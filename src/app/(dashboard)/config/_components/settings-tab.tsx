"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  SHOW_COST_KEY,
  HERO_DWELL_KEY,
  HERO_DWELL_OPTIONS,
  DEFAULT_HERO_DWELL_SECONDS,
  DEFAULT_GLANCE_DELAY_SECONDS,
  DEFAULT_GLANCE_ENABLED,
  GLANCE_DELAY_OPTIONS,
  HOME_GLANCE_DELAY_KEY,
  HOME_GLANCE_ENABLED_KEY,
  glanceDelayLabel,
  heroDwellLabel,
  readGlanceDelaySeconds,
  readGlanceEnabled,
  readHeroDwellSeconds,
} from "@/lib/preferences"
import { saveWatchImagesPath } from "@/lib/actions/settings-actions"

export function SettingsTab({
  initialWatchImagesPath = "",
}: {
  initialWatchImagesPath?: string
}) {
  const [showCost, setShowCost] = useState(false)
  const [heroDwell, setHeroDwell] = useState<number>(DEFAULT_HERO_DWELL_SECONDS)
  const [glanceEnabled, setGlanceEnabled] = useState(DEFAULT_GLANCE_ENABLED)
  const [glanceDelay, setGlanceDelay] = useState<number>(DEFAULT_GLANCE_DELAY_SECONDS)
  const [imagesPath, setImagesPath] = useState(initialWatchImagesPath)
  const [isSaving, startSaving] = useTransition()

  // Read the saved per-device preferences after hydration (localStorage is client-only).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")
    setHeroDwell(readHeroDwellSeconds())
    setGlanceEnabled(readGlanceEnabled())
    setGlanceDelay(readGlanceDelaySeconds())
  }, [])

  function toggleGlance(next: boolean) {
    setGlanceEnabled(next)
    localStorage.setItem(HOME_GLANCE_ENABLED_KEY, next ? "1" : "0")
  }

  function changeGlanceDelay(next: number) {
    setGlanceDelay(next)
    localStorage.setItem(HOME_GLANCE_DELAY_KEY, String(next))
  }

  function toggle(next: boolean) {
    setShowCost(next)
    localStorage.setItem(SHOW_COST_KEY, next ? "1" : "0")
  }

  function changeHeroDwell(next: number) {
    setHeroDwell(next)
    localStorage.setItem(HERO_DWELL_KEY, String(next))
  }

  function saveImagesPath() {
    startSaving(async () => {
      const res = await saveWatchImagesPath(imagesPath)
      if (res.error) toast.error(res.error)
      else toast.success("Watch Images folder saved.")
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={showCost}
              onChange={(e) => toggle(e.target.checked)}
              className="mt-0.5"
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

          {/* Glance mode sits beside the dwell control — both are about
              leaving the home screen up (Phase 7 §2.4). */}
          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={glanceEnabled}
                onChange={(e) => toggleGlance(e.target.checked)}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">
                  Home screen — glance mode
                </span>
                <span className="block text-xs text-muted-foreground">
                  After a spell with no input, the chrome leaves and the
                  photograph takes the whole screen. The rotation keeps running;
                  any movement — or Escape — brings the working view back.
                </span>
              </span>
            </label>
            <div className="space-y-1.5 pl-7">
              <label htmlFor="glance-delay" className="block text-sm font-medium">
                Idle before glance mode
              </label>
              <select
                id="glance-delay"
                value={glanceDelay}
                disabled={!glanceEnabled}
                onChange={(e) => changeGlanceDelay(Number(e.target.value))}
                className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              >
                {GLANCE_DELAY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {glanceDelayLabel(s)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Turn the checkbox off for never.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            These preferences are saved on this device.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Photo Lab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="watch-images-path" className="block text-sm font-medium">
              Watch Images folder location
            </label>
            <p className="text-xs text-muted-foreground">
              The parent folder on your machine that holds one image folder per watch (e.g.
              <span className="font-mono"> C:\WatchImages</span>). Used by the local
              <span className="font-mono"> sync-watch-folders</span> script — the app itself
              can&apos;t create folders on your disk.
            </p>
            <div className="flex gap-2">
              <Input
                id="watch-images-path"
                value={imagesPath}
                onChange={(e) => setImagesPath(e.target.value)}
                placeholder="C:\WatchImages"
                className="h-9 font-mono"
              />
              <Button size="sm" onClick={saveImagesPath} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
