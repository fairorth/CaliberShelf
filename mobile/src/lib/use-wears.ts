import { useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { localDateIso } from "@/lib/dates"
import type { WearFeel } from "@/lib/validations/keep"
import { deleteWear, fetchRecentWears, setWearFeel } from "./wear"
import type { WearEntry } from "./wear"

/** How far back "Recent" looks for watches to offer as one-tap wears. */
const RECENT_DAYS = 60

/**
 * The wears Today shows, refreshed every time the tab comes into focus (so a
 * wear logged from the camera or the picker shows up on return).
 */
export function useWears() {
  const [wears, setWears] = useState<WearEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setWears(await fetchRecentWears(RECENT_DAYS))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload])
  )

  /** Optimistic: the buttons answer at once; a failed write reloads the truth. */
  const changeFeel = useCallback(
    async (logId: string, feel: WearFeel | null) => {
      setWears((prev) => prev.map((w) => (w.id === logId ? { ...w, feel } : w)))
      try {
        await setWearFeel(logId, feel)
      } catch (e) {
        setError((e as Error).message)
        void reload()
      }
    },
    [reload]
  )

  const remove = useCallback(
    async (logId: string) => {
      setWears((prev) => prev.filter((w) => w.id !== logId))
      try {
        await deleteWear(logId)
      } catch (e) {
        setError((e as Error).message)
        void reload()
      }
    },
    [reload]
  )

  const byDate = useMemo(() => {
    const m = new Map<string, WearEntry[]>()
    for (const w of wears) m.set(w.date, [...(m.get(w.date) ?? []), w])
    return m
  }, [wears])

  /** Distinct watches, most recently worn first. */
  const recentWatchIds = useMemo(() => {
    const seen = new Set<string>()
    const ids: string[] = []
    for (const w of wears) {
      if (!seen.has(w.watchId)) {
        seen.add(w.watchId)
        ids.push(w.watchId)
      }
    }
    return ids
  }, [wears])

  return { wears, byDate, recentWatchIds, today: localDateIso(), loading, error, reload, changeFeel, remove }
}
