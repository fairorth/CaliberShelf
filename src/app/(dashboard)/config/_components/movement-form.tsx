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
import { createMovement, updateMovement } from "@/lib/actions/movement-actions"
import type { MovementActionState } from "@/lib/actions/movement-actions"
import { caliberTypeLabels } from "@/lib/validations/movement"
import type { Movement } from "@/lib/types/watch"

interface MovementFormProps {
  onSuccess?: () => void
  movement?: Movement
}

export function MovementForm({ onSuccess, movement }: MovementFormProps) {
  const boundAction = movement
    ? updateMovement.bind(null, movement.id)
    : createMovement

  const [state, formAction, isPending] = useActionState<MovementActionState, FormData>(
    boundAction,
    {}
  )

  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess()
    }
  }, [state.success, onSuccess])

  const isEdit = !!movement

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="caliber_name">Caliber Name *</Label>
          <Input
            id="caliber_name"
            name="caliber_name"
            placeholder="e.g. ETA 6497"
            defaultValue={movement?.caliber_name ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            name="manufacturer"
            placeholder="e.g. Citizen"
            defaultValue={movement?.manufacturer ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="caliber_type">Caliber Type</Label>
          <Select name="caliber_type" defaultValue={movement?.caliber_type ?? ""}>
            <SelectTrigger id="caliber_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None selected</SelectItem>
              {Object.entries(caliberTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beat_rate">Beat Rate</Label>
          <Input
            id="beat_rate"
            name="beat_rate"
            placeholder="e.g. 28.8k"
            defaultValue={movement?.beat_rate ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="power_reserve">Power Reserve</Label>
          <Input
            id="power_reserve"
            name="power_reserve"
            placeholder="e.g. 42h"
            defaultValue={movement?.power_reserve ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lift_angle">Lift Angle</Label>
          <Input
            id="lift_angle"
            name="lift_angle"
            placeholder="e.g. 52°"
            defaultValue={movement?.lift_angle ?? ""}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (isEdit ? "Saving..." : "Creating...")
            : (isEdit ? "Save Changes" : "Create Movement")}
        </Button>
      </div>
    </form>
  )
}
