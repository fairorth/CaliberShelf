import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type {
  WearLog,
  WearLogWithWatch,
  WearStats,
  WatchWithCover,
  Watch,
  WatchPhoto,
  Brand,
  Movement,
  Label,
} from "@/lib/types/watch"

// ── Helpers ────────────────────────────────────────────────────────

/** Build WearLogWithWatch[] from raw logs + watch data (with cover photos) */
async function enrichLogsWithWatches(
  logs: Array<WearLog & { watches: Watch & { brands: Brand; movements: Movement | null } }>
): Promise<WearLogWithWatch[]> {
  if (logs.length === 0) return []

  const supabase = await createClient()

  // Collect unique watch IDs
  const watchIds = [...new Set(logs.map((l) => l.watches.id))]

  // Fetch cover photos for all watches
  const { data: coverPhotos } = await supabase
    .from("watch_photos")
    .select("*")
    .in("watch_id", watchIds)
    .eq("is_cover", true)

  const coverMap = new Map<string, string>()
  if (coverPhotos) {
    for (const photo of coverPhotos as WatchPhoto[]) {
      coverMap.set(photo.watch_id, photo.storage_path)
    }
  }

  // Fetch labels for all watches
  const labelsByWatch = new Map<string, Label[]>()
  const { data: watchLabels } = await supabase
    .from("watch_labels")
    .select("watch_id, labels(*)")
    .in("watch_id", watchIds)

  if (watchLabels) {
    for (const wl of watchLabels as unknown as Array<{ watch_id: string; labels: Label }>) {
      const existing = labelsByWatch.get(wl.watch_id) ?? []
      existing.push(wl.labels)
      labelsByWatch.set(wl.watch_id, existing)
    }
  }

  // Generate signed URLs
  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = await getSignedUrls(storagePaths)

  return logs.map((log) => {
    const w = log.watches
    const coverPath = coverMap.get(w.id)
    const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null

    const watch: WatchWithCover = {
      ...w,
      cover_photo_url: coverUrl,
      brand: w.brands,
      movement: w.movements,
      labels: labelsByWatch.get(w.id) ?? [],
    }

    return {
      id: log.id,
      user_id: log.user_id,
      watch_id: log.watch_id,
      worn_date: log.worn_date,
      notes: log.notes,
      created_at: log.created_at,
      updated_at: log.updated_at,
      watch,
    }
  })
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Get wear logs for a given month (calendar view).
 */
export async function getWearLogsForMonth(
  year: number,
  month: number
): Promise<WearLogWithWatch[]> {
  const supabase = await createClient()

  // Build date range for the month (month is 1-indexed)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`

  const { data: logs, error } = await supabase
    .from("wear_logs")
    .select("*, watches(*, brands(*), movements(*))")
    .gte("worn_date", startDate)
    .lt("worn_date", endDate)
    .order("worn_date", { ascending: true })

  if (error) {
    console.error("Failed to fetch wear logs for month:", error.message)
    return []
  }

  if (!logs || logs.length === 0) return []

  return enrichLogsWithWatches(
    logs as unknown as Array<
      WearLog & { watches: Watch & { brands: Brand; movements: Movement | null } }
    >
  )
}

/**
 * Get paginated wear log history (newest first).
 */
export async function getWearLogsHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<{ logs: WearLogWithWatch[]; totalCount: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Get total count
  const { count } = await supabase
    .from("wear_logs")
    .select("*", { count: "exact", head: true })

  // Get paginated logs
  const { data: logs, error } = await supabase
    .from("wear_logs")
    .select("*, watches(*, brands(*), movements(*))")
    .order("worn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Failed to fetch wear log history:", error.message)
    return { logs: [], totalCount: 0 }
  }

  if (!logs || logs.length === 0) return { logs: [], totalCount: count ?? 0 }

  const enriched = await enrichLogsWithWatches(
    logs as unknown as Array<
      WearLog & { watches: Watch & { brands: Brand; movements: Movement | null } }
    >
  )

  return { logs: enriched, totalCount: count ?? 0 }
}

/**
 * Compute wear statistics for the current user.
 * Fetches all logs and all watches, computes everything in JS.
 */
export async function getWearStats(
  allWatches: WatchWithCover[]
): Promise<WearStats> {
  const supabase = await createClient()

  const { data: allLogs, error } = await supabase
    .from("wear_logs")
    .select("id, watch_id, worn_date")
    .order("worn_date", { ascending: false })

  if (error) {
    console.error("Failed to fetch wear stats:", error.message)
    return {
      totalThisMonth: 0,
      totalThisYear: 0,
      totalAllTime: 0,
      mostWorn: [],
      leastWorn: [],
      neverWorn: allWatches,
      currentStreak: 0,
      longestStreak: 0,
    }
  }

  const logs = (allLogs ?? []) as Array<{ id: string; watch_id: string; worn_date: string }>

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  // Basic counts
  let totalThisMonth = 0
  let totalThisYear = 0
  const totalAllTime = logs.length

  // Count per watch
  const countByWatch = new Map<string, number>()

  for (const log of logs) {
    const [y, m] = log.worn_date.split("-").map(Number)
    if (y === currentYear) totalThisYear++
    if (y === currentYear && m === currentMonth) totalThisMonth++
    countByWatch.set(log.watch_id, (countByWatch.get(log.watch_id) ?? 0) + 1)
  }

  // Build watch lookup
  const watchMap = new Map<string, WatchWithCover>()
  for (const w of allWatches) {
    watchMap.set(w.id, w)
  }

  // Most worn (top 5)
  const sortedCounts = [...countByWatch.entries()].sort((a, b) => b[1] - a[1])
  const mostWorn = sortedCounts.slice(0, 5).map(([watchId, count]) => ({
    watch: watchMap.get(watchId)!,
    count,
  })).filter((item) => item.watch !== undefined)

  // Least worn (bottom 5 with at least 1 wear)
  const leastWornSorted = sortedCounts.filter(([, c]) => c > 0).reverse()
  const leastWorn = leastWornSorted.slice(0, 5).map(([watchId, count]) => ({
    watch: watchMap.get(watchId)!,
    count,
  })).filter((item) => item.watch !== undefined)

  // Never worn
  const neverWorn = allWatches.filter((w) => !countByWatch.has(w.id))

  // Streaks: consecutive days with at least one wear
  const uniqueDates = [...new Set(logs.map((l) => l.worn_date))].sort().reverse()
  let currentStreak = 0
  let longestStreak = 0

  if (uniqueDates.length > 0) {
    // Check if streak includes today or yesterday
    const todayStr = now.toISOString().slice(0, 10)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1])
        const curr = new Date(uniqueDates[i])
        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Longest streak (scan all dates in ascending order)
    const ascending = [...uniqueDates].reverse()
    let streak = 1
    longestStreak = 1
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(ascending[i - 1])
      const curr = new Date(ascending[i])
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays === 1) {
        streak++
        longestStreak = Math.max(longestStreak, streak)
      } else {
        streak = 1
      }
    }
  }

  return {
    totalThisMonth,
    totalThisYear,
    totalAllTime,
    mostWorn,
    leastWorn,
    neverWorn,
    currentStreak,
    longestStreak,
  }
}

/**
 * Get wear count and last worn date for a specific watch.
 */
export async function getWearCountForWatch(
  watchId: string
): Promise<{ count: number; lastWorn: string | null }> {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from("wear_logs")
    .select("worn_date")
    .eq("watch_id", watchId)
    .order("worn_date", { ascending: false })

  if (error || !logs || logs.length === 0) {
    return { count: 0, lastWorn: null }
  }

  return {
    count: logs.length,
    lastWorn: (logs[0] as { worn_date: string }).worn_date,
  }
}
