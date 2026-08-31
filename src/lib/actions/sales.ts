"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { dollarsToCents } from "@/lib/utils"
import {
  listingFormSchema,
  manualValuationSchema,
  saleEditSchema,
  saleFormSchema,
  type ListingFormValues,
  type ManualValuationValues,
  type SaleEditValues,
  type SaleFormValues,
} from "@/lib/validations/sale"
import { todayDate } from "@/lib/queries/sales"
import type { SaleStatus, WatchListing } from "@/lib/types/watch"

export type SaleActionState = {
  error?: string
  success?: boolean
}

// ── The transition table (spec §2) — enforced HERE, not in the DB ──
//
//   owned  → listed          (mark for sale — opens a listing row)
//   listed → sold | owned    (owned = withdrawn, listing row closed)
//   sold   → owned           (undo, deletes the sale row)
//
// Candidate was retired in 00051: "thinking about it" was a state the app
// tracked and the owner never used. A watch is either for sale — with a
// venue, a date and an ask — or it is not.
//
// Every status write in this file goes through assertTransition. The app owns
// the lifecycle; the DB deliberately has no CHECK so backfills stay possible.

const TRANSITIONS: Record<SaleStatus, readonly SaleStatus[]> = {
  owned: ["listed"],
  listed: ["sold", "owned"],
  sold: ["owned"],
}

function assertTransition(from: SaleStatus, to: SaleStatus): string | null {
  if (TRANSITIONS[from].includes(to)) return null
  return `A ${from} watch can't move to ${to}.`
}

// Minimal watch state the transitions need.
interface WatchState {
  id: string
  sale_status: SaleStatus
  target_ask_cents: number | null
}

async function getWatchState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  watchId: string
): Promise<WatchState | null> {
  const { data } = await supabase
    .from("watches")
    .select("id, sale_status, target_ask_cents")
    .eq("id", watchId)
    .eq("user_id", userId)
    .maybeSingle()
  return data as WatchState | null
}

/** Every surface a lifecycle change can appear on. */
function revalidateSaleSurfaces(watchId: string) {
  revalidatePath(`/watch/${watchId}`)
  revalidatePath(`/watch/${watchId}/edit`)
  revalidatePath("/market")
  revalidatePath("/market/sold")
  revalidatePath("/collection")
  revalidatePath("/reports/sales")
  revalidatePath("/reports/annual-summary")
  revalidatePath("/reports/watch-list")
}

// ── owned → listed: mark for sale (§3.4) ────────────────────────

export async function listForSale(
  watchId: string,
  input: ListingFormValues
): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = listingFormSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const data = parsed.data

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  const blocked = assertTransition(watch.sale_status, "listed")
  if (blocked) return { error: blocked }

  const askCents = dollarsToCents(data.ask_price)
  const { data: listing, error: insertError } = await supabase
    .from("watch_listings")
    .insert({
      watch_id: watchId,
      user_id: user.id,
      venue: data.venue,
      venue_other: data.venue === "other" ? data.venue_other.trim() : null,
      listing_url: data.listing_url || null,
      listed_at: data.listed_at,
      ask_price_cents: askCents,
    })
    .select("id")
    .single()
  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This watch already has an active listing." }
    }
    return { error: insertError.message }
  }

  const { error: updateError } = await supabase
    .from("watches")
    .update({
      sale_status: "listed",
      // §3.4: copy the ask into target_ask_cents if that is empty.
      target_ask_cents: watch.target_ask_cents ?? askCents,
    })
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (updateError) {
    // No cross-table transaction from the client — undo the listing insert
    // so a failed status write doesn't strand an active listing.
    await supabase.from("watch_listings").delete().eq("id", listing.id)
    return { error: updateError.message }
  }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── Edit the active listing (no transition) ─────────────────────
// The mock's "Edit listing" link and the attention row's "drop the ask" both
// need the active listing to be editable in place. Status is untouched.

export async function updateListing(
  watchId: string,
  input: ListingFormValues
): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = listingFormSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const data = parsed.data

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  if (watch.sale_status !== "listed") {
    return { error: "Only a listed watch has a listing to edit." }
  }

  const { error } = await supabase
    .from("watch_listings")
    .update({
      venue: data.venue,
      venue_other: data.venue === "other" ? data.venue_other.trim() : null,
      listing_url: data.listing_url || null,
      listed_at: data.listed_at,
      ask_price_cents: dollarsToCents(data.ask_price),
    })
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
    .eq("status", "active")
  if (error) return { error: error.message }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── listed → owned (withdraw) ───────────────────────────────────
// With Candidate retired there is one way back: the listing closes as
// withdrawn and the watch is plainly owned again. The listing row survives —
// it is where days-on-market and price history live.

export async function withdrawListing(watchId: string): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  if (watch.sale_status !== "listed") {
    return { error: "Only a watch that is for sale can be withdrawn." }
  }
  const blocked = assertTransition(watch.sale_status, "owned")
  if (blocked) return { error: blocked }

  const { error: closeError } = await supabase
    .from("watch_listings")
    .update({ status: "withdrawn", closed_at: todayDate() })
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
    .eq("status", "active")
  if (closeError) return { error: closeError.message }

  const { error: updateError } = await supabase
    .from("watches")
    .update({ sale_status: "owned" })
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (updateError) return { error: updateError.message }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── listed → sold (§3.5) ────────────────────────────────────────

export async function recordSale(
  watchId: string,
  input: SaleFormValues
): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = saleFormSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const data = parsed.data

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  const blocked = assertTransition(watch.sale_status, "sold")
  if (blocked) return { error: blocked }

  // Venue denormalizes from the active listing — sales outlive listings.
  const { data: listingRow } = await supabase
    .from("watch_listings")
    .select("*")
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()
  const listing = listingRow as WatchListing | null
  if (!listing) return { error: "No active listing for this watch." }

  const { data: sale, error: insertError } = await supabase
    .from("watch_sales")
    .insert({
      watch_id: watchId,
      user_id: user.id,
      listing_id: listing.id,
      sold_at: data.sold_at,
      sale_price_cents: dollarsToCents(data.sale_price),
      venue: listing.venue,
      venue_other: listing.venue_other,
      buyer_name: data.buyer_name.trim() || null,
      buyer_handle: data.buyer_handle.trim() || null,
      payment_method: data.payment_method.trim() || null,
      tracking_number: data.tracking_number.trim() || null,
      venue_fee_cents: dollarsToCents(data.venue_fee),
      processing_fee_cents: dollarsToCents(data.processing_fee),
      shipping_cost_cents: dollarsToCents(data.shipping_cost),
      insurance_cents: dollarsToCents(data.insurance),
      notes: data.notes.trim() || null,
    })
    .select("id")
    .single()
  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This watch already has a sale recorded." }
    }
    return { error: insertError.message }
  }

  const { error: closeError } = await supabase
    .from("watch_listings")
    .update({ status: "sold", closed_at: data.sold_at })
    .eq("id", listing.id)
  if (closeError) {
    await supabase.from("watch_sales").delete().eq("id", sale.id)
    return { error: closeError.message }
  }

  // §3.5: sold watches also stop being price-checked — the agent must not
  // keep spending money on a watch you no longer own.
  const { error: updateError } = await supabase
    .from("watches")
    .update({ sale_status: "sold", price_check_enabled: false })
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (updateError) {
    await supabase.from("watch_sales").delete().eq("id", sale.id)
    await supabase
      .from("watch_listings")
      .update({ status: "active", closed_at: null })
      .eq("id", listing.id)
    return { error: updateError.message }
  }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── Edit a recorded sale (no transition) ────────────────────────
// A sale is a record, and records get corrected: a fee lands late, the buyer
// turns out to have paid a different way, the date was a day out. Before
// this the only way to change any of it was to undo the sale — deleting the
// row, reopening the listing and re-entering everything — which is a
// destructive operation to fix a typo. Venue is editable here (unlike when
// recording, where it copies from the listing) because the listing may be
// long closed and the sale is now the only place the venue lives.

export async function updateSale(
  watchId: string,
  input: SaleEditValues
): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = saleEditSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const data = parsed.data

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  if (watch.sale_status !== "sold") {
    return { error: "Only a sold watch has a sale to edit." }
  }

  // net_proceeds_cents is GENERATED — it re-derives itself from the price and
  // the four fee columns. Nothing here writes it.
  const { error } = await supabase
    .from("watch_sales")
    .update({
      sold_at: data.sold_at,
      sale_price_cents: dollarsToCents(data.sale_price),
      venue: data.venue,
      venue_other: data.venue === "other" ? data.venue_other.trim() : null,
      buyer_name: data.buyer_name.trim() || null,
      buyer_handle: data.buyer_handle.trim() || null,
      payment_method: data.payment_method.trim() || null,
      tracking_number: data.tracking_number.trim() || null,
      venue_fee_cents: dollarsToCents(data.venue_fee),
      processing_fee_cents: dollarsToCents(data.processing_fee),
      shipping_cost_cents: dollarsToCents(data.shipping_cost),
      insurance_cents: dollarsToCents(data.insurance),
      notes: data.notes.trim() || null,
    })
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── sold → owned (undo — deletes the sale row) ──────────────────
// The checklist rule: undo restores the status and deletes the sale row.
// The listing it closed is reopened as 'withdrawn', not left as 'sold': the
// sale that closed it no longer exists, and a listing marked sold with no
// sale record behind it is a lie the sold archive can never explain.
// price_check_enabled stays off — re-enable it by hand if the undo was
// itself a correction.

export async function undoSale(watchId: string): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }
  const blocked = assertTransition(watch.sale_status, "owned")
  if (blocked) return { error: blocked }

  // Grab the linked listing before the sale row (and its FK) disappear.
  const { data: sale } = await supabase
    .from("watch_sales")
    .select("listing_id")
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
    .maybeSingle()

  const { error: deleteError } = await supabase
    .from("watch_sales")
    .delete()
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
  if (deleteError) return { error: deleteError.message }

  if (sale?.listing_id) {
    await supabase
      .from("watch_listings")
      .update({ status: "withdrawn" })
      .eq("id", sale.listing_id)
      .eq("user_id", user.id)
  }

  const { error: updateError } = await supabase
    .from("watches")
    .update({ sale_status: "owned" })
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (updateError) return { error: updateError.message }

  revalidateSaleSurfaces(watchId)
  return { success: true }
}

// ── Log a value (manual valuation, V7) ──────────────────────────
// No lifecycle transition. Manual rows require mid value, confidence and a
// note (00046 rules); agent_model, datapoints and sources stay null, so the
// row is visibly yours and never enters portfolio totals.

export async function logManualValuation(
  watchId: string,
  input: ManualValuationValues
): Promise<SaleActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = manualValuationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const data = parsed.data

  const watch = await getWatchState(supabase, user.id, watchId)
  if (!watch) return { error: "Watch not found." }

  const { error } = await supabase.from("watch_valuations").insert({
    watch_id: watchId,
    user_id: user.id,
    value_mid_cents: dollarsToCents(data.value_mid),
    currency: "USD",
    confidence: data.confidence,
    source: "manual",
    entered_note: data.entered_note.trim(),
  })
  if (error) return { error: error.message }

  // A human-entered value resolves the "needs review" flag a no-evidence
  // agent run may have raised (00050).
  await supabase
    .from("watches")
    .update({ needs_value_review: false })
    .eq("id", watchId)
    .eq("user_id", user.id)

  revalidatePath(`/watch/${watchId}`)
  revalidatePath("/market")
  return { success: true }
}
