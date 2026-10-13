"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getTierBands } from "@/lib/queries/tier-config"
import { tierRowFor, syncTierValuationFor, WATCH_FIELDS, type EligibilityRow } from "@/lib/tier-sync"

// Static valuations (v1.10.2, migration 00053).
//
// Every watch the agent does not price gets a value anyway: its purchase price
// times its price tier's percentage. This file (with its client-passed core,
// lib/tier-sync.ts) is the ONLY writer of source='tier' rows, and it owns one invariant:
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

/**
 * Re-assert the tier valuation for ONE watch. Called after any write that can
 * change its eligibility: create, edit, the Market panel's tracking toggle, and
 * recording or undoing a sale.
 *
 * Best-effort by design — a watch that saves but whose static value fails to
 * write is a stale number; a watch that refuses to save because of one is a
 * broken app. Failures are logged, never thrown. The work is
 * lib/tier-sync.ts, shared with the iPhone app's create route.
 */
export async function syncTierValuation(watchId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await syncTierValuationFor(supabase, user.id, watchId)
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
