import { createClient } from "@/lib/supabase/server"
import { getSignedUrls, getSignedUrl } from "@/lib/storage"
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

  // Fetch cover photos for all watches in one query
  const watchIds = watches.map((w: Watch) => w.id)
  const { data: coverPhotos } = await supabase
    .from("watch_photos")
    .select("*")
    .in("watch_id", watchIds)
    .eq("is_cover", true)

  // Build a map of watch_id -> cover photo storage_path
  const coverMap = new Map<string, string>()
  if (coverPhotos) {
    for (const photo of coverPhotos as WatchPhoto[]) {
      coverMap.set(photo.watch_id, photo.storage_path)
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

  // Generate signed URLs for all cover photos
  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = await getSignedUrls(storagePaths)

  // Merge cover photo URLs into watches
  return watches.map(
    (watch: Watch & { brands: Brand; movements: Movement | null; categories: Category }) => {
      const coverPath = coverMap.get(watch.id)
      const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
      return {
        ...watch,
        cover_photo_url: coverUrl,
        brand: watch.brands,
        movement: watch.movements,
        category: watch.categories,
        labels: labelsByWatch.get(watch.id) ?? [],
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
): Promise<(WatchWithPhotos & { photo_urls: Map<string, string>; brand: Brand; movement: Movement | null }) | null> {
  const supabase = await createClient()

  const { data: watch, error } = await supabase
    .from("watches")
    .select("*, watch_photos(*), brands(*), movements(*)")
    .eq("id", id)
    .order("display_order", { referencedTable: "watch_photos", ascending: true })
    .single()

  if (error || !watch) {
    return null
  }

  const typedWatch = watch as WatchWithPhotos & { brands: Brand; movements: Movement | null }

  // Generate signed URLs for all photos
  const storagePaths = typedWatch.watch_photos.map((p) => p.storage_path)
  const photoUrls = await getSignedUrls(storagePaths)

  return {
    ...typedWatch,
    photo_urls: photoUrls,
    brand: typedWatch.brands,
    movement: typedWatch.movements,
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
