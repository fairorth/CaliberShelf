"use client"

import { useActionState, useState } from "react"
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
  caseMaterialLabels,
  crystalLabels,
  conditionLabels,
} from "@/lib/validations/watch"
import { caseSizeLabels } from "@/lib/validations/display-case"
import { BrandCombobox } from "@/components/brand-combobox"
import { MovementCombobox } from "@/components/movement-combobox"
import { CaseSlotPicker } from "@/components/case-slot-picker"
import type { WatchActionState } from "@/lib/actions/watch-actions"
import type { Watch, Brand, Movement, DisplayCase, WatchWithCover, CaseSize } from "@/lib/types/watch"

interface WatchFormProps {
  action: (prevState: WatchActionState, formData: FormData) => Promise<WatchActionState>
  watch?: Watch & { brand?: Brand; movement?: Movement | null }
  submitLabel?: string
  brands: Brand[]
  movements: Movement[]
  cases: DisplayCase[]
  /** Watches in all cases (for slot picker occupied display) */
  caseWatches?: Map<string, WatchWithCover[]>
}

export function WatchForm({
  action,
  watch,
  submitLabel = "Add Watch",
  brands,
  movements,
  cases,
  caseWatches,
}: WatchFormProps) {
  const [state, formAction, isPending] = useActionState<WatchActionState, FormData>(
    action,
    {}
  )

  // Track selected case for the slot picker
  const [selectedCaseId, setSelectedCaseId] = useState(watch?.case_id ?? "")

  const selectedCase = cases.find((c) => c.id === selectedCaseId)
  const watchesInSelectedCase = selectedCaseId
    ? caseWatches?.get(selectedCaseId) ?? []
    : []

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
            <Label>Brand *</Label>
            <BrandCombobox
              brands={brands}
              defaultBrandId={watch?.brand_id}
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

      {/* Movement & Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Movement / Caliber</Label>
            <MovementCombobox
              movements={movements}
              defaultMovementId={watch?.movement_id ?? undefined}
            />
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

      {/* Storage — display case + slot */}
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="case_id">Display Case *</Label>
              <input type="hidden" name="case_id" value={selectedCaseId} />
              <Select
                value={selectedCaseId}
                onValueChange={(val) => setSelectedCaseId(val ?? "")}
              >
                <SelectTrigger id="case_id">
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.length === 0 ? (
                    <SelectItem value="" disabled>
                      No cases — create one in Config first
                    </SelectItem>
                  ) : (
                    cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({caseSizeLabels[c.capacity] ?? c.capacity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCase && (
            <div className="space-y-2">
              <Label>Select Slot *</Label>
              <CaseSlotPicker
                capacity={selectedCase.capacity as CaseSize}
                occupiedSlots={watchesInSelectedCase.map((w) => ({
                  slot: w.case_slot,
                  watchName: `${w.brand.name} ${w.model}`,
                  thumbnailUrl: w.cover_photo_url,
                }))}
                defaultSlot={watch?.case_id === selectedCaseId ? watch.case_slot : undefined}
                excludeWatchId={watch?.id}
                watches={watchesInSelectedCase}
              />
            </div>
          )}
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
