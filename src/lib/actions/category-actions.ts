"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { categoryFormSchema } from "@/lib/validations/category"

export type CategoryActionState = {
  error?: string
  success?: boolean
}

const MAX_CATEGORIES = 12

/**
 * Create a new category (max 12 per user).
 */
export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = categoryFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Enforce max 12 categories
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if ((count ?? 0) >= MAX_CATEGORIES) {
    return { error: `Maximum of ${MAX_CATEGORIES} categories reached (one per hour on the dial).` }
  }

  // Get the next display_order
  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = lastCategory
    ? (lastCategory as { display_order: number }).display_order + 1
    : 0

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    display_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Update a category.
 */
export async function updateCategory(
  categoryId: string,
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = categoryFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("categories")
    .update({
      name: data.name,
      description: data.description || null,
    })
    .eq("id", categoryId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Delete a category. Fails if it contains watches (ON DELETE RESTRICT).
 */
export async function deleteCategory(
  categoryId: string
): Promise<CategoryActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Cannot delete this category — it still contains watches. Move them first.",
      }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}
