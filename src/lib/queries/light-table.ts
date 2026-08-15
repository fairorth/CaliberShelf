import { createClient } from "@/lib/supabase/server"
import { getTransformedSignedUrls } from "@/lib/storage"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { getAwaitingReviewCount } from "./photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

// Phase 6 (v3 §08): the Light Table home page. One pass fetches everything and
// partitions it into the five rotation sets in memory, so switching sets is
// instant and needs no round trip. No migrations — every column here already
// exists (00002, 00038, 00040, 00041, 00043).

export type { PhotoAngle } from "@/lib/types/watch"

export type RotationSetId = "all" | "wish" | "recent" | `guide:${string}`

/** Each queue is capped here — a rotation longer than this is a screensaver. */
export const ROTATION_QUEUE_CAP = 60

export interface LightTableFrame {
  id: string
  /** ~1080px contain — the selected-frame view and the loupe's source. */
  url: string
  /** ~192px contain — the contact-sheet tiles (dense cells rule, CLAUDE.md). */
  thumbUrl: string
  /** 00041: 'flat' | 'hero' | 'profile' | 'caseback' | 'macro' — null = no stamp. */
  angle: PhotoAngle | null
  /** watch_image_scores.composite_score (00040), when this photo was scored. */
  score: number | null
}

export interface LightTableWatch {
  id: string
  brandName: string
  model: string
  nickname: string | null
  referenceNumber: string | null
  /** watch-hero's metaLine(), computed server-side: "Automatic · MT5402". */
  caliberLine: string | null
  caseDiameterMm: number | null
  purchaseDate: string | null
  wearCount: number
  lastWornDate: string | null
  isWishlist: boolean
  /** "Grand Seiko · chapter 4, The Shunbun texture dial" — first linked guide. */
  guideChapter: string | null
  /** Distinct non-null angle classes among this watch's frames, 0–5. */
  coveredAngles: number
  /** hero angle first, then sort_order (fallback display_order), then created_at. */
  frames: LightTableFrame[]
}

export interface RotationSet {
  id: RotationSetId
  /** Short name for the ROTATION button: "Grand Seiko". */
  label: string
  /** Eyebrow/menu name: "MASTER GUIDE · GRAND SEIKO". */
  displayName: string
  isGuide: boolean
  /** True set size, before the has-frames filter. */
  total: number
  /** How many members have at least one frame. */
  withFrames: number
  /** Only members with frames, capped at ROTATION_QUEUE_CAP. */
  watches: LightTableWatch[]
}

interface RawWatch {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  case_diameter_mm: number | null
  purchase_date: string | null
  is_wishlist: boolean
  sale_status: string
  brand: { name: string } | null
  movement: {
    caliber_type: string | null
    manufacturer: string | null
    caliber_name: string
  } | null
}

interface RawPhoto {
  id: string
  watch_id: string
  storage_path: string
  thumb_path: string | null
  display_order: number
  angle: PhotoAngle | null
  sort_order: number | null
  created_at: string
}

/** watch-hero's metaLine, verbatim logic — the hero is deleted this phase, so
 *  the line lives on here. */
function caliberLine(movement: RawWatch["movement"]): string | null {
  if (!movement) return null
  const type = movement.caliber_type
    ? caliberTypeLabels[movement.caliber_type] ?? movement.caliber_type
    : null
  const caliber = `${movement.manufacturer ? movement.manufacturer + " " : ""}${movement.caliber_name}`.trim()
  const line = [type, caliber].filter(Boolean).join("  ·  ")
  return line || null
}

/** Frame order inside a watch: hero angle first (the frame the rotation lands
 *  on), then sort_order (falling back to display_order), then created_at. */
function frameSort(a: RawPhoto, b: RawPhoto): number {
  const aHero = a.angle === "hero" ? 0 : 1
  const bHero = b.angle === "hero" ? 0 : 1
  if (aHero !== bHero) return aHero - bHero
  const aOrder = a.sort_order ?? a.display_order
  const bOrder = b.sort_order ?? b.display_order
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.created_at < b.created_at ? -1 : 1
}

/**
 * Everything the Light Table needs, in one pass: all five rotation sets (plus
 * one per additional guide — sets are DERIVED from collection_guides, so a new
 * guide appears with no code change), each watch carrying its ordered frames
 * with signed URLs.
 */
export interface LightTableStats {
  /** watch_photos rows created this calendar month — "Frames kept this month". */
  framesThisMonth: number
  /** Photo Lab Review queue depth (same definition as the coverage matrix). */
  awaitingReview: number
}

/** The contact sheet's pinned stats block (§2.5). */
export async function getLightTableStats(): Promise<LightTableStats> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const [photosRes, awaitingReview] = await Promise.all([
    supabase
      .from("watch_photos")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    getAwaitingReviewCount(),
  ])
  return { framesThisMonth: photosRes.count ?? 0, awaitingReview }
}

export async function getLightTableSets(): Promise<RotationSet[]> {
  const supabase = await createClient()

  const [watchesRes, photosRes, scoresRes, guidesRes, entriesRes, wearRes] =
    await Promise.all([
      supabase
        .from("watches")
        .select(
          "id, model, nickname, reference_number, case_diameter_mm, purchase_date, is_wishlist, sale_status, brand:brands(name), movement:movements(caliber_type, manufacturer, caliber_name)"
        ),
      supabase
        .from("watch_photos")
        .select(
          "id, watch_id, storage_path, thumb_path, display_order, angle, sort_order, created_at"
        ),
      supabase
        .from("watch_image_scores")
        .select("watch_photo_id, composite_score")
        .not("watch_photo_id", "is", null),
      supabase
        .from("collection_guides")
        .select("id, name")
        .order("created_at", { ascending: true }),
      supabase
        .from("guide_entries")
        .select("guide_id, watch_id, position, title")
        .not("watch_id", "is", null)
        .order("position", { ascending: true }),
      supabase.from("wear_logs").select("watch_id, worn_date"),
    ])

  const rawWatches = (watchesRes.data ?? []) as unknown as RawWatch[]
  const rawPhotos = (photosRes.data ?? []) as unknown as RawPhoto[]

  // Sold watches never enter a rotation queue — dropped before any set forms.
  const eligible = rawWatches.filter((w) => w.sale_status !== "sold")

  // Wear tallies (same derivation as getWatches — wear_count lives in
  // wear_logs, not on the watch row).
  const wearCount = new Map<string, number>()
  const lastWorn = new Map<string, string>()
  for (const row of (wearRes.data ?? []) as Array<{
    watch_id: string
    worn_date: string
  }>) {
    wearCount.set(row.watch_id, (wearCount.get(row.watch_id) ?? 0) + 1)
    const prev = lastWorn.get(row.watch_id)
    if (!prev || row.worn_date > prev) lastWorn.set(row.watch_id, row.worn_date)
  }

  // Best composite score per linked photo.
  const scoreByPhoto = new Map<string, number>()
  for (const s of (scoresRes.data ?? []) as Array<{
    watch_photo_id: string
    composite_score: number | null
  }>) {
    if (s.composite_score == null) continue
    const prev = scoreByPhoto.get(s.watch_photo_id)
    if (prev == null || s.composite_score > prev)
      scoreByPhoto.set(s.watch_photo_id, s.composite_score)
  }

  // First linked guide chapter per watch (guides in collection_guides order,
  // entries in position order).
  const guides = (guidesRes.data ?? []) as Array<{ id: string; name: string }>
  const guideOrder = new Map(guides.map((g, i) => [g.id, i]))
  const guideName = new Map(guides.map((g) => [g.id, g.name]))
  const entries = (
    (entriesRes.data ?? []) as Array<{
      guide_id: string
      watch_id: string
      position: number
      title: string
    }>
  ).filter((e) => guideOrder.has(e.guide_id))
  const chapterByWatch = new Map<string, string>()
  const sortedEntries = entries
    .slice()
    .sort(
      (a, b) =>
        (guideOrder.get(a.guide_id)! - guideOrder.get(b.guide_id)!) ||
        a.position - b.position
    )
  for (const e of sortedEntries) {
    if (!chapterByWatch.has(e.watch_id)) {
      chapterByWatch.set(
        e.watch_id,
        `${guideName.get(e.guide_id)} · chapter ${e.position}, ${e.title}`
      )
    }
  }
  const guideWatchIds = new Map<string, string[]>()
  for (const e of entries) {
    const list = guideWatchIds.get(e.guide_id) ?? []
    list.push(e.watch_id)
    guideWatchIds.set(e.guide_id, list)
  }

  // Photos per watch, ordered; two signed sizes (large frame + grid thumb).
  const photosByWatch = new Map<string, RawPhoto[]>()
  for (const p of rawPhotos) {
    const list = photosByWatch.get(p.watch_id) ?? []
    list.push(p)
    photosByWatch.set(p.watch_id, list)
  }
  for (const list of photosByWatch.values()) list.sort(frameSort)

  const allPaths = rawPhotos.map((p) => p.storage_path)
  const thumbPaths = rawPhotos.map((p) => p.thumb_path ?? p.storage_path)
  const [largeUrls, thumbUrls] = await Promise.all([
    getTransformedSignedUrls([...new Set(allPaths)], {
      width: 1080,
      height: 1080,
      resize: "contain",
      quality: 82,
    }),
    getTransformedSignedUrls([...new Set(thumbPaths)], {
      width: 192,
      height: 192,
      resize: "contain",
      quality: 82,
    }),
  ])

  function toLightTableWatch(w: RawWatch): LightTableWatch {
    const photos = photosByWatch.get(w.id) ?? []
    const frames: LightTableFrame[] = []
    for (const p of photos) {
      const url = largeUrls.get(p.storage_path)
      const thumbUrl = thumbUrls.get(p.thumb_path ?? p.storage_path)
      if (!url) continue
      frames.push({
        id: p.id,
        url,
        thumbUrl: thumbUrl ?? url,
        angle: p.angle,
        score: scoreByPhoto.get(p.id) ?? null,
      })
    }
    const angles = new Set(
      photos.map((p) => p.angle).filter((a): a is PhotoAngle => a != null)
    )
    return {
      id: w.id,
      brandName: w.brand?.name ?? "",
      model: w.model,
      nickname: w.nickname,
      referenceNumber: w.reference_number,
      caliberLine: caliberLine(w.movement),
      caseDiameterMm: w.case_diameter_mm,
      purchaseDate: w.purchase_date,
      wearCount: wearCount.get(w.id) ?? 0,
      lastWornDate: lastWorn.get(w.id) ?? null,
      isWishlist: w.is_wishlist,
      guideChapter: chapterByWatch.get(w.id) ?? null,
      coveredAngles: angles.size,
      frames,
    }
  }

  const byId = new Map(eligible.map((w) => [w.id, w]))
  const built = new Map<string, LightTableWatch>()
  const build = (w: RawWatch): LightTableWatch => {
    let lw = built.get(w.id)
    if (!lw) {
      lw = toLightTableWatch(w)
      built.set(w.id, lw)
    }
    return lw
  }

  function makeSet(
    id: RotationSetId,
    label: string,
    displayName: string,
    isGuide: boolean,
    members: RawWatch[]
  ): RotationSet {
    const framed = members.map(build).filter((w) => w.frames.length > 0)
    return {
      id,
      label,
      displayName,
      isGuide,
      total: members.length,
      withFrames: framed.length,
      watches: framed.slice(0, ROTATION_QUEUE_CAP),
    }
  }

  const owned = eligible.filter((w) => !w.is_wishlist)
  const wish = eligible.filter((w) => w.is_wishlist)
  const recent = owned
    .slice()
    .sort((a, b) => {
      // purchase_date DESC NULLS LAST
      if (a.purchase_date == null && b.purchase_date == null) return 0
      if (a.purchase_date == null) return 1
      if (b.purchase_date == null) return -1
      return a.purchase_date < b.purchase_date ? 1 : -1
    })
    .slice(0, 20)

  const sets: RotationSet[] = [
    makeSet("all", "All Watches", "ALL WATCHES", false, owned),
    makeSet("wish", "Wish List", "WISH LIST", false, wish),
    makeSet("recent", "Last 20 Acquired", "LAST 20 ACQUIRED", false, recent),
  ]

  for (const g of guides) {
    const ids = guideWatchIds.get(g.id) ?? []
    const members = ids
      .map((id) => byId.get(id))
      .filter((w): w is RawWatch => w != null)
    sets.push(
      makeSet(
        `guide:${g.id}`,
        g.name,
        `MASTER GUIDE · ${g.name.toUpperCase()}`,
        true,
        members
      )
    )
  }

  return sets
}
