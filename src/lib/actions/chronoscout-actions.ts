"use server"

import { createClient } from "@/lib/supabase/server"

// A catalog match surfaced in the watch form's "Find in catalog" picker.
// Sourced from the ChronoScout mirror (chronoscout_watches). Dimensions map to
// the form's spec fields; everything else ChronoScout doesn't carry is left to
// the ✨ agent or manual entry.
export interface CatalogWatch {
  id: string
  name: string
  brand_name: string | null
  diameter_mm: number | null
  between_lugs_mm: number | null
  lug_to_lug_mm: number | null
  thickness_mm: number | null
  weight_g: number | null
  image_src: string | null
  chronoscout_url: string | null
}

/**
 * Search the ChronoScout catalog mirror by name. Whitespace-separated terms are
 * AND-ed against the model name (which embeds the brand), so "christopher
 * trident" narrows correctly. Read-only; RLS lets any authenticated user read
 * the shared mirror. Returns up to `limit` matches, or [] for a too-short query.
 */
export async function searchCatalogWatches(
  rawQuery: string,
  limit = 12
): Promise<CatalogWatch[]> {
  const q = rawQuery.trim()
  if (q.length < 2) return []

  const supabase = await createClient()

  // Only signed-in users hit the mirror.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const terms = q.split(/\s+/).filter((t) => t.length >= 2).slice(0, 6)
  if (terms.length === 0) return []

  let query = supabase
    .from("chronoscout_watches")
    .select(
      "id, name, brand_name, diameter_mm, between_lugs_mm, lug_to_lug_mm, thickness_mm, weight_g, image_src, chronoscout_url"
    )
  // Each term must appear in the name (trigram GIN index backs the ILIKE).
  for (const term of terms) {
    query = query.ilike("name", `%${term}%`)
  }

  const { data, error } = await query
    .order("name", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 25))

  if (error) {
    console.error("Catalog search failed:", error.message)
    return []
  }
  return (data as CatalogWatch[]) ?? []
}
