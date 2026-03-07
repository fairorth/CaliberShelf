import { createClient } from "@/lib/supabase/server"
import type { Brand } from "@/lib/types/watch"

/**
 * Get all brands for the current user, sorted alphabetically.
 */
export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Failed to fetch brands:", error.message)
    return []
  }

  return (data as Brand[]) ?? []
}

/**
 * Get a single brand by ID.
 */
export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data as Brand
}
