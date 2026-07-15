"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { wearLogFormSchema, wearLogNotesSchema } from "@/lib/validations/wear-log"
import { getWearLogsForMonth, getWearLogsHistory } from "@/lib/queries/wear-logs"
import type { WearLogWithWatch } from "@/lib/types/watch"

// ── Types ──────────────────────────────────────────────────────────

export type WearLogActionState = {
  error?: string
  success?: boolean
}

// ── Form-bound Actions ─────────────────────────────────────────────

/**
 * Create a wear log entry from the add-wear dialog form.
 * Signature: (prevState, formData) for useActionState.
 */
export async function createWearLog(
  _prevState: WearLogActionState,
  formData: FormData
): Promise<WearLogActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const raw = Object.fromEntries(formData.entries())
  const parsed = wearLogFormSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data

  const { error } = await supabase.from("wear_logs").insert({
    user_id: user.id,
    watch_id: data.watch_id,
    worn_date: data.worn_date,
    notes: data.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath("/wear-log")
  revalidatePath(`/watch/${data.watch_id}/edit`)
  return { success: true }
}

/**
 * Update notes on an existing wear log.
 * Bound with .bind(null, logId) for useActionState.
 */
export async function updateWearLogNotes(
  logId: string,
  _prevState: WearLogActionState,
  formData: FormData
): Promise<WearLogActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const raw = Object.fromEntries(formData.entries())
  const parsed = wearLogNotesSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from("wear_logs")
    .update({ notes: parsed.data.notes || null })
    .eq("id", logId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/wear-log")
  return { success: true }
}

// ── Direct-call Actions ────────────────────────────────────────────

/**
 * Quick-wear: log today's date for a watch. Called from "Wore Today" button.
 */
export async function quickWear(
  watchId: string
): Promise<WearLogActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from("wear_logs").insert({
    user_id: user.id,
    watch_id: watchId,
    worn_date: today,
  })

  if (error) return { error: error.message }

  revalidatePath("/wear-log")
  revalidatePath(`/watch/${watchId}/edit`)
  return { success: true }
}

/**
 * Delete a wear log entry.
 */
export async function deleteWearLog(
  logId: string
): Promise<WearLogActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase
    .from("wear_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/wear-log")
  return { success: true }
}

// ── Data-fetching Actions (for client-side navigation) ─────────────

/**
 * Fetch wear logs for a specific month (called from calendar month nav).
 */
export async function fetchMonthLogs(
  year: number,
  month: number
): Promise<WearLogWithWatch[]> {
  return getWearLogsForMonth(year, month)
}

/**
 * Fetch paginated wear history (called from history tab pagination).
 */
export async function fetchWearHistory(
  page: number,
  pageSize: number
): Promise<{ logs: WearLogWithWatch[]; totalCount: number }> {
  return getWearLogsHistory(page, pageSize)
}
