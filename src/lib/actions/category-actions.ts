"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { categoryFormSchema } from "@/lib/validations/category"

export type CategoryActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a new category.
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

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: data.name,
    description: data.description || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Update a category (name + description).
 */
export async function updateCategory(
  categoryId: string,
  data: { name: string; description: string }
): Promise<CategoryActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const parsed = categoryFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
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
