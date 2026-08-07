"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"

const BUCKET = "watch-photos"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type StrapPhotoActionState = {
  error?: string
  success?: boolean
}

/** Strap photos live in the watch-photos bucket under
 *  {user_id}/straps/{strap_id}/{filename} — first folder stays the owner id,
 *  which is what the bucket's storage RLS checks. */
function buildStrapStoragePath(userId: string, strapId: string, filename: string): string {
  return `${userId}/straps/${strapId}/${filename}`
}

/**
 * Upload a photo for a strap. First photo becomes the cover.
 */
export async function uploadStrapPhoto(
  strapId: string,
  formData: FormData
): Promise<StrapPhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to upload photos." }
  }

  const { data: strap } = await supabase
    .from("straps")
    .select("id")
    .eq("id", strapId)
    .eq("user_id", user.id)
    .single()

  if (!strap) {
    return { error: "Strap not found." }
  }

  const file = formData.get("photo") as File | null
  if (!file || file.size === 0) {
    return { error: "No file selected." }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File must be smaller than 10MB." }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "File must be an image (JPEG, PNG, WebP, or HEIC)." }
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = buildStrapStoragePath(user.id, strapId, uniqueName)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const thumbPath = await generateThumbnail(supabase, storagePath, await file.arrayBuffer())

  const { count } = await supabase
    .from("strap_photos")
    .select("id", { count: "exact", head: true })
    .eq("strap_id", strapId)

  const isFirstPhoto = (count ?? 0) === 0

  const { error: insertError } = await supabase.from("strap_photos").insert({
    strap_id: strapId,
    user_id: user.id,
    storage_path: storagePath,
    thumb_path: thumbPath,
    display_order: count ?? 0,
    is_cover: isFirstPhoto,
  })

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath, thumbPathFor(storagePath)])
    return { error: `Failed to save photo: ${insertError.message}` }
  }

  revalidatePath(`/straps/${strapId}/edit`)
  revalidatePath("/straps")
  return { success: true }
}

/**
 * Delete a strap photo from storage and database; promote the next photo to
 * cover if the cover was deleted.
 */
export async function deleteStrapPhoto(
  photoId: string,
  strapId: string
): Promise<StrapPhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to delete photos." }
  }

  const { data: photo } = await supabase
    .from("strap_photos")
    .select("storage_path, thumb_path, is_cover")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single()

  if (!photo) {
    return { error: "Photo not found." }
  }

  const typedPhoto = photo as { storage_path: string; thumb_path: string | null; is_cover: boolean }

  await supabase.storage
    .from(BUCKET)
    .remove([typedPhoto.storage_path, typedPhoto.thumb_path ?? thumbPathFor(typedPhoto.storage_path)])

  const { error } = await supabase
    .from("strap_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  if (typedPhoto.is_cover) {
    const { data: nextPhoto } = await supabase
      .from("strap_photos")
      .select("id")
      .eq("strap_id", strapId)
      .order("display_order", { ascending: true })
      .limit(1)
      .single()

    if (nextPhoto) {
      await supabase
        .from("strap_photos")
        .update({ is_cover: true })
        .eq("id", (nextPhoto as { id: string }).id)
    }
  }

  revalidatePath(`/straps/${strapId}/edit`)
  revalidatePath("/straps")
  return { success: true }
}

/**
 * Set a photo as the strap's cover.
 */
export async function setStrapCoverPhoto(
  photoId: string,
  strapId: string
): Promise<StrapPhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  await supabase
    .from("strap_photos")
    .update({ is_cover: false })
    .eq("strap_id", strapId)
    .eq("user_id", user.id)
    .eq("is_cover", true)

  const { error } = await supabase
    .from("strap_photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/straps/${strapId}/edit`)
  revalidatePath("/straps")
  return { success: true }
}
