"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveBoxCount } from "@/lib/actions/box-actions"
import { MIN_BOX_COUNT, MAX_BOX_COUNT, boxOptions } from "@/lib/boxes"

export function BoxesTab({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(String(initialCount))
  const [isSaving, startSaving] = useTransition()

  const parsed = parseInt(count, 10)
  const valid =
    Number.isFinite(parsed) && parsed >= MIN_BOX_COUNT && parsed <= MAX_BOX_COUNT
  const preview = valid ? boxOptions(parsed) : []

  function save() {
    if (!valid) {
      toast.error(`Enter a whole number between ${MIN_BOX_COUNT} and ${MAX_BOX_COUNT}.`)
      return
    }
    startSaving(async () => {
      const result = await saveBoxCount(parsed)
      if (result.error) toast.error(result.error)
      else toast.success("Boxes saved. The Box dropdown now uses your count.")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Storage Boxes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set how many storage boxes you have. Boxes are numbered Box1 through your
          chosen number and offered as a dropdown on each watch&apos;s Box field.
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

        {preview.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Dropdown preview</p>
            <div className="flex flex-wrap gap-1.5">
              {preview.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
