"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveTierConfig } from "@/lib/actions/tier-actions"
import { DEFAULT_TIER_CONFIG, type TierConfigRow } from "@/lib/tiers"

interface Row {
  label: string
  max: string // dollars, as typed; ignored for the last (open-ended) tier
}

function toRows(config: TierConfigRow[]): Row[] {
  return config.map((r) => ({ label: r.label, max: r.max == null ? "" : String(r.max) }))
}

export function TiersTab({ initialConfig }: { initialConfig: TierConfigRow[] }) {
  const [rows, setRows] = useState<Row[]>(toRows(initialConfig))
  const [isSaving, startSaving] = useTransition()

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addTier() {
    if (rows.length >= 12) return
    // Insert a new finite tier just above the open-ended top tier.
    setRows((prev) => {
      const next = [...prev]
      next.splice(next.length - 1, 0, { label: `Tier ${prev.length}`, max: "" })
      return next
    })
  }
  function removeTier(i: number) {
    if (rows.length <= 2) return
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }
  function reset() {
    setRows(toRows(DEFAULT_TIER_CONFIG))
  }

  function save() {
    const config: TierConfigRow[] = []
    let prev = 0
    for (let i = 0; i < rows.length; i++) {
      const isLast = i === rows.length - 1
      const label = rows[i].label.trim() || `Tier ${i + 1}`
      if (isLast) {
        config.push({ label, max: null })
        break
      }
      const max = parseFloat(rows[i].max)
      if (!Number.isFinite(max) || max <= 0) {
        toast.error(`Tier ${i + 1} needs a positive upper bound.`)
        return
      }
      if (max <= prev) {
        toast.error("Each tier's upper bound must be larger than the one above it.")
        return
      }
      prev = max
      config.push({ label, max })
    }

    startSaving(async () => {
      const result = await saveTierConfig(config)
      if (result.error) toast.error(result.error)
      else toast.success("Tiers saved. Reports now use your new tiers.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Price Tiers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Name your price tiers and set each one&apos;s upper bound (derived from a watch&apos;s
          purchase price). The bottom tier is open-ended. Used by the Collection Map.
        </p>

        <div className="space-y-2">
          {rows.map((row, i) => {
            const isLast = i === rows.length - 1
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  value={row.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder={`Tier ${i + 1}`}
                  className="h-9 flex-1"
                  aria-label={`Tier ${i + 1} label`}
                />
                {isLast ? (
                  <span className="w-[132px] shrink-0 text-center text-xs text-muted-foreground">
                    and up
                  </span>
                ) : (
                  <div className="relative w-[132px] shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      up to $
                    </span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={row.max}
                      onChange={(e) => update(i, { max: e.target.value })}
                      className="h-9 pl-[52px] text-right font-mono"
                      aria-label={`Tier ${i + 1} upper bound`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  disabled={rows.length <= 2}
                  aria-label={`Remove tier ${i + 1}`}
                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={addTier} disabled={rows.length >= 12}>
            + Add tier
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to defaults
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save tiers"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
