import { createClient } from "@/lib/supabase/server"
import { valuationRunDate } from "./valuations"
import { aggregateGain, type GainFigure } from "./gain"

// Portfolio-side queries (Phase 5): basis / value / unrealized, as a strip
// and as a series. Together with sales.ts this file is where EVERY gain
// number comes from. The arithmetic lives in ./gain and is re-exported here.
//
// Set rules, applied consistently:
// - "Owned" = not wishlist, not coming-soon. "Unsold" = sale_status ≠ 'sold'.
// - COST BASIS sums every owned, unsold watch (an unknown purchase price
//   contributes its acquisition costs, usually 0 — money actually spent).
// - CURRENT VALUE sums the latest agent-row mid of tracked, unsold watches.
//   Manual valuations NEVER enter totals or the primary series (00046 rule).
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

/** Owned watches + agent valuation rows (newest-first) in one round trip. */
async function fetchPortfolioData(): Promise<{
  owned: PortfolioWatch[]
  valuations: AgentValuationRow[]
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
      .select("watch_id, value_mid_cents, valued_at")
      .eq("source", "agent")
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
  return { owned, valuations: (valuationsRes.data ?? []) as AgentValuationRow[] }
}

// ── The portfolio strip (§3.2 block 1) ──────────────────────────

export interface PortfolioOverview {
  /** Σ cost basis, owned & unsold watches. */
  costBasisCents: number
  /** Σ latest agent mid, tracked & unsold watches. */
  currentValueCents: number
  /** count of watches contributing to currentValueCents. */
  valuedCount: number
  /** owned & unsold watches — the denominator for "28 of 42 tracked". */
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

export async function getPortfolioOverview(): Promise<PortfolioOverview> {
  const supabase = await createClient()
  const [{ owned, valuations }, salesRes] = await Promise.all([
    fetchPortfolioData(),
    supabase
      .from("watch_sales")
      .select(
        "net_proceeds_cents, watch:watches(cost_basis_cents, purchase_price_cents)"
      ),
  ])

  const unsold = owned.filter((w) => w.sale_status !== "sold")

  // Latest agent mid per watch (rows arrive newest-first).
  const latestMid = new Map<string, number>()
  for (const v of valuations) {
    if (!latestMid.has(v.watch_id)) latestMid.set(v.watch_id, v.value_mid_cents)
  }

  const valued = unsold.filter(
    (w) => w.price_check_enabled && latestMid.has(w.id)
  )

  // The run these values came from: newest agent row among the valued set.
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
