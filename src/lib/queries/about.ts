import { createClient } from "@/lib/supabase/server"

/**
 * The live counts behind the About page's "By the numbers" band. Head-only
 * counts — no rows come back — so the showcase page stays cheap.
 *
 * Never throws: a table that is missing or refuses (an older database, a
 * transient error) counts as 0, and the page hides a zero tile rather than
 * printing it.
 */
export interface AboutCounts {
  photos: number
  wears: number
  /** Friends who have played Rate My Watches — the owner is the yardstick, not a guest. */
  friendRaters: number
  /** Every duel pick ever made, by anyone. */
  duelPicks: number
  admiredWatches: number
  showVendors: number
  /** Distinct named events the Admired watches were seen at. */
  shows: number
}

export async function getAboutCounts(): Promise<AboutCounts> {
  const supabase = await createClient()
  const head = { count: "exact" as const, head: true }

  const [photos, wears, friends, picks, admired, vendors, events] = await Promise.all([
    supabase.from("watch_photos").select("id", head),
    supabase.from("wear_logs").select("id", head),
    supabase.from("raters").select("id", head).eq("is_owner", false),
    supabase.from("rating_picks").select("id", head),
    supabase.from("admired_watches").select("id", head),
    supabase.from("admired_vendors").select("id", head),
    supabase.from("admired_watches").select("event").not("event", "is", null),
  ])

  const eventNames = new Set(
    ((events.data ?? []) as { event: string | null }[])
      .map((r) => r.event?.trim())
      .filter((e): e is string => Boolean(e))
  )

  return {
    photos: photos.count ?? 0,
    wears: wears.count ?? 0,
    friendRaters: friends.count ?? 0,
    duelPicks: picks.count ?? 0,
    admiredWatches: admired.count ?? 0,
    showVendors: vendors.count ?? 0,
    shows: eventNames.size,
  }
}
