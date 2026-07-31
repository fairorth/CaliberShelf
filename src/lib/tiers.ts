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
}

export interface TierBand {
  tier: number // 1-based
  lo: number // dollars, inclusive
  hi: number // dollars, exclusive (Infinity for the top tier)
  label: string // user-facing label
  short: string // compact numeric range for chart axes
}

export const DEFAULT_TIER_CONFIG: TierConfigRow[] = [
  { label: "Tier 1", max: 200 },
  { label: "Tier 2", max: 600 },
  { label: "Tier 3", max: 1400 },
  { label: "Tier 4", max: 3500 },
  { label: "Tier 5", max: 7500 },
  { label: "Tier 6", max: null },
]

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
  const rows: TierConfigRow[] = []
  for (const r of raw) {
    if (r && typeof r === "object") {
      const obj = r as Record<string, unknown>
      const label = typeof obj.label === "string" ? obj.label : ""
      const max =
        typeof obj.max === "number" && Number.isFinite(obj.max) && obj.max > 0
          ? obj.max
          : null
      rows.push({ label, max })
    }
  }
  if (rows.length === 0) return DEFAULT_TIER_CONFIG
  // The top tier is always open-ended.
  rows[rows.length - 1] = { ...rows[rows.length - 1], max: null }
  return rows
}
