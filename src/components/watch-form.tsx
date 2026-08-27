"use client"

import {
  useActionState,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react"
import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Cog,
  FolderOpen,
  Layers,
  Plus,
  Ruler,
  Settings2,
  Tag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
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
import { SectionCard, SectionSubHeading, SECTION_LABEL } from "@/components/section-card"
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
  KNOWN_COMPLICATIONS,
} from "@/lib/validations/watch"
import type { SpecFetchResponse } from "@/lib/validations/spec-fetch"
import { labelColorMap } from "@/lib/validations/label"
import { BrandCombobox } from "@/components/brand-combobox"
import { MovementCombobox } from "@/components/movement-combobox"
import { MovementPreview } from "@/components/movement-preview"
import { CatalogCombobox } from "@/components/catalog-combobox"
import type { CatalogWatch } from "@/lib/actions/chronoscout-actions"
import { cn } from "@/lib/utils"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { deleteWatch } from "@/lib/actions/watch-actions"
import { toast } from "sonner"
import type { WatchActionState } from "@/lib/actions/watch-actions"
import type { Watch, Brand, Movement, Category, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"
import { boxOptions, boxLabel, DEFAULT_BOX_COUNT } from "@/lib/boxes"

interface WatchFormProps {
  action: (prevState: WatchActionState, formData: FormData) => Promise<WatchActionState>
  watch?: Watch & { brand?: Brand; movement?: Movement | null }
  submitLabel?: string
  brands: Brand[]
  movements: Movement[]
  categories: Category[]
  labels: Label[]
  /** How many numbered boxes to offer in the Box dropdown (Config → Boxes). */
  boxCount?: number
  /** Optional per-box descriptions from Config → Boxes (presentation only). */
  boxDescriptions?: Record<string, string>
  defaultLabelIds?: string[]
  /** Render the fixed dirty-state save bar instead of an inline submit button. */
  stickyBar?: boolean
  /** Where Cancel navigates when stickyBar is on. */
  cancelHref?: string
}

// Filled dark input with a brass focus ring (the redesign's field treatment).
// §3.7 — `--card` with a `--border` hairline, for filled and empty alike.
// This was `bg-input`, a distinctly grey fill (oklch 0.89 against the card's
// 0.99), which made every field holding a value look read-only — while the one
// EMPTY field on the page looked like the only editable one. Exactly backwards.
// Grey fill is now reserved for genuinely disabled controls.
// One step down from the default 15px: these are short values — dates, prices,
// reference codes — and at 15px in a two-column grid the form was mostly white
// space. `md:text-xs` is needed because the Input base sets `md:text-sm`, which
// would otherwise win back the size at the breakpoint that matters.
const FIELD =
  "bg-card border-border text-xs md:text-xs focus-visible:border-brass/55 focus-visible:ring-brass/25"

// §3.4 — selects must fill their grid cell like every other control. The
// shadcn trigger is `w-fit` by default, which is why Category rendered about a
// fifth the width of the text input beside it and the row looked broken.
const SELECT_FIELD = `${FIELD} w-full`

// Neutral spec card — identity comes from icon + title, not a colored edge
// (E1: brass is never decoration).
/** Field labels: 13px muted, the same size as the value beneath them. */
const LABEL = SECTION_LABEL

type WatchStatus = "owned" | "coming_soon" | "wishlist"

const STATUS_OPTIONS: { value: WatchStatus; label: string; hint: string }[] = [
  { value: "owned", label: "Owned", hint: "In the collection and counted in totals." },
  {
    value: "coming_soon",
    label: "Coming soon",
    hint: "Ordered, awaiting arrival (use Notes for sale details).",
  },
  {
    value: "wishlist",
    label: "Wish list",
    hint: "Not owned; excluded from collection counts and total value.",
  },
]

/** Numeric spec field: right-aligned mono value with the unit rendered as a
 *  suffix inside the field (C3) — the form's spec-sheet treatment. */
function MeasureField({
  id,
  label,
  suffix,
  value,
  onChange,
  step,
  min,
  max,
  className,
}: {
  id: string
  label: string
  suffix: string
  value: string
  onChange: (value: string) => void
  step?: string
  min?: string
  max?: string
  className?: string
}) {
  return (
    <div className="space-y-1.5">
      <FormLabel htmlFor={id} className={LABEL}>
        {label}
      </FormLabel>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            FIELD,
            "pr-10 text-right font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            className
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  )
}

// Serialise the form's submittable state for dirty comparison. FormData
// follows DOM order, so the result is stable across renders; unchecked
// checkboxes are simply absent, which the comparison handles for free.
function serializeForm(form: HTMLFormElement): string {
  const parts: string[] = []
  for (const [key, value] of new FormData(form).entries()) {
    parts.push(`${key}=${typeof value === "string" ? value : value.name}`)
  }
  return parts.join("\u0000")
}

export function WatchForm({
  action,
  watch,
  submitLabel = "Add Watch",
  brands,
  movements,
  categories,
  labels,
  boxCount = DEFAULT_BOX_COUNT,
  boxDescriptions,
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

  // ── Dirty tracking (two-way, C1) ─────────────────────────────
  // Dirty = the form's current FormData differs from a snapshot taken on
  // mount (and re-taken after a successful save). Reverting an edit returns
  // the bar to "All changes saved". Change handlers call markDirty(), which
  // just forces a render — the comparison effect below does the real work
  // after controlled state has been flushed into the hidden inputs.
  const [isDirty, setIsDirty] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const snapshotRef = useRef<string | null>(null)
  const [, markDirty] = useReducer((c: number) => c + 1, 0)

  // Re-snapshot to the saved values after a successful submit so the bar
  // returns to "All changes saved" without a remount. (Actions that redirect
  // unmount the form anyway; this covers the return-state path.)
  useEffect(() => {
    if (state.success && formRef.current) {
      snapshotRef.current = serializeForm(formRef.current)
    }
  }, [state])

  // Runs every render (deliberately no dep array): uncontrolled inputs tick a
  // reducer, controlled fields re-render on their own, and either way the DOM
  // must be read *after* the commit. One FormData walk — cheap. The setState
  // is guarded, so it can't loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional every-render comparison against the snapshot
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    if (snapshotRef.current === null) {
      snapshotRef.current = serializeForm(form)
      return
    }
    const dirty = serializeForm(form) !== snapshotRef.current
    if (dirty !== isDirty) setIsDirty(dirty)
  })

  // Warn on reload/close while dirty (C1).
  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isDirty])

  // Register with the app-level guard so nav-header links warn too (C1).
  const { setDirty: setGlobalDirty } = useUnsavedChanges()
  useEffect(() => {
    setGlobalDirty(isDirty)
    return () => setGlobalDirty(false)
  }, [isDirty, setGlobalDirty])

  // Box is a dropdown of numbered boxes (Box1..BoxN). Preserve any legacy or
  // custom free-text value already on the watch so nothing is silently dropped.
  const [box, setBox] = useState(watch?.box ?? "")
  const boxChoices = boxOptions(boxCount)
  const boxSelectOptions =
    box && !boxChoices.includes(box) ? [box, ...boxChoices] : boxChoices

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

  // Status is one segmented control (C3): wish-list beats coming-soon beats
  // owned, matching the app's own filter precedence.
  const [status, setStatus] = useState<WatchStatus>(
    watch?.is_wishlist ? "wishlist" : watch?.is_coming_soon ? "coming_soon" : "owned"
  )

  // ── Spec fields (controlled) ─────────────────────────────────
  // Controlled (not defaultValue) so the auto-fill agent can write into them.
  const initialSpecs = {
    case_material: (watch?.case_material ?? "stainless_steel") as string,
    crystal: (watch?.crystal ?? "sapphire") as string,
    case_shape: (watch?.case_shape ?? "") as string,
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
  // Result note after a ChronoScout catalog prefill (dimensions only, free).
  const [catalogResult, setCatalogResult] = useState<
    { name: string; appliedCount: number; keptCount: number } | null
  >(null)
  const [selectedBrandName, setSelectedBrandName] = useState(watch?.brand?.name ?? "")

  function setSpec(key: SpecKey, value: string) {
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
    }

    // Merge complications: check any that match our fixed set; ignore the rest.
    if (s.complications.length > 0) {
      const knownLower = new Map(KNOWN_COMPLICATIONS.map((c) => [c.toLowerCase(), c]))
      const newKnown: string[] = []
      for (const comp of s.complications) {
        const canonical = knownLower.get(comp.trim().toLowerCase())
        if (canonical && !checkedComplications.has(canonical)) newKnown.push(canonical)
      }
      if (newKnown.length > 0) {
        setCheckedComplications((prev) => new Set([...prev, ...newKnown]))
      }
    }

    const appliedCount = applied.size + (refApplied ? 1 : 0)
    setSpecFetchResult({ ...data, appliedCount, keptCount: kept })
    toast.success(
      `Filled ${appliedCount} field${appliedCount === 1 ? "" : "s"}` +
        `${refApplied ? " (reference needs verification)" : ""} · $${data.usage.cost_usd.toFixed(2)} API cost`
    )
  }

  // Apply a picked catalog match's dimensions. ChronoScout carries only the
  // five measurements below; everything else is left to ✨ or manual entry.
  // Reuses the same fill-empty + highlight rule as applySpecs: never overwrite
  // real data (on the add form, untouched defaults are still fillable).
  function applyCatalogDimensions(row: CatalogWatch) {
    const updates: Partial<typeof initialSpecs> = {}
    const applied = new Set<string>()
    let kept = 0

    const maybeDim = (key: SpecKey, value: number | null) => {
      if (value == null) return
      const v = String(value)
      const current = specs[key]
      if (current === v) return
      const fillable = current === "" || (!watch && current === initialSpecs[key])
      if (!fillable) {
        kept++
        return
      }
      updates[key] = v
      applied.add(key)
    }

    maybeDim("case_diameter_mm", row.diameter_mm)
    maybeDim("strap_width_mm", row.between_lugs_mm) // between-lugs = lug width
    maybeDim("lug_to_lug_mm", row.lug_to_lug_mm)
    maybeDim("case_height_mm", row.thickness_mm)
    maybeDim("weight_g", row.weight_g)

    if (applied.size > 0) {
      setSpecs((prev) => ({ ...prev, ...updates }))
      setAutofilled((prev) => new Set([...prev, ...applied]))
    }
    setCatalogResult({ name: row.name, appliedCount: applied.size, keptCount: kept })
    toast.success(
      applied.size > 0
        ? `Filled ${applied.size} dimension${applied.size === 1 ? "" : "s"} from the catalog`
        : "Catalog match had no new dimensions to fill"
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
  // §3.5 — collapsed by default, expanded automatically when any acquisition
  // cost is already recorded, so an existing value can never be hidden behind
  // a disclosure the reader has no reason to open.
  const [showAcqCosts, setShowAcqCosts] = useState(
    Boolean(watch?.acq_shipping_cents || watch?.acq_tax_cents || watch?.acq_duty_cents)
  )

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

  // Assemble complication value for the hidden input — only the fixed supported
  // set (KNOWN_COMPLICATIONS); free-text "other" complications are not allowed.
  const complicationValue = Array.from(checkedComplications).join(", ")

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
  const dollarsDefault = (cents: number | null | undefined) =>
    cents != null ? (cents / 100).toFixed(2) : ""

  return (
    <form
      ref={formRef}
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

      {/* ── Card 1: Identity (§3.3) ──────────────────────────────
          Identity and money are two different things and now live in two
          cards, matching how the view page has always shown them. */}
      <SectionCard id="identity" icon={Tag} title="Identity" contentClassName="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1">
            <FormLabel className={LABEL}>Brand <span className="text-brass">*</span></FormLabel>
            <BrandCombobox
              brands={brands}
              defaultBrandId={watch?.brand_id}
              onChange={(_id, name) => {
                markDirty()
                if (name) setSelectedBrandName(name)
              }}
            />
          </div>
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="model">Model <span className="text-brass">*</span></FormLabel>
            <Input
              id="model"
              name="model"
              defaultValue={watch?.model ?? ""}
              required
              className={FIELD}
            />
          </div>
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="nickname">Nickname</FormLabel>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={watch?.nickname ?? ""}
              className={FIELD}
            />
          </div>
          {/* Category sits with identity, not with Labels: it is what the
              watch *is* (a design archetype), while a label is something you
              stuck on it. Placed just before Reference Number so the two share
              a row on wide screens. */}
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="category_select">Category <span className="text-brass">*</span></FormLabel>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => {
                markDirty()
                setSelectedCategoryId(val ?? "")
              }}
            >
              <SelectTrigger id="category_select" className={SELECT_FIELD}>
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FormLabel className={LABEL} htmlFor="reference_number">Reference Number</FormLabel>
              {refUnverified && (
                <>
                  <span className="rounded-full px-2 py-0.5 text-2xs font-medium text-brass ring-1 ring-brass/45">
                    ⚠ needs verification
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRefUnverified(false)
                      markDirty()
                    }}
                    className="text-2xs font-medium text-primary underline-offset-2 hover:underline"
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
                "font-mono text-xs",
                (refAutofilled || refUnverified) &&
                  "border-brass/60 ring-1 ring-brass/30"
              )}
            />
          </div>
          {/* §3.4 — half a row, not the full ~970px. A field the width of a
              paragraph invites a paragraph; this holds a short alphanumeric
              code. §3.8 — the reassurance is a persistent help line, not a
              placeholder that vanishes the moment you start typing, which is
              precisely when it matters. */}
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="serial_number">Serial Number</FormLabel>
            <Input
              id="serial_number"
              name="serial_number"
              defaultValue={watch?.serial_number ?? ""}
              className={cn(FIELD, "font-mono text-xs")}
            />
          </div>

      </SectionCard>

      {/* ── Card 2: Ownership (§3.3) ─────────────────────────────
          Split out of the old `Identity & Ownership`. The view page has
          always shown Specifications and Ownership as separate cards; the edit
          page merged identity and money into one, so the same data had two
          shapes depending on which page you were on.

          §3.4 — settled on 2 columns, with deliberate full-width exceptions
          (the cost row, the ownership tier, notes). The old card changed
          rhythm five times top to bottom and read as accretion. */}
      <SectionCard id="ownership" icon={Wallet} title="Ownership" contentClassName="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="purchase_date">Purchase Date</FormLabel>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={watch?.purchase_date ?? ""}
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="purchase_price">Purchase Price ($)</FormLabel>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={purchasePriceDefault}
              className={cn(FIELD, "font-mono")}
            />
          </div>

          {/* §3.5 — three fields reading 0.00 on every one of 121 watches is a
              lot of nothing to scroll past. Collapsed by default, and expanded
              automatically whenever any of them is non-zero, so the Phase 5
              cost-basis feature costs nothing on the watches that do not use
              it. The DB derives cost basis from purchase + these three in a
              generated column (00043). */}
          <div className="space-y-1 sm:col-span-2">
            {showAcqCosts ? (
              <>
                <FormLabel className={LABEL}>Acquisition costs ($) — count toward cost basis</FormLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["acq_shipping", "Shipping", watch?.acq_shipping_cents],
                      ["acq_tax", "Tax", watch?.acq_tax_cents],
                      ["acq_duty", "Duty", watch?.acq_duty_cents],
                    ] as const
                  ).map(([name, label, cents]) => (
                    <div key={name} className="space-y-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <Input
                        id={name}
                        name={name}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={dollarsDefault(cents)}
                        className={cn(FIELD, "font-mono")}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAcqCosts(true)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brass"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add acquisition costs (shipping, tax, duty)
              </button>
            )}
          </div>

          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="box">Box</FormLabel>
            <input type="hidden" name="box" value={box} />
            <Select
              value={box}
              onValueChange={(val) => {
                markDirty()
                setBox(val ?? "")
              }}
            >
              <SelectTrigger id="box" className={SELECT_FIELD}>
                <span>{box ? boxLabel(box, boxDescriptions) : ""}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No box</SelectItem>
                {boxSelectOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {boxLabel(b, boxDescriptions)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* One Ownership control — a watch is exactly one of these (C3,
              DECISIONS.md §6). The columns stay is_coming_soon/is_wishlist;
              the control guarantees they are never both true.

              §2.6 — "Ownership", not "Status". The view page's Lifecycle
              (Owned → Candidate → Listed → Sold) is a different axis that also
              contains a value called "Owned"; two controls named the same
              thing, both offering "Owned", is a collision worth ending. */}
          <div className="space-y-1">
            <FormLabel className={LABEL}>Ownership</FormLabel>
            <input type="hidden" name="is_coming_soon" value={status === "coming_soon" ? "on" : ""} />
            <input type="hidden" name="is_wishlist" value={status === "wishlist" ? "on" : ""} />
            <div
              role="radiogroup"
              aria-label="Ownership"
              className="flex h-8 w-full overflow-hidden rounded-lg border border-border"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={status === opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "flex-1 px-2 text-xs font-medium transition-colors [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border",
                    status === opt.value
                      ? "bg-brass/15 text-brass"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <FormLabel className={LABEL} htmlFor="notes">Notes</FormLabel>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={watch?.notes ?? ""}
              className={FIELD}
            />
          </div>
      </SectionCard>

      {/* ── Card 2: Specifications ──────────────────────────────── */}
      <SectionCard
        id="specifications"
        icon={Settings2}
        title="Specifications"
        contentClassName="space-y-5"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CatalogCombobox
              defaultQuery={[selectedBrandName, watch?.model].filter(Boolean).join(" ")}
              onApply={applyCatalogDimensions}
              disabled={isFetchingSpecs || isPending || isDeleting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutofillSpecs}
              disabled={isFetchingSpecs || isPending || isDeleting}
              className="shrink-0 border-brass/40 text-brass hover:bg-brass/10 hover:text-brass"
              title="Search the web for this watch's official specs and fill the empty fields"
            >
              {isFetchingSpecs ? "Searching the web…" : "✨ Fill from AI"}
            </Button>
          </div>
        }
      >
        {/* §3.2 — the rule, stated. Both buttons fill EMPTY fields only and
            never touch a value you entered; the result panel says how many
            existing values were kept. Two similar buttons with unstated
            overwrite behaviour is the kind of thing you press once and never
            again. */}
        <p className="-mt-1 text-xs text-muted-foreground">
          Both fill empty fields only — your entries are never changed.
        </p>
          {/* Catalog prefill note — dimensions filled from ChronoScout (free) */}
          {catalogResult && (
            <div className="space-y-1 rounded-lg border border-brass/30 bg-brass/5 px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-brass">
                  {catalogResult.appliedCount > 0
                    ? `Filled ${catalogResult.appliedCount} dimension${catalogResult.appliedCount === 1 ? "" : "s"} from the catalog`
                    : "Catalog match had no new dimensions to fill"}
                  {catalogResult.keptCount > 0 &&
                    ` · kept ${catalogResult.keptCount} existing value${catalogResult.keptCount === 1 ? "" : "s"}`}
                </p>
                <button
                  type="button"
                  onClick={() => setCatalogResult(null)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {catalogResult.name} · review the highlighted fields · use ✨ for the rest · Data provided by Chronoscout
              </p>
            </div>
          )}
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
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {specFetchResult.specs.suggested_caliber && (
                <p className="text-muted-foreground">
                  Suggested caliber:{" "}
                  <span className="font-mono text-xs text-foreground">
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
                      className="underline hover:text-primary"
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
          <SectionSubHeading icon={Cog}>Movement</SectionSubHeading>
          <div className="space-y-1">
            <FormLabel className={LABEL}>Movement / Caliber</FormLabel>
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
          <SectionSubHeading icon={Ruler}>Case</SectionSubHeading>
          {/* Selects submit via hidden inputs (controlled value + name prop
              double-submits on some Select implementations) */}
          <input type="hidden" name="case_material" value={specs.case_material} />
          <input type="hidden" name="crystal" value={specs.crystal} />
          <input type="hidden" name="case_shape" value={specs.case_shape} />
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <FormLabel className={LABEL} htmlFor="case_material">Case Material</FormLabel>
              <Select
                value={specs.case_material}
                onValueChange={(val) => setSpec("case_material", val ?? "")}
              >
                <SelectTrigger
                  id="case_material"
                  className={cn(SELECT_FIELD, specHighlight("case_material"))}
                >
                  <span>
                    {specs.case_material ? caseMaterialLabels[specs.case_material] : ""}
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

            <div className="space-y-1">
              <FormLabel className={LABEL} htmlFor="crystal">Crystal</FormLabel>
              <Select
                value={specs.crystal}
                onValueChange={(val) => setSpec("crystal", val ?? "")}
              >
                <SelectTrigger id="crystal" className={cn(SELECT_FIELD, specHighlight("crystal"))}>
                  <span>
                    {specs.crystal ? crystalLabels[specs.crystal] : ""}
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

            <div className="space-y-1">
              <FormLabel className={LABEL} htmlFor="case_shape">Case Shape</FormLabel>
              <Select
                value={specs.case_shape}
                onValueChange={(val) => setSpec("case_shape", val ?? "")}
              >
                <SelectTrigger
                  id="case_shape"
                  className={cn(SELECT_FIELD, specHighlight("case_shape"))}
                >
                  <span>
                    {specs.case_shape ? caseShapeLabels[specs.case_shape] : ""}
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

            <div className="space-y-1">
              <FormLabel className={LABEL} htmlFor="dial_color">Dial Color</FormLabel>
              <Input
                id="dial_color"
                name="dial_color"
                value={specs.dial_color}
                onChange={(e) => setSpec("dial_color", e.target.value)}
                className={cn(FIELD, specHighlight("dial_color"))}
              />
            </div>

            <div className="space-y-1">
              <FormLabel className={LABEL}>Bezel</FormLabel>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="rotating_bezel"
                  defaultChecked={watch?.rotating_bezel ?? false}
                  onChange={markDirty}
                  className="h-4 w-4 rounded border-border accent-brass"
                />
                Rotating bezel
              </label>
            </div>
          </div>

          {/* Measurements — a labelled 2×4 spec block that reads like a spec
              sheet: right-aligned mono values, unit as a suffix inside the
              field, never in the label (C3). */}
          <div className="rounded-lg border border-border p-4">
            <h5 className="mb-3 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Measurements
            </h5>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MeasureField
                id="case_diameter_mm"
                label="Diameter"
                suffix="mm"
                step="0.1"
                min="10"
                max="60"
                value={specs.case_diameter_mm}
                onChange={(v) => setSpec("case_diameter_mm", v)}
                className={specHighlight("case_diameter_mm")}
              />
              <MeasureField
                id="case_height_mm"
                label="Height"
                suffix="mm"
                step="0.1"
                min="4"
                max="25"
                value={specs.case_height_mm}
                onChange={(v) => setSpec("case_height_mm", v)}
                className={specHighlight("case_height_mm")}
              />
              <MeasureField
                id="lug_to_lug_mm"
                label="Lug-to-lug"
                suffix="mm"
                step="0.1"
                min="20"
                max="80"
                value={specs.lug_to_lug_mm}
                onChange={(v) => setSpec("lug_to_lug_mm", v)}
                className={specHighlight("lug_to_lug_mm")}
              />
              <MeasureField
                id="strap_width_mm"
                label="Lug width"
                suffix="mm"
                step="0.5"
                min="6"
                max="30"
                value={specs.strap_width_mm}
                onChange={(v) => setSpec("strap_width_mm", v)}
                className={specHighlight("strap_width_mm")}
              />
              <MeasureField
                id="weight_g"
                label="Weight"
                suffix="g"
                step="0.5"
                min="5"
                max="1000"
                value={specs.weight_g}
                onChange={(v) => setSpec("weight_g", v)}
                className={specHighlight("weight_g")}
              />
              <MeasureField
                id="water_resistance_m"
                label="Water res."
                suffix="m"
                min="0"
                max="12000"
                value={specs.water_resistance_m}
                onChange={(v) => setSpec("water_resistance_m", v)}
                className={specHighlight("water_resistance_m")}
              />
            </div>
          </div>

          {/* Complications subsection */}
          <SectionSubHeading icon={Layers}>Complications</SectionSubHeading>
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
          </div>
      </SectionCard>

      {/* ── Card 3: Labels ──────────────────────────────────────── */}
      {/* Category moved up to Identity & Ownership; with nothing else to hold,
          this card is absent entirely when there are no labels to show. */}
      {labels.length > 0 && (
      <SectionCard id="labels" icon={FolderOpen} title="Labels" contentClassName="space-y-6">
            <div className="space-y-2">
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
                      {isSelected && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                      {label.name}
                    </button>
                  )
                })}
              </div>
            </div>
      </SectionCard>
      )}

      {/* ── Market card (V8, V10): tracking + target ask ────────── */}
      <SectionCard id="market" icon={TrendingUp} title="Market" contentClassName="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div
            className={cn(
              "flex flex-col justify-center gap-1 text-sm",
              !hasRef && "opacity-50"
            )}
          >
            <label
              className={cn(
                "inline-flex w-fit items-center gap-2",
                hasRef ? "cursor-pointer" : "cursor-not-allowed"
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
              <span className="font-medium">Track market value</span>
            </label>
            {!hasRef && (
              <span className="text-xs text-muted-foreground">
                Requires a reference number.
              </span>
            )}
          </div>
          <div className="space-y-1">
            <FormLabel className={LABEL} htmlFor="target_ask">Target ask ($)</FormLabel>
            <Input
              id="target_ask"
              name="target_ask"
              type="number"
              step="0.01"
              min="0"
              defaultValue={dollarsDefault(watch?.target_ask_cents)}
              className={cn(FIELD, "font-mono")}
            />
          </div>
      </SectionCard>

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
            {/* §3.8 — Delete is separated from Save. It sat immediately
                adjacent to the two safe actions, which is how a misclick
                becomes an unrecoverable one. Far left, with the save actions
                pushed to the right by `ml-auto` on their own group. */}
            {watch && (
              <div className="mr-auto pl-4">
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
              </div>
            )}
            <div className="ml-auto flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleReturn}
                disabled={isPending || isDeleting}
              >
                {/* §3.8 — says where it goes, rather than leaving you to
                    guess what you are returning to. */}
                Back to watch
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isPending || isDeleting}
                className="bg-brass text-brass-foreground hover:bg-brass/90 disabled:opacity-50"
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
                  Discard &amp; go back
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
