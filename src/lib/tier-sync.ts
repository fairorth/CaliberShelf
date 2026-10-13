import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { configToBands, DEFAULT_TIER_CONFIG, normalizeTierConfig, tierValuation, type TierBand } from "@/lib/tiers"

/**
 * The core of the static (tier) valuation, for any caller that already holds
 * a Supabase client acting AS THE USER: the web's Server Actions
 * (actions/tier-valuations.ts, cookie session) and the iPhone app's routes
 * (bearer token). The rules and the file header live in
 * actions/tier-valuations.ts; this is the same logic, client passed in, so a
 * watch created on the phone gets its static value exactly as one created on
 * the web. scripts/refresh-tier-valuations.mjs mirrors tierRowFor.
 */

/** Columns the eligibility rule and the derived value need. */
export const WATCH_FIELDS =
  "id, purchase_price_cents, purchase_currency, sale_status, is_wishlist"

export interface EligibilityRow {
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
export function tierRowFor(
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


/** The user's tier bands, read with the given client (getTierBands, client passed in). */
export async function tierBandsFor(supabase: SupabaseClient, userId: string): Promise<TierBand[]> {
  const { data } = await supabase
    .from("profiles")
    .select("tier_config")
    .eq("id", userId)
    .maybeSingle()
  const config =
    !data || (data as { tier_config: unknown }).tier_config == null
      ? DEFAULT_TIER_CONFIG
      : normalizeTierConfig((data as { tier_config: unknown }).tier_config)
  return configToBands(config)
}

/**
 * Re-assert ONE watch's tier valuation with the given client. Best-effort:
 * failures are logged, never thrown (see syncTierValuation).
 */
export async function syncTierValuationFor(
  supabase: SupabaseClient,
  userId: string,
  watchId: string
): Promise<void> {
  try {
    const { data: watch } = await supabase
      .from("watches")
      .select(WATCH_FIELDS)
      .eq("id", watchId)
      .eq("user_id", userId)
      .maybeSingle<EligibilityRow>()
    if (!watch) return

    const { count: agentRows } = await supabase
      .from("watch_valuations")
      .select("id", { count: "exact", head: true })
      .eq("watch_id", watchId)
      .eq("source", "agent")

    const bands = await tierBandsFor(supabase, userId)
    const row = tierRowFor(watch, userId, bands, new Date().toISOString(), (agentRows ?? 0) > 0)

    // Replace, never append (see actions/tier-valuations.ts).
    await supabase.from("watch_valuations").delete().eq("watch_id", watchId).eq("source", "tier")
    if (row) await supabase.from("watch_valuations").insert(row)
  } catch (e) {
    console.error("syncTierValuationFor failed:", e)
  }
}
