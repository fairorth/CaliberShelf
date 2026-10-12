import type { Session } from "@supabase/supabase-js"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { isLockEnabled, RELOCK_AFTER_MS, unlock } from "./src/lib/app-lock"
import { supabase } from "./src/lib/supabase"
import { useAppUpdate } from "./src/lib/use-app-update"
import { fetchWatches } from "./src/lib/watches"
import type { PhoneWatch } from "./src/lib/watches"
import { CameraScreen } from "./src/screens/camera-screen"
import type { CameraMode } from "./src/screens/camera-screen"
import { SettingsSheet } from "./src/screens/settings-sheet"
import { SignIn } from "./src/screens/sign-in"
import { WatchPicker } from "./src/screens/watch-picker"
import { color, radius, text, TOUCH } from "./src/theme"

/**
 * TenTen — CAMERA TRIAL build (docs/iphone-app.md §19). A handful of screens
 * and no router on purpose: the trial answers one question (does a real
 * camera beat the iOS camera sheet?) before v1 earns its tabs and Expo Router.
 */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [watches, setWatches] = useState<PhoneWatch[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [camera, setCamera] = useState<CameraMode | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const update = useAppUpdate()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Face ID lock (optional, Settings): on launch, and on return after more
  // than a minute away. A quick app switch doesn't re-prompt.
  const backgroundedAt = useRef<number | null>(null)
  useEffect(() => {
    void isLockEnabled().then((on) => {
      if (on) setLocked(true)
    })
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") backgroundedAt.current = Date.now()
      if (state === "active" && backgroundedAt.current != null) {
        const away = Date.now() - backgroundedAt.current
        backgroundedAt.current = null
        if (away > RELOCK_AFTER_MS) {
          void isLockEnabled().then((on) => {
            if (on) setLocked(true)
          })
        }
      }
    })
    return () => sub.remove()
  }, [])

  const tryUnlock = useCallback(async () => {
    if (await unlock()) setLocked(false)
  }, [])
  const lockActive = locked && !!session
  useEffect(() => {
    if (lockActive) void tryUnlock()
  }, [lockActive, tryUnlock])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWatches(await fetchWatches())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (userId) void load()
    else setWatches(null)
  }, [userId, load])

  let screen: React.ReactNode
  if (session === undefined) {
    screen = (
      <View style={styles.boot}>
        <ActivityIndicator color={color.brass} />
      </View>
    )
  } else if (!session) {
    screen = <SignIn />
  } else if (lockActive) {
    screen = (
      <View style={styles.boot}>
        <Text style={styles.lockTitle}>TenTen is locked</Text>
        <Pressable style={styles.lockButton} onPress={() => void tryUnlock()}>
          <Text style={styles.lockButtonText}>Unlock with Face ID</Text>
        </Pressable>
      </View>
    )
  } else if (camera) {
    screen = (
      <CameraScreen
        // A new mode is a fresh screen: identify → capture must not carry
        // over the strip or the result sheet.
        key={camera.kind === "capture" ? camera.watch.id : "identify"}
        mode={camera}
        watches={watches ?? []}
        onClose={() => {
          setCamera(null)
          void load() // new covers show up in the grid
        }}
        onSwitchToCapture={(w) => setCamera({ kind: "capture", watch: w })}
      />
    )
  } else {
    screen = (
      <WatchPicker
        watches={watches}
        loading={loading}
        error={error}
        onRefresh={() => void load()}
        onPick={(w) => setCamera({ kind: "capture", watch: w })}
        onIdentify={() => setCamera({ kind: "identify" })}
        onSettings={() => setSettingsOpen(true)}
        updateReady={update.state === "ready"}
        onRestart={update.restart}
      />
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={camera && !lockActive ? "light" : "dark"} />
      {screen}
      {session && (
        <SettingsSheet
          visible={settingsOpen}
          email={session.user.email ?? ""}
          update={update}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: color.background,
  },
  lockTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  lockButton: {
    minHeight: TOUCH,
    paddingHorizontal: 20,
    borderRadius: radius.control,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
  },
  lockButtonText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
