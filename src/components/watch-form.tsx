"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
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
  KNOWN_COMPLICATIONS,
} from "@/lib/validations/watch"
import { labelColorMap } from "@/lib/validations/label"
import { BrandCombobox } from "@/components/brand-combobox"
import { MovementCombobox } from "@/components/movement-combobox"
import { MovementPreview } from "@/components/movement-preview"
import { cn } from "@/lib/utils"
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
  /** Render the fixed dirty-state save bar instead of an inline submit button. */
  stickyBar?: boolean
  /** Where Cancel navigates when stickyBar is on. */
  cancelHref?: string
}

// Filled dark input with a brass focus ring (the redesign's field treatment).
const FIELD = "bg-[#1b212a] border-white/12 focus-visible:border-brass/55 focus-visible:ring-brass/25"

// Brass-accented spec card (matches the read-only Detail cards).
const CARD = "overflow-hidden rounded-2xl border-l-2 border-l-brass/40"
const CARD_HEADER = "bg-brass/5"
const CARD_TITLE = "flex items-center gap-2.5 font-display text-[19px] font-semibold"
const CHIP = "flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brass/15 text-sm text-brass"

export function WatchForm({
  action,
  watch,
  submitLabel = "Add Watch",
  brands,
  movements,
  categories,
  labels,
  defaultLabelIds = [],
  stickyBar = false,
  cancelHref = "/collection",
}: WatchFormProps) {
  const [state, formAction, isPending] = useActionState<WatchActionState, FormData>(
    action,
    {}
  )

  // Dirty tracking for the sticky save bar. setState(true) is a no-op once set,
  // so wiring it to every change handler stays cheap.
  const [isDirty, setIsDirty] = useState(false)
  const markDirty = () => setIsDirty(true)

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
    markDirty()
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
    <form
      action={formAction}
      onInput={markDirty}
      onChange={markDirty}
      className={stickyBar ? "space-y-[18px] pb-4" : "space-y-6"}
    >
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
      <Card className={CARD}>
        <CardHeader className={CARD_HEADER}>
          <CardTitle className={CARD_TITLE}>
            <span className={CHIP}>🏷️</span>
            Identity & Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <FormLabel>Brand <span className="text-brass">*</span></FormLabel>
            <BrandCombobox
              brands={brands}
              defaultBrandId={watch?.brand_id}
              onChange={markDirty}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="model">Model <span className="text-brass">*</span></FormLabel>
            <Input
              id="model"
              name="model"
              placeholder="e.g. Speedmaster Professional"
              defaultValue={watch?.model ?? ""}
              required
              className={FIELD}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="nickname">Nickname</FormLabel>
            <Input
              id="nickname"
              name="nickname"
              placeholder="e.g. Moonwatch"
              defaultValue={watch?.nickname ?? ""}
              className={FIELD}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="reference_number">Reference Number</FormLabel>
            <Input
              id="reference_number"
              name="reference_number"
              placeholder="e.g. 310.30.42.50.01.001"
              defaultValue={watch?.reference_number ?? ""}
              className={cn(FIELD, "font-mono text-[13px]")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FormLabel htmlFor="serial_number">Serial Number</FormLabel>
            <Input
              id="serial_number"
              name="serial_number"
              placeholder="Private — only visible to you"
              defaultValue={watch?.serial_number ?? ""}
              className={cn(FIELD, "font-mono text-[13px]")}
            />
          </div>

          {/* Ownership fields */}
          <div className="space-y-2">
            <FormLabel htmlFor="purchase_date">Purchase Date</FormLabel>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={watch?.purchase_date ?? ""}
              className={cn(FIELD, "[color-scheme:dark]")}
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
              className={cn(FIELD, "font-mono")}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_coming_soon"
                defaultChecked={watch?.is_coming_soon ?? false}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span className="font-medium">Coming soon</span>
              <span className="text-xs text-muted-foreground">
                — ordered, awaiting arrival (use Notes for sale details)
              </span>
            </label>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <FormLabel htmlFor="notes">Notes</FormLabel>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional details about this watch..."
              rows={3}
              defaultValue={watch?.notes ?? ""}
              className={FIELD}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Specifications ──────────────────────────────── */}
      <Card className={CARD}>
        <CardHeader className={CARD_HEADER}>
          <CardTitle className={CARD_TITLE}>
            <span className={CHIP}>⚙️</span>
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Movement subsection */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs opacity-60">⏱️</span>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Movement</h4>
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="space-y-2">
            <FormLabel>Movement / Caliber</FormLabel>
            <MovementCombobox
              movements={movements}
              defaultMovementId={watch?.movement_id ?? undefined}
              onMovementChange={(m) => {
                markDirty()
                setSelectedMovement(m)
              }}
            />
          </div>

          {/* Movement preview (read-only) — shared component */}
          {selectedMovement && (
            <MovementPreview movement={selectedMovement} />
          )}

          {/* Case subsection */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60">🔩</span>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Case</h4>
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="case_material">Case Material</FormLabel>
              <Select name="case_material" defaultValue={watch?.case_material ?? "stainless_steel"}>
                <SelectTrigger id="case_material" className={FIELD}>
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
              <Select name="crystal" defaultValue={watch?.crystal ?? "sapphire"}>
                <SelectTrigger id="crystal" className={FIELD}>
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
                defaultValue={watch?.case_diameter_mm?.toString() ?? ""}
                className={cn(FIELD, "font-mono")}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="strap_width_mm">Strap Width (mm)</FormLabel>
              <Input
                id="strap_width_mm"
                name="strap_width_mm"
                type="number"
                step="0.5"
                min="6"
                max="30"
                defaultValue={watch?.strap_width_mm?.toString() ?? "20"}
                className={cn(FIELD, "font-mono")}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="lug_to_lug_mm">Lug-to-Lug (mm)</FormLabel>
              <Input
                id="lug_to_lug_mm"
                name="lug_to_lug_mm"
                type="number"
                step="0.1"
                min="20"
                max="80"
                defaultValue={watch?.lug_to_lug_mm?.toString() ?? ""}
                className={cn(FIELD, "font-mono")}
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
                defaultValue={watch?.case_height_mm?.toString() ?? ""}
                className={cn(FIELD, "font-mono")}
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
                defaultValue={watch?.water_resistance_m?.toString() ?? "100"}
                className={cn(FIELD, "font-mono")}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="dial_color">Dial Color</FormLabel>
              <Input
                id="dial_color"
                name="dial_color"
                placeholder="e.g. Black"
                defaultValue={watch?.dial_color ?? ""}
                className={FIELD}
              />
            </div>
          </div>

          {/* Complications subsection */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60">✨</span>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Complications</h4>
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {KNOWN_COMPLICATIONS.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-brass"
                    checked={checkedComplications.has(name)}
                    onChange={(e) => {
                      markDirty()
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
              className={FIELD}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Card 3: Category & Labels ───────────────────────────── */}
      <Card className={CARD}>
        <CardHeader className={CARD_HEADER}>
          <CardTitle className={CARD_TITLE}>
            <span className={CHIP}>📂</span>
            Category & Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category */}
          <div className="max-w-sm space-y-2">
            <FormLabel htmlFor="category_select">Category <span className="text-brass">*</span></FormLabel>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => {
                markDirty()
                setSelectedCategoryId(val ?? "")
              }}
            >
              <SelectTrigger id="category_select" className={FIELD}>
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

      {stickyBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-4 sm:px-[30px]">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                isDirty
                  ? "bg-brass shadow-[0_0_8px_var(--brass)]"
                  : "bg-muted-foreground/50"
              )}
            />
            <span className={cn("text-sm", isDirty ? "text-brass" : "text-muted-foreground")}>
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <div className="ml-auto flex gap-2.5">
              <Button type="button" variant="outline" render={<Link href={cancelHref} />}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isPending}
                className="bg-brass text-[#1a1206] hover:bg-brass/90 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      )}
    </form>
  )
}
