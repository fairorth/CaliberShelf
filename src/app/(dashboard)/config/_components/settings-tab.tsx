"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SHOW_COST_KEY,
  HERO_DWELL_KEY,
  HERO_DWELL_OPTIONS,
  DEFAULT_HERO_DWELL_SECONDS,
  heroDwellLabel,
  readHeroDwellSeconds,
} from "@/lib/preferences"

export function SettingsTab() {
  const [showCost, setShowCost] = useState(false)
  const [heroDwell, setHeroDwell] = useState<number>(DEFAULT_HERO_DWELL_SECONDS)

  // Read the saved preferences after hydration (localStorage is client-only).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")
    setHeroDwell(readHeroDwellSeconds())
  }, [])

  function toggle(next: boolean) {
    setShowCost(next)
    localStorage.setItem(SHOW_COST_KEY, next ? "1" : "0")
  }

  function changeHeroDwell(next: number) {
    setHeroDwell(next)
    localStorage.setItem(HERO_DWELL_KEY, String(next))
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
        <div className="space-y-1.5 border-t border-border pt-4">
          <label htmlFor="hero-dwell" className="block text-sm font-medium">
            Home screen — featured watch duration
          </label>
          <p className="text-xs text-muted-foreground">
            How long each watch stays on the home screen before switching to the next.
          </p>
          <select
            id="hero-dwell"
            value={heroDwell}
            onChange={(e) => changeHeroDwell(Number(e.target.value))}
            className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {HERO_DWELL_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {heroDwellLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">
          These preferences are saved on this device.
        </p>
      </CardContent>
    </Card>
  )
}
