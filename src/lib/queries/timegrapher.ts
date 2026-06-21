import { createClient } from "@/lib/supabase/server"
import type { TimegrapherRun } from "@/lib/types/watch"

/**
 * Get all timegrapher runs for a watch, newest first.
 * RLS restricts results to the owning user.
 */
export async function getTimegrapherRuns(
  watchId: string
): Promise<TimegrapherRun[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("timegrapher_runs")
    .select("*")
    .eq("watch_id", watchId)
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch timegrapher runs:", error.message)
    return []
  }

  return (data ?? []) as TimegrapherRun[]
}
