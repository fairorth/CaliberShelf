"use client"

import Link from "next/link"

/**
 * Floating action button for quick photo capture.
 * Only visible on mobile devices (hidden on md+ breakpoints).
 */
export function CaptureFab() {
  return (
    <Link
      href="/capture"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
      aria-label="Quick Capture"
    >
      <span className="text-2xl">📷</span>
    </Link>
  )
}
