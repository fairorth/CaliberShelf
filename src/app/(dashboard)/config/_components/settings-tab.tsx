"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SHOW_COST_KEY } from "@/lib/preferences"

export function SettingsTab() {
  const [showCost, setShowCost] = useState(false)

  // Read the saved preference after hydration (localStorage is client-only).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")
  }, [])

  function toggle(next: boolean) {
    setShowCost(next)
    localStorage.setItem(SHOW_COST_KEY, next ? "1" : "0")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Display Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showCost}
            onChange={(e) => toggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">Include Cost in Category Listing</span>
            <span className="block text-xs text-muted-foreground">
              Show each watch&apos;s purchase price in the Collection table and gallery.
            </span>
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          This preference is saved on this device.
        </p>
      </CardContent>
    </Card>
  )
}
