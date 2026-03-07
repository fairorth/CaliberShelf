"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { movementFormSchema } from "@/lib/validations/movement"

export type MovementActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a user-owned movement.
 */
export async function createMovement(
  _prevState: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = movementFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase.from("movements").insert({
    user_id: user.id,
    caliber_name: data.caliber_name,
    manufacturer: data.manufacturer || null,
    base_caliber: data.base_caliber || null,
    aliases: data.aliases || null,
    movement_type: data.movement_type,
    display_type: data.display_type,
    diameter_mm: data.diameter_mm,
    height_mm: data.height_mm,
    jewel_count: data.jewel_count,
    beat_rate_vph: data.beat_rate_vph,
    power_reserve_hours: data.power_reserve_hours,
    accuracy_range: data.accuracy_range || null,
    hacking: data.hacking,
    hand_windable: data.hand_windable,
    quickset_date: data.quickset_date,
    complications: data.complications || null,
    country_of_origin: data.country_of_origin || null,
    production_year_start: data.production_year_start,
    production_year_end: data.production_year_end,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Update a user-owned movement.
 */
export async function updateMovement(
  movementId: string,
  _prevState: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = movementFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("movements")
    .update({
      caliber_name: data.caliber_name,
      manufacturer: data.manufacturer || null,
      base_caliber: data.base_caliber || null,
      aliases: data.aliases || null,
      movement_type: data.movement_type,
      display_type: data.display_type,
      diameter_mm: data.diameter_mm,
      height_mm: data.height_mm,
      jewel_count: data.jewel_count,
      beat_rate_vph: data.beat_rate_vph,
      power_reserve_hours: data.power_reserve_hours,
      accuracy_range: data.accuracy_range || null,
      hacking: data.hacking,
      hand_windable: data.hand_windable,
      quickset_date: data.quickset_date,
      complications: data.complications || null,
      country_of_origin: data.country_of_origin || null,
      production_year_start: data.production_year_start,
      production_year_end: data.production_year_end,
    })
    .eq("id", movementId)
    .eq("user_id", user.id) // can only edit own movements

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Delete a user-owned movement. Watches referencing it will have movement_id set to NULL.
 */
export async function deleteMovement(movementId: string): Promise<MovementActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("movements")
    .delete()
    .eq("id", movementId)
    .eq("user_id", user.id) // can only delete own movements

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}
