import { createClient } from "@/lib/supabase/server"
import { boxOptions } from "@/lib/boxes"
import { getBoxConfig } from "./box-config"

/** One row of the Boxes flyout and the Display Case (Phase 8 §7, §8). */
export interface BoxSummary {
  /** The numbered label exactly as `watches.box` stores it: "Box3". */
  label: string
  /** From the user's box_config, or null when the box is undescribed. */
  description: string | null
  /** Live count of UNSOLD watches in this box — sold ones are history. */
  count: number
}

/**
 * Every configured box, in order, each with its live unsold count.
 *
 * Boxes with zero watches are still returned: the list is the user's storage
 * map, and a box missing from it is more confusing than an empty one.
 *
 * A label that is not in the configured range but still has watches on it is
 * appended after the configured ones. `watches.box` is free text and the
 * configured count can be lowered after the fact, so without this a watch
 * could sit in a box that no list ever shows.
 */
export async function getBoxSummaries(): Promise<BoxSummary[]> {
  const supabase = await createClient()
  const [config, watchesRes] = await Promise.all([
    getBoxConfig(),
    supabase.from("watches").select("box, sale_status").not("box", "is", null),
  ])

  const counts = new Map<string, number>()
  for (const row of (watchesRes.data ?? []) as Array<{
    box: string | null
    sale_status: string
  }>) {
    if (!row.box || row.sale_status === "sold") continue
    counts.set(row.box, (counts.get(row.box) ?? 0) + 1)
  }

  const configured = boxOptions(config.count)
  const summaries: BoxSummary[] = configured.map((label) => ({
    label,
    description: config.descriptions[label] ?? null,
    count: counts.get(label) ?? 0,
  }))

  const known = new Set(configured)
  for (const [label, count] of counts) {
    if (known.has(label)) continue
    summaries.push({
      label,
      description: config.descriptions[label] ?? null,
      count,
    })
  }

  return summaries
}
