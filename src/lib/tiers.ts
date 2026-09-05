// Price tiers — user-configurable in Config → Tiers, stored per user on
// profiles.tier_config. Pure module (no I/O) so both server queries and the
// client config UI can share the types and math.
//
// A tier config is an ordered list of rows; each row's `max` is its EXCLUSIVE
// upper bound in dollars, and the last row's `max` is null (open-ended top
// tier). A tier covers [previous max, this max).

export interface TierConfigRow {
  label: string
  max: number | null // dollars, exclusive upper bound; null = open-ended top
  /**
   * Percent of the purchase price a watch in this tier is assumed to be worth
   * today — the basis of the STATIC valuation every untracked watch carries
   * (v1.10.2). Cheap watches shed most of their price the moment they are worn;
   * expensive ones hold it, which is why this is per tier and not one global
   * number. Over 100 is allowed: a tier of watches that appreciate is a real
   * thing, and capping it at par would quietly lie about them.
   */
  valuationPct: number
}

export interface TierBand {
  tier: number // 1-based
  lo: number // dollars, inclusive
  hi: number // dollars, exclusive (Infinity for the top tier)
  label: string // user-facing label
  short: string // compact numeric range for chart axes
  /** Percent of purchase price used for untracked watches in this band. */
  valuationPct: number
}

export const MIN_VALUATION_PCT = 0
export const MAX_VALUATION_PCT = 500

export const DEFAULT_TIER_CONFIG: TierConfigRow[] = [
  { label: "Tier 1", max: 200, valuationPct: 50 },
  { label: "Tier 2", max: 600, valuationPct: 60 },
  { label: "Tier 3", max: 1400, valuationPct: 70 },
  { label: "Tier 4", max: 3500, valuationPct: 75 },
  { label: "Tier 5", max: 7500, valuationPct: 80 },
  { label: "Tier 6", max: null, valuationPct: 85 },
]

/**
 * The percentage a row gets when the stored config predates this field (or a
 * newly added tier has none yet): a straight ramp from 50% at the bottom to
 * 85% at the top, which is the shape of the defaults above and holds for any
 * number of tiers. A single-tier config sits at the top of the ramp.
 */
export function defaultValuationPct(index: number, count: number): number {
  if (count <= 1) return 85
  return Math.round(50 + (85 - 50) * (index / (count - 1)))
}

function fmtK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `$${n}`
}
function shortRange(lo: number, hi: number): string {
  if (lo <= 0) return `<${fmtK(hi)}`
  if (!Number.isFinite(hi)) return `${fmtK(lo)}+`
  return `${fmtK(lo)}–${fmtK(hi)}`
}

export function configToBands(config: TierConfigRow[]): TierBand[] {
  const bands: TierBand[] = []
  let lo = 0
  config.forEach((row, i) => {
    const isLast = i === config.length - 1
    const hi = isLast || row.max == null ? Infinity : row.max
    bands.push({
      tier: i + 1,
      lo,
      hi,
      label: row.label?.trim() || `Tier ${i + 1}`,
      short: shortRange(lo, hi),
      valuationPct:
        typeof row.valuationPct === "number" && Number.isFinite(row.valuationPct)
          ? row.valuationPct
          : defaultValuationPct(i, config.length),
    })
    lo = Number.isFinite(hi) ? hi : lo
  })
  return bands
}

export const DEFAULT_TIER_BANDS = configToBands(DEFAULT_TIER_CONFIG)

// 0-based index into bands for a price (cents), or -1 when there's no price.
export function tierIndexFor(cents: number | null | undefined, bands: TierBand[]): number {
  if (cents == null) return -1
  const d = cents / 100
  for (let i = 0; i < bands.length; i++) {
    if (d < bands[i].hi) return i
  }
  return bands.length - 1
}

export function tierBandForCents(
  cents: number | null | undefined,
  bands: TierBand[]
): { key: string; label: string } {
  const i = tierIndexFor(cents, bands)
  if (i < 0) return { key: "unpriced", label: "No price" }
  return { key: `t${bands[i].tier}`, label: bands[i].label }
}

// Coerce arbitrary stored/submitted data into a safe, ordered config.
// Guarantees ≥1 row and an open-ended last row; drops junk rows.
export function normalizeTierConfig(raw: unknown): TierConfigRow[] {
  if (!Array.isArray(raw)) return DEFAULT_TIER_CONFIG
  const draft: Array<{ label: string; max: number | null; pct: number | null }> = []
  for (const r of raw) {
    if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>
      const label = typeof obj.label === "string" ? obj.label : ""
      const max =
        typeof obj.max === "number" && Number.isFinite(obj.max) && obj.max > 0
          ? obj.max
          : null
      const pct =
        typeof obj.valuationPct === "number" && Number.isFinite(obj.valuationPct)
          ? Math.min(Math.max(obj.valuationPct, MIN_VALUATION_PCT), MAX_VALUATION_PCT)
          : null
      draft.push({ label, max, pct })
    }
  }
  if (draft.length === 0) return DEFAULT_TIER_CONFIG
  // A config saved before valuation percentages existed has none — fill it in
  // from the ramp rather than leaving the field undefined, so every reader
  // (and the Tiers screen) sees a real number.
  const rows: TierConfigRow[] = draft.map((d, i) => ({
    label: d.label,
    max: d.max,
    valuationPct: d.pct ?? defaultValuationPct(i, draft.length),
  }))
  // The top tier is always open-ended.
  rows[rows.length - 1] = { ...rows[rows.length - 1], max: null }
  return rows
}

// ── Static (tier-derived) valuation ────────────────────────────────
//
// The valuation agent is expensive and only runs on watches worth researching,
// so most of the collection used to carry no value at all — a portfolio total
// that covered a third of the watches. A tier's `valuationPct` fills that gap:
// a flat percentage of what was paid, honest about being an assumption rather
// than research. Tracked watches never use it; their agent estimate wins.

export interface TierValuation {
  /** The derived value in cents. */
  cents: number
  /** The band the purchase price fell in. */
  band: TierBand
}

/**
 * The static valuation for a purchase price, or null when there is nothing to
 * derive it from — no purchase price (the "—" rule), or a tier deliberately
 * set to 0% (which reads as "don't value this band at all").
 */
export function tierValuation(
  purchasePriceCents: number | null | undefined,
  bands: TierBand[]
): TierValuation | null {
  const i = tierIndexFor(purchasePriceCents, bands)
  if (i < 0 || purchasePriceCents == null) return null
  const band = bands[i]
  if (!(band.valuationPct > 0)) return null
  return { cents: Math.round((purchasePriceCents * band.valuationPct) / 100), band }
}
