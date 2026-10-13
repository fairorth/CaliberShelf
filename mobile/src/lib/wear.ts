import { localDateIso } from "@/lib/dates"
import type { WearFeel } from "@/lib/validations/keep"
import { supabase } from "./supabase"

/**
 * Wear logging from the phone — straight to Supabase as the signed-in user
 * (RLS), the same wear_logs rows the web's Wear Log reads. Every date is the
 * PHONE'S local day (lib/dates.ts) — never the server's, which is UTC.
 */
export interface WearEntry {
  id: string
  watchId: string
  /** YYYY-MM-DD, local. */
  date: string
  feel: WearFeel | null
}

/** The last `days` days of wears, newest first. */
export async function fetchRecentWears(days: number): Promise<WearEntry[]> {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  const { data, error } = await supabase
    .from("wear_logs")
    .select("id, watch_id, worn_date, feel, created_at")
    .gte("worn_date", localDateIso(since))
    .order("worn_date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => {
    const row = r as { id: string; watch_id: string; worn_date: string; feel: WearFeel | null }
    return { id: row.id, watchId: row.watch_id, date: row.worn_date, feel: row.feel }
  })
}

/** Log a wear; returns the new row. Logging the same watch twice on one day
 *  is refused here — the web allows it, but on the phone it is a double tap. */
export async function logWear(
  watchId: string,
  date: string = localDateIso(),
  feel: WearFeel | null = null
): Promise<WearEntry> {
  const { data: existing } = await supabase
    .from("wear_logs")
    .select("id, feel")
    .eq("watch_id", watchId)
    .eq("worn_date", date)
    .limit(1)
    .maybeSingle()
  if (existing) {
    const row = existing as { id: string; feel: WearFeel | null }
    return { id: row.id, watchId, date, feel: row.feel }
  }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("You're signed out — sign in again.")
  const { data, error } = await supabase
    .from("wear_logs")
    .insert({ user_id: auth.user.id, watch_id: watchId, worn_date: date, feel })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  return { id: (data as { id: string }).id, watchId, date, feel }
}

/** How it felt (00054) — the wear signal The Edit uses. null clears it. */
export async function setWearFeel(logId: string, feel: WearFeel | null): Promise<void> {
  const { error } = await supabase.from("wear_logs").update({ feel }).eq("id", logId)
  if (error) throw new Error(error.message)
}

export async function deleteWear(logId: string): Promise<void> {
  const { error } = await supabase.from("wear_logs").delete().eq("id", logId)
  if (error) throw new Error(error.message)
}

/** The last 7 local days, today first. */
export function lastSevenDays(today: Date = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    return localDateIso(d)
  })
}

/** "Today", "Yesterday", or the weekday ("Thu"). */
export function dayLabel(iso: string, today: string = localDateIso()): string {
  if (iso === today) return "Today"
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (iso === localDateIso(y)) return "Yesterday"
  const [yy, mm, dd] = iso.split("-").map(Number)
  return new Date(yy, mm - 1, dd).toLocaleDateString(undefined, { weekday: "short" })
}
