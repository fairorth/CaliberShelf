import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

/**
 * More → "Show watch purchase price". Off by default: the phone is used in
 * public — a show floor, a GTG — where a price on screen is nobody else's
 * business. When on, the collection tiles and the watch card show what was
 * paid. Per device.
 */
const KEY = "tenten.showPurchasePrice"

let state = false
const listeners = new Set<() => void>()

void AsyncStorage.getItem(KEY)
  .then((v) => {
    state = v === "on"
    for (const l of listeners) l()
  })
  .catch(() => {})

export async function setShowPurchasePrice(on: boolean): Promise<void> {
  state = on
  for (const l of listeners) l()
  try {
    await AsyncStorage.setItem(KEY, on ? "on" : "off")
  } catch {
    // in-memory for this session
  }
}

export function useShowPurchasePrice(): boolean {
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

/** "$1,250" — whole dollars, as the web's tiles show it. */
export function formatPrice(cents: number | null): string | null {
  if (cents == null) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100
  )
}
