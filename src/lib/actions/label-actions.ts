"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { labelFormSchema } from "@/lib/validations/label"

export type LabelActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a new label.
 */
export async function createLabel(
  _prevState: LabelActionState,
  formData: FormData
): Promise<LabelActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = labelFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase.from("labels").insert({
    user_id: user.id,
    name: data.name,
    color: data.color,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: `A label named "${data.name}" already exists.` }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  return { success: true }
}

/**
 * Delete a label. Junction table rows cascade-delete automatically.
 */
export async function deleteLabel(
  labelId: string
): Promise<LabelActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", labelId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}

/**
 * Replace all labels for a watch. Deletes existing, inserts new.
 */
export async function setWatchLabels(
  watchId: string,
  labelIds: string[]
): Promise<void> {
  const supabase = await createClient()

  // Delete existing labels for this watch
  await supabase
    .from("watch_labels")
    .delete()
    .eq("watch_id", watchId)

  // Insert new labels
  if (labelIds.length > 0) {
    const rows = labelIds.map((labelId) => ({
      watch_id: watchId,
      label_id: labelId,
    }))
    await supabase.from("watch_labels").insert(rows)
  }
}
