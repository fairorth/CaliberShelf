"use client"

import { useActionState, useState, useTransition } from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  caseMaterialLabels,
  crystalLabels,
  caseShapeLabels,
  bezelTypeLabels,
  bezelMaterialLabels,
  KNOWN_COMPLICATIONS,
} from "@/lib/validations/watch"
import type { SpecFetchResponse } from "@/lib/validations/spec-fetch"
import { labelColorMap } from "@/lib/validations/label"
import { BrandCombobox } from "@/components/brand-combobox"
import { MovementCombobox } from "@/components/movement-combobox"
import { MovementPreview } from "@/components/movement-preview"
import { cn } from "@/lib/utils"
import { deleteWatch } from "@/lib/actions/watch-actions"
import { toast } from "sonner"
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
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<WatchActionState, FormData>(
    action,
    {}
  )
  const [isDeleting, startDeleteTransition] = useTransition()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // Dirty tracking for the sticky save bar. setState(true) is a no-op once set,
  // so wiring it to every change handler stays cheap.
  const [isDirty, setIsDirty] = useState(false)
  const markDirty = () => setIsDirty(true)

  // Return navigates immediately when clean; a dirty form asks first.
  function handleReturn() {
    if (isDirty) {
      setShowLeaveConfirm(true)
    } else {
      router.push(cancelHref)
    }
  }

  function handleDelete() {
    if (!watch) return
    startDeleteTransition(async () => {
      const result = await deleteWatch(watch.id)
      // On success the action redirects (throws), so we only land here on error.
      if (result?.error) toast.error(result.error)
    })
  }

  // Reference number is controlled so the autofill agent can propose one.
  // Agent-supplied refs carry reference_unverified until a human confirms.
  const [refNumber, setRefNumber] = useState(watch?.reference_number ?? "")
  const [refUnverified, setRefUnverified] = useState(
    watch?.reference_unverified ?? false
  )
  const [refAutofilled, setRefAutofilled] = useState(false)

  // Price checking is only meaningful when the agent can identify the exact
  // variant, so the checkbox is gated on having a reference number.
  const [hasRef, setHasRef] = useState(Boolean(watch?.reference_number?.trim()))
  const [priceCheckEnabled, setPriceCheckEnabled] = useState(
    watch?.price_check_enabled ?? false
  )

  // Track selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState(watch?.category_id ?? "")

  // ── Spec fields (controlled) ─────────────────────────────────
  // Controlled (not defaultValue) so the auto-fill agent can write into them.
  const initialSpecs = {
    case_material: (watch?.case_material ?? "stainless_steel") as string,
    crystal: (watch?.crystal ?? "sapphire") as string,
    case_shape: (watch?.case_shape ?? "") as string,
    bezel_type: (watch?.bezel_type ?? "") as string,
    bezel_material: (watch?.bezel_material ?? "") as string,
    case_diameter_mm: watch?.case_diameter_mm?.toString() ?? "",
    strap_width_mm: watch?.strap_width_mm?.toString() ?? "20",
    lug_to_lug_mm: watch?.lug_to_lug_mm?.toString() ?? "",
    case_height_mm: watch?.case_height_mm?.toString() ?? "",
    weight_g: watch?.weight_g?.toString() ?? "",
    water_resistance_m: watch?.water_resistance_m?.toString() ?? "100",
    dial_color: watch?.dial_color ?? "",
  }
  type SpecKey = keyof typeof initialSpecs
  const [specs, setSpecs] = useState(initialSpecs)

  // Fields the agent just filled — highlighted until the user edits them
  const [autofilled, setAutofilled] = useState<Set<string>>(new Set())
  const [isFetchingSpecs, setIsFetchingSpecs] = useState(false)
  const [specFetchResult, setSpecFetchResult] = useState<
    (SpecFetchResponse & { appliedCount: number; keptCount: number }) | null
  >(null)
  const [selectedBrandName, setSelectedBrandName] = useState(watch?.brand?.name ?? "")

  function setSpec(key: SpecKey, value: string) {
    setIsDirty(true)
    setAutofilled((prev) => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setSpecs((prev) => ({ ...prev, [key]: value }))
  }

  // Brass ring on fields the agent just filled
  const specHighlight = (key: SpecKey) =>
    autofilled.has(key) ? "border-brass/70 ring-1 ring-brass/40" : undefined

  function applySpecs(data: SpecFetchResponse) {
    const s = data.specs
    const updates: Partial<typeof initialSpecs> = {}
    const applied = new Set<string>()
    let kept = 0

    // Fill a field only when it holds no real user data: always fill empties;
    // on the ADD form also fill untouched defaults (WR 100, strap 20, etc.).
    // On the edit page, existing DB values are user data — never overwrite.
    const maybe = (key: SpecKey, value: string | null | undefined) => {
      if (value == null || value === "") return
      const current = specs[key]
      if (current === value) return
      const fillable = current === "" || (!watch && current === initialSpecs[key])
      if (!fillable) {
        kept++
        return
      }
      updates[key] = value
      applied.add(key)
    }

    maybe("case_diameter_mm", s.case_diameter_mm?.toString())
    maybe("strap_width_mm", s.strap_width_mm?.toString())
    maybe("lug_to_lug_mm", s.lug_to_lug_mm?.toString())
    maybe("case_height_mm", s.case_height_mm?.toString())
    maybe("weight_g", s.weight_g?.toString())
    maybe("water_resistance_m", s.water_resistance_m?.toString())
    maybe("dial_color", s.dial_color)
    maybe("case_material", s.case_material)
    maybe("crystal", s.crystal)
    maybe("case_shape", s.case_shape)
    maybe("bezel_type", s.bezel_type)
    maybe("bezel_material", s.bezel_material)

    // Agent-proposed reference: only fills an empty field, always flagged
    // unverified — a wrong reference poisons price-check and deal matching.
    let refApplied = false
    if (s.reference_number && refNumber.trim() === "") {
      setRefNumber(s.reference_number)
      setHasRef(true)
      setRefUnverified(true)
      setRefAutofilled(true)
      refApplied = true
    }

    if (applied.size > 0 || refApplied) {
      setSpecs((prev) => ({ ...prev, ...updates }))
      setAutofilled((prev) => new Set([...prev, ...applied]))
      setIsDirty(true)
    }

    // Merge complications: check known ones, append unknown ones to "other"
    if (s.complications.length > 0) {
      const knownLower = new Map(KNOWN_COMPLICATIONS.map((c) => [c.toLowerCase(), c]))
      const unknown: string[] = []
      const newKnown: string[] = []
      for (const comp of s.complications) {
        const canonical = knownLower.get(comp.trim().toLowerCase())
        if (canonical) {
          if (!checkedComplications.has(canonical)) newKnown.push(canonical)
        } else if (
          !otherComplication.toLowerCase().includes(comp.trim().toLowerCase())
        ) {
          unknown.push(comp.trim())
        }
      }
      if (newKnown.length > 0) {
        setCheckedComplications((prev) => new Set([...prev, ...newKnown]))
        setIsDirty(true)
      }
      if (unknown.length > 0) {
        setOtherComplication((prev) => [prev, ...unknown].filter(Boolean).join(", "))
        setIsDirty(true)
      }
    }

    const appliedCount = applied.size + (refApplied ? 1 : 0)
    setSpecFetchResult({ ...data, appliedCount, keptCount: kept })
    toast.success(
      `Filled ${appliedCount} field${appliedCount === 1 ? "" : "s"}` +
        `${refApplied ? " (reference needs verification)" : ""} · $${data.usage.cost_usd.toFixed(2)} API cost`
    )
  }

  async function handleAutofillSpecs(e: MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form
    if (!form) return
    const fd = new FormData(form)
    const modelName = String(fd.get("model") ?? "").trim()
    const reference = String(fd.get("reference_number") ?? "").trim()
    const brandName =
      selectedBrandName ||
      brands.find((b) => b.id === String(fd.get("brand_id") ?? ""))?.name ||
      ""
    if (!brandName || !modelName) {
      toast.error("Enter a brand and model first — the agent needs them to search.")
      return
    }
    setIsFetchingSpecs(true)
    try {
      const res = await fetch("/api/spec-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brandName,
          model: modelName,
          reference_number: reference,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Spec lookup failed.")
        return
      }
      applySpecs(data as SpecFetchResponse)
    } catch {
      toast.error("Spec lookup failed — network error.")
    } finally {
      setIsFetchingSpecs(false)
    }
  }

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
              onChange={(_id, name) => {
                markDirty()
                if (name) setSelectedBrandName(name)
              }}
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
            <div className="flex items-center gap-2">
              <FormLabel htmlFor="reference_number">Reference Number</FormLabel>
              {refUnverified && (
                <>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                    ⚠ needs verification
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRefUnverified(false)
                      markDirty()
                    }}
                    className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Mark verified
                  </button>
                </>
              )}
            </div>
            <input
              type="hidden"
              name="reference_unverified"
              value={refUnverified ? "on" : ""}
            />
            <Input
              id="reference_number"
              name="reference_number"
              placeholder="e.g. 310.30.42.50.01.001"
              value={refNumber}
              onChange={(e) => {
                setRefNumber(e.target.value)
                setHasRef(e.target.value.trim() !== "")
                // A human editing the reference counts as verification
                setRefUnverified(false)
                setRefAutofilled(false)
              }}
              className={cn(
                FIELD,
                "font-mono text-[13px]",
                (refAutofilled || refUnverified) &&
                  "border-amber-500/60 ring-1 ring-amber-500/30"
              )}
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
                onChange={markDirty}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span className="font-medium">Coming soon</span>
              <span className="text-xs text-muted-foreground">
                — ordered, awaiting arrival (use Notes for sale details)
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_wishlist"
                defaultChecked={watch?.is_wishlist ?? false}
                onChange={markDirty}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span className="font-medium">Wish list</span>
              <span className="text-xs text-muted-foreground">
                — not owned; excluded from collection counts and total value
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label
              className={cn(
                "flex items-center gap-2 text-sm",
                !hasRef && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="checkbox"
                name="price_check_enabled"
                checked={priceCheckEnabled && hasRef}
                disabled={!hasRef}
                onChange={(e) => {
                  setPriceCheckEnabled(e.target.checked)
                  markDirty()
                }}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span className="font-medium">Perform price checking</span>
              <span className="text-xs text-muted-foreground">
                {hasRef
                  ? "— include in automated market-value updates"
                  : "— requires a reference number"}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className={CARD_TITLE}>
              <span className={CHIP}>⚙️</span>
              Specifications
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutofillSpecs}
              disabled={isFetchingSpecs || isPending || isDeleting}
              className="shrink-0 border-brass/40 text-brass hover:bg-brass/10 hover:text-brass"
              title="Search the web for this watch's official specs and fill the empty fields"
            >
              {isFetchingSpecs ? "Searching the web…" : "✨ Auto-fill specs"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Agent result panel — review what was found before saving */}
          {specFetchResult && (
            <div className="space-y-1.5 rounded-lg border border-brass/30 bg-brass/5 px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-brass">
                  Filled {specFetchResult.appliedCount} field
                  {specFetchResult.appliedCount === 1 ? "" : "s"}
                  {specFetchResult.keptCount > 0 &&
                    ` · kept ${specFetchResult.keptCount} existing value${specFetchResult.keptCount === 1 ? "" : "s"}`}{" "}
                  · confidence: {specFetchResult.specs.confidence}
                </p>
                <button
                  type="button"
                  onClick={() => setSpecFetchResult(null)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
              {specFetchResult.specs.suggested_caliber && (
                <p className="text-muted-foreground">
                  Suggested caliber:{" "}
                  <span className="font-mono text-[13px] text-foreground">
                    {specFetchResult.specs.suggested_caliber}
                  </span>{" "}
                  — select it in the Movement box above if it matches.
                </p>
              )}
              {specFetchResult.specs.notes && (
                <p className="text-muted-foreground">{specFetchResult.specs.notes}</p>
              )}
              {specFetchResult.specs.sources.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  Sources:{" "}
                  {specFetchResult.specs.sources.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-brass"
                    >
                      {i > 0 && ", "}
                      {(() => {
                        try {
                          return new URL(url).hostname
                        } catch {
                          return url
                        }
                      })()}
                    </a>
                  ))}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {specFetchResult.usage.searches} web search
                {specFetchResult.usage.searches === 1 ? "" : "es"} · $
                {specFetchResult.usage.cost_usd.toFixed(2)} API cost (
                {specFetchResult.model}) · review the highlighted fields, then Save.
              </p>
            </div>
          )}
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
          {/* Selects submit via hidden inputs (controlled value + name prop
              double-submits on some Select implementations) */}
          <input type="hidden" name="case_material" value={specs.case_material} />
          <input type="hidden" name="crystal" value={specs.crystal} />
          <input type="hidden" name="case_shape" value={specs.case_shape} />
          <input type="hidden" name="bezel_type" value={specs.bezel_type} />
          <input type="hidden" name="bezel_material" value={specs.bezel_material} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <FormLabel htmlFor="case_material">Case Material</FormLabel>
              <Select
                value={specs.case_material}
                onValueChange={(val) => setSpec("case_material", val ?? "")}
              >
                <SelectTrigger
                  id="case_material"
                  className={cn(FIELD, specHighlight("case_material"))}
                >
                  <span>
                    {specs.case_material
                      ? caseMaterialLabels[specs.case_material]
                      : "None selected"}
                  </span>
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
              <Select
                value={specs.crystal}
                onValueChange={(val) => setSpec("crystal", val ?? "")}
              >
                <SelectTrigger id="crystal" className={cn(FIELD, specHighlight("crystal"))}>
                  <span>
                    {specs.crystal ? crystalLabels[specs.crystal] : "None selected"}
                  </span>
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
              <FormLabel htmlFor="case_shape">Case Shape</FormLabel>
              <Select
                value={specs.case_shape}
                onValueChange={(val) => setSpec("case_shape", val ?? "")}
              >
                <SelectTrigger
                  id="case_shape"
                  className={cn(FIELD, specHighlight("case_shape"))}
                >
                  <span>
                    {specs.case_shape ? caseShapeLabels[specs.case_shape] : "None selected"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None selected</SelectItem>
                  {Object.entries(caseShapeLabels).map(([value, label]) => (
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
                value={specs.case_diameter_mm}
                onChange={(e) => setSpec("case_diameter_mm", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("case_diameter_mm"))}
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
                value={specs.strap_width_mm}
                onChange={(e) => setSpec("strap_width_mm", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("strap_width_mm"))}
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
                value={specs.lug_to_lug_mm}
                onChange={(e) => setSpec("lug_to_lug_mm", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("lug_to_lug_mm"))}
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
                value={specs.case_height_mm}
                onChange={(e) => setSpec("case_height_mm", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("case_height_mm"))}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="weight_g">Weight (g)</FormLabel>
              <Input
                id="weight_g"
                name="weight_g"
                type="number"
                step="0.5"
                min="5"
                max="1000"
                value={specs.weight_g}
                onChange={(e) => setSpec("weight_g", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("weight_g"))}
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
                value={specs.water_resistance_m}
                onChange={(e) => setSpec("water_resistance_m", e.target.value)}
                className={cn(FIELD, "font-mono", specHighlight("water_resistance_m"))}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="bezel_type">Bezel Type</FormLabel>
              <Select
                value={specs.bezel_type}
                onValueChange={(val) => setSpec("bezel_type", val ?? "")}
              >
                <SelectTrigger
                  id="bezel_type"
                  className={cn(FIELD, specHighlight("bezel_type"))}
                >
                  <span>
                    {specs.bezel_type ? bezelTypeLabels[specs.bezel_type] : "None selected"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None selected</SelectItem>
                  {Object.entries(bezelTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="bezel_material">Bezel Material</FormLabel>
              <Select
                value={specs.bezel_material}
                onValueChange={(val) => setSpec("bezel_material", val ?? "")}
              >
                <SelectTrigger
                  id="bezel_material"
                  className={cn(FIELD, specHighlight("bezel_material"))}
                >
                  <span>
                    {specs.bezel_material
                      ? bezelMaterialLabels[specs.bezel_material]
                      : "None selected"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None selected</SelectItem>
                  {Object.entries(bezelMaterialLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="dial_color">Dial Color</FormLabel>
              <Input
                id="dial_color"
                name="dial_color"
                placeholder="e.g. Black"
                value={specs.dial_color}
                onChange={(e) => setSpec("dial_color", e.target.value)}
                className={cn(FIELD, specHighlight("dial_color"))}
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
              {watch && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending || isDeleting}
                      />
                    }
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this watch?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;
                        {[watch.brand?.name, watch.model].filter(Boolean).join(" ")}&quot; and
                        all its photos. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete Watch
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleReturn}
                disabled={isPending || isDeleting}
              >
                Return
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isPending || isDeleting}
                className="bg-brass text-[#1a1206] hover:bg-brass/90 disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          {/* Unsaved-changes prompt for Return */}
          <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes that will be lost if you leave now.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push(cancelHref)}>
                  Discard &amp; Return
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
