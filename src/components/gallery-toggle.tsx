"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// Touch detection via useSyncExternalStore
const noopSubscribe = () => () => {}
function getTouchSnapshot(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}
function getTouchServerSnapshot(): boolean {
  return false
}

type GalleryView = "cases" | "collection"

interface GalleryToggleProps {
  caseView: ReactNode
  collectionView: ReactNode
}

export function GalleryToggle({ caseView, collectionView }: GalleryToggleProps) {
  const isMobile = useSyncExternalStore(noopSubscribe, getTouchSnapshot, getTouchServerSnapshot)
  const [view, setView] = useState<GalleryView>(isMobile ? "collection" : "cases")

  return (
    <div className="space-y-4">
      {/* Segmented control */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            type="button"
            onClick={() => setView("cases")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === "cases"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🗄️ Cases
          </button>
          <button
            type="button"
            onClick={() => setView("collection")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              view === "collection"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            📋 Collection
          </button>
        </div>
      </div>

      {/* Render the active view */}
      {view === "cases" ? caseView : collectionView}
    </div>
  )
}
