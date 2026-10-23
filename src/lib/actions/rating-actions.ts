"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Result = { success: true } | { error: string }

/**
 * Rate My Watches — removing results (Reports → Ratings). The phone removes
 * a player by deleting the same `raters` row straight through Supabase (RLS);
 * the cascade is the one rule both rely on: a rater takes their sessions,
 * a session takes its picks (00057).
 */

/** A player and every rating they made. */
export async function deleteRater(raterId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase.from("raters").delete().eq("id", raterId).eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/reports/ratings")
  return { success: true }
}

/**
 * One completed segment (or Best in Show). The report shows each rater's
 * LATEST session per segment, so an earlier play of the same segment, if
 * there is one, takes its place.
 */
export async function deleteRatingSession(sessionId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { error } = await supabase.from("rating_sessions").delete().eq("id", sessionId).eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/reports/ratings")
  return { success: true }
}
