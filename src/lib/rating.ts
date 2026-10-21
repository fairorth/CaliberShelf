/**
 * RATE MY WATCHES — the model (migration 00057). Pure; shared by the iPhone
 * (pair selection and the stop rule, live, after every tap) and the web
 * (the Ratings report re-fits stored picks). One model, so the phone's reveal
 * and the web's report can never rank the same picks differently.
 *
 * Bradley–Terry: each watch i has a strength p_i, and P(i beats j) =
 * p_i / (p_i + p_j). Fitted with Hunter's MM iteration. A light prior — one
 * virtual win and one virtual loss against an average watch — keeps a watch
 * seen once from leaping to the top on a single lucky pick, and makes the fit
 * well-defined even for a watch that has won (or lost) everything. "Can't
 * choose" counts as half a win to each side.
 */

export interface RatingPick {
  /** The two watches shown (order irrelevant to the model). */
  a: string
  b: string
  /** The one tapped; null = "Can't choose" (a tie). */
  winner: string | null
}

export interface RankedWatch {
  watchId: string
  rank: number
  /** Display score on an Elo-like scale: 1500 is an average watch of this set. */
  score: number
  comparisons: number
}

const PRIOR = 1
const MAX_ITER = 200
const TOLERANCE = 1e-7

/** Fit strengths; geometric mean normalised to 1. */
export function fitStrengths(ids: string[], picks: RatingPick[]): Map<string, number> {
  const index = new Map(ids.map((id, i) => [id, i]))
  const n = ids.length
  const wins = new Array<number>(n).fill(PRIOR)
  // pairCount[i][j] = comparisons between i and j (symmetric).
  const pairCount: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (const pk of picks) {
    const i = index.get(pk.a)
    const j = index.get(pk.b)
    if (i === undefined || j === undefined || i === j) continue
    pairCount[i][j] += 1
    pairCount[j][i] += 1
    if (pk.winner === null) {
      wins[i] += 0.5
      wins[j] += 0.5
    } else if (pk.winner === pk.a) wins[i] += 1
    else if (pk.winner === pk.b) wins[j] += 1
  }

  let p = new Array<number>(n).fill(1)
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const next = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      // The prior: 2·PRIOR comparisons against a virtual watch of strength 1.
      let denom = (2 * PRIOR) / (p[i] + 1)
      for (let j = 0; j < n; j++) {
        if (pairCount[i][j] > 0) denom += pairCount[i][j] / (p[i] + p[j])
      }
      next[i] = wins[i] / denom
    }
    // Normalise to geometric mean 1 (the model is scale-free).
    const logMean = next.reduce((s, v) => s + Math.log(v), 0) / Math.max(1, n)
    const scale = Math.exp(logMean)
    let maxDelta = 0
    for (let i = 0; i < n; i++) {
      next[i] /= scale
      maxDelta = Math.max(maxDelta, Math.abs(next[i] - p[i]))
    }
    p = next
    if (maxDelta < TOLERANCE) break
  }
  return new Map(ids.map((id, i) => [id, p[i]]))
}

function comparisonCounts(ids: string[], picks: RatingPick[]): Map<string, number> {
  const counts = new Map(ids.map((id) => [id, 0]))
  for (const pk of picks) {
    if (counts.has(pk.a)) counts.set(pk.a, counts.get(pk.a)! + 1)
    if (counts.has(pk.b)) counts.set(pk.b, counts.get(pk.b)! + 1)
  }
  return counts
}

/** The ranking, best first. Ties in strength fall back to raw wins, then id. */
export function rankWatches(ids: string[], picks: RatingPick[]): RankedWatch[] {
  const strengths = fitStrengths(ids, picks)
  const counts = comparisonCounts(ids, picks)
  return [...ids]
    .sort((x, y) => strengths.get(y)! - strengths.get(x)! || x.localeCompare(y))
    .map((watchId, i) => ({
      watchId,
      rank: i + 1,
      score: Math.round(1500 + 400 * Math.log10(strengths.get(watchId)!)),
      comparisons: counts.get(watchId) ?? 0,
    }))
}

export interface RankedWithGap extends RankedWatch {
  /** Natural-log strength, and its standard error (from the Fisher information). */
  logStrength: number
  se: number
  /** Against the NEXT watch down: the model's chance this rater picks this
   *  one over it, and whether the lead is clear (≈84% confidence) or too
   *  close to call. Null for the last watch. */
  vsNext: { winChance: number; clear: boolean } | null
}

/**
 * The ranking with the gaps made readable. Bradley–Terry's strengths turn
 * straight into head-to-head odds — P(i over j) = p_i / (p_i + p_j) — and the
 * curvature of the fit gives each strength an uncertainty, so a lead can be
 * called clear or not. A watch seen twice has a wide error bar; one seen ten
 * times a narrow one.
 */
export function rankWithGaps(ids: string[], picks: RatingPick[]): RankedWithGap[] {
  const strengths = fitStrengths(ids, picks)
  const ranked = rankWatches(ids, picks)
  // Fisher information for log-strength: Σ n_ij · π_ij · (1 − π_ij), plus the
  // prior's two virtual games against an average watch.
  const info = new Map(ids.map((id) => [id, 0]))
  for (const id of ids) {
    const pi = strengths.get(id)!
    const pPrior = pi / (pi + 1)
    info.set(id, 2 * PRIOR * pPrior * (1 - pPrior))
  }
  for (const pk of picks) {
    const pa = strengths.get(pk.a)
    const pb = strengths.get(pk.b)
    if (pa === undefined || pb === undefined || pk.a === pk.b) continue
    const pi = pa / (pa + pb)
    const w = pi * (1 - pi)
    info.set(pk.a, info.get(pk.a)! + w)
    info.set(pk.b, info.get(pk.b)! + w)
  }
  return ranked.map((r, i) => {
    const logStrength = Math.log(strengths.get(r.watchId)!)
    const se = 1 / Math.sqrt(Math.max(1e-9, info.get(r.watchId)!))
    const next = ranked[i + 1]
    let vsNext: RankedWithGap["vsNext"] = null
    if (next) {
      const pThis = strengths.get(r.watchId)!
      const pNext = strengths.get(next.watchId)!
      const nextSe = 1 / Math.sqrt(Math.max(1e-9, info.get(next.watchId)!))
      const gap = Math.log(pThis) - Math.log(pNext)
      vsNext = { winChance: pThis / (pThis + pNext), clear: gap > Math.sqrt(se * se + nextSe * nextSe) }
    }
    return { ...r, logStrength, se, vsNext }
  })
}

/** Every watch is compared at least this many times before a segment can end. */
export const MIN_COMPARISONS = 3

/** About how many picks a segment of n watches takes (shown before playing). */
export function estimatePicks(n: number): number {
  if (n < 2) return 0
  return Math.max(MIN_COMPARISONS, Math.ceil(2.5 * n))
}

/** Order-independent key for a pair (the Skip set uses it too). */
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/**
 * The next pair to show: the one that teaches the model most.
 *  1. Watch A = a least-compared watch (so every watch is seen early and none
 *     is ranked on one comparison), never one of the pair just shown.
 *  2. Watch B = the closest in strength to A — a choice between near-equals
 *     is informative, a mismatch isn't — penalising pairs already shown and
 *     much-compared watches, with a little randomness so it never feels
 *     scripted.
 * Left/right is randomised: people favour the left.
 */
export function nextPair(
  ids: string[],
  picks: RatingPick[],
  rand: () => number = Math.random,
  /** Pairs the rater SKIPPED ("can't judge these") — not offered again while
   *  any other pair is left. A skip records nothing in the model. */
  skipped: Set<string> = new Set()
): [string, string] | null {
  if (ids.length < 2) return null
  const strengths = fitStrengths(ids, picks)
  const counts = comparisonCounts(ids, picks)
  const seen = new Set(picks.map((p) => pairKey(p.a, p.b)))
  const last = picks[picks.length - 1]
  const justShown = new Set(last ? [last.a, last.b] : [])

  const pool = ids.length > 2 ? ids.filter((id) => !justShown.has(id)) : ids
  const minCount = Math.min(...pool.map((id) => counts.get(id)!))
  // Phase 1: until every watch has its MIN_COMPARISONS, the least-seen go first.
  // Phase 2: most picks go to the FRONT-RUNNERS — the podium is what a rater
  // sees first, and it's where a misplaced watch is most noticed — while
  // the rest still get the occasional look so a late riser can climb.
  let candidates = pool
  if (minCount >= MIN_COMPARISONS && rand() < 0.65) {
    const k = Math.max(5, Math.ceil(ids.length / 4))
    const front = new Set([...ids].sort((x, y) => strengths.get(y)! - strengths.get(x)!).slice(0, k))
    const frontPool = pool.filter((id) => front.has(id))
    if (frontPool.length > 0) candidates = frontPool
  }
  const candMin = Math.min(...candidates.map((id) => counts.get(id)!))
  const fewest = candidates.filter((id) => counts.get(id) === candMin)
  const a = fewest[Math.floor(rand() * fewest.length)]

  const maxCount = Math.max(1, ...ids.map((id) => counts.get(id)!))
  const allPairsSeen = seen.size >= (ids.length * (ids.length - 1)) / 2
  let best: string | null = null
  let bestCost = Infinity
  for (const b of ids) {
    if (b === a) continue
    if (ids.length > 2 && justShown.has(b) && justShown.has(a)) continue
    const closeness = Math.abs(Math.log(strengths.get(a)!) - Math.log(strengths.get(b)!))
    const repeat = !allPairsSeen && seen.has(pairKey(a, b)) ? 3 : 0
    const skip = skipped.has(pairKey(a, b)) ? 6 : 0
    const busy = (0.6 * counts.get(b)!) / maxCount
    const cost = closeness + repeat + skip + busy + rand() * 0.2
    if (cost < bestCost) {
      bestCost = cost
      best = b
    }
  }
  if (!best) return null
  return rand() < 0.5 ? [a, best] : [best, a]
}

/**
 * Is the segment complete? Every watch compared at least MIN_COMPARISONS
 * times, at least the estimated number of picks made, and the ranking has
 * STOPPED MOVING — the last few picks changed almost nothing. A hard cap of
 * 4 picks per watch ends a segment whose rater genuinely can't decide.
 */
export function isSegmentComplete(ids: string[], picks: RatingPick[]): boolean {
  const n = ids.length
  if (n < 2) return true
  if (picks.length >= 4 * n) return true
  const counts = comparisonCounts(ids, picks)
  if (Math.min(...ids.map((id) => counts.get(id)!)) < MIN_COMPARISONS) return false
  if (picks.length < estimatePicks(n)) return false
  const window = Math.max(3, Math.round(n / 4))
  const before = rankWatches(ids, picks.slice(0, picks.length - window)).map((r) => r.watchId)
  const now = rankWatches(ids, picks).map((r) => r.watchId)
  // The podium must have settled too: same top three, same order.
  const podium = Math.min(3, n)
  const podiumSettled = now.slice(0, podium).every((id, i) => before[i] === id)
  return podiumSettled && pairwiseAgreement(now, before).pct >= 0.95
}

/** 0..1 progress for the bar — honest, never past 0.99 until complete. */
export function segmentProgress(ids: string[], picks: RatingPick[]): number {
  if (isSegmentComplete(ids, picks)) return 1
  return Math.min(0.99, picks.length / Math.max(1, estimatePicks(ids.length)))
}

/**
 * How much two rankings agree: of every pair of watches both contain, the
 * share they put in the same order (Kendall-style). `reference` may instead
 * be a level per watch (lower = preferred, e.g. attachment Max=0…None=4);
 * pairs on the same level are then skipped — they say nothing.
 */
export function pairwiseAgreement(
  ranking: string[],
  reference: string[] | Map<string, number>
): { pct: number; pairs: number } {
  const refLevel =
    reference instanceof Map ? reference : new Map(reference.map((id, i) => [id, i] as const))
  const ids = ranking.filter((id) => refLevel.has(id))
  let agree = 0
  let pairs = 0
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const li = refLevel.get(ids[i])!
      const lj = refLevel.get(ids[j])!
      if (li === lj) continue
      pairs++
      // ids[i] is ranked above ids[j]; agree if the reference also prefers it.
      if (li < lj) agree++
    }
  }
  return { pct: pairs === 0 ? 0 : agree / pairs, pairs }
}

/**
 * The hot take: the watch this rater placed furthest from the reference
 * ranking — "you put the Tank 14th; Marc has it 2nd".
 */
export function hotTake(
  ranking: string[],
  reference: string[]
): { watchId: string; raterRank: number; referenceRank: number } | null {
  const refRank = new Map(reference.map((id, i) => [id, i + 1]))
  let best: { watchId: string; raterRank: number; referenceRank: number } | null = null
  let bestDiff = 2 // a hot take is at least 3 places apart
  for (let i = 0; i < ranking.length; i++) {
    const r = refRank.get(ranking[i])
    if (r === undefined) continue
    const diff = Math.abs(i + 1 - r)
    if (diff > bestDiff) {
      bestDiff = diff
      best = { watchId: ranking[i], raterRank: i + 1, referenceRank: r }
    }
  }
  return best
}

/** Best in Show: the top `perSegment` of each completed segment. */
export function finalists(segmentRankings: RankedWatch[][], perSegment = 3): string[] {
  return segmentRankings.flatMap((r) => r.slice(0, perSegment).map((w) => w.watchId))
}
