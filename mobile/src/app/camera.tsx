import * as Haptics from "expo-haptics"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Alert } from "react-native"
import { useApp } from "../lib/app-context"
import { casebackRunPosition } from "../lib/caseback-run"
import { getShowMode } from "../lib/show-mode"
import { logWear } from "../lib/wear"
import { CameraScreen } from "../screens/camera-screen"
import type { CameraMode } from "../screens/camera-screen"

/**
 * /camera?mode=identify[&intent=wear] — "which watch is this?" (intent=wear
 *   when opened from Today: "Wearing it" leads).
 * /camera?watchId=…                  — shoot frames for that watch.
 * /camera?mode=admired               — Show mode: admired watches + placards.
 * /camera?watchId=…&run=caseback     — the caseback run (Rate tab): Caseback
 *   preselected, "Next" walks to the next watch missing one.
 * Full-screen over the tabs; Done returns to wherever you came from.
 */
export default function CameraRoute() {
  const { watchId, intent, mode: modeParam, run: runParam } = useLocalSearchParams<{
    mode?: string
    watchId?: string
    intent?: string
    run?: string
  }>()
  const { watches, reloadWatches } = useApp()

  const watch = watchId ? watches?.find((w) => w.id === watchId) : undefined
  const mode: CameraMode = watch
    ? { kind: "capture", watch }
    : modeParam === "admired"
      ? { kind: "admired", event: getShowMode().event }
      : { kind: "identify" }
  const runAt = runParam === "caseback" && watch ? casebackRunPosition(watch.id) : null
  const close = () => {
    void reloadWatches() // new covers show up in the grids
    router.back()
  }

  return (
    <>
      <StatusBar style="light" />
      <CameraScreen
        // A new mode is a fresh screen: identify → capture must not carry
        // over the strip or the result sheet.
        key={mode.kind === "capture" ? mode.watch.id : mode.kind}
        mode={mode}
        watches={watches ?? []}
        intent={intent === "wear" ? "wear" : undefined}
        initialAngle={runAt ? "caseback" : undefined}
        run={
          runAt
            ? {
                label: `Caseback run · ${runAt.index + 1} of ${runAt.total}`,
                nextLabel: runAt.nextId ? "Next →" : "Finish",
                onNext: () => (runAt.nextId ? router.setParams({ watchId: runAt.nextId }) : close()),
              }
            : undefined
        }
        onClose={close}
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
