"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { watchFormSchema } from "@/lib/validations/watch"
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
      case_id: data.case_id,
      case_slot: data.case_slot,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      condition: data.condition || null,
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
    if (error.code === "23505") {
      return { error: "That case slot is already occupied. Please choose a different slot." }
    }
    return { error: error.message }
  }

  revalidatePath("/collection")
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
      case_id: data.case_id,
      case_slot: data.case_slot,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      condition: data.condition || null,
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
    if (error.code === "23505") {
      return { error: "That case slot is already occupied. Please choose a different slot." }
    }
    return { error: error.message }
  }

  revalidatePath("/collection")
  revalidatePath("/dashboard")
  revalidatePath(`/watch/${watchId}`)
  redirect(`/watch/${watchId}`)
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

  // Delete the watch (cascades to watch_photos rows)
  const { error } = await supabase
    .from("watches")
    .delete()
    .eq("id", watchId)
    .eq("user_id", user.id) // extra safety on top of RLS

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/collection")
  revalidatePath("/dashboard")
  redirect("/collection")
}
