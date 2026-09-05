"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { syncTierValuation } from "@/lib/actions/tier-valuations"

export type PriceTrackingState = { error?: string; enabled?: boolean }

/**
 * Turn price tracking on or off for one watch, from the Market section.
 *
 * It used to be an edit-form checkbox only, which meant the answer to "should
 * I be spending a dollar a month valuing this?" lived on a different page from
 * the value itself. The column is otherwise untouched: the edit form still
 * writes it, and recording a sale still clears it (sales.ts).
 *
 * A reference number is required — enforced by a Zod refine on the form, by
 * the CHECK constraint in migration 00021, and here, so the toggle can say why
 * rather than surfacing a constraint violation.
 */
export async function setPriceTracking(
  watchId: string,
  enabled: boolean
): Promise<PriceTrackingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { data: watch } = await supabase
    .from("watches")
    .select("reference_number, sale_status")
    .eq("id", watchId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!watch) return { error: "Watch not found." }

  if (enabled && !watch.reference_number) {
    return {
      error: "Add a reference number first — a valuation needs one to be about a specific watch.",
    }
  }
  if (enabled && watch.sale_status === "sold") {
    return { error: "This watch is sold — it is no longer price-checked." }
  }

  const { error } = await supabase
    .from("watches")
    .update({ price_check_enabled: enabled })
    .eq("id", watchId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  // The two valuation sources are exclusive: switching tracking ON hands the
  // watch to the agent and drops its static estimate; switching it OFF hands
  // it back to its tier. `syncTierValuation` knows which way round this is.
  await syncTierValuation(watchId)

  revalidatePath(`/watch/${watchId}`)
  revalidatePath("/market")
  revalidatePath("/collection")
  return { enabled }
}
