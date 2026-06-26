"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { buildStoragePath } from "@/lib/storage"
import { generateThumbnail } from "@/lib/thumbnails"
import { createBrandInline } from "@/lib/actions/brand-actions"

const PHOTO_BUCKET = "watch-photos"
const PHOTO_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type BatchSetupResult = {
  brandId?: string
  nextBatchNum?: number
  error?: string
}

export type SingleImportResult = {
  success: boolean
  error?: string
}

/**
 * Step 1: Prepare for batch import.
 * Ensures "Unknown" brand exists and finds the next batch number.
 * Called once before the per-image loop.
 */
export async function prepareBatchImport(): Promise<BatchSetupResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  // Ensure "Unknown" brand exists
  const brandResult = await createBrandInline("Unknown")
  if (!brandResult.id) {
    return { error: brandResult.error ?? "Failed to create Unknown brand." }
  }

  // Find highest existing "Batch N" number
  const { data: existingBatches } = await supabase
    .from("watches")
    .select("model")
    .eq("user_id", user.id)
    .like("model", "Batch %")

  let nextBatchNum = 1
  if (existingBatches) {
    for (const w of existingBatches as Array<{ model: string }>) {
      const match = w.model.match(/^Batch (\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num >= nextBatchNum) nextBatchNum = num + 1
      }
    }
  }

  return { brandId: brandResult.id, nextBatchNum }
}

/**
 * Step 2: Import a single watch with its photo.
 * Called once per image from the client-side loop.
 * Each call sends only one file, staying well under the body size limit.
 */
export async function importSingleWatch(
  formData: FormData
): Promise<SingleImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be logged in." }

  const brandId = formData.get("brand_id") as string
  const categoryId = formData.get("category_id") as string
  const batchName = formData.get("batch_name") as string
  const file = formData.get("photo") as File

  if (!brandId || !categoryId || !batchName) {
    return { success: false, error: "Missing required fields." }
  }

  // Validate file
  if (!file || file.size === 0) {
    return { success: false, error: "Empty file." }
  }
  if (file.size > PHOTO_MAX_SIZE) {
    return { success: false, error: "Exceeds 10MB limit." }
  }
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: `Unsupported file type "${file.type}".` }
  }

  // Create the watch
  const { data: watch, error: watchError } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: brandId,
      model: batchName,
      category_id: categoryId,
    })
    .select("id")
    .single()

  if (watchError || !watch) {
    return { success: false, error: `Failed to create watch: ${watchError?.message ?? "unknown"}` }
  }

  const watchId = (watch as { id: string }).id

  // Upload photo
  const ext = file.name.split(".").pop() ?? "jpg"
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const storagePath = buildStoragePath(user.id, watchId, uniqueName)

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { success: true, error: `Watch created but photo failed: ${uploadError.message}` }
  }

  // Generate a small thumbnail for fast Collection loading (best-effort).
  const thumbPath = await generateThumbnail(supabase, storagePath, await file.arrayBuffer())

  // Create photo record
  await supabase.from("watch_photos").insert({
    watch_id: watchId,
    user_id: user.id,
    storage_path: storagePath,
    thumb_path: thumbPath,
    display_order: 0,
    is_cover: true,
  })

  return { success: true }
}

/**
 * Step 3: Revalidate paths after batch is complete.
 * Called once after all imports finish.
 */
export async function finalizeBatchImport(): Promise<void> {
  revalidatePath("/dashboard")
  revalidatePath("/collection")
}
