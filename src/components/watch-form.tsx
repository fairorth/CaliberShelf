"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  movementLabels,
  caseMaterialLabels,
  crystalLabels,
  conditionLabels,
} from "@/lib/validations/watch"
import type { WatchActionState } from "@/lib/actions/watch-actions"
import type { Watch } from "@/lib/types/watch"

interface WatchFormProps {
  action: (prevState: WatchActionState, formData: FormData) => Promise<WatchActionState>
  watch?: Watch
  submitLabel?: string
}

export function WatchForm({ action, watch, submitLabel = "Add Watch" }: WatchFormProps) {
  const [state, formAction, isPending] = useActionState<WatchActionState, FormData>(
    action,
    {}
  )

  // Convert cents back to dollars for form default
  const purchasePriceDefault =
    watch?.purchase_price_cents != null
      ? (watch.purchase_price_cents / 100).toFixed(2)
      : ""

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Identity section */}
      <Card>
        <CardHeader>
          <CardTitle>Watch Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="e.g. Omega"
              defaultValue={watch?.brand ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              name="model"
              placeholder="e.g. Speedmaster Professional"
              defaultValue={watch?.model ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              name="nickname"
              placeholder="e.g. Moonwatch"
              defaultValue={watch?.nickname ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              name="reference_number"
              placeholder="e.g. 310.30.42.50.01.001"
              defaultValue={watch?.reference_number ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              name="serial_number"
              placeholder="Private — only visible to you"
              defaultValue={watch?.serial_number ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specifications section */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="movement">Movement</Label>
            <Select name="movement" defaultValue={watch?.movement ?? ""}>
              <SelectTrigger id="movement">
                <SelectValue placeholder="Select movement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None selected</SelectItem>
                {Object.entries(movementLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_material">Case Material</Label>
            <Select name="case_material" defaultValue={watch?.case_material ?? ""}>
              <SelectTrigger id="case_material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None selected</SelectItem>
                {Object.entries(caseMaterialLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crystal">Crystal</Label>
            <Select name="crystal" defaultValue={watch?.crystal ?? ""}>
              <SelectTrigger id="crystal">
                <SelectValue placeholder="Select crystal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None selected</SelectItem>
                {Object.entries(crystalLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_diameter_mm">Case Diameter (mm)</Label>
            <Input
              id="case_diameter_mm"
              name="case_diameter_mm"
              type="number"
              step="0.1"
              min="10"
              max="60"
              placeholder="e.g. 42"
              defaultValue={watch?.case_diameter_mm?.toString() ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="water_resistance_m">Water Resistance (m)</Label>
            <Input
              id="water_resistance_m"
              name="water_resistance_m"
              type="number"
              min="0"
              max="12000"
              placeholder="e.g. 50"
              defaultValue={watch?.water_resistance_m?.toString() ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dial_color">Dial Color</Label>
            <Input
              id="dial_color"
              name="dial_color"
              placeholder="e.g. Black"
              defaultValue={watch?.dial_color ?? ""}
            />
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="complication">Complications</Label>
            <Input
              id="complication"
              name="complication"
              placeholder="e.g. Chronograph, Date, Moon Phase"
              defaultValue={watch?.complication ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ownership section */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select name="condition" defaultValue={watch?.condition ?? ""}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None selected</SelectItem>
                {Object.entries(conditionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase Date</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={watch?.purchase_date ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_price">Purchase Price ($)</Label>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 6500.00"
              defaultValue={purchasePriceDefault}
            />
          </div>

          {/* Hidden field for currency — always USD for now */}
          <input type="hidden" name="purchase_currency" value={watch?.purchase_currency ?? "USD"} />

          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional details about this watch..."
              rows={3}
              defaultValue={watch?.notes ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
