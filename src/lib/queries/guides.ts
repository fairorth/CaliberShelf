import { createClient } from "@/lib/supabase/server"
import type {
  CollectionGuide,
  GuideEntry,
  GuideEntryWatchRef,
  GuideEntryWithWatch,
  GuideWithStats,
} from "@/lib/types/guide"
import { guideEntryStatus } from "@/lib/types/guide"

type RawEntry = GuideEntry & { watch: GuideEntryWatchRef | null }

const ENTRY_SELECT =
  "*, watch:watches(id, model, nickname, is_wishlist, is_coming_soon, purchase_price_cents)"

/** All guides with entry/owned counts, newest first. */
export async function getGuides(): Promise<GuideWithStats[]> {
  const supabase = await createClient()

  const { data: guides, error } = await supabase
    .from("collection_guides")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to fetch guides:", error.message)
    return []
  }
  const rows = (guides as CollectionGuide[]) ?? []
  if (rows.length === 0) return []

  const { data: entries } = await supabase
    .from("guide_entries")
    .select(ENTRY_SELECT)
    .in("guide_id", rows.map((g) => g.id))

  const byGuide = new Map<string, GuideEntryWithWatch[]>()
  for (const e of (entries as unknown as RawEntry[]) ?? []) {
    const list = byGuide.get(e.guide_id) ?? []
    list.push(e)
    byGuide.set(e.guide_id, list)
  }

  return rows.map((g) => {
    const list = byGuide.get(g.id) ?? []
    return {
      ...g,
      entry_count: list.length,
      owned_count: list.filter((e) => guideEntryStatus(e) === "owned").length,
    }
  })
}

/** One guide with its entries (linked watches joined), ordered by position. */
export async function getGuideById(
  id: string
): Promise<{ guide: CollectionGuide; entries: GuideEntryWithWatch[] } | null> {
  const supabase = await createClient()

  const { data: guide, error } = await supabase
    .from("collection_guides")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !guide) return null

  const { data: entries } = await supabase
    .from("guide_entries")
    .select(ENTRY_SELECT)
    .eq("guide_id", id)
    .order("position", { ascending: true })

  return {
    guide: guide as CollectionGuide,
    entries: ((entries as unknown as RawEntry[]) ?? []).map((e) => ({ ...e })),
  }
}

/** Map of watch_id → guide name, for badging watches that belong to a guide.
 *  A watch in multiple guides shows the first guide's name (rare by design). */
export async function getGuideMembership(): Promise<Record<string, string>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("guide_entries")
    .select("watch_id, collection_guides(name)")
    .not("watch_id", "is", null)

  if (error) {
    console.error("Failed to fetch guide membership:", error.message)
    return {}
  }

  const membership: Record<string, string> = {}
  for (const row of (data as unknown as Array<{
    watch_id: string
    collection_guides: { name: string } | null
  }>) ?? []) {
    if (row.watch_id && row.collection_guides?.name && !membership[row.watch_id]) {
      membership[row.watch_id] = row.collection_guides.name
    }
  }
  return membership
}
