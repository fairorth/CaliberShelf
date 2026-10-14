import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

/**
 * Show mode (More → Show mode): at a watch show, the camera button opens
 * ADMIRED capture and every admired watch is stamped with the event. A
 * per-device preference — it's about where this phone is this weekend.
 */
export interface ShowMode {
  on: boolean
  event: string
}

export const DEFAULT_SHOW_EVENT = "Watch Week NYC 2026"
const KEY = "tenten.showMode"

let state: ShowMode = { on: false, event: DEFAULT_SHOW_EVENT }
let loaded = false
const listeners = new Set<() => void>()

async function load() {
  if (loaded) return
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<ShowMode>
      state = { on: !!v.on, event: (v.event ?? "").trim() || DEFAULT_SHOW_EVENT }
    }
  } catch {
    // keep defaults
  }
  loaded = true
  for (const l of listeners) l()
}
void load()

export function getShowMode(): ShowMode {
  return state
}

export async function setShowMode(patch: Partial<ShowMode>): Promise<void> {
  state = { ...state, ...patch }
  for (const l of listeners) l()
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // in-memory for this session
  }
}

/** Live Show mode — every screen using it updates when More changes it. */
export function useShowMode(): ShowMode {
  const [s, setS] = useState(state)
  useEffect(() => {
    const l = () => setS(state)
    listeners.add(l)
    l()
    return () => {
      listeners.delete(l)
    }
  }, [])
  return s
}
