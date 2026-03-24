"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
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
import { labelColorMap } from "@/lib/validations/label"
import { BrandCombobox } from "@/components/brand-combobox"
import { MovementCombobox } from "@/components/movement-combobox"
import type { WatchActionState } from "@/lib/actions/watch-actions"
import type { Watch, Brand, Movement, Category, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface WatchFormProps {
  action: (prevState: WatchActionState, formData: FormData) => Promise<WatchActionState>
  watch?: Watch & { brand?: Brand; movement?: Movement | null }
  submitLabel?: string
  brands: Brand[]
  movements: Movement[]
  categories: Category[]
  labels: Label[]
  defaultLabelIds?: string[]
}

export function WatchForm({
  action,
  watch,
  submitLabel = "Add Watch",
  brands,
  movements,
  categories,
  labels,
  defaultLabelIds = [],
}: WatchFormProps) {
  const [state, formAction, isPending] = useActionState<WatchActionState, FormData>(
    action,
    {}
  )

  // Track selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState(watch?.category_id ?? "")

  // Track selected labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(
    new Set(defaultLabelIds)
  )

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev)
      if (next.has(labelId)) {
        next.delete(labelId)
      } else {
        next.add(labelId)
      }
      return next
    })
  }

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

      {/* Hidden inputs for category and labels */}
      <input type="hidden" name="category_id" value={selectedCategoryId} />
      <input type="hidden" name="label_ids" value={Array.from(selectedLabelIds).join(",")} />

      {/* Identity section */}
      <Card>
        <CardHeader>
          <CardTitle>Watch Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Brand *</FormLabel>
            <BrandCombobox
              brands={brands}
              defaultBrandId={watch?.brand_id}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="model">Model *</FormLabel>
            <Input
              id="model"
              name="model"
              placeholder="e.g. Speedmaster Professional"
              defaultValue={watch?.model ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="nickname">Nickname</FormLabel>
            <Input
              id="nickname"
              name="nickname"
              placeholder="e.g. Moonwatch"
              defaultValue={watch?.nickname ?? ""}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="reference_number">Reference Number</FormLabel>
            <Input
              id="reference_number"
              name="reference_number"
              placeholder="e.g. 310.30.42.50.01.001"
              defaultValue={watch?.reference_number ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FormLabel htmlFor="serial_number">Serial Number</FormLabel>
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
            <FormLabel>Movement / Caliber</FormLabel>
            <MovementCombobox
              movements={movements}
              defaultMovementId={watch?.movement_id ?? undefined}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="case_material">Case Material</FormLabel>
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
            <FormLabel htmlFor="crystal">Crystal</FormLabel>
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
            <FormLabel htmlFor="case_diameter_mm">Case Diameter (mm)</FormLabel>
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
            <FormLabel htmlFor="lug_width_mm">Lug Width (mm)</FormLabel>
            <Input
              id="lug_width_mm"
              name="lug_width_mm"
              type="number"
              step="0.5"
              min="6"
              max="30"
              placeholder="e.g. 20"
              defaultValue={watch?.lug_width_mm?.toString() ?? ""}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="water_resistance_m">Water Resistance (m)</FormLabel>
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
            <FormLabel htmlFor="dial_color">Dial Color</FormLabel>
            <Input
              id="dial_color"
              name="dial_color"
              placeholder="e.g. Black"
              defaultValue={watch?.dial_color ?? ""}
            />
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <FormLabel htmlFor="complication">Complications</FormLabel>
            <Input
              id="complication"
              name="complication"
              placeholder="e.g. Chronograph, Date, Moon Phase"
              defaultValue={watch?.complication ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle>Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <FormLabel htmlFor="category_select">Category *</FormLabel>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => setSelectedCategoryId(val ?? "")}
            >
              <SelectTrigger id="category_select">
                <span>
                  {selectedCategoryId
                    ? categories.find((c) => c.id === selectedCategoryId)?.name ?? "Select a category"
                    : "Select a category"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="" disabled>
                    No categories — create one in Config first
                  </SelectItem>
                ) : (
                  categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Labels */}
      {labels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const isSelected = selectedLabelIds.has(label.id)
                const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ring-2 ring-current/30`
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {label.name}
                  </button>
                )
              })}
            </div>
            {labels.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Click to toggle labels. Labels can be managed in Config.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ownership section */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <FormLabel htmlFor="condition">Condition</FormLabel>
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
            <FormLabel htmlFor="purchase_date">Purchase Date</FormLabel>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={watch?.purchase_date ?? ""}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="purchase_price">Purchase Price ($)</FormLabel>
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
            <FormLabel htmlFor="notes">Notes</FormLabel>
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
