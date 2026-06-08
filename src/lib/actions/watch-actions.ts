"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  watchFormSchema,
  quickAddSchema,
  dialFramingSchema,
  type DialFramingValues,
} from "@/lib/validations/watch"
import { setWatchLabels } from "@/lib/actions/label-actions"
import { buildStoragePath } from "@/lib/storage"
import { dollarsToCents } from "@/lib/utils"

export type WatchActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a new watch. Redirects to the watch detail page on success.
 */
export async function createWatch(
  _prevState: WatchActionState,
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to add a watch." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = watchFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { data: watch, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: data.brand_id,
      model: data.model,
      reference_number: data.reference_number || null,
      serial_number: data.serial_number || null,
      nickname: data.nickname || null,
      movement_id: data.movement_id || null,
      category_id: data.category_id,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      lug_width_mm: data.lug_width_mm,
      case_height_mm: data.case_height_mm,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents: data.purchase_price !== null
        ? dollarsToCents(data.purchase_price)
        : null,
      purchase_currency: data.purchase_currency,
      notes: data.notes || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  // Sync labels
  if (data.label_ids.length > 0) {
    await setWatchLabels(watch.id, data.label_ids)
  }

  revalidatePath("/dashboard")
  redirect(`/watch/${watch.id}`)
}

/**
 * Update an existing watch. Redirects to the watch detail page on success.
 */
export async function updateWatch(
  watchId: string,
  _prevState: WatchActionState,
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to edit a watch." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = watchFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("watches")
    .update({
      brand_id: data.brand_id,
      model: data.model,
      reference_number: data.reference_number || null,
      serial_number: data.serial_number || null,
      nickname: data.nickname || null,
      movement_id: data.movement_id || null,
      category_id: data.category_id,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      lug_width_mm: data.lug_width_mm,
      case_height_mm: data.case_height_mm,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents: data.purchase_price !== null
        ? dollarsToCents(data.purchase_price)
        : null,
      purchase_currency: data.purchase_currency,
      notes: data.notes || null,
    })
    .eq("id", watchId)
    .eq("user_id", user.id) // extra safety on top of RLS

  if (error) {
    return { error: error.message }
  }

  // Sync labels
  await setWatchLabels(watchId, data.label_ids)

  revalidatePath("/dashboard")
  revalidatePath(`/watch/${watchId}`)
  redirect(`/watch/${watchId}`)
}

/**
 * Update only the dial framing (focal point + zoom) for a watch.
 * Direct-call action (not form-bound) — see CLAUDE.md gotcha.
 */
export async function updateDialFraming(
  watchId: string,
  data: DialFramingValues
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const parsed = dialFramingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from("watches")
    .update(parsed.data)
    .eq("id", watchId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath(`/watch/${watchId}`)
  revalidatePath(`/watch/${watchId}/edit`)
  return { success: true }
}

/**
 * Delete a watch and all associated photos from storage.
 */
export async function deleteWatch(watchId: string): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to delete a watch." }
  }

  // First, get all photo storage paths so we can clean up storage
  const { data: photos } = await supabase
    .from("watch_photos")
    .select("storage_path")
    .eq("watch_id", watchId)
    .eq("user_id", user.id)

  // Delete photos from storage bucket
  if (photos && photos.length > 0) {
    const paths = photos.map(
      (p: { storage_path: string }) => p.storage_path
    )
    await supabase.storage.from("watch-photos").remove(paths)
  }

  // Delete the watch (cascades to watch_photos and watch_labels rows)
  const { error } = await supabase
    .from("watches")
    .delete()
    .eq("id", watchId)
    .eq("user_id", user.id) // extra safety on top of RLS

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

/**
 * Bulk delete watches and all associated photos from storage.
 */
export async function bulkDeleteWatches(
  watchIds: string[]
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  if (watchIds.length === 0) {
    return { error: "No watches selected." }
  }

  // Get all photo storage paths for these watches
  const { data: photos } = await supabase
    .from("watch_photos")
    .select("storage_path")
    .in("watch_id", watchIds)
    .eq("user_id", user.id)

  // Delete photos from storage bucket
  if (photos && photos.length > 0) {
    const paths = photos.map(
      (p: { storage_path: string }) => p.storage_path
    )
    await supabase.storage.from("watch-photos").remove(paths)
  }

  // Delete the watches (cascades to watch_photos, watch_labels, wear_logs)
  const { error } = await supabase
    .from("watches")
    .delete()
    .in("id", watchIds)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}

const PHOTO_BUCKET = "watch-photos"
const PHOTO_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

/**
 * Create a watch with an optional photo in one action.
 * Used by the camera-first "Add Watch" mobile flow.
 */
export async function createWatchWithPhoto(
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to add a watch." }
  }

  // Parse form fields (minimal schema)
  const raw = Object.fromEntries(formData.entries())
  const parsed = quickAddSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Insert the watch
  const { data: watch, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: data.brand_id,
      model: data.model,
      category_id: data.category_id,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  // Handle photo upload if present
  const photo = formData.get("photo") as File | null
  if (photo && photo.size > 0) {
    if (photo.size > PHOTO_MAX_SIZE) {
      // Watch created, but photo too large — still redirect
      revalidatePath("/dashboard")
      redirect(`/watch/${watch.id}`)
    }

    if (PHOTO_ALLOWED_TYPES.includes(photo.type)) {
      const ext = photo.name.split(".").pop() ?? "jpg"
      const uniqueName = `${crypto.randomUUID()}.${ext}`
      const storagePath = buildStoragePath(user.id, watch.id, uniqueName)

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, photo, {
          contentType: photo.type,
          upsert: false,
        })

      if (!uploadError) {
        await supabase.from("watch_photos").insert({
          watch_id: watch.id,
          user_id: user.id,
          storage_path: storagePath,
          display_order: 0,
          is_cover: true,
        })
      }
    }
  }

  revalidatePath("/dashboard")
  redirect(`/watch/${watch.id}`)
}
