import { createClient } from "@/lib/supabase/server"
import type { Movement } from "@/lib/types/watch"

/**
 * Get all movements for the current user.
 * Sorted by caliber name.
 */
export async function getMovements(): Promise<Movement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("movements")
    .select("*")
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
