"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  faceoffSchema,
  saleGoalSchema,
  wearFeelSchema,
  type SaleGoalInput,
  type WearFeel,
} from "@/lib/validations/keep"
import { keepFieldsSchema, type KeepFields } from "@/lib/validations/watch"
import { dollarsToCents } from "@/lib/utils"

// The Edit's writes (00054). Every screen of the keep/sell flow — the Sort
// grid, the rating session, the head-to-heads, the watch page — goes through
// these, so the timestamps that say WHEN a judgement was made are stamped in
// exactly one place.

type Result = { error?: string; success?: boolean }

const EDIT_PATHS = ["/market/edit", "/market/edit/sort", "/market/edit/rate", "/market/edit/faceoff", "/market/to-sell"]

function revalidateEdit(watchId?: string) {
  for (const p of EDIT_PATHS) revalidatePath(p)
  revalidatePath("/collection")
  if (watchId) {
    revalidatePath(`/watch/${watchId}`)
    revalidatePath(`/watch/${watchId}/edit`)
  }
}

/**
 * Set any of attachment / keep decision / sentimental / replaceability on one
 * watch. Absent keys are left alone; null clears. Direct-call signature
 * `(id, data)` — the Sort grid and the rating session fire these per key.
 */
export async function setKeepFields(watchId: string, fields: KeepFields): Promise<Result> {
  const parsed = keepFieldsSchema.safeParse(fields)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {}
  const f = parsed.data
  if (f.attachment !== undefined) {
    update.attachment = f.attachment
    update.attachment_rated_at = f.attachment ? now : null
  }
  if (f.keep_decision !== undefined) {
    update.keep_decision = f.keep_decision
    update.keep_decided_at = f.keep_decision ? now : null
  }
  if (f.sentimental !== undefined) update.sentimental = f.sentimental
  if (f.replaceability !== undefined) update.replaceability = f.replaceability

  const { error } = await supabase
    .from("watches")
    .update(update)
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidateEdit(watchId)
  return { success: true }
}

/** Record one head-to-head pick: "keep this one over that one". */
export async function recordFaceoff(winnerId: string, loserId: string): Promise<Result & { id?: string }> {
  const parsed = faceoffSchema.safeParse({ winnerId, loserId })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { data, error } = await supabase
    .from("keep_faceoffs")
    .insert({ user_id: user.id, winner_id: winnerId, loser_id: loserId })
    .select("id")
    .single()
  if (error) {
    if (error.code === "23503") return { error: "One of those watches no longer exists." }
    return { error: error.message }
  }

  revalidatePath("/market/edit")
  revalidatePath("/market/edit/faceoff")
  return { success: true, id: (data as { id: string }).id }
}

/** Take back a head-to-head pick (the Undo on the face-off screen). */
export async function deleteFaceoff(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase
    .from("keep_faceoffs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/market/edit")
  revalidatePath("/market/edit/faceoff")
  return { success: true }
}

/** Clear every head-to-head pick — a fresh start once the collection moves. */
export async function clearFaceoffs(): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase.from("keep_faceoffs").delete().eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/market/edit")
  revalidatePath("/market/edit/faceoff")
  return { success: true }
}

/**
 * Save the sale goal and fee haircut. The goal's start date (which sales count
 * toward it) moves only when the AMOUNT changes — relabelling or retuning the
 * fee must not quietly drop the sales already made toward it.
 */
export async function saveSaleGoal(input: SaleGoalInput): Promise<Result> {
  const parsed = saleGoalSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { data: current } = await supabase
    .from("profiles")
    .select("sale_goal_cents, sale_goal_set_at")
    .eq("id", user.id)
    .maybeSingle()

  const goalCents = parsed.data.goal != null ? dollarsToCents(parsed.data.goal) : null
  const prev = current as { sale_goal_cents: number | null; sale_goal_set_at: string | null } | null
  const amountChanged = (prev?.sale_goal_cents ?? null) !== goalCents

  const { error } = await supabase
    .from("profiles")
    .update({
      sale_goal_cents: goalCents,
      sale_goal_label: parsed.data.label || null,
      sale_fee_pct: parsed.data.feePct,
      sale_goal_set_at:
        goalCents == null
          ? null
          : amountChanged || !prev?.sale_goal_set_at
            ? new Date().toISOString()
            : prev.sale_goal_set_at,
    })
    .eq("id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/market/to-sell")
  return { success: true }
}

/** Set (or clear) how a wear felt. */
export async function setWearFeel(logId: string, feel: WearFeel | null): Promise<Result> {
  if (feel !== null) {
    const parsed = wearFeelSchema.safeParse(feel)
    if (!parsed.success) return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase
    .from("wear_logs")
    .update({ feel })
    .eq("id", logId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/wear-log")
  revalidatePath("/market/edit")
  return { success: true }
}
