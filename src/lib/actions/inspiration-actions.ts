"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { inspirationNoteSchema } from "@/lib/validations/inspiration"

const BUCKET = "watch-photos"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type InspirationActionState = {
  error?: string
  success?: boolean
}

/** Inspiration images live in the watch-photos bucket under
 *  {user_id}/inspiration/{filename} — first folder stays the owner id. */
function buildInspirationPath(userId: string, filename: string): string {
  return `${userId}/inspiration/${filename}`
}

/**
 * Upload an inspiration image (paste or file picker), with an optional note.
 */
export async function uploadInspirationImage(
  formData: FormData
): Promise<InspirationActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to add images." }
  }

  const file = formData.get("image") as File | null
  if (!file || file.size === 0) {
    return { error: "No image provided." }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be smaller than 10MB." }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "File must be an image (JPEG, PNG, WebP, or HEIC)." }
  }

  const parsedNote = inspirationNoteSchema.safeParse(formData.get("note") ?? "")
  if (!parsedNote.success) {
    return { error: parsedNote.error.issues[0].message }
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = buildInspirationPath(user.id, uniqueName)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const thumbPath = await generateThumbnail(supabase, storagePath, await file.arrayBuffer())

  const { error: insertError } = await supabase.from("inspiration_images").insert({
    user_id: user.id,
    storage_path: storagePath,
    thumb_path: thumbPath,
    note: parsedNote.data || null,
  })

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath, thumbPathFor(storagePath)])
    return { error: `Failed to save image: ${insertError.message}` }
  }

  revalidatePath("/inspiration")
  return { success: true }
}

/**
 * Update an image's note (inline edit; empty string clears it).
 */
export async function updateInspirationNote(
  imageId: string,
  note: string
): Promise<InspirationActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = inspirationNoteSchema.safeParse(note)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from("inspiration_images")
    .update({ note: parsed.data || null })
    .eq("id", imageId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/inspiration")
  return { success: true }
}

/**
 * Delete an inspiration image (storage objects + row).
 */
export async function deleteInspirationImage(
  imageId: string
): Promise<InspirationActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { data: image } = await supabase
    .from("inspiration_images")
    .select("storage_path, thumb_path")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single()

  if (!image) return { error: "Image not found." }

  const typed = image as { storage_path: string; thumb_path: string | null }
  await supabase.storage
    .from(BUCKET)
    .remove([typed.storage_path, typed.thumb_path ?? thumbPathFor(typed.storage_path)])

  const { error } = await supabase
    .from("inspiration_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/inspiration")
  return { success: true }
}
