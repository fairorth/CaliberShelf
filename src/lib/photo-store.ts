import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { buildStoragePath } from "@/lib/storage"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { dimensionColumns, readImageDimensions } from "@/lib/image-meta"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

/**
 * The ONE implementation of storing and deleting a watch photo. Two callers:
 * the web's Server Actions (`actions/photo-actions.ts`, cookie session) and
 * the iPhone app's API routes (`/api/watches/[id]/photos`, `/api/photos/[id]`,
 * bearer token). Both hand in a Supabase client that acts AS THE USER, so RLS
 * still decides what is reachable. No revalidatePath here — that is the
 * Server Action's concern; route handlers have no cache to refresh.
 */

const BUCKET = "watch-photos"
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // 10MB — iPhone photos can be large
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type PhotoStoreResult = { photoId: string } | { error: string }

export async function storeWatchPhoto(
  supabase: SupabaseClient,
  userId: string,
  watchId: string,
  file: File,
  opts: { angle?: PhotoAngle | null } = {}
): Promise<PhotoStoreResult> {
  // Verify the watch belongs to the user
  const { data: watch } = await supabase
    .from("watches")
    .select("id")
    .eq("id", watchId)
    .eq("user_id", userId)
    .single()
  if (!watch) return { error: "Watch not found." }

  if (!file || file.size === 0) return { error: "No file selected." }
  if (file.size > MAX_PHOTO_BYTES) return { error: "File must be smaller than 10MB." }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { error: "File must be an image (JPEG, PNG, WebP, or HEIC)." }
  }
  const angle = opts.angle ?? null
  if (angle !== null && !PHOTO_ANGLES.includes(angle)) return { error: "Unknown angle." }

  // Generate unique filename preserving extension
  const ext = file.name.split(".").pop() ?? "jpg"
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = buildStoragePath(userId, watchId, uniqueName)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

  // One read of the bytes serves both the thumbnail and the dimensions.
  const bytes = await file.arrayBuffer()

  // Generate a small thumbnail for fast Collection loading (best-effort).
  const thumbPath = await generateThumbnail(supabase, storagePath, bytes)

  // Dimensions of the file as stored (00048). Best-effort: an unreadable
  // image simply records null and takes the 3:2 fallback everywhere.
  const dims = await readImageDimensions(bytes)

  // Check if this is the first photo (make it the cover)
  const { count } = await supabase
    .from("watch_photos")
    .select("id", { count: "exact", head: true })
    .eq("watch_id", watchId)
  const isFirstPhoto = (count ?? 0) === 0

  const { data: inserted, error: insertError } = await supabase
    .from("watch_photos")
    .insert({
      watch_id: watchId,
      user_id: userId,
      storage_path: storagePath,
      thumb_path: thumbPath,
      display_order: count ?? 0,
      is_cover: isFirstPhoto,
      // Tagged at capture by the phone's angle chips, so phone frames count
      // in the Photo Lab coverage matrix (docs/iphone-app.md §8).
      angle,
      ...dimensionColumns(dims),
    })
    .select("id")
    .single()

  if (insertError || !inserted) {
    // Clean up uploaded files if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath, thumbPathFor(storagePath)])
    return { error: `Failed to save photo: ${insertError?.message ?? "unknown error"}` }
  }

  return { photoId: (inserted as { id: string }).id }
}

/** Delete a photo (storage + row); promotes the next photo if it was the cover. */
export async function removeWatchPhoto(
  supabase: SupabaseClient,
  userId: string,
  photoId: string
): Promise<{ watchId: string } | { error: string }> {
  const { data: photo } = await supabase
    .from("watch_photos")
    .select("watch_id, storage_path, thumb_path, is_cover")
    .eq("id", photoId)
    .eq("user_id", userId)
    .single()
  if (!photo) return { error: "Photo not found." }

  const typedPhoto = photo as {
    watch_id: string
    storage_path: string
    thumb_path: string | null
    is_cover: boolean
  }

  // Delete original + thumbnail from storage
  await supabase.storage
    .from(BUCKET)
    .remove([typedPhoto.storage_path, typedPhoto.thumb_path ?? thumbPathFor(typedPhoto.storage_path)])

  const { error } = await supabase
    .from("watch_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", userId)
  if (error) return { error: error.message }

  // If this was the cover photo, promote the next photo
  if (typedPhoto.is_cover) {
    const { data: nextPhoto } = await supabase
      .from("watch_photos")
      .select("id")
      .eq("watch_id", typedPhoto.watch_id)
      .order("display_order", { ascending: true })
      .limit(1)
      .single()
    if (nextPhoto) {
      await supabase
        .from("watch_photos")
        .update({ is_cover: true })
        .eq("id", (nextPhoto as { id: string }).id)
    }
  }

  return { watchId: typedPhoto.watch_id }
}
