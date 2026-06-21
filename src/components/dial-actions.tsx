"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

// Touch detection via useSyncExternalStore (avoids setState-in-effect lint rule).
const noopSubscribe = () => () => {}
function getTouchSnapshot(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}
function getTouchServerSnapshot(): boolean {
  return false
}

/**
 * The two primary actions under the watch dial: browse the collection or add a
 * watch. Add Watch mirrors the nav — camera-first flow on touch, full form on
 * desktop.
 */
export function DialActions() {
  const isMobile = useSyncExternalStore(
    noopSubscribe,
    getTouchSnapshot,
    getTouchServerSnapshot
  )
  const addWatchHref = isMobile ? "/add" : "/collection/new"

  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="outline" render={<Link href="/collection" />}>
        <span className="mr-1.5">📋</span> View Collection
      </Button>
      <Button render={<Link href={addWatchHref} />}>
        <span className="mr-1.5">➕</span> Add a Watch
      </Button>
    </div>
  )
}
