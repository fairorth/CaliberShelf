import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { storeWatchPhoto } from "@/lib/photo-store"
import { syncTierValuationFor } from "@/lib/tier-sync"

/**
 * The ONE implementation of creating a watch, for any caller holding a
 * Supabase client that acts AS THE USER: the web's quick add
 * (actions/watch-actions.ts createWatchWithPhoto) and the iPhone app's
 * POST /api/watches. Both get the same side effects — first photo becomes the
 * cover, an owned watch clears its brand's wish-list tag, and the static
 * valuation is written. No revalidatePath: that is the Server Action's job.
 */

export interface NewWatchInput {
  brand_id: string
  model: string
  category_id: string
  purchase_price_cents: number | null
  is_coming_soon: boolean
  is_wishlist: boolean
  reference_number?: string | null
  reference_unverified?: boolean
  box?: string | null
  /** YYYY-MM-DD. */
  purchase_date?: string | null
  /** Sales tax / import fees paid on the purchase (count toward cost basis). */
  acq_tax_cents?: number | null
  acq_duty_cents?: number | null
}

export type CreateWatchResult = { watchId: string; photoError?: string } | { error: string }

export async function createWatchFor(
  supabase: SupabaseClient,
  userId: string,
  input: NewWatchInput,
  photo?: File | null
): Promise<CreateWatchResult> {
  const { data: watch, error } = await supabase
    .from("watches")
    .insert({
      user_id: userId,
      brand_id: input.brand_id,
      model: input.model,
      category_id: input.category_id,
      purchase_price_cents: input.purchase_price_cents,
      is_coming_soon: input.is_coming_soon,
      is_wishlist: input.is_wishlist,
      ...(input.reference_number
        ? { reference_number: input.reference_number, reference_unverified: !!input.reference_unverified }
        : {}),
      ...(input.box ? { box: input.box } : {}),
      ...(input.purchase_date ? { purchase_date: input.purchase_date } : {}),
      ...(input.acq_tax_cents ? { acq_tax_cents: input.acq_tax_cents } : {}),
      ...(input.acq_duty_cents ? { acq_duty_cents: input.acq_duty_cents } : {}),
    })
    .select("id")
    .single()
  if (error) {
    if (error.code === "23503") return { error: "That brand or category no longer exists." }
    return { error: error.message }
  }
  const watchId = (watch as { id: string }).id

  // The watch exists from here on; a photo problem is reported, not fatal.
  let photoError: string | undefined
  if (photo && photo.size > 0) {
    const stored = await storeWatchPhoto(supabase, userId, watchId, photo)
    if ("error" in stored) photoError = stored.error
  }

  await clearBrandWishlistFor(supabase, userId, input.brand_id, input.is_wishlist)
  await syncTierValuationFor(supabase, userId, watchId)

  return photoError ? { watchId, photoError } : { watchId }
}

/**
 * A brand on the wish list stops being one the moment you own a watch from
 * it. Non-fatal: the watch save already succeeded.
 */
export async function clearBrandWishlistFor(
  supabase: SupabaseClient,
  userId: string,
  brandId: string,
  watchIsWishlist: boolean
): Promise<boolean> {
  if (watchIsWishlist) return false
  const { error } = await supabase
    .from("brands")
    .update({ is_wishlist: false })
    .eq("id", brandId)
    .eq("user_id", userId)
    .eq("is_wishlist", true)
  if (error) {
    console.error("Failed to clear brand wish-list tag:", error.message)
    return false
  }
  return true
}

/** Find a brand by exact name, or create it (createBrandInline, client passed in). */
export async function ensureBrandFor(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<{ id: string } | { error: string }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: "Brand name is required." }
  const { data, error } = await supabase
    .from("brands")
    .insert({ user_id: userId, name: trimmed })
    .select("id")
    .single()
  if (!error) return { id: (data as { id: string }).id }
  if (error.code === "23505") {
    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id", userId)
      .eq("name", trimmed)
      .single()
    if (existing) return { id: (existing as { id: string }).id }
    return { error: "Brand already exists." }
  }
  return { error: error.message }
}
