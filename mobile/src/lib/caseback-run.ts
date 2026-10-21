import { supabase } from "./supabase"

/**
 * The caseback run (Rate tab): every owned watch with no Caseback-tagged
 * photo, shot one after another with the Caseback angle already chosen — so
 * Rate My Watches can show front AND back. The list lives in memory for the
 * run; the camera route walks it with router.setParams.
 */

let queue: string[] = []

export function startCasebackRun(ids: string[]) {
  queue = [...ids]
}

/** This watch's place in the run, or null when it isn't part of one. */
export function casebackRunPosition(watchId: string): { index: number; total: number; nextId: string | null } | null {
  const index = queue.indexOf(watchId)
  if (index < 0) return null
  return { index, total: queue.length, nextId: queue[index + 1] ?? null }
}

/** Of these watches, the ones with no photo tagged Caseback. */
export async function watchesMissingCaseback(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from("watch_photos").select("watch_id").eq("angle", "caseback").in("watch_id", ids)
  if (error) throw new Error(error.message)
  const have = new Set(((data ?? []) as Array<{ watch_id: string }>).map((r) => r.watch_id))
  return ids.filter((id) => !have.has(id))
}
