// Display Box selection engine — pure module (no I/O) so it's easy to reason
// about and test. Picks a weekly rotation of watches, balancing category /
// price tier / complication while favoring under-worn and newer pieces, and
// rotating away from last week's box. Transparent by design: every pick carries
// a human-readable "reason".
//
// House rules (in priority order):
// 1. 3–4 gym watches — chronograph category or rotating bezel, never luxury
//    and never a dressy category (Dress/Horology).
// 2. 1–2 swim-ready watches — ≥200 m water resistance, never luxury. A gym
//    diver counts toward both quotas.
// 3. At most 2 luxury watches (the top tier bands — special-occasion pieces).
// 4. No two watches from the same brand.
// 5. Good price mix — the tier diversity multiplier spreads picks across bands.
// If the collection can't satisfy a rule, it relaxes gently (quota maxima
// first, then the brand rule) rather than leaving slots empty — except the
// luxury cap, which never relaxes.

export const DISPLAY_BOX_SIZE = 11

// Quotas and caps for the house rules above.
export const GYM_MIN = 3
export const GYM_MAX = 4
export const SWIM_MIN = 1
export const SWIM_MAX = 2
export const LUXURY_MAX = 2
export const SWIM_WR_METERS = 200

export interface DisplayBoxCandidate {
  id: string
  name: string
  brandId: string | null
  categoryId: string
  categoryName: string | null
  tierLabel: string
  /** 0-based index into the user's tier bands; -1 when unpriced. */
  tierIndex: number
  complications: string[]
  rotatingBezel: boolean
  waterResistanceM: number | null
  wearCount: number
  lastWornDate: string | null // YYYY-MM-DD
  purchaseDate: string | null // YYYY-MM-DD
  box: string | null // permanent storage box
}

export interface DisplayBoxPick {
  id: string
  reason: string
}

export interface SelectOptions {
  size?: number
  /** Watch ids in the previous box — strongly deprioritized, to rotate. */
  previousBoxIds?: Set<string>
  /** Today as YYYY-MM-DD; the caller supplies it (module stays pure). */
  todayIso?: string
  /** How many tier bands the user has configured — defines the luxury bands. */
  tierCount?: number
}

interface Roles {
  gym: boolean
  swim: boolean
  luxury: boolean
}

// Luxury = the top two tier bands when the user has a reasonably granular
// config (≥4 bands); with a coarser config, only the open-ended top band.
// Unpriced watches are treated as non-luxury — no price, no judgement.
function luxuryFloor(tierCount: number): number {
  return tierCount >= 4 ? tierCount - 2 : tierCount - 1
}

function classify(c: DisplayBoxCandidate, tierCount: number): Roles {
  const luxury =
    tierCount > 0 && c.tierIndex >= 0 && c.tierIndex >= luxuryFloor(tierCount)
  // A rotating bezel alone isn't enough — a dressy world-timer's city bezel
  // qualifies technically, but nobody takes a Dress watch to the gym.
  const dressy = /dress|horolog/i.test(c.categoryName ?? "")
  const sporty = c.rotatingBezel || /chrono/i.test(c.categoryName ?? "")
  return {
    luxury,
    gym: sporty && !luxury && !dressy,
    swim: !luxury && (c.waterResistanceM ?? 0) >= SWIM_WR_METERS,
  }
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso + "T00:00:00Z")
  const b = Date.parse(toIso + "T00:00:00Z")
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

// Base desirability, independent of what's already in the box: least-worn and
// longest-unworn score highest (dominant), with a small boost for recently
// acquired watches.
function baseScore(c: DisplayBoxCandidate, todayIso: string): number {
  const wearScore = 1 / (1 + Math.max(0, c.wearCount)) // 1.0 unworn, decays
  let idleScore = 0.5 // never worn = full idle credit
  if (c.lastWornDate) idleScore = Math.min(0.5, daysBetween(c.lastWornDate, todayIso) / 365)
  let newness = 0
  if (c.purchaseDate) {
    newness = Math.max(0, 0.25 * (1 - Math.min(1, daysBetween(c.purchaseDate, todayIso) / 730)))
  }
  return wearScore + idleScore + newness
}

function reasonFor(c: DisplayBoxCandidate, roles: Roles): string {
  const tags: string[] = []
  if (roles.gym) tags.push("Gym")
  if (roles.swim) tags.push("Swim")
  if (roles.luxury) tags.push("Luxury")
  const cat = c.categoryName ?? "Uncategorized"
  const comp = c.complications.length > 0 ? c.complications.join(", ") : "Time-only"
  const worn = c.wearCount === 0 ? "never worn" : `worn ${c.wearCount}×`
  const prefix = tags.length > 0 ? `${tags.join(" · ")} · ` : ""
  return `${prefix}${cat} · ${c.tierLabel} · ${comp} · ${worn}`
}

// Relaxation ladder when no candidate passes every rule:
// 0 = all rules · 1 = gym/swim maxima may overflow · 2 = brands may repeat.
// The luxury cap is never relaxed.
type RelaxLevel = 0 | 1 | 2

/**
 * Select the display box. Quota-first greedy: gym picks until GYM_MIN, then
 * swim picks until SWIM_MIN (divers picked for the gym already count), then a
 * general fill — all under the brand-uniqueness rule, the luxury cap, and the
 * gym/swim maxima. Within any phase the pick is the highest marginal score,
 * where a watch is down-weighted if its category / tier / complications are
 * already represented in the box so far (the tier multiplier is what delivers
 * the price mix). Deterministic (stable id tie-break) — variety across weeks
 * comes from logged wears and the previous-box penalty, not randomness.
 */
export function selectDisplayBox(
  candidates: DisplayBoxCandidate[],
  opts: SelectOptions = {}
): DisplayBoxPick[] {
  const size = opts.size ?? DISPLAY_BOX_SIZE
  const today = opts.todayIso ?? "1970-01-01"
  const prev = opts.previousBoxIds ?? new Set<string>()
  const tierCount = opts.tierCount ?? 0

  const remaining = [...candidates]
  const base = new Map(candidates.map((c) => [c.id, baseScore(c, today)]))
  const roles = new Map(candidates.map((c) => [c.id, classify(c, tierCount)]))
  const catCount = new Map<string, number>()
  const tierCountByLabel = new Map<string, number>()
  const compCount = new Map<string, number>()
  const brandsUsed = new Set<string>()
  const picks: DisplayBoxPick[] = []
  let gymCount = 0
  let swimCount = 0
  let luxuryCount = 0

  const eligible = (c: DisplayBoxCandidate, relax: RelaxLevel): boolean => {
    const r = roles.get(c.id)!
    if (r.luxury && luxuryCount >= LUXURY_MAX) return false // never relaxed
    if (relax < 2 && c.brandId && brandsUsed.has(c.brandId)) return false
    if (relax < 1) {
      if (r.gym && gymCount >= GYM_MAX) return false
      if (r.swim && swimCount >= SWIM_MAX) return false
    }
    return true
  }

  const marginalScore = (c: DisplayBoxCandidate): number => {
    let s = base.get(c.id) ?? 0
    if (prev.has(c.id)) s *= 0.15 // rotate away from last week
    const catMult = 1 / (1 + (catCount.get(c.categoryId) ?? 0))
    const tierMult = 1 / (1 + (tierCountByLabel.get(c.tierLabel) ?? 0))
    let compMult = 1
    if (c.complications.length > 0) {
      const avg =
        c.complications.reduce((sum, k) => sum + (compCount.get(k) ?? 0), 0) /
        c.complications.length
      compMult = 1 / (1 + avg)
    }
    // Category & tier balance weigh full; complications a softer nudge.
    return s * catMult * tierMult * (0.5 + 0.5 * compMult)
  }

  // Best remaining candidate passing `pool` at the given relax level, or -1.
  const bestIndex = (pool: (r: Roles) => boolean, relax: RelaxLevel): number => {
    let bestIdx = -1
    let bestScore = -Infinity
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i]
      if (!pool(roles.get(c.id)!) || !eligible(c, relax)) continue
      const m = marginalScore(c)
      if (m > bestScore || (m === bestScore && (bestIdx === -1 || c.id < remaining[bestIdx].id))) {
        bestScore = m
        bestIdx = i
      }
    }
    return bestIdx
  }

  const take = (idx: number) => {
    const chosen = remaining.splice(idx, 1)[0]
    const r = roles.get(chosen.id)!
    picks.push({ id: chosen.id, reason: reasonFor(chosen, r) })
    catCount.set(chosen.categoryId, (catCount.get(chosen.categoryId) ?? 0) + 1)
    tierCountByLabel.set(chosen.tierLabel, (tierCountByLabel.get(chosen.tierLabel) ?? 0) + 1)
    for (const k of chosen.complications) compCount.set(k, (compCount.get(k) ?? 0) + 1)
    if (chosen.brandId) brandsUsed.add(chosen.brandId)
    if (r.gym) gymCount++
    if (r.swim) swimCount++
    if (r.luxury) luxuryCount++
  }

  const anyPool = () => true

  while (picks.length < size && remaining.length > 0) {
    // Quota phases first; each falls through if the collection runs dry.
    let idx = -1
    if (gymCount < GYM_MIN) idx = bestIndex((r) => r.gym, 0)
    if (idx === -1 && swimCount < SWIM_MIN) idx = bestIndex((r) => r.swim, 0)
    if (idx === -1) idx = bestIndex(anyPool, 0)
    if (idx === -1) idx = bestIndex(anyPool, 1) // let gym/swim overflow
    if (idx === -1) idx = bestIndex(anyPool, 2) // allow brand repeats
    if (idx === -1) break // only over-cap luxury left — leave slots empty
    take(idx)
  }
  return picks
}
