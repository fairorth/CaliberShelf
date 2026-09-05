import { createClient } from "@/lib/supabase/server"
import { valuationRunDate } from "./valuations"
import { currentValueByWatch } from "@/lib/valuation"
import { aggregateGain, type GainFigure } from "./gain"
import type { ValuationSource } from "@/lib/types/watch"

// Portfolio-side queries (Phase 5): basis / value / unrealized, as a strip
// and as a series. Together with sales.ts this file is where EVERY gain
// number comes from. The arithmetic lives in ./gain and is re-exported here.
//
// Set rules, applied consistently:
// - "Owned" = not wishlist, not coming-soon. "Unsold" = sale_status ≠ 'sold'.
// - COST BASIS sums every owned, unsold watch (an unknown purchase price
//   contributes its acquisition costs, usually 0 — money actually spent).
// - CURRENT VALUE sums the current value of every owned, unsold watch, exactly
//   as src/lib/valuation.ts defines it: newest of agent|manual, falling back to
//   the tier-derived static value. Manual rows DO count from v1.10.3 — the old
//   00046 rule kept them out of totals, which guaranteed the watch page and the
//   portfolio disagreed about the same watch.
// - The value-over-time series stays agent-only. A tier row carries a single
//   timestamp — the moment the percentages were last edited — so plotting it
//   would draw a cliff on that date and call it the market moving; a manual row
//   is a point, not a run, and gets its own markers rather than joining the
//   researched line.
// - UNREALIZED compares value to basis only over watches that have BOTH a
//   valuation and a known purchase price — never value minus a basis from a
//   different set of watches, and never a gain on an unknown basis.
export { aggregateGain, gainVersusBasis, type GainFigure } from "./gain"

interface PortfolioWatch {
  id: string
  sale_status: string
  price_check_enabled: boolean
  purchase_price_cents: number | null
  cost_basis_cents: number
  is_wishlist: boolean
  is_coming_soon: boolean
}

interface AgentValuationRow {
  watch_id: string
  value_mid_cents: number
  valued_at: string
}

interface EstimateRow extends AgentValuationRow {
  source: ValuationSource
}

/** Owned watches + every valuation row (newest-first) in one round trip.
 *  `valuations` is the agent-only subset the trend series draws from;
 *  `estimates` is everything, for the precedence rule to arbitrate. */
async function fetchPortfolioData(): Promise<{
  owned: PortfolioWatch[]
  valuations: AgentValuationRow[]
  estimates: EstimateRow[]
}> {
  const supabase = await createClient()
  const [watchesRes, valuationsRes] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, sale_status, price_check_enabled, purchase_price_cents, cost_basis_cents, is_wishlist, is_coming_soon"
      ),
    supabase
      .from("watch_valuations")
      .select("watch_id, value_mid_cents, valued_at, source")
      .order("valued_at", { ascending: false }),
  ])
  if (watchesRes.error) {
    console.error("Failed to fetch watches:", watchesRes.error.message)
  }
  if (valuationsRes.error) {
    console.error("Failed to fetch valuations:", valuationsRes.error.message)
  }
  const owned = ((watchesRes.data ?? []) as PortfolioWatch[]).filter(
    (w) => !w.is_wishlist && !w.is_coming_soon
  )
  const estimates = (valuationsRes.data ?? []) as EstimateRow[]
  return {
    owned,
    valuations: estimates.filter((v) => v.source === "agent"),
    estimates,
  }
}

// ── The portfolio strip (§3.2 block 1) ──────────────────────────

export interface PortfolioOverview {
  /** Σ cost basis, owned & unsold watches. */
  costBasisCents: number
  /** Σ latest estimate (agent where tracked, tier where not), owned & unsold. */
  currentValueCents: number
  /** count of watches contributing to currentValueCents. */
  valuedCount: number
  /** of those, how many are researched agent estimates — the strip says so,
   *  because "researched" and "assumed" are not the same claim about a number. */
  researchedCount: number
  /** of those, how many are values you logged by hand. */
  loggedCount: number
  /** owned & unsold watches — the denominator for "40 of 42 valued". */
  ownedCount: number
  unrealized: GainFigure | null
  /** lifetime realized gain over sales with a known basis. */
  realized: GainFigure | null
  salesCount: number
  /** local "YYYY-MM-DD" of the newest agent run behind these values. */
  latestRunDate: string | null
}

/** "Sep 1" — when the monthly cron (1st, 14:00 UTC) next draws a data point.
 *  Used by the honest one-run empty state on the portfolio chart. */
export function nextMonthlyRunLabel(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * "28 researched · 85 static · 1 logged" — the composition of a value total,
 * in one wording. A total that mixes research with arithmetic has to say so,
 * and it has to say it the same way on every screen that prints it.
 */
export function valueMixLabel(o: {
  valuedCount: number
  researchedCount: number
  loggedCount: number
}): string {
  const staticCount = o.valuedCount - o.researchedCount - o.loggedCount
  return [
    o.researchedCount > 0 ? `${o.researchedCount} researched` : null,
    staticCount > 0 ? `${staticCount} static` : null,
    o.loggedCount > 0 ? `${o.loggedCount} logged` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

export async function getPortfolioOverview(): Promise<PortfolioOverview> {
  const supabase = await createClient()
  const [{ owned, valuations, estimates }, salesRes] = await Promise.all([
    fetchPortfolioData(),
    supabase
      .from("watch_sales")
      .select(
        "net_proceeds_cents, watch:watches(cost_basis_cents, purchase_price_cents)"
      ),
  ])

  const unsold = owned.filter((w) => w.sale_status !== "sold")

  // The current value per watch, decided in one place (src/lib/valuation.ts),
  // with the winning source kept so the strip can say what these numbers are.
  const current = currentValueByWatch(estimates)
  const latestMid = new Map<string, number>()
  const sourceOf = new Map<string, ValuationSource>()
  for (const [watchId, v] of current) {
    latestMid.set(watchId, v.cents)
    sourceOf.set(watchId, v.source)
  }

  const valued = unsold.filter((w) => latestMid.has(w.id))

  // The run these values came from: newest AGENT row among the valued set —
  // a tier row has no run behind it, so it must not date the strip.
  const valuedIds = new Set(valued.map((w) => w.id))
  const latestValuedAt = valuations.find((v) => valuedIds.has(v.watch_id))?.valued_at
  const latestRunDate = latestValuedAt ? valuationRunDate(latestValuedAt) : null

  const sales = (salesRes.data ?? []) as unknown as Array<{
    net_proceeds_cents: number
    watch: { cost_basis_cents: number; purchase_price_cents: number | null }
  }>

  return {
    costBasisCents: unsold.reduce((sum, w) => sum + w.cost_basis_cents, 0),
    currentValueCents: valued.reduce(
      (sum, w) => sum + (latestMid.get(w.id) ?? 0),
      0
    ),
    valuedCount: valued.length,
    researchedCount: valued.filter((w) => sourceOf.get(w.id) === "agent").length,
    loggedCount: valued.filter((w) => sourceOf.get(w.id) === "manual").length,
    ownedCount: unsold.length,
    latestRunDate,
    unrealized: aggregateGain(
      valued.map((w) => ({ valueCents: latestMid.get(w.id) ?? 0, watch: w }))
    ),
    realized: aggregateGain(
      sales.map((s) => ({ valueCents: s.net_proceeds_cents, watch: s.watch }))
    ),
    salesCount: sales.length,
  }
}

// ── Portfolio value over time (§3.2 block 2) ────────────────────

export interface PortfolioPoint {
  /** local run date, "YYYY-MM-DD" */
  date: string
  valueCents: number
}

export interface PortfolioSeries {
  /** one point per valuation run date, oldest first. */
  points: PortfolioPoint[]
  /** flat reference line: Σ basis of the tracked, unsold watches the value
   *  series draws from — same set, so the two lines are comparable. */
  basisCents: number
}

/**
 * Portfolio value at each valuation run date. A watch's value carries forward
 * between runs (a watch valued in June but skipped in July still counts in
 * July's point), so a point is "the latest known value of every tracked,
 * unsold watch as of that date". Agent rows only. The chart needs ≥2 points
 * to draw (§3.2) — the caller checks points.length.
 */
export async function getPortfolioSeries(): Promise<PortfolioSeries> {
  const { owned, valuations } = await fetchPortfolioData()
  const tracked = new Map(
    owned
      .filter((w) => w.sale_status !== "sold" && w.price_check_enabled)
      .map((w) => [w.id, w])
  )

  // Group tracked watches' rows by local run date, oldest first.
  const byDate = new Map<string, AgentValuationRow[]>()
  for (const v of valuations) {
    if (!tracked.has(v.watch_id)) continue
    const date = valuationRunDate(v.valued_at)
    const rows = byDate.get(date) ?? []
    rows.push(v)
    byDate.set(date, rows)
  }
  const dates = [...byDate.keys()].sort()

  // Walk forward, carrying each watch's latest mid.
  const midByWatch = new Map<string, number>()
  const points: PortfolioPoint[] = []
  for (const date of dates) {
    // Within a date, rows are newest-first; keep the newest by writing only
    // the first seen per watch.
    const seen = new Set<string>()
    for (const v of byDate.get(date)!) {
      if (seen.has(v.watch_id)) continue
      seen.add(v.watch_id)
      midByWatch.set(v.watch_id, v.value_mid_cents)
    }
    let valueCents = 0
    for (const mid of midByWatch.values()) valueCents += mid
    points.push({ date, valueCents })
  }

  return {
    points,
    basisCents: [...tracked.values()].reduce(
      (sum, w) => sum + w.cost_basis_cents,
      0
    ),
  }
}
