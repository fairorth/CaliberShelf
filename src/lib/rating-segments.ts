import { tierIndexFor } from "@/lib/tiers"
import type { TierBand } from "@/lib/tiers"

/**
 * Rate My Watches — how the collection is cut into SEGMENTS (pure; shared by
 * the phone, which builds them, and the web report, which reads them back).
 *
 *  type       one segment per category (Dress, Sport, Tool / Field, …)
 *  tier       one per price tier — named NEUTRALLY ("Tier 1" = the lowest),
 *             never by the owner's labels, which carry dollar amounts: the
 *             game is price-free, and a price on screen sways the pick
 *  type_tier  each category split by tier ("Sport · Tier 2") — like for like
 *             on both axes
 *
 * Small groups merge with their neighbour so every segment is a real game
 * (MIN_SEGMENT watches); unpriced watches get their own "Unpriced" group in
 * the tier schemes rather than being guessed into a tier.
 *
 * A watch with NO PHOTO can't be judged — the game is entirely visual — so it
 * is never played (v1.11.24). It still counts toward which segment is which
 * (segments are cut from every watch, so adding a photo later never renames
 * or reshuffles a segment), and is listed under the ranking as not rated.
 */

export const SEGMENT_SCHEMES = ["type", "tier", "type_tier"] as const
export type SegmentScheme = (typeof SEGMENT_SCHEMES)[number]
export const segmentSchemeLabels: Record<SegmentScheme, string> = {
  type: "Type",
  tier: "Tier",
  type_tier: "Type + Tier",
}

/** A segment of fewer watches than this merges with its neighbour (tier schemes). */
export const MIN_SEGMENT = 4

export interface SegmentWatch {
  id: string
  categoryId: string | null
  categoryName: string | null
  priceCents: number | null
  /** False = no photo: kept out of the game. Absent counts as having one. */
  hasPhoto?: boolean
}

export interface GameSegment {
  scheme: SegmentScheme
  /** Stable key, stored on the session: a category id; "tier:2", "tier:1-2",
   *  "tier:unpriced"; or "<categoryId>|tier:…". */
  key: string
  name: string
  /** The watches played — every member with a photo. */
  watchIds: string[]
  /** Members with no photo: not played, listed under the ranking as not rated. */
  unratedIds: string[]
  /** The category, for type and type_tier segments. */
  categoryId: string | null
}

interface TierGroup {
  /** First and last tier (1-based) in the group; 0 = unpriced. */
  from: number
  to: number
  ids: string[]
}

/** Bucket watches by tier, then merge small neighbouring tiers upward. */
function tierGroups(watches: SegmentWatch[], bands: TierBand[], min: number): TierGroup[] {
  const byTier = new Map<number, string[]>()
  const unpriced: string[] = []
  for (const w of watches) {
    const i = tierIndexFor(w.priceCents, bands)
    if (i < 0) unpriced.push(w.id)
    else byTier.set(i + 1, [...(byTier.get(i + 1) ?? []), w.id])
  }
  const groups: TierGroup[] = []
  let open: TierGroup | null = null
  for (let t = 1; t <= bands.length; t++) {
    const ids = byTier.get(t) ?? []
    if (ids.length === 0) continue
    if (!open) open = { from: t, to: t, ids: [...ids] }
    else {
      open.to = t
      open.ids.push(...ids)
    }
    if (open.ids.length >= min) {
      groups.push(open)
      open = null
    }
  }
  if (open) {
    // A small group left at the top joins the group below it.
    const last = groups[groups.length - 1]
    if (last) {
      last.to = open.to
      last.ids.push(...open.ids)
    } else groups.push(open)
  }
  if (unpriced.length >= 2) groups.push({ from: 0, to: 0, ids: unpriced })
  return groups
}

const tierKey = (g: TierGroup) =>
  g.from === 0 ? "tier:unpriced" : g.from === g.to ? `tier:${g.from}` : `tier:${g.from}-${g.to}`
const tierName = (g: TierGroup) =>
  g.from === 0 ? "Unpriced" : g.from === g.to ? `Tier ${g.from}` : `Tiers ${g.from}–${g.to}`

export function buildSegments(watches: SegmentWatch[], scheme: SegmentScheme, bands: TierBand[]): GameSegment[] {
  const noPhoto = new Set(watches.filter((w) => w.hasPhoto === false).map((w) => w.id))
  // Cut from EVERY watch (stable keys), then split each segment into the
  // played and the not-rated; a segment needs two playable watches.
  return cutSegments(watches, scheme, bands)
    .map(({ watchIds, ...s }) => ({
      ...s,
      watchIds: watchIds.filter((id) => !noPhoto.has(id)),
      unratedIds: watchIds.filter((id) => noPhoto.has(id)),
    }))
    .filter((s) => s.watchIds.length >= 2)
}

function cutSegments(
  watches: SegmentWatch[],
  scheme: SegmentScheme,
  bands: TierBand[]
): Array<Omit<GameSegment, "unratedIds">> {
  const byCategory = new Map<string, { name: string; watches: SegmentWatch[] }>()
  for (const w of watches) {
    if (!w.categoryId) continue
    const c = byCategory.get(w.categoryId) ?? { name: w.categoryName ?? "Uncategorised", watches: [] }
    c.watches.push(w)
    byCategory.set(w.categoryId, c)
  }
  const categories = [...byCategory.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))

  let out: Array<Omit<GameSegment, "unratedIds">> = []
  if (scheme === "type") {
    out = categories.map(([id, c]) => ({
      scheme,
      key: id,
      name: c.name,
      watchIds: c.watches.map((w) => w.id),
      categoryId: id,
    }))
  } else if (scheme === "tier") {
    out = tierGroups(watches, bands, MIN_SEGMENT).map((g) => ({
      scheme,
      key: tierKey(g),
      name: tierName(g),
      watchIds: g.ids,
      categoryId: null,
    }))
  } else {
    for (const [id, c] of categories) {
      const groups = tierGroups(c.watches, bands, MIN_SEGMENT)
      // A category too small to split stays whole.
      if (groups.length <= 1) {
        out.push({ scheme, key: `${id}|all`, name: c.name, watchIds: c.watches.map((w) => w.id), categoryId: id })
        continue
      }
      for (const g of groups) {
        out.push({ scheme, key: `${id}|${tierKey(g)}`, name: `${c.name} · ${tierName(g)}`, watchIds: g.ids, categoryId: id })
      }
    }
  }
  return out
}

/** The owner's real tier label(s) for a tier key — for the owner's own report only. */
export function tierLabelForKey(key: string, bands: TierBand[]): string | null {
  const m = /tier:(\d+)(?:-(\d+))?$/.exec(key)
  if (!m) return key.endsWith("tier:unpriced") ? "No price" : null
  const from = bands[Number(m[1]) - 1]
  const to = bands[Number(m[2] ?? m[1]) - 1]
  if (!from || !to) return null
  return from === to ? from.label : `${from.label} – ${to.label}`
}
