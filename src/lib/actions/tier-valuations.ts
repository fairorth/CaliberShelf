"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getTierBands } from "@/lib/queries/tier-config"
import { tierValuation, type TierBand } from "@/lib/tiers"

// Static valuations (v1.10.2, migration 00053).
//
// Every watch the agent does not price gets a value anyway: its purchase price
// times its price tier's percentage. This file is the ONLY writer of
// source='tier' rows, and it owns one invariant:
//
//   a tier row exists  ⟺  the watch has NO researched value, is unsold, not
//                          wish-list, and has a purchase price (tier pct > 0)
//
// The condition is "no agent row", NOT "not price-tracked" (v1.10.7). Switching
// research on is a request for a number, not a reason to throw away the one you
// have: under the old rule, ticking Research blanked the watch's value and
// dropped the portfolio total until the monthly run landed, which made the new
// toggle on the Watch Values report a trap. A tier row alongside research that
// has not happened yet costs nothing — pickCurrentValue prefers the agent row
// the instant it exists.
//
// so every path that can change one of those four things calls
// `syncTierValuation` for the watch, and `refreshTierValuations` re-asserts it
// across the whole collection after the tier percentages themselves change.
//
// A tier row is a derivation, not an observation: refreshing REPLACES it rather
// than appending, and the partial unique index in 00053 makes that structural.
// Keeping a history of "what we assumed in June" would put fake movement in a
// chart that is meant to show the market moving.

/** Columns the eligibility rule and the derived value need. */
const WATCH_FIELDS =
  "id, purchase_price_cents, purchase_currency, sale_status, is_wishlist"

interface EligibilityRow {
  id: string
  purchase_price_cents: number | null
  purchase_currency: string | null
  sale_status: string
  is_wishlist: boolean
}

/**
 * The row to write for a watch, or null when it should carry no tier value.
 * Coming-soon watches DO get one — they are bought, just not here yet.
 */
function tierRowFor(
  watch: EligibilityRow,
  userId: string,
  bands: TierBand[],
  valuedAt: string,
  hasResearch: boolean
) {
  if (watch.is_wishlist) return null // a shopping list, not a holding
  if (watch.sale_status === "sold") return null // net proceeds is the number now
  if (hasResearch) return null // a researched number exists; this would never win
  const derived = tierValuation(watch.purchase_price_cents, bands)
  if (!derived) return null

  return {
    watch_id: watch.id,
    user_id: userId,
    valued_at: valuedAt,
    value_low_cents: null,
    value_mid_cents: derived.cents,
    value_high_cents: null,
    currency: watch.purchase_currency || "USD",
    // Never anything but low: this is an assumption about a price segment, not
    // a claim about this watch.
    confidence: "low" as const,
    n_datapoints: null,
    assumed_variant: null,
    datapoints: null,
    sources: null,
    method_notes: `${derived.band.valuationPct}% of the purchase price (${derived.band.label}). Static estimate — no market research. Turn on price tracking for a researched value.`,
    caveats: null,
    agent_model: null,
    source: "tier" as const,
    entered_note: null,
    run_mode: "static" as const,
  }
}

/**
 * Re-assert the tier valuation for ONE watch. Called after any write that can
 * change its eligibility: create, edit, the Market panel's tracking toggle, and
 * recording or undoing a sale.
 *
 * Best-effort by design — a watch that saves but whose static value fails to
 * write is a stale number; a watch that refuses to save because of one is a
 * broken app. Failures are logged, never thrown.
 */
export async function syncTierValuation(watchId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: watch } = await supabase
      .from("watches")
      .select(WATCH_FIELDS)
      .eq("id", watchId)
      .eq("user_id", user.id)
      .maybeSingle<EligibilityRow>()
    if (!watch) return

    const { count: agentRows } = await supabase
      .from("watch_valuations")
      .select("id", { count: "exact", head: true })
      .eq("watch_id", watchId)
      .eq("source", "agent")

    const bands = await getTierBands()
    const row = tierRowFor(
      watch,
      user.id,
      bands,
      new Date().toISOString(),
      (agentRows ?? 0) > 0
    )

    // Replace, never append (see the file header).
    await supabase
      .from("watch_valuations")
      .delete()
      .eq("watch_id", watchId)
      .eq("source", "tier")
    if (row) await supabase.from("watch_valuations").insert(row)
  } catch (e) {
    console.error("syncTierValuation failed:", e)
  }
}

export interface TierValuationRefresh {
  error?: string
  /** watches now carrying a tier valuation. */
  valued?: number
  /** tier rows that existed before this run and do not now (net). */
  removed?: number
  /** un-researched watches with no purchase price to derive from. */
  skipped?: number
  totalCents?: number
}

/**
 * Recompute every static valuation from the current tier percentages — the
 * "Update static valuations" button in Config → Tiers, and what `saveTierConfig`
 * calls for you when the percentages change.
 *
 * One delete + one insert for the whole collection: at ~160 watches the
 * round trips matter more than the row count.
 */
export async function refreshTierValuations(): Promise<TierValuationRefresh> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const [{ data: watches, error: readError }, { data: researched }, bands] =
    await Promise.all([
      supabase.from("watches").select(WATCH_FIELDS).eq("user_id", user.id),
      supabase
        .from("watch_valuations")
        .select("watch_id")
        .eq("user_id", user.id)
        .eq("source", "agent"),
      getTierBands(),
    ])
  if (readError) return { error: readError.message }

  const hasResearch = new Set(
    ((researched ?? []) as Array<{ watch_id: string }>).map((r) => r.watch_id)
  )

  const valuedAt = new Date().toISOString()
  const rows = []
  let skipped = 0
  for (const w of (watches ?? []) as EligibilityRow[]) {
    const row = tierRowFor(w, user.id, bands, valuedAt, hasResearch.has(w.id))
    if (row) rows.push(row)
    else if (
      !w.is_wishlist &&
      w.sale_status !== "sold" &&
      !hasResearch.has(w.id)
    ) {
      skipped++
    }
  }

  const { count: before } = await supabase
    .from("watch_valuations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", "tier")

  const { error: deleteError } = await supabase
    .from("watch_valuations")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "tier")
  if (deleteError) return { error: deleteError.message }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("watch_valuations")
      .insert(rows)
    if (insertError) return { error: insertError.message }
  }

  revalidatePath("/collection")
  revalidatePath("/market")
  revalidatePath("/config")
  revalidatePath("/reports/watch-list")
  revalidatePath("/reports/collection-summary")

  return {
    valued: rows.length,
    removed: Math.max((before ?? 0) - rows.length, 0),
    skipped,
    totalCents: rows.reduce((sum, r) => sum + r.value_mid_cents, 0),
  }
}
