import { createClient } from "@/lib/supabase/server"
import type { Movement } from "@/lib/types/watch"

/**
 * Get all movements accessible to the current user (system + own).
 * Sorted by manufacturer then caliber name.
 */
export async function getMovements(): Promise<Movement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .order("manufacturer", { ascending: true, nullsFirst: false })
    .order("caliber_name", { ascending: true })

  if (error) {
    console.error("Failed to fetch movements:", error.message)
    return []
  }

  return (data as Movement[]) ?? []
}

/**
 * Get a single movement by ID.
 */
export async function getMovementById(id: string): Promise<Movement | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data as Movement
}

/**
 * Search movements by caliber name or manufacturer.
 */
export async function searchMovements(query: string): Promise<Movement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("movements")
    .select("*")
    .or(`caliber_name.ilike.%${query}%,manufacturer.ilike.%${query}%`)
    .order("manufacturer", { ascending: true, nullsFirst: false })
    .order("caliber_name", { ascending: true })
    .limit(20)

  if (error) {
    console.error("Failed to search movements:", error.message)
    return []
  }

  return (data as Movement[]) ?? []
}
