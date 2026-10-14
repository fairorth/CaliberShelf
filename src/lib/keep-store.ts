import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { KeepFields } from "@/lib/validations/watch"

/**
 * The ONE write of a keep judgement — attachment, keep decision, sentimental,
 * replaceability — with the timestamps that say WHEN it was made. Called by
 * the web's setKeepFields (actions/keep-actions.ts) and the iPhone's
 * POST /api/watches/[id]/keep, both with a client acting as the user.
 * Absent keys are left alone; null clears (and clears its timestamp).
 * `fields` must already be validated with keepFieldsSchema.
 */
export async function applyKeepFieldsFor(
  supabase: SupabaseClient,
  userId: string,
  watchId: string,
  f: KeepFields
): Promise<{ ok: true } | { error: string }> {
  const now = new Date().toISOString()
  const update: Record<string, unknown> = {}
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

  const { error } = await supabase.from("watches").update(update).eq("id", watchId).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}
