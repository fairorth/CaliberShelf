"use server"

import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { buildStoragePath } from "@/lib/storage"
import { dimensionColumns, type ImageDimensions } from "@/lib/image-meta"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle, ReviewState } from "@/lib/types/watch"

const BUCKET = "watch-photos"
// Cover-photo output target from docs/photo-lab.md: 2000px long edge JPEG.
const PROMOTE_LONG_EDGE = 2000

export type PhotoLabActionState = {
  error?: string
  success?: boolean
}

function revalidatePhotoLab(watchId?: string) {
  revalidatePath("/photo-lab")
  revalidatePath("/photo-lab/review")
  if (watchId) {
    revalidatePath(`/watch/${watchId}`)
    revalidatePath(`/watch/${watchId}/edit`)
  }
}

/**
 * Mark a scored frame reviewed (rejected or back to unreviewed). Rejecting
 * NEVER touches the source file on disk — it only marks the row (D1).
 */
export async function setFrameReviewState(
  scoreId: string,
  state: Exclude<ReviewState, "accepted">
): Promise<PhotoLabActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase
    .from("watch_image_scores")
    .update({
      review_state: state,
      reviewed_at: state === "unreviewed" ? null : new Date().toISOString(),
    })
    .eq("id", scoreId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePhotoLab()
  return { success: true }
}

/**
 * Accept a scored frame: read the source from the capture folder, re-encode
 * to the 2000px cover target, upload it into watch_photos (thumbnail, angle
 * tag, optional cover), and mark the score row accepted — review and
 * publication in one action (D1). Local-only, like the scorer itself.
 */
export async function promoteScoredFrame(
  scoreId: string,
  options: { angle?: PhotoAngle | null; setCover?: boolean }
): Promise<PhotoLabActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const angle = options.angle ?? null
  if (angle !== null && !PHOTO_ANGLES.includes(angle)) {
    return { error: "Unknown angle." }
  }

  const [{ data: scoreRow }, { data: profile }] = await Promise.all([
    supabase
      .from("watch_image_scores")
      .select("id, watch_id, watch_photo_id, rel_path, content_hash, source_kind")
      .eq("id", scoreId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("watch_images_path").eq("id", user.id).maybeSingle(),
  ])

  const score = scoreRow as {
    id: string
    watch_id: string
    watch_photo_id: string | null
    rel_path: string
    content_hash: string
    source_kind: string
  } | null
  if (!score) return { error: "Frame not found." }
  if (score.watch_photo_id) return { error: "This frame was already accepted." }

  const base = ((profile?.watch_images_path as string | null) ?? "").trim()
  if (!base) return { error: "No Watch Images folder configured (Config → Settings)." }

  const baseAbs = path.resolve(base)
  const originalAbs = path.resolve(baseAbs, score.rel_path)
  if (!originalAbs.startsWith(baseAbs + path.sep)) {
    return { error: "Frame path is outside the Watch Images folder." }
  }

  // Get renderable bytes: CR3 → embedded full-res JpgFromRaw via ExifTool
  // (same technique as photo-score.mjs); JPEG/export → the file itself.
  let sourceBytes: Buffer
  try {
    if (score.source_kind === "cr3") {
      const { exiftool } = await import("exiftool-vendored")
      sourceBytes = await exiftool.extractBinaryTagToBuffer("JpgFromRaw", originalAbs)
    } else {
      sourceBytes = await fs.readFile(originalAbs)
    }
  } catch {
    return {
      error:
        "Could not read the frame from disk — Review promotion only works on the machine that holds the capture folders.",
    }
  }

  let jpeg: Buffer
  // Dimensions of the COMPOSITE, not the source (00048). `resolveWithObject`
  // hands back the output size from the encode that is already happening, so
  // this costs nothing and — crucially — describes the file that actually gets
  // stored. Reading the RAW instead would describe a frame nobody sees: the
  // resize below changes it, and `.rotate()` may transpose it.
  let jpegDims: ImageDimensions | null = null
  try {
    const { default: sharp } = await import("sharp")
    const encoded = await sharp(sourceBytes)
      .rotate()
      .resize(PROMOTE_LONG_EDGE, PROMOTE_LONG_EDGE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true })
    jpeg = encoded.data
    jpegDims = { width: encoded.info.width, height: encoded.info.height }
  } catch {
    return { error: "Could not decode this frame (unsupported format)." }
  }

  const storagePath = buildStoragePath(user.id, score.watch_id, `${crypto.randomUUID()}.jpg`)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, jpeg, { contentType: "image/jpeg", upsert: false })
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

  const thumbPath = await generateThumbnail(
    supabase,
    storagePath,
    Uint8Array.from(jpeg).buffer as ArrayBuffer
  )

  const { count } = await supabase
    .from("watch_photos")
    .select("id", { count: "exact", head: true })
    .eq("watch_id", score.watch_id)

  const makeCover = Boolean(options.setCover) || (count ?? 0) === 0
  if (makeCover) {
    await supabase
      .from("watch_photos")
      .update({ is_cover: false })
      .eq("watch_id", score.watch_id)
      .eq("user_id", user.id)
      .eq("is_cover", true)
  }

  const { data: inserted, error: insertError } = await supabase
    .from("watch_photos")
    .insert({
      watch_id: score.watch_id,
      user_id: user.id,
      storage_path: storagePath,
      thumb_path: thumbPath,
      display_order: count ?? 0,
      sort_order: count ?? 0,
      is_cover: makeCover,
      angle,
      ...dimensionColumns(jpegDims),
    })
    .select("id")
    .single()

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath, thumbPathFor(storagePath)])
    return { error: `Failed to save photo: ${insertError?.message ?? "unknown error"}` }
  }

  const { error: linkError } = await supabase
    .from("watch_image_scores")
    .update({
      watch_photo_id: (inserted as { id: string }).id,
      review_state: "accepted",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", scoreId)
    .eq("user_id", user.id)

  if (linkError) return { error: linkError.message }

  revalidatePhotoLab(score.watch_id)
  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}
