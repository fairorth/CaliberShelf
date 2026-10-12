import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Camera preferences (More → Camera). Per-device, like the Face ID lock: a
 * camera calibration belongs to the phone that shoots, not to the account.
 *
 * Defaults come from calibration on Marc's iPhone 17 Pro Max (2026-10-12):
 * a sharp dial reads ~4,000–7,000, a blurred one ~40 (see lib/focus.ts).
 */
export interface CameraSettings {
  /** The ring turns WHITE at this reading or above. */
  sharpAt: number
  /** The ring turns AMBER again below this. Always below sharpAt. */
  softBelow: number
  /** How far one tap of a − / + stepper moves a threshold. */
  step: number
  /** Shutter pressed while amber waits for focus to land before shooting. */
  focusAwareShutter: boolean
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  sharpAt: 600,
  softBelow: 300,
  step: 50,
  focusAwareShutter: false,
}

export const STEP_CHOICES = [10, 50, 100, 500] as const

/** Bounds for a threshold: a reading is never negative, and a sharp dial on
 *  this phone tops out in the thousands. */
export const THRESHOLD_MIN = 0
export const THRESHOLD_MAX = 20_000
/** The smallest gap kept between the two, so "soft below" stays under "sharp at". */
const MIN_GAP = 1

/** How long a focus-aware shutter waits for the ring to turn white. */
export const FOCUS_WAIT_MS = 1200

const KEY = "tenten.cameraSettings"

/** Clamp and order the two thresholds; fill anything missing from defaults. */
export function normalizeCameraSettings(raw: Partial<CameraSettings> | null | undefined): CameraSettings {
  const s = { ...DEFAULT_CAMERA_SETTINGS, ...(raw ?? {}) }
  const clamp = (n: number) => Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(Number(n) || 0)))
  const sharpAt = Math.max(clamp(s.sharpAt), THRESHOLD_MIN + MIN_GAP)
  const softBelow = Math.min(clamp(s.softBelow), sharpAt - MIN_GAP)
  const step = (STEP_CHOICES as readonly number[]).includes(s.step) ? s.step : DEFAULT_CAMERA_SETTINGS.step
  return { sharpAt, softBelow, step, focusAwareShutter: !!s.focusAwareShutter }
}

export async function loadCameraSettings(): Promise<CameraSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return normalizeCameraSettings(raw ? (JSON.parse(raw) as Partial<CameraSettings>) : null)
  } catch {
    return DEFAULT_CAMERA_SETTINGS
  }
}

export async function saveCameraSettings(s: CameraSettings): Promise<CameraSettings> {
  const clean = normalizeCameraSettings(s)
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(clean))
  } catch {
    // A failed save keeps the in-memory value for this session.
  }
  return clean
}

/** The settings, loaded once per mount, with a setter that saves. */
export function useCameraSettings() {
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  // The current value for `update` to build on: a state updater runs later,
  // so computing the next value inside one and saving it here would save the
  // stale value instead.
  const current = useRef<CameraSettings>(DEFAULT_CAMERA_SETTINGS)

  useEffect(() => {
    let alive = true
    void loadCameraSettings().then((s) => {
      if (!alive) return
      current.current = s
      setSettings(s)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const update = useCallback(async (patch: Partial<CameraSettings>) => {
    const next = normalizeCameraSettings({ ...current.current, ...patch })
    current.current = next
    setSettings(next)
    await saveCameraSettings(next)
  }, [])

  return { settings, loaded, update }
}
