"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveBoxConfig } from "@/lib/actions/box-actions"
import {
  MIN_BOX_COUNT,
  MAX_BOX_COUNT,
  MAX_BOX_DESCRIPTION,
  boxOptions,
  type BoxConfig,
} from "@/lib/boxes"

export function BoxesTab({ initialConfig }: { initialConfig: BoxConfig }) {
  const [count, setCount] = useState(String(initialConfig.count))
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    initialConfig.descriptions
  )
  const [isSaving, startSaving] = useTransition()

  const parsed = parseInt(count, 10)
  const valid =
    Number.isFinite(parsed) && parsed >= MIN_BOX_COUNT && parsed <= MAX_BOX_COUNT
  const boxes = valid ? boxOptions(parsed) : []

  function setDescription(box: string, value: string) {
    setDescriptions((prev) => ({ ...prev, [box]: value }))
  }

  function save() {
    if (!valid) {
      toast.error(`Enter a whole number between ${MIN_BOX_COUNT} and ${MAX_BOX_COUNT}.`)
      return
    }
    startSaving(async () => {
      const result = await saveBoxConfig(parsed, descriptions)
      if (result.error) toast.error(result.error)
      else toast.success("Boxes saved.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Storage Boxes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set how many storage boxes you have, and optionally describe each one
          (&ldquo;Luxury Tier&rdquo;, &ldquo;Fun AliExpress Finds&rdquo;). Watches store
          only the box number, so descriptions can be renamed anytime without
          touching any watch.
        </p>

        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <label htmlFor="box-count" className="text-sm font-medium">
              Number of boxes
            </label>
            <Input
              id="box-count"
              type="number"
              inputMode="numeric"
              min={MIN_BOX_COUNT}
              max={MAX_BOX_COUNT}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="h-9 w-28 font-mono"
              aria-label="Number of boxes"
            />
          </div>
          <Button size="sm" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save boxes"}
          </Button>
        </div>

        {boxes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Descriptions (optional, shown next to the box number everywhere)
            </p>
            <div className="max-w-md space-y-2">
              {boxes.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-mono text-sm text-muted-foreground">
                    {b}
                  </span>
                  <Input
                    value={descriptions[b] ?? ""}
                    onChange={(e) => setDescription(b, e.target.value)}
                    maxLength={MAX_BOX_DESCRIPTION}
                    placeholder="e.g. Luxury Tier"
                    className="h-8"
                    aria-label={`Description for ${b}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
