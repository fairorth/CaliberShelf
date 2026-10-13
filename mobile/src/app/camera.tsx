import * as Haptics from "expo-haptics"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Alert } from "react-native"
import { useApp } from "../lib/app-context"
import { logWear } from "../lib/wear"
import { CameraScreen } from "../screens/camera-screen"
import type { CameraMode } from "../screens/camera-screen"

/**
 * /camera?mode=identify[&intent=wear] — "which watch is this?" (intent=wear
 *   when opened from Today: "Wearing it" leads).
 * /camera?watchId=…                  — shoot frames for that watch.
 * Full-screen over the tabs; Done returns to wherever you came from.
 */
export default function CameraRoute() {
  const { watchId, intent } = useLocalSearchParams<{ mode?: string; watchId?: string; intent?: string }>()
  const { watches, reloadWatches } = useApp()

  const watch = watchId ? watches?.find((w) => w.id === watchId) : undefined
  const mode: CameraMode = watch ? { kind: "capture", watch } : { kind: "identify" }

  return (
    <>
      <StatusBar style="light" />
      <CameraScreen
        // A new mode is a fresh screen: identify → capture must not carry
        // over the strip or the result sheet.
        key={mode.kind === "capture" ? mode.watch.id : "identify"}
        mode={mode}
        watches={watches ?? []}
        intent={intent === "wear" ? "wear" : undefined}
        onClose={() => {
          void reloadWatches() // new covers show up in the grids
          router.back()
        }}
        onSwitchToCapture={(w) => router.setParams({ mode: "capture", watchId: w.id })}
        onWearing={(w) => {
          void (async () => {
            try {
              await logWear(w.id)
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              // Back to wherever the camera was opened from; Today refreshes on focus.
              router.dismissTo("/")
            } catch (e) {
              Alert.alert("Couldn't log that wear", (e as Error).message)
            }
          })()
        }}
        onAdd={({ photoUri, guess, ownership }) =>
          router.replace({
            pathname: "/add",
            params: {
              photoUri,
              ownership,
              ...(guess?.brand ? { brand: guess.brand } : {}),
              ...(guess?.model ? { model: guess.model } : {}),
              ...(guess?.reference_number ? { reference: guess.reference_number } : {}),
            },
          })
        }
      />
    </>
  )
}
