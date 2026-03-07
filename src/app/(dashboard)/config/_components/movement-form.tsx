"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createMovement } from "@/lib/actions/movement-actions"
import type { MovementActionState } from "@/lib/actions/movement-actions"
import { movementLabels } from "@/lib/validations/watch"
import { displayTypeLabels } from "@/lib/validations/movement"

interface MovementFormProps {
  onSuccess?: () => void
}

export function MovementForm({ onSuccess }: MovementFormProps) {
  const [state, formAction, isPending] = useActionState<MovementActionState, FormData>(
    createMovement,
    {}
  )

  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess()
    }
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Identity</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="caliber_name">Caliber Name *</Label>
            <Input
              id="caliber_name"
              name="caliber_name"
              placeholder="e.g. NH35A"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              name="manufacturer"
              placeholder="e.g. Seiko"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="base_caliber">Base Caliber</Label>
            <Input
              id="base_caliber"
              name="base_caliber"
              placeholder="e.g. 4R35"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aliases">Aliases</Label>
            <Input
              id="aliases"
              name="aliases"
              placeholder="e.g. SII NH35"
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Classification</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="movement_type">Movement Type *</Label>
            <Select name="movement_type" defaultValue="automatic">
              <SelectTrigger id="movement_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(movementLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display_type">Display Type</Label>
            <Select name="display_type" defaultValue="analog">
              <SelectTrigger id="display_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(displayTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dimensions & Performance */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Dimensions & Performance</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="diameter_mm">Diameter (mm)</Label>
            <Input id="diameter_mm" name="diameter_mm" type="number" step="0.01" min="5" max="50" placeholder="e.g. 27.4" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height_mm">Height (mm)</Label>
            <Input id="height_mm" name="height_mm" type="number" step="0.01" min="0.5" max="20" placeholder="e.g. 5.32" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jewel_count">Jewels</Label>
            <Input id="jewel_count" name="jewel_count" type="number" min="0" max="100" placeholder="e.g. 24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beat_rate_vph">Beat Rate (vph)</Label>
            <Input id="beat_rate_vph" name="beat_rate_vph" type="number" min="0" max="72000" placeholder="e.g. 21600" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="power_reserve_hours">Power Reserve (h)</Label>
            <Input id="power_reserve_hours" name="power_reserve_hours" type="number" min="0" placeholder="e.g. 41" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accuracy_range">Accuracy</Label>
            <Input id="accuracy_range" name="accuracy_range" placeholder="e.g. -10/+20 s/d" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Features</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hacking" className="rounded" />
            Hacking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hand_windable" className="rounded" />
            Hand-windable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="quickset_date" className="rounded" />
            Quickset date
          </label>
        </div>
      </div>

      {/* Complications & Meta */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Meta</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="complications">Complications</Label>
            <Input id="complications" name="complications" placeholder="e.g. Chronograph, Date, Moon Phase" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country_of_origin">Country of Origin</Label>
            <Input id="country_of_origin" name="country_of_origin" placeholder="e.g. Japan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="production_year_start">Production Start</Label>
            <Input id="production_year_start" name="production_year_start" type="number" min="1700" max="2100" placeholder="e.g. 2019" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Movement"}
        </Button>
      </div>
    </form>
  )
}
