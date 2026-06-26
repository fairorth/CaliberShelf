import "server-only"
import sharp from "sharp"
import type { SupabaseClient } from "@supabase/supabase-js"

const BUCKET = "watch-photos"
// Long-edge cap for thumbnails. Large enough to stay crisp on the biggest
// gallery tile (400px) on retina, small enough to load fast (~40–80KB).
const THUMB_MAX = 600

/** Thumbnail storage path for an original: same folder, "thumb_" prefix, .jpg. */
export function thumbPathFor(storagePath: string): string {
  const slash = storagePath.lastIndexOf("/")
  const dir = storagePath.slice(0, slash + 1)
  const file = storagePath.slice(slash + 1)
  const base = file.includes(".") ? file.slice(0, file.lastIndexOf(".")) : file
  return `${dir}thumb_${base}.jpg`
}

/** Resize an image buffer down to a small JPEG thumbnail. */
export async function makeThumbnailBuffer(input: ArrayBuffer | Buffer): Promise<Buffer> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return sharp(buf)
    .rotate() // honor EXIF orientation before stripping metadata
    .resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
}

/**
 * Generate and upload a thumbnail next to an original photo. Best-effort: any
 * failure returns null so the upload still succeeds (the collection falls back
 * to the full image).
 */
export async function generateThumbnail(
  supabase: SupabaseClient,
  originalStoragePath: string,
  bytes: ArrayBuffer
): Promise<string | null> {
  try {
    const thumb = await makeThumbnailBuffer(bytes)
    const path = thumbPathFor(originalStoragePath)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, thumb, { contentType: "image/jpeg", upsert: true })
    return error ? null : path
  } catch {
    return null
  }
}
