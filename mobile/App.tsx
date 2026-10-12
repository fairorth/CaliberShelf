import type { Session } from "@supabase/supabase-js"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { supabase } from "./src/lib/supabase"
import { fetchWatches } from "./src/lib/watches"
import type { PhoneWatch } from "./src/lib/watches"
import { CameraScreen } from "./src/screens/camera-screen"
import type { CameraMode } from "./src/screens/camera-screen"
import { SignIn } from "./src/screens/sign-in"
import { WatchPicker } from "./src/screens/watch-picker"
import { color } from "./src/theme"

/**
 * TenTen — CAMERA TRIAL build (docs/iphone-app.md §19). Three screens and no
 * router on purpose: the trial answers one question (does a real camera beat
 * the iOS camera sheet?) before v1 earns its navigation, tabs and Expo Router.
 */
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [watches, setWatches] = useState<PhoneWatch[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [camera, setCamera] = useState<CameraMode | null>(null)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

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
      />
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={camera ? "light" : "dark"} />
      {screen}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.background },
})
