import { createClient } from "@/lib/supabase/server"
import { getSignedUrls, getSignedUrl } from "@/lib/storage"
import type { Watch, WatchWithCover, WatchWithPhotos, WatchPhoto } from "@/lib/types/watch"

/**
 * Get all watches for the current user, each with its cover photo URL.
 * Sorted by most recently updated first.
 */
export async function getWatches(): Promise<WatchWithCover[]> {
  const supabase = await createClient()

  const { data: watches, error } = await supabase
    .from("watches")
    .select("*")
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

  // Generate signed URLs for all cover photos
  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = await getSignedUrls(storagePaths)

  // Merge cover photo URLs into watches
  return watches.map((watch: Watch) => {
    const coverPath = coverMap.get(watch.id)
    const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
    return {
      ...watch,
      cover_photo_url: coverUrl,
    } as WatchWithCover
  })
}

/**
 * Get a single watch by ID with all its photos and signed URLs.
 * Returns null if not found (RLS will also filter).
 */
export async function getWatchById(
  id: string
): Promise<(WatchWithPhotos & { photo_urls: Map<string, string> }) | null> {
  const supabase = await createClient()

  const { data: watch, error } = await supabase
    .from("watches")
    .select("*, watch_photos(*)")
    .eq("id", id)
    .order("display_order", { referencedTable: "watch_photos", ascending: true })
    .single()

  if (error || !watch) {
    return null
  }

  const typedWatch = watch as WatchWithPhotos

  // Generate signed URLs for all photos
  const storagePaths = typedWatch.watch_photos.map((p) => p.storage_path)
  const photoUrls = await getSignedUrls(storagePaths)

  return {
    ...typedWatch,
    photo_urls: photoUrls,
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
