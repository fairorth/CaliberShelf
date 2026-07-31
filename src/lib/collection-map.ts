// Pure aggregation for the Collection Map report. No I/O — takes watches, returns
// the distributions, the size×color matrix, scatter points, and gap insights the
// report renders. Kept pure so it's trivially testable and reusable.

import type { WatchWithCover } from "@/lib/types/watch"
import { type TierBand, tierBandForCents, DEFAULT_TIER_BANDS } from "@/lib/tiers"

// ── Dial-color normalization ─────────────────────────────────────
// dial_color is free text ("Blue", "blue", "Blue/Black", "Turquois", "Enamel
// White"…). We map it to a canonical bucket whose swatch is the REAL hue — the
// color is the data, so the mark shows the actual color (always labelled too).

export interface ColorBucket {
  key: string
  label: string
  hex: string // representative dial hue; "" = unspecified (rendered as outline)
}

const COLOR_BUCKETS: ColorBucket[] = [
  { key: "black", label: "Black", hex: "#1c1c1e" },
  { key: "white", label: "White / Cream", hex: "#f2eee3" },
  { key: "silver", label: "Silver", hex: "#c7cace" },
  { key: "grey", label: "Grey", hex: "#6b7280" },
  { key: "blue", label: "Blue", hex: "#2f5f9e" },
  { key: "teal", label: "Teal", hex: "#1a9e94" },
  { key: "green", label: "Green", hex: "#3f7d4f" },
  { key: "brown", label: "Brown / Bronze", hex: "#7a5230" },
  { key: "salmon", label: "Salmon / Rose", hex: "#e08a7a" },
  { key: "red", label: "Red", hex: "#b23b3b" },
  { key: "orange", label: "Orange", hex: "#d9772e" },
  { key: "yellow", label: "Yellow / Gold", hex: "#d3a53a" },
  { key: "purple", label: "Purple", hex: "#6b4a9e" },
  { key: "other", label: "Other", hex: "#9a8f7d" },
  { key: "unspecified", label: "Unspecified", hex: "" },
]
const BUCKET_BY_KEY = new Map(COLOR_BUCKETS.map((b) => [b.key, b]))

// First matching token wins, so "Enamel White" → white, "silver blue" → silver.
const TOKEN_TO_KEY: Record<string, string> = {
  black: "black", onyx: "black",
  white: "white", ivory: "white", cream: "white", beige: "white", pale: "white", enamel: "white",
  silver: "silver", steel: "silver",
  grey: "grey", gray: "grey", slate: "grey", graphite: "grey", gunmetal: "grey", anthracite: "grey", charcoal: "grey",
  blue: "blue", navy: "blue", midnight: "blue", indigo: "blue", azure: "blue",
  teal: "teal", turquois: "teal", turquoise: "teal", aqua: "teal",
  green: "green", seafoam: "green", olive: "green", emerald: "green", sage: "green",
  brown: "brown", bronze: "brown", copper: "brown", coffee: "brown", chocolate: "brown", tan: "brown",
  salmon: "salmon", rose: "salmon", pink: "salmon",
  red: "red", burgundy: "red", maroon: "red", oxblood: "red", crimson: "red",
  orange: "orange",
  yellow: "yellow", gold: "yellow", champagne: "yellow", mustard: "yellow",
  purple: "purple", violet: "purple", aubergine: "purple", lavender: "purple",
}

export function normalizeDialColor(raw: string | null | undefined): ColorBucket {
  const s = (raw ?? "").trim().toLowerCase()
  if (!s) return BUCKET_BY_KEY.get("unspecified")!
  const tokens = s.split(/[^a-z]+/).filter(Boolean)
  for (const t of tokens) {
    const key = TOKEN_TO_KEY[t]
    if (key) return BUCKET_BY_KEY.get(key)!
  }
  return BUCKET_BY_KEY.get("other")!
}

// ── Size bands ───────────────────────────────────────────────────
export interface SizeBand {
  key: string
  label: string
}
const SIZE_BANDS: SizeBand[] = [
  { key: "u36", label: "<36mm" },
  { key: "36", label: "36–38" },
  { key: "38", label: "38–40" },
  { key: "40", label: "40–42" },
  { key: "42", label: "42–44" },
  { key: "44", label: "44mm+" },
  { key: "unsized", label: "Unsized" },
]
export function sizeBand(mm: number | null | undefined): SizeBand {
  if (mm == null) return SIZE_BANDS[6]
  if (mm < 36) return SIZE_BANDS[0]
  if (mm < 38) return SIZE_BANDS[1]
  if (mm < 40) return SIZE_BANDS[2]
  if (mm < 42) return SIZE_BANDS[3]
  if (mm < 44) return SIZE_BANDS[4]
  return SIZE_BANDS[5]
}

// ── Price bands ──────────────────────────────────────────────────

export function thicknessBand(mm: number | null | undefined): { key: string; label: string } {
  if (mm == null) return { key: "unspec", label: "Unspecified" }
  if (mm < 10) return { key: "u10", label: "<10mm" }
  if (mm < 12) return { key: "10", label: "10–12" }
  if (mm < 14) return { key: "12", label: "12–14" }
  if (mm < 16) return { key: "14", label: "14–16" }
  return { key: "16", label: "16mm+" }
}
const THICK_ORDER = ["u10", "10", "12", "14", "16", "unspec"]

// complication is a single comma-joined string ("Date, GMT"); split and tally.
export function parseComplications(raw: string | null | undefined): string[] {
  const s = (raw ?? "").trim()
  if (!s) return []
  return s.split(",").map((t) => t.trim()).filter(Boolean)
}

// ── Aggregate shape ──────────────────────────────────────────────
export interface DistBar {
  key: string
  label: string
  count: number
  hex?: string // set only for the dial-color distribution
}
export interface MatrixCell {
  count: number
  labels: string[] // watch names in this cell (for the tooltip)
}
export interface ScatterPoint {
  id: string
  label: string
  diameter: number
  thickness: number
  hex: string
  colorLabel: string
}
export interface PriceCategoryPoint {
  id: string
  label: string
  catIndex: number
  priceCents: number
  hex: string
  colorLabel: string
}
export interface PriceCategory {
  categories: string[]
  points: PriceCategoryPoint[]
  maxPriceCents: number
}
export interface CollectionMap {
  total: number
  sizeDist: DistBar[]
  colorDist: DistBar[]
  categoryDist: DistBar[]
  thicknessDist: DistBar[]
  complicationDist: DistBar[]
  tierDist: DistBar[]
  tierBands: TierBand[]
  priceCategory: PriceCategory
  // matrix: rows = size bands present, cols = color buckets present
  matrixRows: SizeBand[]
  matrixCols: ColorBucket[]
  matrix: MatrixCell[][] // [row][col]
  matrixMax: number
  scatter: ScatterPoint[]
  insights: string[]
  missingColor: number
  missingSize: number
}

function tallyBars(
  watches: WatchWithCover[],
  bucket: (w: WatchWithCover) => { key: string; label: string; hex?: string },
  order?: string[]
): DistBar[] {
  const m = new Map<string, DistBar>()
  for (const w of watches) {
    const b = bucket(w)
    const cur = m.get(b.key)
    if (cur) cur.count++
    else m.set(b.key, { key: b.key, label: b.label, count: 1, hex: b.hex })
  }
  const bars = [...m.values()]
  if (order) {
    bars.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  } else {
    bars.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }
  return bars
}

export function buildCollectionMap(
  watches: WatchWithCover[],
  tierBands: TierBand[] = DEFAULT_TIER_BANDS
): CollectionMap {
  const sizeOrder = SIZE_BANDS.map((b) => b.key)

  const sizeDist = tallyBars(watches, (w) => sizeBand(w.case_diameter_mm), sizeOrder)
  const colorDist = tallyBars(watches, (w) => {
    const b = normalizeDialColor(w.dial_color)
    return { key: b.key, label: b.label, hex: b.hex }
  })
  const categoryDist = tallyBars(watches, (w) => ({
    key: w.category?.id ?? "none",
    label: w.category?.name ?? "Uncategorized",
  }))
  const thicknessDist = tallyBars(watches, (w) => thicknessBand(w.case_height_mm), THICK_ORDER)
  const tierDist = tallyBars(
    watches,
    (w) => tierBandForCents(w.purchase_price_cents, tierBands),
    [...tierBands.map((b) => `t${b.tier}`), "unpriced"]
  )

  // Complications are multi-valued per watch, so tally manually (sum > total).
  const compMap = new Map<string, DistBar>()
  for (const w of watches) {
    const comps = parseComplications(w.complication)
    const keys = comps.length > 0 ? comps : ["Time only"]
    for (const c of keys) {
      const cur = compMap.get(c)
      if (cur) cur.count++
      else compMap.set(c, { key: c, label: c, count: 1 })
    }
  }
  const complicationDist = [...compMap.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  )

  // Price × category scatter (categories ordered as in categoryDist).
  const catIndexByName = new Map(categoryDist.map((b, i) => [b.label, i]))
  const pcPoints: PriceCategoryPoint[] = []
  let maxPriceCents = 0
  for (const w of watches) {
    if (w.purchase_price_cents == null) continue
    const name = w.category?.name ?? "Uncategorized"
    const ci = catIndexByName.get(name)
    if (ci == null) continue
    const cb = normalizeDialColor(w.dial_color)
    pcPoints.push({
      id: w.id,
      label: `${w.brand?.name ?? ""} ${w.model}`.trim(),
      catIndex: ci,
      priceCents: w.purchase_price_cents,
      hex: cb.hex || "#9a8f7d",
      colorLabel: cb.label,
    })
    maxPriceCents = Math.max(maxPriceCents, w.purchase_price_cents)
  }
  const priceCategory: PriceCategory = {
    categories: categoryDist.map((b) => b.label),
    points: pcPoints,
    maxPriceCents,
  }

  // Matrix — only rows/cols that actually appear, so it stays compact.
  const rowKeys = new Set<string>()
  const colKeys = new Set<string>()
  for (const w of watches) {
    rowKeys.add(sizeBand(w.case_diameter_mm).key)
    colKeys.add(normalizeDialColor(w.dial_color).key)
  }
  const matrixRows = SIZE_BANDS.filter((b) => rowKeys.has(b.key))
  const matrixCols = COLOR_BUCKETS.filter((b) => colKeys.has(b.key))
  const rowIdx = new Map(matrixRows.map((r, i) => [r.key, i]))
  const colIdx = new Map(matrixCols.map((c, i) => [c.key, i]))
  const matrix: MatrixCell[][] = matrixRows.map(() =>
    matrixCols.map(() => ({ count: 0, labels: [] }))
  )
  for (const w of watches) {
    const ri = rowIdx.get(sizeBand(w.case_diameter_mm).key)!
    const ci = colIdx.get(normalizeDialColor(w.dial_color).key)!
    const cell = matrix[ri][ci]
    cell.count++
    if (cell.labels.length < 20) {
      cell.labels.push(`${w.brand?.name ?? ""} ${w.model}`.trim())
    }
  }
  let matrixMax = 0
  for (const row of matrix) for (const c of row) matrixMax = Math.max(matrixMax, c.count)

  // Scatter — watches with both diameter and thickness.
  const scatter: ScatterPoint[] = []
  for (const w of watches) {
    if (w.case_diameter_mm == null || w.case_height_mm == null) continue
    const b = normalizeDialColor(w.dial_color)
    scatter.push({
      id: w.id,
      label: `${w.brand?.name ?? ""} ${w.model}`.trim(),
      diameter: w.case_diameter_mm,
      thickness: w.case_height_mm,
      hex: b.hex || "#9a8f7d",
      colorLabel: b.label,
    })
  }

  const missingColor = watches.filter((w) => normalizeDialColor(w.dial_color).key === "unspecified").length
  const missingSize = watches.filter((w) => w.case_diameter_mm == null).length

  return {
    total: watches.length,
    sizeDist,
    colorDist,
    categoryDist,
    thicknessDist,
    complicationDist,
    tierDist,
    tierBands,
    priceCategory,
    matrixRows,
    matrixCols,
    matrix,
    matrixMax,
    scatter,
    insights: buildInsights(watches, { sizeDist, colorDist, matrixRows, matrixCols, matrix }),
    missingColor,
    missingSize,
  }
}

// Deterministic, transparent gap/overload observations (no AI).
function buildInsights(
  watches: WatchWithCover[],
  d: Pick<CollectionMap, "sizeDist" | "colorDist" | "matrixRows" | "matrixCols" | "matrix">
): string[] {
  const out: string[] = []
  const sized = watches.filter((w) => w.case_diameter_mm != null).length
  const colored = watches.filter((w) => normalizeDialColor(w.dial_color).key !== "unspecified").length

  // Dominant size band (excluding Unsized).
  const topSize = d.sizeDist.filter((b) => b.key !== "unsized").sort((a, b) => b.count - a.count)[0]
  if (topSize && sized > 0) {
    const pct = Math.round((topSize.count / sized) * 100)
    if (pct >= 40)
      out.push(`Size skews to ${topSize.label} — ${pct}% of sized watches sit there. Consider whether the range feels one-note.`)
  }

  // Most concentrated size×color cell.
  let best: { r: number; c: number; n: number } | null = null
  for (let r = 0; r < d.matrixRows.length; r++)
    for (let c = 0; c < d.matrixCols.length; c++) {
      const n = d.matrix[r][c].count
      if (d.matrixRows[r].key === "unsized" || d.matrixCols[c].key === "unspecified") continue
      if (!best || n > best.n) best = { r, c, n }
    }
  if (best && best.n >= 3)
    out.push(`Your densest pocket is ${d.matrixRows[best.r].label} + ${d.matrixCols[best.c].label} (${best.n} watches).`)

  // Notable missing color families overall (from a shortlist of "expected" hues).
  const present = new Set(d.colorDist.filter((b) => b.count > 0).map((b) => b.key))
  const wishlistWorthy = ["green", "blue", "salmon", "black", "white"]
  const missing = wishlistWorthy.filter((k) => !present.has(k))
  if (missing.length > 0) {
    const labels = missing.map((k) => COLOR_BUCKETS.find((b) => b.key === k)!.label.split(" ")[0])
    out.push(`No ${labels.join(", ")} dials in the collection yet — an open lane if any appeal.`)
  }

  // A small-dial color gap: colors you own in big sizes but not small, or vice versa.
  const smallKeys = new Set(["u36", "36", "38"])
  const smallColors = new Set<string>()
  const bigColors = new Set<string>()
  for (const w of watches) {
    const cb = normalizeDialColor(w.dial_color)
    if (cb.key === "unspecified") continue
    const sb = sizeBand(w.case_diameter_mm).key
    if (sb === "unsized") continue
    if (smallKeys.has(sb)) smallColors.add(cb.key)
    else bigColors.add(cb.key)
  }
  const onlyBig = [...bigColors].filter((k) => !smallColors.has(k))
  if (onlyBig.length > 0 && smallColors.size > 0) {
    const labels = onlyBig.slice(0, 3).map((k) => COLOR_BUCKETS.find((b) => b.key === k)!.label.split(" ")[0])
    out.push(`You have ${labels.join(", ")} only in larger cases — nothing small in ${onlyBig.length === 1 ? "that color" : "those colors"}.`)
  }

  // Data completeness nudge.
  const missColor = watches.length - colored
  const missSize = watches.length - sized
  if (missColor > 0 || missSize > 0) {
    const parts: string[] = []
    if (missSize > 0) parts.push(`${missSize} without a case size`)
    if (missColor > 0) parts.push(`${missColor} without a dial color`)
    out.push(`Completeness: ${parts.join(" and ")} — filling these sharpens the map (try 🔍 Find in catalog or ✨).`)
  }

  return out
}
