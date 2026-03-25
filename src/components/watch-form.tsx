"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  movementLabels,
  KNOWN_COMPLICATIONS,
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

  // Track selected movement for preview
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(
    watch?.movement ?? null
  )

  // Complications state — parse existing data
  const [checkedComplications, setCheckedComplications] = useState<Set<string>>(() => {
    const parts = (watch?.complication ?? "").split(",").map((s) => s.trim()).filter(Boolean)
    const knownLower = new Map(KNOWN_COMPLICATIONS.map((c) => [c.toLowerCase(), c]))
    const checked = new Set<string>()
    for (const p of parts) {
      const canonical = knownLower.get(p.toLowerCase())
      if (canonical) checked.add(canonical)
    }
    return checked
  })

  const [otherComplication, setOtherComplication] = useState(() => {
    const parts = (watch?.complication ?? "").split(",").map((s) => s.trim()).filter(Boolean)
    const knownLower = new Set(KNOWN_COMPLICATIONS.map((c) => c.toLowerCase()))
    return parts.filter((p) => !knownLower.has(p.toLowerCase())).join(", ")
  })

  // Assemble complication value for hidden input
  const otherParts = otherComplication
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !new Set(KNOWN_COMPLICATIONS.map((c) => c.toLowerCase())).has(p.toLowerCase()))
  const complicationValue = [...Array.from(checkedComplications), ...otherParts].join(", ")

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

      {/* Hidden inputs */}
      <input type="hidden" name="category_id" value={selectedCategoryId} />
      <input type="hidden" name="label_ids" value={Array.from(selectedLabelIds).join(",")} />
      <input type="hidden" name="complication" value={complicationValue} />
      <input type="hidden" name="purchase_currency" value={watch?.purchase_currency ?? "USD"} />

      {/* ── Card 1: Identity & Ownership ────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs">
              🏷️
            </span>
            Identity & Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Ownership fields */}
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

      {/* ── Card 2: Specifications ──────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-xs">
              ⚙️
            </span>
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Movement subsection */}
          <div className="flex items-center gap-2 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Movement</h4>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="space-y-2">
            <FormLabel>Movement / Caliber</FormLabel>
            <MovementCombobox
              movements={movements}
              defaultMovementId={watch?.movement_id ?? undefined}
              onMovementChange={setSelectedMovement}
            />
          </div>

          {/* Movement preview (read-only) */}
          {selectedMovement && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedMovement.caliber_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {movementLabels[selectedMovement.movement_type] ?? selectedMovement.movement_type}
                </Badge>
                {selectedMovement.user_id === null && (
                  <span className="text-xs text-muted-foreground" title="System caliber">🌐</span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {selectedMovement.manufacturer && (
                  <span>Mfr: {selectedMovement.manufacturer}</span>
                )}
                {selectedMovement.jewel_count !== null && (
                  <span>{selectedMovement.jewel_count} jewels</span>
                )}
                {selectedMovement.beat_rate_vph !== null && (
                  <span>{selectedMovement.beat_rate_vph.toLocaleString()} vph</span>
                )}
                {selectedMovement.power_reserve_hours !== null && (
                  <span>{selectedMovement.power_reserve_hours}h reserve</span>
                )}
                {selectedMovement.diameter_mm !== null && (
                  <span>
                    {selectedMovement.diameter_mm}mm × {selectedMovement.height_mm ?? "?"}mm
                  </span>
                )}
              </div>
              {(selectedMovement.hacking || selectedMovement.hand_windable || selectedMovement.quickset_date) && (
                <div className="flex flex-wrap gap-1">
                  {selectedMovement.hacking && (
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400 text-[10px]">Hacking</Badge>
                  )}
                  {selectedMovement.hand_windable && (
                    <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400 text-[10px]">Hand Wind</Badge>
                  )}
                  {selectedMovement.quickset_date && (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-[10px]">Quickset Date</Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Case subsection */}
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Case</h4>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <FormLabel htmlFor="case_height_mm">Case Height (mm)</FormLabel>
              <Input
                id="case_height_mm"
                name="case_height_mm"
                type="number"
                step="0.1"
                min="4"
                max="25"
                placeholder="e.g. 13.5"
                defaultValue={watch?.case_height_mm?.toString() ?? ""}
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
          </div>

          {/* Complications subsection */}
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Complications</h4>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {KNOWN_COMPLICATIONS.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={checkedComplications.has(name)}
                    onChange={(e) => {
                      setCheckedComplications((prev) => {
                        const next = new Set(prev)
                        if (e.target.checked) {
                          next.add(name)
                        } else {
                          next.delete(name)
                        }
                        return next
                      })
                    }}
                  />
                  {name}
                </label>
              ))}
            </div>
            <Input
              placeholder="Other complications (comma-separated)"
              value={otherComplication}
              onChange={(e) => setOtherComplication(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 3: Category & Labels ───────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-xs">
              📂
            </span>
            Category & Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category */}
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

          {/* Labels */}
          {labels.length > 0 && (
            <div className="space-y-2">
              <FormLabel>Labels</FormLabel>
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
              <p className="text-xs text-muted-foreground">
                Click to toggle labels. Labels can be managed in Config.
              </p>
            </div>
          )}
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
