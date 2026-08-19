import { createClient } from "@/lib/supabase/server"
import { getSignedUrl, getTransformedSignedUrls } from "@/lib/storage"
import { selectWithPhotoDimensions, squareness } from "./photo-dimensions"
import type {
  Watch,
  WatchWithCover,
  WatchWithPhotos,
  WatchPhoto,
  Brand,
  Movement,
  Label,
  Category,
} from "@/lib/types/watch"

/**
 * Get all watches for the current user, each with its cover photo URL
 * and joined brand/movement data.
 * Sorted by most recently updated first.
 */
export async function getWatches(): Promise<WatchWithCover[]> {
  const supabase = await createClient()

  const { data: watches, error } = await supabase
    .from("watches")
    .select("*, brands(*), movements(*), categories(*)")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch watches:", error.message)
    return []
  }

  if (!watches || watches.length === 0) return []

  // EVERY photo, not just the covers — the tile frame is now chosen by shape
  // (Phase 9 §1.1), which needs all the candidates.
  const watchIds = watches.map((w: Watch) => w.id)
  const { data: allPhotos } = await selectWithPhotoDimensions<
    WatchPhoto & { image_width?: number | null; image_height?: number | null }
  >("id, watch_id, storage_path, thumb_path, display_order, is_cover, angle", (columns) =>
    supabase.from("watch_photos").select(columns).in("watch_id", watchIds)
  )

  /**
   * Which frame represents a watch in a dense, cropping grid.
   *
   * Phase 9 §1.1 replaced the dial-framing editor with this rule: **the frame
   * whose aspect is nearest 1:1, then centre-crop, hero angle breaking ties.**
   * A square-ish frame survives a square crop; a 16:9 reclining shot loses its
   * ends and a tall wrist shot becomes a forearm. No per-watch input, and it
   * improves on its own as proper angles get shot.
   *
   * Unmeasured photos are EXCLUDED from the comparison rather than assumed
   * square — they must not win by default. When a watch has no measured photo
   * at all, the user's `is_cover` choice stands, which is exactly the
   * behaviour before 00048 was applied.
   */
  const coverMap = new Map<string, string>()
  if (allPhotos) {
    const byWatch = new Map<string, typeof allPhotos>()
    for (const photo of allPhotos) {
      const list = byWatch.get(photo.watch_id) ?? []
      list.push(photo)
      byWatch.set(photo.watch_id, list)
    }
    for (const [watchId, photos] of byWatch) {
      const measured = photos
        .map((p) => ({ p, d: squareness(p.image_width, p.image_height) }))
        .filter((c): c is { p: (typeof photos)[number]; d: number } => c.d != null)
        .sort(
          (a, b) =>
            a.d - b.d ||
            Number(b.p.angle === "hero") - Number(a.p.angle === "hero") ||
            Number(b.p.is_cover) - Number(a.p.is_cover) ||
            a.p.display_order - b.p.display_order
        )
      const chosen = measured[0]?.p ?? photos.find((p) => p.is_cover) ?? null
      if (chosen) coverMap.set(watchId, chosen.thumb_path ?? chosen.storage_path)
    }
  }

  // Fetch labels for all watches
  const labelsByWatch = new Map<string, Label[]>()
  const { data: watchLabels } = await supabase
    .from("watch_labels")
    .select("watch_id, labels(*)")
    .in("watch_id", watchIds)

  if (watchLabels) {
    for (const wl of watchLabels as unknown as Array<{ watch_id: string; labels: Label }>) {
      const existing = labelsByWatch.get(wl.watch_id) ?? []
      existing.push(wl.labels)
      labelsByWatch.set(wl.watch_id, existing)
    }
  }

  // Cover photos were served as the untransformed originals — multi-megabyte,
  // several thousand pixels wide — and then squeezed into a 64px table cell by
  // the browser. That is both why the table thumbnails looked mushy (a ~50:1
  // downscale is where browser resampling falls apart) and why the collection
  // page pulled hundreds of megabytes.
  //
  // 720 on the long edge is the smallest size that still serves every consumer
  // of this URL: the home hero at 560px, gallery tiles at 280px, and the
  // table's 64px thumbnail with pixels to spare on a HiDPI screen. `contain`
  // caps the long edge without cropping, so callers that frame the image
  // themselves with object-cover still get the whole frame.
  //
  // Two sizes, because one cannot serve both ends: the 720px cover is right
  // for a 560px hero and wrong for a 64px table cell, where a ~9:1 downscale
  // is exactly the artefacting the hover preview does not show at ~2:1. The
  // transform is baked into the signing token, so a second size means a second
  // signed URL — there is no way to vary width on an already-signed one.
  const storagePaths = Array.from(coverMap.values())
  const [signedUrlMap, thumbUrlMap] = await Promise.all([
    getTransformedSignedUrls(storagePaths, {
      width: 720,
      height: 720,
      resize: "contain",
      quality: 80,
    }),
    getTransformedSignedUrls(storagePaths, {
      width: 192,
      height: 192,
      resize: "contain",
      quality: 82,
    }),
  ])

  // Tally wear-log entries per watch (count + most-recent date). worn_date is
  // "YYYY-MM-DD", so lexical comparison finds the latest.
  const wearCountByWatch = new Map<string, number>()
  const lastWornByWatch = new Map<string, string>()
  const { data: wearRows } = await supabase
    .from("wear_logs")
    .select("watch_id, worn_date")
    .in("watch_id", watchIds)
  if (wearRows) {
    for (const row of wearRows as Array<{ watch_id: string; worn_date: string }>) {
      wearCountByWatch.set(row.watch_id, (wearCountByWatch.get(row.watch_id) ?? 0) + 1)
      const prev = lastWornByWatch.get(row.watch_id)
      if (!prev || row.worn_date > prev) lastWornByWatch.set(row.watch_id, row.worn_date)
    }
  }

  // Merge cover photo URLs into watches
  return watches.map(
    (watch: Watch & { brands: Brand; movements: Movement | null; categories: Category }) => {
      const coverPath = coverMap.get(watch.id)
      const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
      const thumbUrl = coverPath ? thumbUrlMap.get(coverPath) ?? null : null
      return {
        ...watch,
        cover_photo_url: coverUrl,
        cover_thumb_url: thumbUrl,
        brand: watch.brands,
        movement: watch.movements,
        category: watch.categories,
        labels: labelsByWatch.get(watch.id) ?? [],
        wear_count: wearCountByWatch.get(watch.id) ?? 0,
        last_worn_date: lastWornByWatch.get(watch.id) ?? null,
      } as WatchWithCover
    }
  )
}

/**
 * Get a single watch by ID with all its photos, signed URLs,
 * and joined brand/movement data.
 * Returns null if not found (RLS will also filter).
 */
export async function getWatchById(
  id: string
): Promise<
  | (WatchWithPhotos & {
      photo_urls: Map<string, string>
      full_photo_urls: Map<string, string>
      brand: Brand
      movement: Movement | null
      category: Category | null
    })
  | null
> {
  const supabase = await createClient()

  const { data: watch, error } = await supabase
    .from("watches")
    .select("*, watch_photos(*), brands(*), movements(*), categories(*)")
    .eq("id", id)
    .order("display_order", { referencedTable: "watch_photos", ascending: true })
    .single()

  if (error || !watch) {
    return null
  }

  const typedWatch = watch as WatchWithPhotos & {
    brands: Brand
    movements: Movement | null
    categories: Category | null
  }

  // Serve right-sized images via Supabase transforms (Pro): a display size for
  // the gallery/hero and a larger capped size for the zoom lightbox — both far
  // smaller than the ~2MB originals.
  const storagePaths = typedWatch.watch_photos.map((p) => p.storage_path)
  const [photoUrls, fullPhotoUrls] = await Promise.all([
    // "contain" with a square box = cap the long edge, preserve aspect (no crop).
    getTransformedSignedUrls(storagePaths, { width: 1000, height: 1000, resize: "contain", quality: 80 }),
    getTransformedSignedUrls(storagePaths, { width: 2000, height: 2000, resize: "contain", quality: 82 }),
  ])

  return {
    ...typedWatch,
    photo_urls: photoUrls,
    full_photo_urls: fullPhotoUrls,
    brand: typedWatch.brands,
    movement: typedWatch.movements,
    category: typedWatch.categories,
  }
}

/**
 * Get the cover photo signed URL for a single watch.
 */
export async function getWatchCoverUrl(watchId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: photo } = await supabase
    .from("watch_photos")
    .select("storage_path")
    .eq("watch_id", watchId)
    .eq("is_cover", true)
    .single()

  if (!photo) return null

  return getSignedUrl((photo as WatchPhoto).storage_path)
}
