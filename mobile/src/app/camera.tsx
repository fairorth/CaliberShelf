import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useApp } from "../lib/app-context"
import { CameraScreen } from "../screens/camera-screen"
import type { CameraMode } from "../screens/camera-screen"

/**
 * /camera?mode=identify — "which watch is this?"
 * /camera?watchId=…   — shoot frames for that watch.
 * Full-screen over the tabs; Done returns to wherever you came from.
 */
export default function CameraRoute() {
  const { watchId } = useLocalSearchParams<{ mode?: string; watchId?: string }>()
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
        onClose={() => {
          void reloadWatches() // new covers show up in the grids
          router.back()
        }}
        onSwitchToCapture={(w) => router.setParams({ mode: "capture", watchId: w.id })}
      />
    </>
  )
}
