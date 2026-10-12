"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { removeWatchPhoto, storeWatchPhoto } from "@/lib/photo-store"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

export type PhotoActionState = {
  error?: string
  success?: boolean
  /** The created watch_photos row (uploadWatchPhoto) — used for undo (D3). */
  photoId?: string
}

/**
 * Upload a photo for a watch. Stores in Supabase Storage and creates
 * a watch_photos row. The first photo uploaded becomes the cover.
 * The work lives in `lib/photo-store.ts`, shared with the iPhone app's route.
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

  const file = formData.get("photo") as File | null
  if (!file) return { error: "No file selected." }

  const result = await storeWatchPhoto(supabase, user.id, watchId, file)
  if ("error" in result) return { error: result.error }

  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
  return { success: true, photoId: result.photoId }
}

/**
 * Delete a watch photo from storage and database (via `lib/photo-store.ts`).
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

  const result = await removeWatchPhoto(supabase, user.id, photoId)
  if ("error" in result) return { error: result.error }

  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
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

  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Tag a photo with one of the five angle classes (or clear it) — the data
 * the Photo Lab coverage matrix reads (D1/D2, migration 00041).
 */
export async function setPhotoAngle(
  photoId: string,
  watchId: string,
  angle: PhotoAngle | null
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }
  if (angle !== null && !PHOTO_ANGLES.includes(angle)) {
    return { error: "Unknown angle." }
  }

  const { error } = await supabase
    .from("watch_photos")
    .update({ angle })
    .eq("id", photoId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
  revalidatePath("/photo-lab")
  return { success: true }
}

/**
 * Persist a filmstrip drag-reorder (D2, migration 00041). `orderedIds` is
 * the full photo list in its new order; sort_order is written 0..n-1.
 */
export async function reorderWatchPhotos(
  watchId: string,
  orderedIds: string[]
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("watch_photos")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("watch_id", watchId)
      .eq("user_id", user.id)
    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
  return { success: true }
}
