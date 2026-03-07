"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { buildStoragePath } from "@/lib/storage"

const BUCKET = "watch-photos"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB — iPhone photos can be large
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type PhotoActionState = {
  error?: string
  success?: boolean
}

/**
 * Upload a photo for a watch. Stores in Supabase Storage and creates
 * a watch_photos row. The first photo uploaded becomes the cover.
 */
export async function uploadWatchPhoto(
  watchId: string,
  formData: FormData
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to upload photos." }
  }

  // Verify the watch belongs to the user
  const { data: watch } = await supabase
    .from("watches")
    .select("id")
    .eq("id", watchId)
    .eq("user_id", user.id)
    .single()

  if (!watch) {
    return { error: "Watch not found." }
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

  // Generate unique filename preserving extension
  const ext = file.name.split(".").pop() ?? "jpg"
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = buildStoragePath(user.id, watchId, uniqueName)

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  // Check if this is the first photo (make it the cover)
  const { count } = await supabase
    .from("watch_photos")
    .select("id", { count: "exact", head: true })
    .eq("watch_id", watchId)

  const isFirstPhoto = (count ?? 0) === 0

  // Create photo record
  const { error: insertError } = await supabase.from("watch_photos").insert({
    watch_id: watchId,
    user_id: user.id,
    storage_path: storagePath,
    display_order: count ?? 0,
    is_cover: isFirstPhoto,
  })

  if (insertError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { error: `Failed to save photo: ${insertError.message}` }
  }

  revalidatePath(`/watch/${watchId}`)
  return { success: true }
}

/**
 * Delete a watch photo from storage and database.
 */
export async function deleteWatchPhoto(
  photoId: string,
  watchId: string
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to delete photos." }
  }

  // Get the photo to find storage path
  const { data: photo } = await supabase
    .from("watch_photos")
    .select("storage_path, is_cover")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single()

  if (!photo) {
    return { error: "Photo not found." }
  }

  const typedPhoto = photo as { storage_path: string; is_cover: boolean }

  // Delete from storage
  await supabase.storage.from(BUCKET).remove([typedPhoto.storage_path])

  // Delete from database
  const { error } = await supabase
    .from("watch_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  // If this was the cover photo, promote the next photo
  if (typedPhoto.is_cover) {
    const { data: nextPhoto } = await supabase
      .from("watch_photos")
      .select("id")
      .eq("watch_id", watchId)
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

  revalidatePath(`/watch/${watchId}`)
  return { success: true }
}

/**
 * Set a photo as the cover photo for a watch.
 */
export async function setCoverPhoto(
  photoId: string,
  watchId: string
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  // Unset current cover
  await supabase
    .from("watch_photos")
    .update({ is_cover: false })
    .eq("watch_id", watchId)
    .eq("user_id", user.id)
    .eq("is_cover", true)

  // Set new cover
  const { error } = await supabase
    .from("watch_photos")
    .update({ is_cover: true })
    .eq("id", photoId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/watch/${watchId}`)
  revalidatePath("/dashboard")
  return { success: true }
}
