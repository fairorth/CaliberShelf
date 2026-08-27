import { createClient } from "@/lib/supabase/server"
import { getTransformedSignedUrls } from "@/lib/storage"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { getAwaitingReviewCount } from "./photo-lab"
import { getBoxConfig } from "./box-config"
import { boxOptions } from "@/lib/boxes"
import { frameAspect } from "@/lib/frame-aspect"
import { caliberLabel } from "@/lib/caliber"
import { selectWithPhotoDimensions } from "./photo-dimensions"
import { PHOTO_ANGLES as PHOTO_ANGLE_ORDER } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

// Phase 6 (v3 §08): the Light Table home page. One pass fetches everything and
// partitions it into the five rotation sets in memory, so switching sets is
// instant and needs no round trip. No migrations — every column here already
// exists (00002, 00038, 00040, 00041, 00043).

export type { PhotoAngle } from "@/lib/types/watch"

export type RotationSetId =
  | "all"
  | "wish"
  | "recent"
  | `guide:${string}`
  | `box:${string}`

/** Which heading a set sits under in the ROTATION menu. Replaces the old
 *  `isGuide` boolean, which could only describe two of the three groups. */
export type RotationGroup = "primary" | "guide" | "box"

/** Latest timegrapher run for a watch (00016). */
export interface LightTableTiming {
  runDate: string
  rateSecPerDay: number | null
  amplitudeDeg: number | null
  beatErrorMs: number | null
}

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
  /** Stored pixel dimensions of the composite (00048), after EXIF rotation.
   *  NULL on both when unknown — the frame then takes the 3:2 fallback box and
   *  is EXCLUDED from aspect comparison rather than assumed square. */
  imageWidth: number | null
  imageHeight: number | null
}


export interface LightTableWatch {
  id: string
  brandName: string
  model: string
  nickname: string | null
  referenceNumber: string | null
  /** watch-hero's metaLine(), computed server-side: "Automatic · MT5402". */
  caliberLine: string | null
  /** Free text as entered, e.g. "28.8k" — the movement line renders it raw. */
  beatRate: string | null
  powerReserve: string | null
  caseDiameterMm: number | null
  caseHeightMm: number | null
  lugToLugMm: number | null
  /** Lug width, i.e. what strap it takes. */
  strapWidthMm: number | null
  /** Fallbacks for the movement line on watches with no movement record. */
  caseMaterial: string | null
  complication: string | null
  /** The most recent timegrapher run, or null if never measured. Shown only
   *  when it exists — the home page never advertises an absence. */
  timing: LightTableTiming | null
  purchaseDate: string | null
  wearCount: number
  lastWornDate: string | null
  isWishlist: boolean
  /** Ordered but not arrived — the third ownership state (00018). */
  isComingSoon: boolean
  /** "Grand Seiko · chapter 4, The Shunbun texture dial" — first linked guide. */
  guideChapter: string | null
  /** watches.box — the numbered label only ("Box4"), free text, may be null. */
  box: string | null
  /** The box's description from the user's box_config ("Divers & Tools"), or
   *  null when the box is undescribed or outside the configured range. */
  boxDescription: string | null
  /** Index into `frames` the rotation should land on — the widest frame, hero
   *  breaking ties (Phase 8 §1.2). */
  landingFrameIndex: number
  /** Distinct non-null angle classes among this watch's frames, 0–5. */
  coveredAngles: number
  /** Strip display order (Phase 8 §1.2): filled angle slots in rack order,
   *  then untagged frames. Empty shot-list cells are a UI concern and are not
   *  in here. The frame to LAND on is `landingFrameIndex`, not element 0. */
  frames: LightTableFrame[]
}

export interface RotationSet {
  id: RotationSetId
  /** Short name for the ROTATION button: "Grand Seiko". */
  label: string
  /** Eyebrow/menu name: "MASTER GUIDE · GRAND SEIKO". */
  displayName: string
  group: RotationGroup
  /** True set size, before the has-frames filter. */
  total: number
  /** How many members have at least one frame. */
  withFrames: number
  /** Every member with at least one frame — uncapped (Phase 8 §3). This is
   *  the number the stage counts against, so `withFrames === watches.length`
   *  and the counter can never contradict the count line. */
  watches: LightTableWatch[]
}

interface RawWatch {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  case_diameter_mm: number | null
  case_height_mm: number | null
  lug_to_lug_mm: number | null
  strap_width_mm: number | null
  case_material: string | null
  complication: string | null
  purchase_date: string | null
  is_wishlist: boolean
  is_coming_soon: boolean
  sale_status: string
  box: string | null
  brand: { name: string } | null
  movement: {
    caliber_type: string | null
    manufacturer: string | null
    caliber_name: string
    beat_rate: string | null
    power_reserve: string | null
  } | null
}

interface RawPhoto {
  id: string
  watch_id: string
  storage_path: string
  thumb_path: string | null
  display_order: number
  /** Absent entirely until 00048 is applied; null once it is but unmeasured. */
  image_width?: number | null
  image_height?: number | null
  angle: PhotoAngle | null
  sort_order: number | null
  created_at: string
}

/** "Automatic  ·  Miyota 90S5". The caliber half comes from the one shared
 *  formatter (Phase 9 §2.1) so the home stage and the watch page cannot
 *  disagree about whether the manufacturer is already in the name. */
function caliberLine(movement: RawWatch["movement"]): string | null {
  if (!movement) return null
  const type = movement.caliber_type
    ? caliberTypeLabels[movement.caliber_type] ?? movement.caliber_type
    : null
  const line = [type, caliberLabel(movement)].filter(Boolean).join("  ·  ")
  return line || null
}

const PHOTO_COLUMNS =
  "id, watch_id, storage_path, thumb_path, display_order, angle, sort_order, created_at"

/** Rack position of a tagged angle; untagged sorts after all of them. */
function angleRank(angle: PhotoAngle | null): number {
  if (angle == null) return PHOTO_ANGLE_ORDER.length
  const i = PHOTO_ANGLE_ORDER.indexOf(angle)
  return i === -1 ? PHOTO_ANGLE_ORDER.length : i
}

/**
 * Strip display order (Phase 8 §1.2): photographs before empty cells.
 *
 * Band 1 is the filled angle slots in rack order, band 2 the untagged frames
 * in sort_order. Band 3 — the empty shot-list cells — is not in this array at
 * all; it exists only in the UI, appended after everything real.
 *
 * The earlier draft interleaved empty cells at their rack positions, which put
 * plus-signs before photographs on a sparsely shot watch and read as a to-do
 * list with a photo attached. On a showcase, photographs outrank positional
 * consistency; rack order still governs WITHIN each band, so nothing is
 * arbitrary.
 */
function frameSort(a: RawPhoto, b: RawPhoto): number {
  const rank = angleRank(a.angle) - angleRank(b.angle)
  if (rank !== 0) return rank
  const aOrder = a.sort_order ?? a.display_order
  const bOrder = b.sort_order ?? b.display_order
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.created_at < b.created_at ? -1 : 1
}

/**
 * Which frame the rotation lands on (Phase 8 §1.2, "Frame preference").
 *
 * **Prefer the widest** — the aspect closest to or above the stage's, because
 * §2.1 fixes the stage height and lets width follow the photograph, so a
 * reclining three-quarter shot fills the page where a square dial-on shot sits
 * compact. Hero angle breaks ties.
 *
 * A frame with no stored dimensions is EXCLUDED from the width comparison
 * rather than assumed square: it must never win by default, nor displace a
 * frame whose aspect is actually known. If NO frame has dimensions, the rule
 * degrades to the older one — hero first, then strip order — which is exactly
 * the behaviour before 00048 was applied.
 *
 * §1.2 also states "lands on the hero frame when one exists"; where that and
 * the widest-frame preference disagree, the preference wins, since its own
 * tie-break clause only has meaning if width is the primary key.
 */
function landingFrameIndex(frames: LightTableFrame[]): number {
  if (frames.length === 0) return 0
  const measured = frames
    .map((f, i) => ({ i, aspect: frameAspect(f), isHero: f.angle === "hero" }))
    .filter((c): c is { i: number; aspect: number; isHero: boolean } => c.aspect != null)

  if (measured.length > 0) {
    measured.sort(
      (a, b) =>
        b.aspect - a.aspect ||
        Number(b.isHero) - Number(a.isHero) ||
        a.i - b.i
    )
    return measured[0].i
  }

  const hero = frames.findIndex((f) => f.angle === "hero")
  return hero >= 0 ? hero : 0
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

  const [
    watchesRes,
    photosRes,
    scoresRes,
    guidesRes,
    entriesRes,
    wearRes,
    timingRes,
    boxConfig,
  ] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, model, nickname, reference_number, case_diameter_mm, case_height_mm, lug_to_lug_mm, strap_width_mm, case_material, complication, purchase_date, is_wishlist, is_coming_soon, sale_status, box, brand:brands(name), movement:movements(caliber_type, manufacturer, caliber_name, beat_rate, power_reserve)"
      ),
    selectWithPhotoDimensions<RawPhoto>(PHOTO_COLUMNS, (columns) =>
      supabase.from("watch_photos").select(columns)
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
    // Newest first, so the first row seen per watch is the latest run.
    supabase
      .from("timegrapher_runs")
      .select("watch_id, run_date, rate_sec_per_day, amplitude_deg, beat_error_ms")
      .order("run_date", { ascending: false }),
    // STORED IN needs the description beside the label (Phase 8 §1); the
    // watch row itself only ever stores "Box4".
    getBoxConfig(),
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

  // Latest timegrapher run per watch. The query is already sorted newest
  // first, so the first row for a watch wins and the rest are skipped.
  const timingByWatch = new Map<string, LightTableTiming>()
  for (const row of (timingRes.data ?? []) as Array<{
    watch_id: string
    run_date: string
    rate_sec_per_day: number | null
    amplitude_deg: number | null
    beat_error_ms: number | null
  }>) {
    if (timingByWatch.has(row.watch_id)) continue
    timingByWatch.set(row.watch_id, {
      runDate: row.run_date,
      rateSecPerDay: row.rate_sec_per_day,
      amplitudeDeg: row.amplitude_deg,
      beatErrorMs: row.beat_error_ms,
    })
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
        imageWidth: p.image_width ?? null,
        imageHeight: p.image_height ?? null,
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
      beatRate: w.movement?.beat_rate ?? null,
      powerReserve: w.movement?.power_reserve ?? null,
      caseDiameterMm: w.case_diameter_mm,
      caseHeightMm: w.case_height_mm,
      lugToLugMm: w.lug_to_lug_mm,
      strapWidthMm: w.strap_width_mm,
      caseMaterial: w.case_material,
      complication: w.complication,
      timing: timingByWatch.get(w.id) ?? null,
      purchaseDate: w.purchase_date,
      wearCount: wearCount.get(w.id) ?? 0,
      lastWornDate: lastWorn.get(w.id) ?? null,
      isWishlist: w.is_wishlist,
      isComingSoon: w.is_coming_soon,
      box: w.box,
      boxDescription: w.box ? boxConfig.descriptions[w.box] ?? null : null,
      guideChapter: chapterByWatch.get(w.id) ?? null,
      coveredAngles: angles.size,
      landingFrameIndex: landingFrameIndex(frames),
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
    group: RotationGroup,
    members: RawWatch[]
  ): RotationSet {
    // Uncapped (Phase 8 §3). The old 60-watch slice silently hid 47 of 107
    // photographed watches AND made the counter disagree with the header, so
    // neither number explained the other. Query weight is answered by
    // selecting only the columns the stage needs, not by truncating the
    // collection: at a 90s dwell, 107 watches is a ~2.7-hour cycle, which is
    // the depth this screen is for.
    const framed = members.map(build).filter((w) => w.frames.length > 0)
    return {
      id,
      label,
      displayName,
      group,
      total: members.length,
      withFrames: framed.length,
      watches: framed,
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
    makeSet("all", "All Watches", "ALL WATCHES", "primary", owned),
    makeSet("wish", "Wish List", "WISH LIST", "primary", wish),
    makeSet("recent", "Last 20 Acquired", "LAST 20 ACQUIRED", "primary", recent),
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
        "guide",
        members
      )
    )
  }

  // One set per configured box. A box is a real, physical grouping the user
  // already curates — including by auto-fill — so it is exactly as good a
  // rotation as a guide chapter. Every configured box is offered even when it
  // is empty; the menu shows the count, and an empty one falls back to All
  // Watches on selection the same way any other empty set does.
  for (const label of boxOptions(boxConfig.count)) {
    const description = boxConfig.descriptions[label]
    sets.push(
      makeSet(
        `box:${label}`,
        description ? `${label} — ${description}` : label,
        `BOX · ${label.toUpperCase()}`,
        "box",
        owned.filter((w) => w.box === label)
      )
    )
  }

  return sets
}
