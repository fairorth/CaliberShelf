"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { brandFormSchema } from "@/lib/validations/brand"

export type BrandActionState = {
  error?: string
  success?: boolean
}

/**
 * Quick-create a brand for the combobox "create new" flow.
 * Returns the new brand's id, or an error if the name is taken.
 */
export async function createBrandInline(
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
    return { error: "Brand name is required." }
  }

  const { data, error } = await supabase
    .from("brands")
    .insert({ user_id: user.id, name: trimmedName })
    .select("id")
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      // Brand already exists — look it up and return the id
      const { data: existing } = await supabase
        .from("brands")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", trimmedName)
        .single()
      if (existing) {
        return { id: (existing as { id: string }).id }
      }
      return { error: "Brand already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { id: (data as { id: string }).id }
}

/**
 * Delete a brand. Fails if any watches reference it (ON DELETE RESTRICT).
 */
export async function deleteBrand(brandId: string): Promise<BrandActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", brandId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23503") {
      return { error: "Cannot delete brand — it is used by one or more watches." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Update a brand's name and country.
 */
export async function updateBrand(
  brandId: string,
  data: { name: string; country_of_origin: string }
): Promise<BrandActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const parsed = brandFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from("brands")
    .update({
      name: parsed.data.name,
      country_of_origin: parsed.data.country_of_origin || null,
    })
    .eq("id", brandId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") {
      return { error: "A brand with this name already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Create a brand from the config form.
 */
export async function createBrand(
  _prevState: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = brandFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase.from("brands").insert({
    user_id: user.id,
    name: data.name,
    country_of_origin: data.country_of_origin || null,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "A brand with this name already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}
