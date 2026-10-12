import type { Session } from "@supabase/supabase-js"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { AppState } from "react-native"
import { isLockEnabled, RELOCK_AFTER_MS, unlock } from "./app-lock"
import { supabase } from "./supabase"
import { useAppUpdate } from "./use-app-update"
import { fetchWatches } from "./watches"
import type { PhoneWatch } from "./watches"

/**
 * App-wide state every screen shares: the signed-in session, the collection
 * (fetched once, refreshed on demand), the over-the-air update, and the
 * optional Face ID lock.
 */
interface AppState_ {
  /** undefined while the stored session is being read. */
  session: Session | null | undefined
  watches: PhoneWatch[] | null
  watchesLoading: boolean
  watchesError: string | null
  reloadWatches: () => Promise<void>
  update: ReturnType<typeof useAppUpdate>
  locked: boolean
  tryUnlock: () => Promise<void>
}

const AppContext = createContext<AppState_ | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [watches, setWatches] = useState<PhoneWatch[] | null>(null)
  const [watchesLoading, setWatchesLoading] = useState(false)
  const [watchesError, setWatchesError] = useState<string | null>(null)
  const [lockRequested, setLockRequested] = useState(false)
  const update = useAppUpdate()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const reloadWatches = useCallback(async () => {
    setWatchesLoading(true)
    setWatchesError(null)
    try {
      setWatches(await fetchWatches())
    } catch (e) {
      setWatchesError((e as Error).message)
    } finally {
      setWatchesLoading(false)
    }
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (userId) void reloadWatches()
    else setWatches(null)
  }, [userId, reloadWatches])

  // Face ID lock (optional, More → Settings): on launch, and on return after
  // more than a minute away. A quick app switch doesn't re-prompt.
  const backgroundedAt = useRef<number | null>(null)
  useEffect(() => {
    void isLockEnabled().then((on) => {
      if (on) setLockRequested(true)
    })
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") backgroundedAt.current = Date.now()
      if (state === "active" && backgroundedAt.current != null) {
        const away = Date.now() - backgroundedAt.current
        backgroundedAt.current = null
        if (away > RELOCK_AFTER_MS) {
          void isLockEnabled().then((on) => {
            if (on) setLockRequested(true)
          })
        }
      }
    })
    return () => sub.remove()
  }, [])

  const tryUnlock = useCallback(async () => {
    if (await unlock()) setLockRequested(false)
  }, [])
  const locked = lockRequested && !!session
  useEffect(() => {
    if (locked) void tryUnlock()
  }, [locked, tryUnlock])

  const value = useMemo<AppState_>(
    () => ({ session, watches, watchesLoading, watchesError, reloadWatches, update, locked, tryUnlock }),
    [session, watches, watchesLoading, watchesError, reloadWatches, update, locked, tryUnlock]
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState_ {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>")
  return ctx
}
