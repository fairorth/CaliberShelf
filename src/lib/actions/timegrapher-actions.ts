"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { timegrapherRunFormSchema } from "@/lib/validations/timegrapher"

export type TimegrapherActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a timegrapher run from the add-run form.
 * Signature: (prevState, formData) for useActionState.
 */
export async function createTimegrapherRun(
  _prevState: TimegrapherActionState,
  formData: FormData
): Promise<TimegrapherActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const raw = Object.fromEntries(formData.entries())
  const parsed = timegrapherRunFormSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data

  const { error } = await supabase.from("timegrapher_runs").insert({
    user_id: user.id,
    watch_id: data.watch_id,
    run_date: data.run_date,
    rate_sec_per_day: data.rate_sec_per_day,
    amplitude_deg: data.amplitude_deg,
    beat_error_ms: data.beat_error_ms,
    notes: data.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/watch/${data.watch_id}/edit`)
  return { success: true }
}

/**
 * Delete a timegrapher run.
 */
export async function deleteTimegrapherRun(
  runId: string,
  watchId: string
): Promise<TimegrapherActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase
    .from("timegrapher_runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/watch/${watchId}/edit`)
  return { success: true }
}
