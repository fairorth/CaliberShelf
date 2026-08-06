import { createClient } from "@/lib/supabase/server"

// Read-side helpers over the ChronoScout catalog mirror (migration 00027).
// The mirror is a shared, authenticated-read reference set — no user_id.
// Licensing: surface this data in-app only, with ChronoScout attribution.

export interface ChronoscoutBrand {
  id: string
  name: string
  domain: string | null
  chronoscout_url: string | null
  logo_src: string | null
  case_sizes_mm: number[] | null
  movement_types: string[] | null
  styles: string[] | null
  price_min_cents: number | null
  price_max_cents: number | null
  most_recent_watch_added_at: string | null
}

export interface ChronoscoutModel {
  id: string
  name: string
  chronoscout_url: string | null
  image_src: string | null
  diameter_mm: number | null
  thickness_mm: number | null
  lug_to_lug_mm: number | null
}

/**
 * Find the ChronoScout catalog brand matching one of the user's brands, by
 * case-insensitive exact name (trigram index backs the ilike). Returns null
 * when the catalog doesn't carry the brand.
 */
export async function getChronoscoutBrandByName(
  name: string
): Promise<ChronoscoutBrand | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("chronoscout_brands")
    .select(
      "id, name, domain, chronoscout_url, logo_src, case_sizes_mm, movement_types, styles, price_min_cents, price_max_cents, most_recent_watch_added_at"
    )
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("ChronoScout brand lookup failed:", error.message)
    return null
  }
  return (data as ChronoscoutBrand | null) ?? null
}

/**
 * All catalog models for a ChronoScout brand (dimensions for fit ranking),
 * plus the exact total model count. Capped fetch — ranking happens in JS.
 */
export async function getChronoscoutModelsForBrand(
  chronoscoutBrandId: string,
  limit = 200
): Promise<{ models: ChronoscoutModel[]; totalCount: number }> {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("chronoscout_watches")
    .select(
      "id, name, chronoscout_url, image_src, diameter_mm, thickness_mm, lug_to_lug_mm",
      { count: "exact" }
    )
    .eq("brand_id", chronoscoutBrandId)
    .order("name", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("ChronoScout model fetch failed:", error.message)
    return { models: [], totalCount: 0 }
  }
  return { models: (data as ChronoscoutModel[]) ?? [], totalCount: count ?? 0 }
}
