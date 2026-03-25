"use client"

import { useState, useSyncExternalStore, useCallback } from "react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "calibershelf-ios-install-dismissed"

function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  const isStandalone =
    ("standalone" in navigator && (navigator as Record<string, unknown>).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  const isDismissed = localStorage.getItem(STORAGE_KEY) === "true"
  return isIos && !isStandalone && !isDismissed
}

// No-op subscribe — this value only changes when the user dismisses
const noop = () => () => {}

/**
 * Dismissible banner prompting iOS Safari users to add CaliberShelf
 * to their Home Screen. Only shown on iOS Safari in browser mode
 * (not standalone). Persists dismissal in localStorage.
 */
export function IosInstallPrompt() {
  // Track dismissal locally so we can re-render when user clicks Dismiss
  const [dismissed, setDismissed] = useState(false)
  const getSnapshot = useCallback(() => {
    if (dismissed) return false
    return shouldShowPrompt()
  }, [dismissed])
  const show = useSyncExternalStore(noop, getSnapshot, () => false)

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg md:hidden">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">⌚</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install CaliberShelf</p>
          <p className="text-xs text-muted-foreground">
            Tap the share button{" "}
            <span className="inline-block">
              ⬆️
            </span>{" "}
            then &ldquo;Add to Home Screen&rdquo; for the best experience.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
