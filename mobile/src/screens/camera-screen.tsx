import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  usePhotoOutput,
} from "react-native-vision-camera"
import type { Frame } from "react-native-vision-camera"
import { scheduleOnRN } from "react-native-worklets"
import { centreSharpness, nextFocusState } from "../lib/focus"
import type { FocusState } from "../lib/focus"
import { ANGLE_LABELS, PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"
import type { IdentifyResponse } from "@/lib/validations/identify"
import { deletePhoto, identify, uploadPhoto } from "../lib/api"
import { fileUri, prepareFrame } from "../lib/images"
import type { PhoneWatch } from "../lib/watches"
import { color, radius, text, TOUCH } from "../theme"

export type CameraMode = { kind: "capture"; watch: PhoneWatch } | { kind: "identify" }

interface CameraScreenProps {
  mode: CameraMode
  /** For naming identify matches. */
  watches: PhoneWatch[]
  onClose: () => void
  /** Identify → "Shoot this watch" switches to capture for that watch. */
  onSwitchToCapture: (watch: PhoneWatch) => void
}

type FrameStatus = "uploading" | "done" | "error" | "removed"
interface StripFrame {
  localId: string
  uri: string
  angle: PhotoAngle | null
  status: FrameStatus
  photoId?: string
  error?: string
  /** The dial read soft at the instant of the shutter — retake candidate. */
  soft: boolean
}

/** Upload size: matches the web's Quick Capture and Review's Accept. */
const UPLOAD_LONG_EDGE = 2000
/** Identify needs far less — keeps the request small and fast. */
const IDENTIFY_LONG_EDGE = 1024

/**
 * The sharpness meter's frame size. MODULE-LEVEL ON PURPOSE: useFrameOutput
 * rebuilds its output whenever `targetResolution` changes identity, and a new
 * output makes VisionCamera reconfigure the whole session. Written inline it
 * was a new object on every render — and the meter re-renders ~5×/s — so the
 * preview froze and jumped every time the number updated (build 3). Every
 * object passed to a VisionCamera hook must be stable.
 */
const FRAME_RESOLUTION = { width: 640, height: 480 }

let frameCounter = 0

/**
 * The camera trial (docs/iphone-app.md §19): a real viewfinder with lens
 * stops (the triple camera switches to its macro lens on its own when you
 * get close), tap-to-focus, shoot-after-shoot with each frame tagged to a
 * Photo Lab angle and uploading behind you, and Identify from the same
 * viewfinder.
 */
export function CameraScreen({ mode, watches, onClose, onSwitchToCapture }: CameraScreenProps) {
  const insets = useSafeAreaInsets()
  const permission = useCameraPermission()
  // Ask for all three back lenses: iOS then gives the virtual "triple"
  // camera, which hands over to the ultra-wide for close focus (macro).
  const device = useCameraDevice("back", {
    physicalDevices: ["ultra-wide-angle", "wide-angle", "telephoto"],
  })
  const photoOutput = usePhotoOutput({
    containerFormat: "jpeg",
    quality: 0.92,
    qualityPrioritization: "quality",
  })

  // Live dial sharpness (build 3). The frame thread measures every preview
  // frame; the screen re-renders at most ~5×/s. If the session can't run
  // the extra stream, the camera's onError turns it off rather than leaving
  // a dead viewfinder.
  const [sharpnessOn, setSharpnessOn] = useState(true)
  const [sharpness, setSharpness] = useState<number | null>(null)
  const [focusState, setFocusState] = useState<FocusState>("unknown")
  // The latest ring state, readable at the shutter without waiting for a render.
  const focusRef = useRef<FocusState>("unknown")
  const lastShown = useRef(0)
  const reportSharpness = useCallback((value: number) => {
    // The ring state follows every reading (it's cheap and decides the
    // shutter's soft flag); the number on screen re-renders at most ~5×/s.
    const next = nextFocusState(focusRef.current, value)
    if (next !== focusRef.current) {
      focusRef.current = next
      setFocusState(next)
    }
    const now = Date.now()
    if (now - lastShown.current < 200) return
    lastShown.current = now
    setSharpness(value)
  }, [])
  const onFrame = useCallback(
    (frame: Frame) => {
      "worklet"
      try {
        const v = centreSharpness(frame)
        if (v != null) scheduleOnRN(reportSharpness, v)
      } finally {
        frame.dispose()
      }
    },
    [reportSharpness]
  )
  const frameOutput = useFrameOutput({
    targetResolution: FRAME_RESOLUTION,
    pixelFormat: "yuv",
    onFrame,
  })

  const [appActive, setAppActive] = useState(AppState.currentState === "active")
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setAppActive(s === "active"))
    return () => sub.remove()
  }, [])

  // Lens stops, in the camera app's own terms: 0.5× · 1× · 2×/3×/5×.
  const { stops, base } = useMemo(() => lensStops(device), [device])
  const [zoom, setZoom] = useState<number | null>(null)
  const activeZoom = zoom ?? base

  const [angle, setAngle] = useState<PhotoAngle | null>(null)
  const [strip, setStrip] = useState<StripFrame[]>([])
  const [shooting, setShooting] = useState(false)
  const [identifying, setIdentifying] = useState(false)
  const [result, setResult] = useState<IdentifyResponse | null>(null)
  const [identifyError, setIdentifyError] = useState<string | null>(null)

  // Ask once on first open; `permission` is a new object every render, so
  // depend on the flag and guard with a ref, or a pending iOS dialog would be
  // re-requested on each re-render.
  const asked = useRef(false)
  const { canRequestPermission, requestPermission } = permission
  useEffect(() => {
    if (canRequestPermission && !asked.current) {
      asked.current = true
      void requestPermission()
    }
  }, [canRequestPermission, requestPermission])

  function updateFrame(localId: string, patch: Partial<StripFrame>) {
    setStrip((prev) => prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f)))
  }

  async function shoot() {
    if (shooting || identifying) return
    setShooting(true)
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const file = await photoOutput.capturePhotoToFile({ enableShutterSound: true }, {})
      if (mode.kind === "identify") {
        await runIdentify(fileUri(file.filePath))
      } else {
        // The frame enters the strip at once; resizing and upload run behind it.
        const localId = `f${++frameCounter}`
        const frameAngle = angle
        const watchId = mode.watch.id
        const soft = sharpnessOn && focusRef.current === "soft"
        setStrip((prev) => [
          { localId, uri: fileUri(file.filePath), angle: frameAngle, status: "uploading", soft },
          ...prev,
        ])
        void (async () => {
          try {
            const prepared = await prepareFrame(fileUri(file.filePath), UPLOAD_LONG_EDGE, {
              compress: 0.9,
              base64: true,
            })
            if (!prepared.base64) throw new Error("Couldn't read the photo.")
            const photoId = await uploadPhoto(watchId, prepared.base64, frameAngle)
            updateFrame(localId, { status: "done", photoId })
          } catch (e) {
            updateFrame(localId, { status: "error", error: (e as Error).message })
          }
        })()
      }
    } catch (e) {
      setIdentifyError((e as Error).message)
    } finally {
      setShooting(false)
    }
  }

  async function runIdentify(uri: string) {
    setIdentifying(true)
    setIdentifyError(null)
    setResult(null)
    try {
      const prepared = await prepareFrame(uri, IDENTIFY_LONG_EDGE, { compress: 0.8, base64: true })
      if (!prepared.base64) throw new Error("Couldn't read the photo.")
      const res = await identify({ image_base64: prepared.base64, media_type: "image/jpeg" })
      setResult(res)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) {
      setIdentifyError((e as Error).message)
    } finally {
      setIdentifying(false)
    }
  }

  async function undo(frame: StripFrame) {
    if (!frame.photoId) return
    updateFrame(frame.localId, { status: "removed" })
    try {
      await deletePhoto(frame.photoId)
    } catch (e) {
      updateFrame(frame.localId, { status: "done", error: (e as Error).message })
    }
  }

  // Leaving with frames still uploading or failed loses them silently — the
  // trial's first caseback frame went that way. Say so first.
  function done() {
    const live = strip.filter((f) => f.status !== "removed")
    const uploading = live.filter((f) => f.status === "uploading").length
    const failed = live.filter((f) => f.status === "error").length
    if (uploading === 0 && failed === 0) return onClose()
    const parts = [
      uploading > 0 ? `${uploading} still uploading` : null,
      failed > 0 ? `${failed} failed to upload` : null,
    ].filter(Boolean)
    Alert.alert("Leave the camera?", `${parts.join(" and ")}.`, [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onClose },
    ])
  }

  if (!permission.hasPermission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.centerText}>
          TenTen needs the camera. If you declined, allow it in Settings → TenTen → Camera.
        </Text>
        <Pressable style={styles.textButton} onPress={onClose}>
          <Text style={styles.textButtonLabel}>Back</Text>
        </Pressable>
      </View>
    )
  }

  const visibleFrames = strip.filter((f) => f.status !== "removed")
  const doneCount = visibleFrames.filter((f) => f.status === "done").length

  return (
    <View style={styles.root}>
      {device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={sharpnessOn ? [photoOutput, frameOutput] : [photoOutput]}
          onError={(e) => {
            if (sharpnessOn) setSharpnessOn(false)
            else console.error(e)
          }}
          isActive={appActive}
          zoom={activeZoom}
          enableNativeTapToFocusGesture
          enableSmoothAutoFocus
          resizeMode="cover"
        />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={color.brassForeground} />
        </View>
      )}

      {/* Top bar: what you're shooting, and the way out. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={done} hitSlop={12} style={styles.topButton}>
          <Text style={styles.topButtonText}>Done</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {mode.kind === "identify" ? "Identify" : `${mode.watch.brand} ${mode.watch.nickname || mode.watch.model}`}
          </Text>
          {mode.kind === "capture" && doneCount > 0 && (
            <Text style={styles.topSub}>{doneCount} uploaded</Text>
          )}
        </View>
        <View style={styles.topButton} />
      </View>

      {/* The fine-grained reading, kept on screen at Marc's request — the
          ring below is what says sharp or soft. */}
      {sharpnessOn && sharpness != null && (
        <View pointerEvents="none" style={[styles.focusPill, { top: insets.top + 64 }]}>
          <Text style={styles.focusText}>Sharpness {Math.round(sharpness)}</Text>
        </View>
      )}

      {/* Dial guide AND sharpness meter: centre the dial in it; it is solid
          white while the dial is sharp and dashed amber while it's soft.
          Tap anywhere to focus there. */}
      <View pointerEvents="none" style={styles.guideWrap}>
        <View
          style={[
            styles.guide,
            sharpnessOn && focusState === "sharp" && styles.guideSharp,
            sharpnessOn && focusState === "soft" && styles.guideSoft,
          ]}
          accessibilityLabel={focusState === "soft" ? "Dial looks soft" : focusState === "sharp" ? "Dial is sharp" : undefined}
        />
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        {mode.kind === "capture" && visibleFrames.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {visibleFrames.map((f) => (
              <View key={f.localId} style={[styles.frame, f.status === "error" && styles.frameError]}>
                <Image source={{ uri: f.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {f.status === "uploading" && (
                  <View style={styles.frameOverlay}>
                    <ActivityIndicator size="small" color={color.viewfinderText} />
                  </View>
                )}
                {f.status === "done" && (
                  <Pressable style={styles.undo} onPress={() => void undo(f)} hitSlop={8}>
                    <Text style={styles.undoText}>Undo</Text>
                  </Pressable>
                )}
                {f.soft && <View style={styles.softDot} accessibilityLabel="Dial was soft — consider a retake" />}
                {f.angle && <Text style={styles.frameAngle}>{ANGLE_LABELS[f.angle]}</Text>}
              </View>
            ))}
          </ScrollView>
        )}
        {mode.kind === "capture" && visibleFrames.some((f) => f.status === "error") && (
          <Text style={styles.errorText}>
            {visibleFrames.find((f) => f.status === "error")?.error ?? "Upload failed."}
          </Text>
        )}

        {mode.kind === "capture" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="No angle" active={angle === null} onPress={() => setAngle(null)} />
            {PHOTO_ANGLES.map((a) => (
              <Chip key={a} label={ANGLE_LABELS[a]} active={angle === a} onPress={() => setAngle(a)} />
            ))}
          </ScrollView>
        )}

        <View style={styles.lenses}>
          {stops.map((s) => (
            <Pressable
              key={s}
              onPress={() => setZoom(s)}
              style={[styles.lens, Math.abs(activeZoom - s) < 0.01 && styles.lensActive]}
              hitSlop={6}
            >
              <Text style={[styles.lensText, Math.abs(activeZoom - s) < 0.01 && styles.lensTextActive]}>
                {formatStop(s / base)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => void shoot()}
          disabled={shooting || identifying || !device}
          style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
          accessibilityLabel={mode.kind === "identify" ? "Identify" : "Take photo"}
        >
          {identifying ? <ActivityIndicator color={color.brass} /> : <View style={styles.shutterInner} />}
        </Pressable>
      </View>

      {/* Identify result sheet */}
      {(result || identifyError) && mode.kind === "identify" && (
        <IdentifySheet
          result={result}
          error={identifyError}
          watches={watches}
          bottomInset={insets.bottom}
          onDismiss={() => {
            setResult(null)
            setIdentifyError(null)
          }}
          onShoot={onSwitchToCapture}
        />
      )}
    </View>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} hitSlop={4}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function IdentifySheet({
  result,
  error,
  watches,
  bottomInset,
  onDismiss,
  onShoot,
}: {
  result: IdentifyResponse | null
  error: string | null
  watches: PhoneWatch[]
  bottomInset: number
  onDismiss: () => void
  onShoot: (w: PhoneWatch) => void
}) {
  const byId = new Map(watches.map((w) => [w.id, w]))
  const matches = (result?.matches ?? [])
    .map((m) => ({ ...m, watch: byId.get(m.watch_id) }))
    .filter((m): m is typeof m & { watch: PhoneWatch } => m.watch != null)

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset + 16 }]}>
      {error && <Text style={styles.sheetError}>{error}</Text>}
      {result && !result.watch_visible && <Text style={styles.sheetBody}>No watch in that photo — try again.</Text>}
      {matches.map((m, i) => (
        <Pressable key={m.watch_id} style={styles.match} onPress={() => onShoot(m.watch)}>
          {m.watch.thumbUrl ? (
            <Image source={{ uri: m.watch.thumbUrl }} style={styles.matchThumb} contentFit="cover" />
          ) : (
            <View style={[styles.matchThumb, { backgroundColor: color.surfacePhoto }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.matchBrand}>
              {i === 0 ? "Best match" : "Or"} · {m.confidence}
            </Text>
            <Text style={styles.matchName} numberOfLines={1}>
              {m.watch.brand} {m.watch.nickname || m.watch.model}
            </Text>
            <Text style={styles.matchReason} numberOfLines={2}>{m.reason}</Text>
          </View>
          <Text style={styles.matchAction}>Photograph</Text>
        </Pressable>
      ))}
      {result && result.watch_visible && matches.length === 0 && (
        <View style={{ gap: 4 }}>
          <Text style={styles.matchBrand}>Not in your collection</Text>
          <Text style={styles.matchName}>
            {[result.guess?.brand, result.guess?.model].filter(Boolean).join(" ") || "Couldn't tell what this is"}
          </Text>
          {result.guess?.reference_number && (
            <Text style={styles.matchReason}>⚠ ref {result.guess.reference_number} (unverified)</Text>
          )}
        </View>
      )}
      {result?.notes && <Text style={styles.matchReason}>{result.notes}</Text>}
      {result && (
        <Text style={styles.cost}>
          {(result.usage.cost_usd * 100).toFixed(1)}¢ · {result.model}
        </Text>
      )}
      <Pressable style={styles.sheetButton} onPress={onDismiss}>
        <Text style={styles.sheetButtonText}>Try another</Text>
      </Pressable>
    </View>
  )
}

/**
 * Zoom values for the lens buttons. On a virtual multi-lens device zoom 1.0
 * is the WIDEST lens, so "1×" (the main camera) is the first switch-over
 * factor; on a single-lens device it is simply 1.0.
 */
function lensStops(device: ReturnType<typeof useCameraDevice>): { stops: number[]; base: number } {
  if (!device) return { stops: [1], base: 1 }
  const hasUltraWide = device.physicalDevices.some((d) => d.type === "ultra-wide-angle")
  const factors = device.zoomLensSwitchFactors.filter((f) => f > device.minZoom && f <= device.maxZoom)
  if (hasUltraWide && factors.length > 0) {
    return { stops: [device.minZoom, ...factors], base: factors[0] }
  }
  return { stops: [Math.max(1, device.minZoom), ...factors], base: Math.max(1, device.minZoom) }
}

function formatStop(x: number): string {
  const rounded = Math.round(x * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}×`
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.viewfinder },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: color.viewfinder },
  centerText: { color: color.viewfinderText, fontSize: text.sm, textAlign: "center", marginBottom: 16 },
  textButton: { minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 16 },
  textButtonLabel: { color: color.viewfinderText, fontSize: text.sm, fontWeight: "600" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topButton: { minWidth: 64, minHeight: TOUCH, justifyContent: "center" },
  topButtonText: { color: color.viewfinderText, fontSize: text.sm, fontWeight: "600" },
  topTitle: { color: color.viewfinderText, fontSize: text.sm, fontWeight: "600" },
  topSub: { color: "rgba(255,255,255,0.75)", fontSize: text.xxs, marginTop: 2 },
  focusPill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  focusText: { color: color.viewfinderText, fontSize: text.xs, fontWeight: "600" },
  guideWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  guide: {
    width: "62%",
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  guideSharp: { borderWidth: 2, borderColor: color.viewfinderText, borderStyle: "solid" },
  guideSoft: { borderWidth: 2, borderColor: color.warning, borderStyle: "dashed" },
  softDot: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: color.warning,
    borderWidth: 1.5,
    borderColor: color.viewfinderText,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  strip: { gap: 8, paddingHorizontal: 12 },
  frame: {
    width: 72,
    height: 72,
    borderRadius: radius.control,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  frameError: { borderColor: color.destructive, borderWidth: 2 },
  frameOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  undo: {
    position: "absolute",
    right: 3,
    top: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  undoText: { color: color.viewfinderText, fontSize: text.xxs, fontWeight: "600" },
  frameAngle: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    color: color.viewfinderText,
    fontSize: text.xxs,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  errorText: { color: color.viewfinderError, fontSize: text.xs, paddingHorizontal: 16, textAlign: "center" },
  chips: { gap: 8, paddingHorizontal: 12 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  chipActive: { backgroundColor: color.brass, borderColor: color.brass },
  chipText: { color: color.viewfinderText, fontSize: text.xs },
  chipTextActive: { color: color.brassForeground, fontWeight: "600" },
  lenses: { flexDirection: "row", gap: 10, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: radius.pill, padding: 4 },
  lens: { minWidth: TOUCH, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  lensActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  lensText: { color: color.viewfinderText, fontSize: text.xs },
  lensTextActive: { color: color.viewfinderAccent, fontWeight: "700" },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: color.viewfinderText,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: color.viewfinderText },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  sheetError: { color: color.destructive, fontSize: text.sm },
  sheetBody: { color: color.foreground, fontSize: text.sm },
  match: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64 },
  matchThumb: { width: 56, height: 56, borderRadius: radius.control },
  matchBrand: { color: color.mutedForeground, fontSize: text.xs },
  matchName: { color: color.foreground, fontSize: text.md, fontWeight: "600" },
  matchReason: { color: color.mutedForeground, fontSize: text.xs },
  matchAction: { color: color.brass, fontSize: text.sm, fontWeight: "600" },
  cost: { color: color.mutedForeground, fontSize: text.xxs },
  sheetButton: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetButtonText: { color: color.foreground, fontSize: text.sm, fontWeight: "600" },
})
