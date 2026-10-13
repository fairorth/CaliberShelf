import { boxOptions, normalizeBoxConfig } from "@/lib/boxes"
import { supabase } from "./supabase"

/** The lists the Add form chooses from, read as the user (RLS). */
export interface AddFormData {
  brands: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  /** "Box1".."BoxN" from Config → Boxes, with their descriptions. */
  boxes: Array<{ label: string; description: string | null }>
}

export async function fetchAddFormData(): Promise<AddFormData> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  const [brands, categories, profile] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    userId
      ? supabase.from("profiles").select("box_config").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (brands.error) throw new Error(brands.error.message)
  if (categories.error) throw new Error(categories.error.message)

  const config = normalizeBoxConfig((profile.data as { box_config?: unknown } | null)?.box_config ?? null)
  return {
    brands: (brands.data ?? []) as Array<{ id: string; name: string }>,
    categories: (categories.data ?? []) as Array<{ id: string; name: string }>,
    boxes: boxOptions(config.count).map((label) => ({
      label,
      description: config.descriptions[label] ?? null,
    })),
  }
}

/** Case-insensitive brand match for an Identify guess ("TUDOR" → Tudor). */
export function matchBrand(
  brands: AddFormData["brands"],
  guess: string | null | undefined
): { id: string; name: string } | null {
  if (!guess) return null
  const g = guess.trim().toLowerCase()
  return brands.find((b) => b.name.toLowerCase() === g) ?? null
}
