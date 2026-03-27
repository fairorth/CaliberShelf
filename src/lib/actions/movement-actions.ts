"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { movementFormSchema } from "@/lib/validations/movement"

export type MovementActionState = {
  error?: string
  success?: boolean
}

/**
 * Quick-create a movement from the combobox "create new" flow.
 * Returns the new movement's id, or the existing one if name is taken.
 */
export async function createMovementInline(
  name: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { error: "Caliber name is required." }
  }

  const { data, error } = await supabase
    .from("movements")
    .insert({ user_id: user.id, caliber_name: trimmedName })
    .select("id")
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("movements")
        .select("id")
        .eq("user_id", user.id)
        .eq("caliber_name", trimmedName)
        .single()
      if (existing) {
        return { id: (existing as { id: string }).id }
      }
      return { error: "Movement already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { id: (data as { id: string }).id }
}

/**
 * Create a movement via the config form.
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
    caliber_type: data.caliber_type || null,
    beat_rate: data.beat_rate || null,
    power_reserve: data.power_reserve || null,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "A movement with this caliber name already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Update a movement.
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
      caliber_type: data.caliber_type || null,
      beat_rate: data.beat_rate || null,
      power_reserve: data.power_reserve || null,
    })
    .eq("id", movementId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") {
      return { error: "A movement with this caliber name already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Delete a movement. Watches referencing it will have movement_id set to NULL.
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
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}
