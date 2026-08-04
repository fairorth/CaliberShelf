// Display Box selection engine — pure module (no I/O) so it's easy to reason
// about and test. Picks a weekly rotation of watches, balancing category /
// price tier / complication while favoring under-worn and newer pieces, and
// rotating away from last week's box. Transparent by design: every pick carries
// a human-readable "reason".

export const DISPLAY_BOX_SIZE = 11

export interface DisplayBoxCandidate {
  id: string
  name: string
  categoryId: string
  categoryName: string | null
  tierLabel: string
  complications: string[]
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

function reasonFor(c: DisplayBoxCandidate): string {
  const cat = c.categoryName ?? "Uncategorized"
  const comp = c.complications.length > 0 ? c.complications.join(", ") : "Time-only"
  const worn = c.wearCount === 0 ? "never worn" : `worn ${c.wearCount}×`
  return `${cat} · ${c.tierLabel} · ${comp} · ${worn}`
}

/**
 * Select the display box. Greedy with diminishing-returns diversity: each round
 * picks the highest marginal score, where a watch is down-weighted if its
 * category / tier / complications are already represented in the box so far.
 * Deterministic (stable id tie-break) — variety across weeks comes from logged
 * wears and the previous-box penalty, not randomness.
 */
export function selectDisplayBox(
  candidates: DisplayBoxCandidate[],
  opts: SelectOptions = {}
): DisplayBoxPick[] {
  const size = opts.size ?? DISPLAY_BOX_SIZE
  const today = opts.todayIso ?? "1970-01-01"
  const prev = opts.previousBoxIds ?? new Set<string>()

  const remaining = [...candidates]
  const base = new Map(candidates.map((c) => [c.id, baseScore(c, today)]))
  const catCount = new Map<string, number>()
  const tierCount = new Map<string, number>()
  const compCount = new Map<string, number>()
  const picks: DisplayBoxPick[] = []

  while (picks.length < size && remaining.length > 0) {
    let bestIdx = -1
    let bestScore = -Infinity
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i]
      let s = base.get(c.id) ?? 0
      if (prev.has(c.id)) s *= 0.15 // rotate away from last week
      const catMult = 1 / (1 + (catCount.get(c.categoryId) ?? 0))
      const tierMult = 1 / (1 + (tierCount.get(c.tierLabel) ?? 0))
      let compMult = 1
      if (c.complications.length > 0) {
        const avg =
          c.complications.reduce((sum, k) => sum + (compCount.get(k) ?? 0), 0) /
          c.complications.length
        compMult = 1 / (1 + avg)
      }
      // Category & tier balance weigh full; complications a softer nudge.
      const marginal = s * catMult * tierMult * (0.5 + 0.5 * compMult)
      if (
        marginal > bestScore ||
        (marginal === bestScore && (bestIdx === -1 || c.id < remaining[bestIdx].id))
      ) {
        bestScore = marginal
        bestIdx = i
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0]
    picks.push({ id: chosen.id, reason: reasonFor(chosen) })
    catCount.set(chosen.categoryId, (catCount.get(chosen.categoryId) ?? 0) + 1)
    tierCount.set(chosen.tierLabel, (tierCount.get(chosen.tierLabel) ?? 0) + 1)
    for (const k of chosen.complications) compCount.set(k, (compCount.get(k) ?? 0) + 1)
  }
  return picks
}
