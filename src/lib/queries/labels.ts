import { createClient } from "@/lib/supabase/server"
import type { Label } from "@/lib/types/watch"

/**
 * Get all labels for the current user, sorted by name.
 */
export async function getLabels(): Promise<Label[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Failed to fetch labels:", error.message)
    return []
  }

  return (data as Label[]) ?? []
}

/**
 * Get all labels for a specific watch via the junction table.
 */
export async function getLabelsForWatch(watchId: string): Promise<Label[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watch_labels")
    .select("labels(*)")
    .eq("watch_id", watchId)

  if (error) {
    console.error("Failed to fetch labels for watch:", error.message)
    return []
  }

  return (data ?? []).map((row) => (row as unknown as { labels: Label }).labels)
}
