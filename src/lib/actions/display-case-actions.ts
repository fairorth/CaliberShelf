"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { displayCaseFormSchema } from "@/lib/validations/display-case"

export type DisplayCaseActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a new display case.
 */
export async function createDisplayCase(
  _prevState: DisplayCaseActionState,
  formData: FormData
): Promise<DisplayCaseActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = displayCaseFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Get the next display_order
  const { data: lastCase } = await supabase
    .from("display_cases")
    .select("display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = lastCase
    ? (lastCase as { display_order: number }).display_order + 1
    : 0

  const { error } = await supabase.from("display_cases").insert({
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    capacity: data.capacity,
    case_type: data.case_type || null,
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
 * Update a display case.
 */
export async function updateDisplayCase(
  caseId: string,
  _prevState: DisplayCaseActionState,
  formData: FormData
): Promise<DisplayCaseActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = displayCaseFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("display_cases")
    .update({
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      case_type: data.case_type || null,
    })
    .eq("id", caseId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Delete a display case. Fails if it contains watches (ON DELETE RESTRICT).
 */
export async function deleteDisplayCase(
  caseId: string
): Promise<DisplayCaseActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("display_cases")
    .delete()
    .eq("id", caseId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Cannot delete this case — it still contains watches. Move them first.",
      }
    }
    return { error: error.message }
  }

  revalidatePath("/config")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Move a single watch to a different case and slot.
 */
export async function moveWatch(
  watchId: string,
  targetCaseId: string,
  targetSlot: number
): Promise<DisplayCaseActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { error } = await supabase
    .from("watches")
    .update({ case_id: targetCaseId, case_slot: targetSlot })
    .eq("id", watchId)
    .eq("user_id", user.id)

  if (error) {
    if (error.code === "23505") {
      return { error: "That slot is already occupied." }
    }
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}

/**
 * Move all watches from one case to another.
 * Validates that the target case has enough capacity.
 */
export async function moveAllWatches(
  sourceCaseId: string,
  targetCaseId: string
): Promise<DisplayCaseActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  // Get source watches
  const { data: sourceWatches } = await supabase
    .from("watches")
    .select("id, case_slot")
    .eq("case_id", sourceCaseId)
    .eq("user_id", user.id)
    .order("case_slot", { ascending: true })

  if (!sourceWatches || sourceWatches.length === 0) {
    return { error: "No watches to move." }
  }

  // Get target case capacity and current watches
  const { data: targetCase } = await supabase
    .from("display_cases")
    .select("capacity")
    .eq("id", targetCaseId)
    .eq("user_id", user.id)
    .single()

  if (!targetCase) {
    return { error: "Target case not found." }
  }

  const capacity = parseInt((targetCase as { capacity: string }).capacity, 10)

  const { data: targetWatches } = await supabase
    .from("watches")
    .select("case_slot")
    .eq("case_id", targetCaseId)

  const occupied = new Set(
    (targetWatches ?? []).map((w: { case_slot: number }) => w.case_slot)
  )
  const availableSlots: number[] = []
  for (let i = 0; i < capacity; i++) {
    if (!occupied.has(i)) availableSlots.push(i)
  }

  if (availableSlots.length < sourceWatches.length) {
    return {
      error: `Not enough space. Target case has ${availableSlots.length} open slot(s) but ${sourceWatches.length} watch(es) need to move.`,
    }
  }

  // Move each watch to the next available slot
  for (let i = 0; i < sourceWatches.length; i++) {
    const watch = sourceWatches[i] as { id: string; case_slot: number }
    const { error } = await supabase
      .from("watches")
      .update({ case_id: targetCaseId, case_slot: availableSlots[i] })
      .eq("id", watch.id)
      .eq("user_id", user.id)

    if (error) {
      return { error: `Failed to move watch: ${error.message}` }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}
