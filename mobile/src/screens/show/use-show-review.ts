import { useFocusEffect } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as admiredQueue from "../../lib/admired-queue"
import { fetchServerSnapshot, mergeVendors } from "../../lib/show-data"
import type { ReviewVendor, ServerSnapshot } from "../../lib/show-data"
import { useShowSession, vendorsFor } from "../../lib/show-session"

/**
 * The review screens' data: the server's snapshot merged with the phone's
 * show session. Re-merged on every local change (a frame shot, moved,
 * deleted — instant, no network); re-fetched on focus, on pull-to-refresh,
 * and whenever the upload queue empties (the server now has what it lacked).
 */
export function useShowReview(event: string): {
  vendors: ReviewVendor[]
  offline: boolean
  loading: boolean
  refresh: () => Promise<void>
} {
  const session = useShowSession()
  const [snapshot, setSnapshot] = useState<ServerSnapshot | null>(null)
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [queueTick, setQueueTick] = useState(0)
  const wasIdle = useRef(admiredQueue.isIdle())

  const refresh = useCallback(async () => {
    setLoading(true)
    const snap = await fetchServerSnapshot(event)
    setSnapshot(snap)
    setFetched(true)
    setLoading(false)
  }, [event])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(
    () =>
      admiredQueue.subscribe(() => {
        setQueueTick((t) => t + 1)
        const idle = admiredQueue.isIdle()
        if (idle && !wasIdle.current) void refresh()
        wasIdle.current = idle
      }),
    [refresh]
  )

  const vendors = useMemo(
    () => mergeVendors(event, vendorsFor(session, event), snapshot?.rows ?? null, snapshot?.thumbs ?? new Map()),
    // queueTick: pending flags and queued deletes change without the session changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, session, snapshot, queueTick]
  )

  return { vendors, offline: fetched && snapshot === null, loading: loading && !fetched, refresh }
}
