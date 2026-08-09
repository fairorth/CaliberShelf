"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { GuideEntryStoredStatus } from "@/lib/types/guide"

export type GuideActionState = {
  error?: string
  success?: boolean
}

/**
 * Toggle an unlinked entry between candidate and passed. Recording "passed"
 * keeps the decision visible so it isn't re-litigated later.
 */
export async function setGuideEntryStatus(
  entryId: string,
  status: GuideEntryStoredStatus
): Promise<GuideActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  if (status !== "candidate" && status !== "passed") {
    return { error: "Invalid status." }
  }

  const { error } = await supabase
    .from("guide_entries")
    .update({ status })
    .eq("id", entryId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/guides")
  return { success: true }
}

/**
 * The two-tier bridge: promote a candidate entry to a wish-list WATCH so the
 * existing fleet (deal-check, valuations, collection UI) can work on it. The
 * created watch links back to the entry; if a watch is already linked, this
 * is a no-op with an explanation.
 */
export async function promoteEntryToWishlist(
  entryId: string,
  brandId: string,
  categoryId: string
): Promise<GuideActionState & { watchId?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }

  const { data: entry } = await supabase
    .from("guide_entries")
    .select("id, title, reference_number, watch_id, target_low_cents, target_high_cents")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single()

  if (!entry) return { error: "Guide entry not found." }
  const e = entry as {
    id: string
    title: string
    reference_number: string | null
    watch_id: string | null
    target_low_cents: number | null
    target_high_cents: number | null
  }
  if (e.watch_id) {
    return { error: "This entry is already linked to a watch." }
  }

  // Estimated cost = target band midpoint (wish-list convention).
  const mid =
    e.target_low_cents != null && e.target_high_cents != null
      ? Math.round((e.target_low_cents + e.target_high_cents) / 2)
      : e.target_low_cents ?? e.target_high_cents

  const { data: watch, error: insertError } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: brandId,
      model: e.title,
      reference_number: e.reference_number,
      category_id: categoryId,
      purchase_price_cents: mid,
      is_wishlist: true,
    })
    .select("id")
    .single()

  if (insertError) return { error: insertError.message }
  const watchId = (watch as { id: string }).id

  const { error: linkError } = await supabase
    .from("guide_entries")
    .update({ watch_id: watchId })
    .eq("id", entryId)
    .eq("user_id", user.id)

  if (linkError) return { error: linkError.message }

  revalidatePath("/guides")
  revalidatePath("/collection")
  return { success: true, watchId }
}
