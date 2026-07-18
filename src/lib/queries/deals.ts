import { createClient } from "@/lib/supabase/server"
import type { Brand, Watch, WishlistDeal } from "@/lib/types/watch"

export interface DealListing {
  watch: Watch & { brands: Brand | null }
  deal: WishlistDeal | null
}

/**
 * All wish-list watches with their current deal-scanner row (if any).
 * One deal row per watch (unique constraint); PostgREST may return the
 * to-one embed as an object or a one-element array — handle both.
 */
export async function getWishlistDeals(): Promise<DealListing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watches")
    .select("*, brands(*), wishlist_deals(*)")
    .eq("is_wishlist", true)
    .order("model", { ascending: true })

  if (error) {
    console.error("Failed to fetch wishlist deals:", error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as Watch & {
      brands: Brand | null
      wishlist_deals: WishlistDeal[] | WishlistDeal | null
    }
    const deal = Array.isArray(r.wishlist_deals)
      ? (r.wishlist_deals[0] ?? null)
      : r.wishlist_deals
    return { watch: r, deal }
  })
}
