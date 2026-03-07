"use client"

import { useSyncExternalStore } from "react"

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(display-mode: standalone)")
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Detects whether the app is running in standalone (installed PWA) mode.
 * Returns `true` when launched from the home screen on iOS or Android.
 */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
