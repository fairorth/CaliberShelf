// The Edit — "which watches should I sell?" — the ONE implementation.
//
// Pure (no I/O) so the Edit screen can re-run it on every slider move in the
// browser, and so the face-off screen asks its questions from the very same
// ranking. Three ideas, in order:
//
//   1. KEEP VALUE (0–1) — how much a watch is worth keeping ON ITS OWN.
//      Attachment dominates; replaceability and a narrative role (a Collection
//      Guide entry) temper it; the two wear signals join only as the wear log
//      earns them weight (see wearContext). Head-to-head picks add a small
//      tiebreak — they separate watches the 5-step scale cannot.
//
//   2. SIMILARITY (0–1) between two watches — a weighted match on category,
//      function, dial family, size band, case material and brand.
//
//   3. GREEDY SELECTION to a target size. Locks go in first; then, one at a
//      time, the watch whose keep value SURVIVES best after crowding by what is
//      already kept. Crowding only ever penalises the weaker members of a
//      group: your favourite chronograph is picked while no chronograph is
//      kept yet, so it pays nothing; the eighth pays for the seven before it.
//      That is the whole point — "I have ten chronographs" must not mark all
//      ten down equally.
//
// Money is deliberately absent from 1–3. Value decides the ORDER you sell in
// (the To Sell view), never WHAT you sell.

import type { Attachment, SaleStatus, ValuationSource } from "@/lib/types/watch"
import type { KeepDecision, Replaceability, WearFeel } from "@/lib/validations/keep"
import { attachmentLabels } from "@/lib/validations/watch"

// ── Input ─────────────────────────────────────────────────────────

export type FunctionKey = "chronograph" | "gmt" | "diver" | "calendar" | "time"

export const FUNCTION_LABELS: Record<FunctionKey, string> = {
  chronograph: "Chronograph",
  gmt: "GMT / dual time",
  diver: "Diver",
  calendar: "Calendar",
  time: "Time only",
}

/** Plural nouns for reasons — "6 chronographs already kept". */
const FUNCTION_PLURAL: Record<FunctionKey, string> = {
  chronograph: "chronographs",
  gmt: "GMTs",
  diver: "divers",
  calendar: "calendar watches",
  time: "time-only watches",
}

export interface EditWatch {
  id: string
  name: string
  nickname: string | null
  thumbUrl: string | null
  /** ~720px cover, for the head-to-head cards. */
  photoUrl: string | null
  brandId: string
  brandName: string
  categoryId: string | null
  categoryName: string | null
  functionKey: FunctionKey
  dialKey: string
  dialLabel: string
  sizeKey: string
  sizeLabel: string
  material: string | null
  attachment: Attachment | null
  replaceability: Replaceability | null
  sentimental: boolean
  keepDecision: KeepDecision | null
  saleStatus: SaleStatus
  isComingSoon: boolean
  /** Guide name when the watch is a Collection Guide entry. */
  guide: string | null
  valueCents: number | null
  valueSource: ValuationSource | null
  /** Wears inside the frequency window. */
  recentWears: number
  /** Feel ratings across all wears, newest first. */
  feels: WearFeel[]
  lastWorn: string | null
}

export interface Faceoff {
  id: string
  winnerId: string
  loserId: string
  createdAt: string
}

/** Collection-wide wear-log coverage, computed by the query. */
export interface WearLogCoverage {
  /** Distinct days with at least one wear, inside the window. */
  daysLogged: number
  /** Wear rows inside the window. */
  wearsInWindow: number
  /** Days since the first wear ever logged (0 when none). */
  historyDays: number
}

/** Derive what the watch DOES from data already on it — no new field. */
export function deriveFunction(input: {
  categoryName: string | null
  complication: string | null
  rotatingBezel: boolean
  waterResistanceM: number | null
}): FunctionKey {
  const cat = (input.categoryName ?? "").toLowerCase()
  const comp = (input.complication ?? "").toLowerCase()
  if (cat.includes("chrono") || comp.includes("chrono")) return "chronograph"
  if (/\bdtz\b|gmt|world ?time|dual/.test(comp)) return "gmt"
  if (input.rotatingBezel && (input.waterResistanceM ?? 0) >= 200) return "diver"
  if (/moon|annual|perpetual/.test(comp)) return "calendar"
  return "time"
}

// ── 1. Keep value ─────────────────────────────────────────────────

const ATTACHMENT_SCORE: Record<Attachment, number> = {
  max: 1,
  high: 0.8,
  medium: 0.55,
  low: 0.3,
  none: 0.05,
}
/** Unrated sits mid-scale: unknown is neither a reason to keep nor to sell. */
const UNRATED_ATTACHMENT = 0.5

const REPLACEABILITY_SCORE: Record<Replaceability, number> = {
  easy: 0.1,
  findable: 0.4,
  rare: 0.75,
  irreplaceable: 1,
}
const UNRATED_REPLACEABILITY = 0.4

const FEEL_SCORE: Record<WearFeel, number> = { loved: 1, fine: 0.55, meh: 0 }

/** Base weights. The two wear weights are scaled by their confidence, and the
 *  total is renormalised — so while the wear log is thin, attachment simply
 *  carries more of the score rather than every watch losing points. */
export const KEEP_WEIGHTS = {
  attachment: 0.6,
  replaceability: 0.15,
  narrative: 0.1,
  feel: 0.15,
  frequency: 0.1,
} as const

/** A watch's feel signal reaches full weight after this many rated wears —
 *  one bad day must not sink a watch. */
export const FEEL_FULL_AT = 3
/** The frequency window, and the history it needs before it counts at all. */
export const FREQUENCY_WINDOW_DAYS = 120
export const FREQUENCY_MIN_HISTORY_DAYS = 120
/** Max tiebreak from head-to-heads, either way. */
const FACEOFF_BONUS = 0.06

export interface WearContext {
  /** 0–1: how much the frequency signal is trusted right now. */
  frequencyConfidence: number
  /** Expected wears per watch in the window, if wear were spread evenly. */
  expectedWears: number
  /** One line for the screen: what the wear signals are doing and why. */
  status: string
}

export function wearContext(coverage: WearLogCoverage, poolSize: number): WearContext {
  const coverageShare = Math.min(1, coverage.daysLogged / FREQUENCY_WINDOW_DAYS)
  const frequencyConfidence =
    coverage.historyDays >= FREQUENCY_MIN_HISTORY_DAYS ? coverageShare : 0
  const expectedWears = poolSize > 0 ? coverage.wearsInWindow / poolSize : 0
  let status: string
  if (coverage.historyDays === 0) {
    status = "No wears logged yet — wear frequency is off. Feel ratings count from the first one."
  } else if (frequencyConfidence === 0) {
    const left = FREQUENCY_MIN_HISTORY_DAYS - coverage.historyDays
    status = `Wear frequency is off until ${FREQUENCY_MIN_HISTORY_DAYS} days of history (${left} to go). Feel ratings already count.`
  } else {
    status = `Wear frequency at ${Math.round(frequencyConfidence * 100)}% weight — ${coverage.daysLogged} of the last ${FREQUENCY_WINDOW_DAYS} days logged.`
  }
  return { frequencyConfidence, expectedWears, status }
}

export interface KeepComponent {
  key: keyof typeof KEEP_WEIGHTS | "faceoff"
  label: string
  /** 0–1 */
  score: number
  /** effective weight after confidence scaling (faceoff: 0, it is additive). */
  weight: number
}

export interface KeepBreakdown {
  value: number
  components: KeepComponent[]
  faceoffNet: number
}

function faceoffNetById(faceoffs: readonly Faceoff[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const f of faceoffs) {
    m.set(f.winnerId, (m.get(f.winnerId) ?? 0) + 1)
    m.set(f.loserId, (m.get(f.loserId) ?? 0) - 1)
  }
  return m
}

export function keepValue(w: EditWatch, wear: WearContext, faceoffNet: number): KeepBreakdown {
  const components: KeepComponent[] = []
  components.push({
    key: "attachment",
    label: w.attachment ? `${attachmentLabels[w.attachment]} attachment` : "Attachment unrated",
    score: w.attachment ? ATTACHMENT_SCORE[w.attachment] : UNRATED_ATTACHMENT,
    weight: KEEP_WEIGHTS.attachment,
  })
  components.push({
    key: "replaceability",
    label: w.replaceability ? `Replaceability: ${w.replaceability}` : "Replaceability unrated",
    score: w.replaceability ? REPLACEABILITY_SCORE[w.replaceability] : UNRATED_REPLACEABILITY,
    weight: KEEP_WEIGHTS.replaceability,
  })
  components.push({
    key: "narrative",
    label: w.guide ? `In the ${w.guide} guide` : "No guide role",
    score: w.guide ? 1 : 0,
    weight: KEEP_WEIGHTS.narrative,
  })

  if (w.feels.length > 0) {
    const mean = w.feels.reduce((s, f) => s + FEEL_SCORE[f], 0) / w.feels.length
    const conf = Math.min(1, w.feels.length / FEEL_FULL_AT)
    components.push({
      key: "feel",
      label: `Felt ${mean >= 0.75 ? "great" : mean >= 0.4 ? "fine" : "meh"} over ${w.feels.length} wear${w.feels.length === 1 ? "" : "s"}`,
      score: mean,
      weight: KEEP_WEIGHTS.feel * conf,
    })
  }

  if (wear.frequencyConfidence > 0) {
    const ratio = wear.expectedWears > 0 ? w.recentWears / wear.expectedWears : 0
    components.push({
      key: "frequency",
      label: `${w.recentWears} wear${w.recentWears === 1 ? "" : "s"} in ${FREQUENCY_WINDOW_DAYS} days`,
      score: ratio / (ratio + 1),
      weight: KEEP_WEIGHTS.frequency * wear.frequencyConfidence,
    })
  }

  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const base = components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
  const bonus = FACEOFF_BONUS * Math.tanh(faceoffNet / 2)
  if (faceoffNet !== 0) {
    components.push({
      key: "faceoff",
      label: `${faceoffNet > 0 ? "Won" : "Lost"} head-to-heads (net ${faceoffNet > 0 ? "+" : ""}${faceoffNet})`,
      score: bonus,
      weight: 0,
    })
  }
  return { value: Math.max(0, Math.min(1.1, base + bonus)), components, faceoffNet }
}

// ── 2. Similarity ─────────────────────────────────────────────────

const SIM_WEIGHTS = {
  category: 0.25,
  function: 0.2,
  dial: 0.25,
  size: 0.1,
  material: 0.1,
  brand: 0.1,
} as const
/** Credit for a dimension where either watch is missing the data — enough to
 *  stay neutral, not enough to make two sparse records look like twins. */
const UNKNOWN_CREDIT = 0.3
const SIZE_ORDER = ["u36", "36", "38", "40", "42", "44"]
const UNKNOWN_DIAL = new Set(["unspecified", "other"])

export function similarity(a: EditWatch, b: EditWatch): number {
  let s = 0
  s += SIM_WEIGHTS.category * (a.categoryId && b.categoryId ? (a.categoryId === b.categoryId ? 1 : 0) : UNKNOWN_CREDIT)
  s +=
    SIM_WEIGHTS.function *
    (a.functionKey === b.functionKey ? (a.functionKey === "time" ? 0.5 : 1) : 0)
  s +=
    SIM_WEIGHTS.dial *
    (UNKNOWN_DIAL.has(a.dialKey) || UNKNOWN_DIAL.has(b.dialKey)
      ? UNKNOWN_CREDIT
      : a.dialKey === b.dialKey
        ? 1
        : 0)
  const ai = SIZE_ORDER.indexOf(a.sizeKey)
  const bi = SIZE_ORDER.indexOf(b.sizeKey)
  s +=
    SIM_WEIGHTS.size *
    (ai < 0 || bi < 0 ? UNKNOWN_CREDIT : ai === bi ? 1 : Math.abs(ai - bi) === 1 ? 0.5 : 0)
  s += SIM_WEIGHTS.material * (a.material && b.material ? (a.material === b.material ? 1 : 0) : UNKNOWN_CREDIT)
  s += SIM_WEIGHTS.brand * (a.brandId === b.brandId ? 1 : 0)
  return s
}

/** What two watches have in common, in words — for face-off cards. */
export function sharedTraits(a: EditWatch, b: EditWatch): string[] {
  const out: string[] = []
  if (a.functionKey === b.functionKey && a.functionKey !== "time") out.push(`Both ${FUNCTION_PLURAL[a.functionKey]}`)
  else if (a.categoryId && a.categoryId === b.categoryId && a.categoryName) out.push(`Both ${a.categoryName}`)
  if (a.dialKey === b.dialKey && !UNKNOWN_DIAL.has(a.dialKey)) out.push(`${a.dialLabel} dials`)
  if (a.sizeKey === b.sizeKey && SIZE_ORDER.includes(a.sizeKey)) out.push(a.sizeLabel)
  if (a.brandId === b.brandId) out.push(`Both ${a.brandName}`)
  return out
}

// ── 3. Selection ──────────────────────────────────────────────────

/** Similarity below this is not "a twin" at all; at TWIN_FULL it is total. */
const TWIN_FLOOR = 0.55
const TWIN_FULL = 0.95
/** Crowding saturation: n kept of a kind costs 1 − e^(−n/τ). */
const CROWD_TAU = 4
const CROWD_WEIGHTS = { category: 0.35, function: 0.3, dial: 0.35 } as const

export const DEFAULT_LAMBDA = 0.6

export type Verdict =
  /** Sentimental, or you marked it Keep — always in. */
  | "locked"
  /** Picked by the algorithm. */
  | "keep"
  /** Not picked: the suggestion. */
  | "sell"
  /** You marked it Sell, or it is already listed — already out. */
  | "decided"

export interface CrowdCount {
  dim: "category" | "function" | "dial"
  label: string
  n: number
}

export interface EditRow {
  watch: EditWatch
  keep: KeepBreakdown
  verdict: Verdict
  /** keep value after crowding, at the moment it was judged. */
  marginal: number
  /** 1-based position in the ranking (locks first, decided last). */
  rank: number
  /** near the cut line — where a face-off or a second look matters most. */
  bubble: boolean
  twin: { id: string; name: string; similarity: number } | null
  crowd: CrowdCount[]
  reasons: string[]
}

export interface EditOptions {
  target: number
  lambda: number
}

export interface CompositionRow {
  key: string
  label: string
  before: number
  after: number
}

export interface EditResult {
  rows: EditRow[]
  target: number
  lockedCount: number
  decidedCount: number
  keptCount: number
  wear: WearContext
  composition: {
    function: CompositionRow[]
    category: CompositionRow[]
    dial: CompositionRow[]
  }
}

interface Kinds {
  category: string | null
  function: string | null
  dial: string | null
}

function kindsOf(w: EditWatch): Kinds {
  return {
    category: w.categoryId,
    function: w.functionKey === "time" ? null : w.functionKey,
    dial: UNKNOWN_DIAL.has(w.dialKey) ? null : w.dialKey,
  }
}

function crowdingFor(
  w: EditWatch,
  counts: Record<keyof Kinds, Map<string, number>>
): { crowd: number; detail: CrowdCount[] } {
  const k = kindsOf(w)
  let num = 0
  let den = 0
  const detail: CrowdCount[] = []
  for (const dim of ["category", "function", "dial"] as const) {
    const key = k[dim]
    if (!key) continue
    const n = counts[dim].get(key) ?? 0
    num += CROWD_WEIGHTS[dim] * (1 - Math.exp(-n / CROWD_TAU))
    den += CROWD_WEIGHTS[dim]
    if (n > 0) {
      detail.push({
        dim,
        n,
        label:
          dim === "function"
            ? FUNCTION_PLURAL[w.functionKey]
            : dim === "dial"
              ? `${w.dialLabel.toLowerCase()} dials`
              : `${(w.categoryName ?? "").toLowerCase()} watches`,
      })
    }
  }
  return { crowd: den > 0 ? num / den : 0, detail: detail.sort((a, b) => b.n - a.n) }
}

function twinFactor(sim: number): number {
  return Math.max(0, Math.min(1, (sim - TWIN_FLOOR) / (TWIN_FULL - TWIN_FLOOR)))
}

function displayName(w: EditWatch): string {
  return w.nickname ? `${w.name} “${w.nickname}”` : w.name
}

/**
 * Run The Edit. `watches` is the pool: everything owned or coming soon that
 * has not sold (wish list excluded) — listed watches included, as decided.
 */
export function runEdit(
  watches: readonly EditWatch[],
  faceoffs: readonly Faceoff[],
  coverage: WearLogCoverage,
  options: EditOptions
): EditResult {
  const wear = wearContext(coverage, watches.length)
  const net = faceoffNetById(faceoffs)
  const keep = new Map(watches.map((w) => [w.id, keepValue(w, wear, net.get(w.id) ?? 0)]))
  const K = (w: EditWatch) => keep.get(w.id)!.value

  const decided = watches.filter((w) => w.saleStatus === "listed" || w.keepDecision === "sell")
  const decidedIds = new Set(decided.map((w) => w.id))
  const locked = watches
    .filter((w) => !decidedIds.has(w.id) && (w.sentimental || w.keepDecision === "keep"))
    .sort((a, b) => K(b) - K(a))
  const lockedIds = new Set(locked.map((w) => w.id))
  const candidates = watches.filter((w) => !decidedIds.has(w.id) && !lockedIds.has(w.id))

  const available = watches.length - decided.length
  const target = Math.max(locked.length, Math.min(Math.round(options.target), available))
  const lambda = Math.max(0, Math.min(1, options.lambda))

  const counts: Record<keyof Kinds, Map<string, number>> = {
    category: new Map(),
    function: new Map(),
    dial: new Map(),
  }
  // Nearest kept watch, per candidate — updated incrementally as each pick lands.
  const nearest = new Map<string, { id: string; name: string; similarity: number }>()

  const rows: EditRow[] = []
  const admit = (w: EditWatch) => {
    const k = kindsOf(w)
    for (const dim of ["category", "function", "dial"] as const) {
      const key = k[dim]
      if (key) counts[dim].set(key, (counts[dim].get(key) ?? 0) + 1)
    }
    for (const c of candidates) {
      if (c.id === w.id) continue
      const sim = similarity(c, w)
      const cur = nearest.get(c.id)
      if (!cur || sim > cur.similarity) nearest.set(c.id, { id: w.id, name: displayName(w), similarity: sim })
    }
  }

  const evaluate = (w: EditWatch) => {
    const { crowd, detail } = crowdingFor(w, counts)
    const twin = nearest.get(w.id) ?? null
    const tf = twin ? twinFactor(twin.similarity) : 0
    const penalty = Math.max(crowd, tf)
    return {
      marginal: K(w) * (1 - lambda * penalty),
      crowd: detail,
      twin: twin && tf > 0 ? twin : null,
    }
  }

  for (const w of locked) {
    rows.push({
      watch: w,
      keep: keep.get(w.id)!,
      verdict: "locked",
      marginal: K(w),
      rank: 0,
      bubble: false,
      twin: null,
      crowd: [],
      reasons: [],
    })
    admit(w)
  }

  const remaining = new Set(candidates.map((c) => c.id))
  const byId = new Map(candidates.map((c) => [c.id, c]))
  while (rows.length < target && remaining.size > 0) {
    let best: { w: EditWatch; e: ReturnType<typeof evaluate> } | null = null
    for (const id of remaining) {
      const w = byId.get(id)!
      const e = evaluate(w)
      if (!best || e.marginal > best.e.marginal || (e.marginal === best.e.marginal && K(w) > K(best.w))) {
        best = { w, e }
      }
    }
    if (!best) break
    remaining.delete(best.w.id)
    rows.push({
      watch: best.w,
      keep: keep.get(best.w.id)!,
      verdict: "keep",
      marginal: best.e.marginal,
      rank: 0,
      bubble: false,
      twin: best.e.twin,
      crowd: best.e.crowd,
      reasons: [],
    })
    admit(best.w)
  }

  // What is left is the suggestion, judged against the FINAL kept set and
  // ordered so the closest calls come first.
  const sells = [...remaining]
    .map((id) => {
      const w = byId.get(id)!
      return { w, e: evaluate(w) }
    })
    .sort((a, b) => b.e.marginal - a.e.marginal)
  for (const { w, e } of sells) {
    rows.push({
      watch: w,
      keep: keep.get(w.id)!,
      verdict: "sell",
      marginal: e.marginal,
      rank: 0,
      bubble: false,
      twin: e.twin,
      crowd: e.crowd,
      reasons: [],
    })
  }
  for (const w of decided.sort((a, b) => K(b) - K(a))) {
    rows.push({
      watch: w,
      keep: keep.get(w.id)!,
      verdict: "decided",
      marginal: K(w),
      rank: 0,
      bubble: false,
      twin: null,
      crowd: [],
      reasons: [w.saleStatus === "listed" ? "Already listed" : "You marked it Sell"],
    })
  }

  // Ranks, the bubble, and the reasons.
  const bubbleWidth = Math.max(4, Math.round(target * 0.08))
  rows.forEach((r, i) => {
    r.rank = i + 1
    if (r.verdict === "keep" || r.verdict === "sell") {
      r.bubble = Math.abs(r.rank - (target + 0.5)) <= bubbleWidth
    }
    if (r.reasons.length === 0) r.reasons = reasonsFor(r, wear)
  })

  const kept = rows.filter((r) => r.verdict === "locked" || r.verdict === "keep")
  return {
    rows,
    target,
    lockedCount: locked.length,
    decidedCount: decided.length,
    keptCount: kept.length,
    wear,
    composition: {
      function: compose(watches, kept.map((r) => r.watch), (w) =>
        ({ key: w.functionKey, label: FUNCTION_LABELS[w.functionKey] })),
      category: compose(watches, kept.map((r) => r.watch), (w) =>
        ({ key: w.categoryId ?? "none", label: w.categoryName ?? "Uncategorized" })),
      dial: compose(watches, kept.map((r) => r.watch), (w) => ({ key: w.dialKey, label: w.dialLabel })),
    },
  }
}

function reasonsFor(r: EditRow, wear: WearContext): string[] {
  const out: string[] = []
  const w = r.watch
  if (r.verdict === "locked") {
    out.push(w.sentimental ? "Sentimental — never suggested" : "You marked it Keep")
    return out
  }
  const attachment = r.keep.components.find((c) => c.key === "attachment")!
  if (r.verdict === "keep") {
    out.push(attachment.label)
    if (w.guide) out.push(`In the ${w.guide} guide`)
    if (w.replaceability === "irreplaceable" || w.replaceability === "rare")
      out.push(w.replaceability === "rare" ? "Rare to replace" : "Irreplaceable")
    const first = r.crowd.length === 0 && w.functionKey !== "time"
    if (first) out.push(`First ${FUNCTION_LABELS[w.functionKey].toLowerCase()} picked`)
  } else {
    out.push(attachment.label)
    // "Twin" is a strong word: only for a real near-match. A milder overlap
    // still costs points, but the crowding count says it better.
    if (r.twin && r.twin.similarity >= 0.75) out.push(`Near twin of ${r.twin.name}`)
    const top = r.crowd[0]
    if (top && top.n >= 2) out.push(`${top.n} ${top.label} already kept`)
    if (w.replaceability === "easy") out.push("Easy to buy again")
  }
  const feel = r.keep.components.find((c) => c.key === "feel")
  if (feel && (feel.score >= 0.75 || feel.score < 0.4)) out.push(feel.label)
  if (wear.frequencyConfidence >= 0.5 && w.recentWears === 0 && r.verdict === "sell")
    out.push("Not worn lately")
  const faceoff = r.keep.components.find((c) => c.key === "faceoff")
  if (faceoff) out.push(faceoff.label)
  return out.slice(0, 4)
}

function compose(
  before: readonly EditWatch[],
  after: readonly EditWatch[],
  key: (w: EditWatch) => { key: string; label: string }
): CompositionRow[] {
  const m = new Map<string, CompositionRow>()
  for (const w of before) {
    const k = key(w)
    const cur = m.get(k.key) ?? { key: k.key, label: k.label, before: 0, after: 0 }
    cur.before++
    m.set(k.key, cur)
  }
  for (const w of after) m.get(key(w).key)!.after++
  return [...m.values()].sort((a, b) => b.before - a.before || a.label.localeCompare(b.label))
}

// ── Face-offs ─────────────────────────────────────────────────────

export interface FaceoffPair {
  a: EditRow
  b: EditRow
  similarity: number
  traits: string[]
}

function pairKey(x: string, y: string): string {
  return x < y ? `${x}|${y}` : `${y}|${x}`
}

/**
 * The questions worth asking: pairs of look-alikes near the cut line, closest
 * keep values first, never a pair already decided. Asking about the 3rd-best
 * and 150th-best watch tells the ranking nothing; asking about two blue
 * chronographs sitting either side of the line tells it exactly what it
 * cannot work out alone.
 */
export function pickFaceoffs(result: EditResult, faceoffs: readonly Faceoff[], limit = 12): FaceoffPair[] {
  const asked = new Set(faceoffs.map((f) => pairKey(f.winnerId, f.loserId)))
  const zoneWidth = Math.max(10, Math.round(result.target * 0.15))
  const zone = result.rows.filter(
    (r) =>
      (r.verdict === "keep" || r.verdict === "sell") &&
      Math.abs(r.rank - (result.target + 0.5)) <= zoneWidth
  )

  const pairs: FaceoffPair[] = []
  for (let i = 0; i < zone.length; i++) {
    for (let j = i + 1; j < zone.length; j++) {
      const a = zone[i]
      const b = zone[j]
      if (asked.has(pairKey(a.watch.id, b.watch.id))) continue
      const sim = similarity(a.watch, b.watch)
      if (sim < 0.45) continue
      pairs.push({ a, b, similarity: sim, traits: sharedTraits(a.watch, b.watch) })
    }
  }
  const score = (p: FaceoffPair) =>
    p.similarity * (1 - Math.min(1, Math.abs(p.a.keep.value - p.b.keep.value) * 2)) +
    (p.a.verdict !== p.b.verdict ? 0.15 : 0)
  pairs.sort((x, y) => score(y) - score(x))

  // No watch more than twice per batch — twelve questions about one watch is
  // a chore, not a game.
  const uses = new Map<string, number>()
  const out: FaceoffPair[] = []
  for (const p of pairs) {
    const ua = uses.get(p.a.watch.id) ?? 0
    const ub = uses.get(p.b.watch.id) ?? 0
    if (ua >= 2 || ub >= 2) continue
    out.push(p)
    uses.set(p.a.watch.id, ua + 1)
    uses.set(p.b.watch.id, ub + 1)
    if (out.length >= limit) break
  }
  return out
}
