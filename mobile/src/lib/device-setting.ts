import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

/**
 * A per-device on/off setting (More screen), kept in AsyncStorage and shared
 * live: every screen using the hook updates the moment it is flipped. Starts
 * at `fallback` until the stored value loads, and stays in memory for the
 * session if storage fails.
 */
export function deviceSetting(key: string, fallback: boolean) {
  let state = fallback
  const listeners = new Set<() => void>()

  void AsyncStorage.getItem(key)
    .then((v) => {
      if (v === "on" || v === "off") state = v === "on"
      for (const l of listeners) l()
    })
    .catch(() => {})

  async function set(on: boolean): Promise<void> {
    state = on
    for (const l of listeners) l()
    try {
      await AsyncStorage.setItem(key, on ? "on" : "off")
    } catch {
      // in-memory for this session
    }
  }

  function useSetting(): boolean {
    const [on, setOn] = useState(state)
    useEffect(() => {
      const l = () => setOn(state)
      listeners.add(l)
      l()
      return () => {
        listeners.delete(l)
      }
    }, [])
    return on
  }

  return { set, useSetting }
}
