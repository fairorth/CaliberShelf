"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { buildStoragePath } from "@/lib/storage"
import { createBrandInline } from "@/lib/actions/brand-actions"

const PHOTO_BUCKET = "watch-photos"
const PHOTO_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

export type BatchImportResult = {
  totalRequested: number
  successCount: number
  errors: string[]
}

/**
 * Batch-create watches from uploaded images.
 * Each image becomes a new watch with a cover photo, auto-named "Batch N",
 * assigned to an "Unknown" brand (auto-created if needed) and the selected category.
 */
export async function batchImportWatches(
  formData: FormData
): Promise<BatchImportResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { totalRequested: 0, successCount: 0, errors: ["You must be logged in."] }
  }

  const categoryId = formData.get("category_id") as string
  if (!categoryId) {
    return { totalRequested: 0, successCount: 0, errors: ["Category is required."] }
  }

  const files = formData.getAll("photos") as File[]
  if (files.length === 0) {
    return { totalRequested: 0, successCount: 0, errors: ["No images selected."] }
  }

  // Ensure "Unknown" brand exists for this user
  const brandResult = await createBrandInline("Unknown")
  if (!brandResult.id) {
    return {
      totalRequested: files.length,
      successCount: 0,
      errors: [brandResult.error ?? "Failed to create Unknown brand."],
    }
  }
  const unknownBrandId = brandResult.id

  // Find the highest existing "Batch N" number so we continue the sequence
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

  const errors: string[] = []
  let successCount = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const batchName = `Batch ${nextBatchNum + i}`

    // Validate file
    if (!file || file.size === 0) {
      errors.push(`Image ${i + 1}: Empty file, skipped.`)
      continue
    }
    if (file.size > PHOTO_MAX_SIZE) {
      errors.push(`Image ${i + 1} (${file.name}): Exceeds 10MB limit, skipped.`)
      continue
    }
    if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Image ${i + 1} (${file.name}): Unsupported file type "${file.type}", skipped.`)
      continue
    }

    // Create the watch
    const { data: watch, error: watchError } = await supabase
      .from("watches")
      .insert({
        user_id: user.id,
        brand_id: unknownBrandId,
        model: batchName,
        category_id: categoryId,
      })
      .select("id")
      .single()

    if (watchError || !watch) {
      errors.push(`Image ${i + 1} (${file.name}): Failed to create watch — ${watchError?.message ?? "unknown error"}.`)
      continue
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
      errors.push(`Image ${i + 1} (${file.name}): Watch created but photo upload failed — ${uploadError.message}.`)
      successCount++ // watch was created, just no photo
      continue
    }

    // Create photo record
    await supabase.from("watch_photos").insert({
      watch_id: watchId,
      user_id: user.id,
      storage_path: storagePath,
      display_order: 0,
      is_cover: true,
    })

    successCount++
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")

  return {
    totalRequested: files.length,
    successCount,
    errors,
  }
}
