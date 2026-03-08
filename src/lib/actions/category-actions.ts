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
 * dial_position is the explicit hour position (0-11) on the dial.
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

  // Determine the dial position
  const dialPositionStr = formData.get("dial_position") as string | null
  let dialPosition: number

  if (dialPositionStr && dialPositionStr !== "") {
    dialPosition = parseInt(dialPositionStr, 10)
    if (isNaN(dialPosition) || dialPosition < 0 || dialPosition > 11) {
      return { error: "Invalid dial position. Choose 1–12." }
    }

    // Check the position isn't already taken
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("display_order", dialPosition)
      .limit(1)

    if (existing && existing.length > 0) {
      return { error: `Dial position ${dialPosition === 0 ? 12 : dialPosition} is already in use.` }
    }
  } else {
    // Auto-assign the first available position (0-11)
    const { data: usedPositions } = await supabase
      .from("categories")
      .select("display_order")
      .eq("user_id", user.id)

    const taken = new Set((usedPositions ?? []).map((c: { display_order: number }) => c.display_order))
    dialPosition = 0
    for (let i = 0; i < 12; i++) {
      if (!taken.has(i)) {
        dialPosition = i
        break
      }
    }
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    display_order: dialPosition,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Update a category (name, description, and/or dial position).
 */
export async function updateCategory(
  categoryId: string,
  data: { name: string; description: string; display_order?: number }
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

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description || null,
  }

  // If changing dial position, validate it's available
  if (data.display_order !== undefined) {
    const pos = data.display_order
    if (pos < 0 || pos > 11) {
      return { error: "Invalid dial position." }
    }

    // Check if taken by another category
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("display_order", pos)
      .neq("id", categoryId)
      .limit(1)

    if (existing && existing.length > 0) {
      return { error: `Dial position ${pos === 0 ? 12 : pos} is already in use by another category.` }
    }

    updateData.display_order = pos
  }

  const { error } = await supabase
    .from("categories")
    .update(updateData)
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
