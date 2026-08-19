"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label as FormLabel } from "@/components/ui/label"
import { caseMaterialLabels } from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { labelColorMap, type LabelColor } from "@/lib/validations/label"
import { cn } from "@/lib/utils"

// ── Filter shape ───────────────────────────────────────────────────

export type PriceTracking = "" | "tracked" | "untracked" // "" = all watches

/**
 * Sale-lifecycle filter (§3.6). "" is *unset*, not "all": the two views have
 * different defaults (tiles hide sold, the table shows everything), so an
 * absent param resolves against the view. "all" is the explicit everything
 * choice, which is what removing the chip sets — otherwise clearing the chip
 * would just re-apply the view's default and the sold rows would stay hidden.
 */
export type SaleStatusFilter = "" | "all" | "unsold" | "candidate" | "listed" | "sold"

export const SALE_STATUS_OPTIONS: { value: Exclude<SaleStatusFilter, "">; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unsold", label: "Owned only" },
  { value: "candidate", label: "Candidates" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
]

/** Tiles browse what you have; the table is the two-sided ledger (§3.6). */
export function defaultSaleStatus(view: "table" | "gallery"): SaleStatusFilter {
  return view === "gallery" ? "unsold" : "all"
}

// Every watch is exactly one status: wish-list beats coming-soon beats owned.
export interface CollectionFilters {
  showOwned: boolean
  showComingSoon: boolean
  showWishlist: boolean
  // Which wish-list watches to show (applies only while showWishlist is on):
  // "" = all · "manual" = hand-added (no guide) · else a collection-guide name.
  wishlistSource: string
  brandId: string
  movementId: string
  caliberType: string
  caseMaterial: string
  box: string
  priceTracking: PriceTracking
  /** Sale lifecycle. "" = unset → the view's default (see defaultSaleStatus). */
  saleStatus: SaleStatusFilter
  // Selected price-tier keys (OR): "t{n}" per tier, "unpriced" for no price.
  tierKeys: string[]
  // Selected label ids. A watch matches if it carries ANY of them (OR).
  labelIds: string[]
  // Selected category ids (OR). Empty = all categories.
  categoryIds: string[]
  // Selected complication names (OR). A watch matches if it has ANY.
  complications: string[]
}

export const EMPTY_FILTERS: CollectionFilters = {
  showOwned: true,
  showComingSoon: true,
  showWishlist: true,
  wishlistSource: "",
  brandId: "",
  movementId: "",
  caliberType: "",
  caseMaterial: "",
  box: "",
  priceTracking: "",
  saleStatus: "",
  tierKeys: [],
  labelIds: [],
  categoryIds: [],
  complications: [],
}

// ── URL codec ──────────────────────────────────────────────────────
//
// The filter set lives in the query string rather than component state. The
// collection is a list view: a filtered list has to survive a trip out to a
// watch and back, be linkable, and be restorable by the Back button. Holding
// it in `useState` meant any remount silently emptied it.
//
// Multi-value filters repeat their key (`?category=a&category=b`) instead of
// comma-joining, so `?category=<id>` — already emitted by /category/[id], the
// by-category report and the table's category cell — keeps working unchanged.
//
// Absent `status` means "all three shown", which is the default; `status=none`
// is the explicit empty selection (distinct from absent).
const PARAM = {
  status: "status",
  wishlistSource: "wlsrc",
  brandId: "brand",
  movementId: "movement",
  caliberType: "movtype",
  caseMaterial: "material",
  box: "box",
  priceTracking: "price",
  saleStatus: "sale",
  tierKeys: "tier",
  labelIds: "label",
  categoryIds: "category",
  complications: "comp",
} as const

/** Params the filter codec owns. Everything else (?q) is left untouched. */
export const FILTER_PARAM_KEYS: string[] = Object.values(PARAM)

interface ReadableParams {
  get(key: string): string | null
  getAll(key: string): string[]
}

export function filtersFromParams(params: ReadableParams): CollectionFilters {
  const status = params.getAll(PARAM.status)
  const allShown = status.length === 0
  const price = params.get(PARAM.priceTracking)
  const sale = params.get(PARAM.saleStatus)
  const saleValid = SALE_STATUS_OPTIONS.some((o) => o.value === sale)
  return {
    showOwned: allShown || status.includes("owned"),
    showComingSoon: allShown || status.includes("coming"),
    showWishlist: allShown || status.includes("wish"),
    wishlistSource: params.get(PARAM.wishlistSource) ?? "",
    brandId: params.get(PARAM.brandId) ?? "",
    movementId: params.get(PARAM.movementId) ?? "",
    caliberType: params.get(PARAM.caliberType) ?? "",
    caseMaterial: params.get(PARAM.caseMaterial) ?? "",
    box: params.get(PARAM.box) ?? "",
    // Anything else in ?price is not a filter we understand — ignore it.
    priceTracking: price === "tracked" || price === "untracked" ? price : "",
    saleStatus: saleValid ? (sale as SaleStatusFilter) : "",
    tierKeys: params.getAll(PARAM.tierKeys).filter(Boolean),
    labelIds: params.getAll(PARAM.labelIds).filter(Boolean),
    categoryIds: params.getAll(PARAM.categoryIds).filter(Boolean),
    complications: params.getAll(PARAM.complications).filter(Boolean),
  }
}

/** Writes `f` onto a copy of `base`, leaving params it doesn't own (?q) alone. */
export function filtersToParams(
  f: CollectionFilters,
  base: ReadableParams & { toString(): string }
): URLSearchParams {
  const p = new URLSearchParams(base.toString())

  const one = (key: string, value: string) => {
    if (value) p.set(key, value)
    else p.delete(key)
  }
  const many = (key: string, values: string[]) => {
    p.delete(key)
    for (const v of values) p.append(key, v)
  }

  const shown = [
    f.showOwned && "owned",
    f.showComingSoon && "coming",
    f.showWishlist && "wish",
  ].filter((v): v is string => Boolean(v))
  if (shown.length === 3) p.delete(PARAM.status)
  else many(PARAM.status, shown.length > 0 ? shown : ["none"])

  one(PARAM.wishlistSource, f.wishlistSource)
  one(PARAM.brandId, f.brandId)
  one(PARAM.movementId, f.movementId)
  one(PARAM.caliberType, f.caliberType)
  one(PARAM.caseMaterial, f.caseMaterial)
  one(PARAM.box, f.box)
  one(PARAM.priceTracking, f.priceTracking)
  one(PARAM.saleStatus, f.saleStatus)
  many(PARAM.tierKeys, f.tierKeys)
  many(PARAM.labelIds, f.labelIds)
  many(PARAM.categoryIds, f.categoryIds)
  many(PARAM.complications, f.complications)

  return p
}

/** Canonical string for a filter set — two sets are equal iff these match.
 *  Reuses the URL codec so there is only one definition of "the same filters". */
export function canonical(f: CollectionFilters): string {
  return filtersToParams(f, new URLSearchParams()).toString()
}

export function activeFilterCount(f: CollectionFilters): number {
  let n = 0
  if (!f.showOwned || !f.showComingSoon || !f.showWishlist) n++
  if (f.showWishlist && f.wishlistSource) n++
  if (f.brandId) n++
  if (f.movementId) n++
  if (f.caliberType) n++
  if (f.caseMaterial) n++
  if (f.box) n++
  if (f.priceTracking) n++
  // Only an explicit choice counts — the view's own default is not a filter
  // the user set, and "all" is the absence of one.
  if (f.saleStatus && f.saleStatus !== "all") n++
  if (f.tierKeys.length > 0) n++
  if (f.labelIds.length > 0) n++
  if (f.categoryIds.length > 0) n++
  if (f.complications.length > 0) n++
  return n
}

// ── Option types ───────────────────────────────────────────────────

export interface BrandOption {
  id: string
  name: string
}
export interface MovementOption {
  id: string
  label: string
}
export interface LabelOption {
  id: string
  name: string
  color: string
}
export interface CategoryOption {
  id: string
  name: string
}
export interface TierFilterOption {
  key: string
  label: string
  short: string
}

interface CollectionFiltersDialogProps {
  /** The filters currently applied to the list. The dialog edits a copy. */
  filters: CollectionFilters
  /** Called once, when the dialog closes — never per keystroke. */
  onChange: (next: CollectionFilters) => void
  /** Distinct collection-guide names with wish-list members (e.g. "Grand Seiko"). */
  guides?: string[]
  brands: BrandOption[]
  movements: MovementOption[]
  caliberTypes: string[]
  caseMaterials: string[]
  boxes: string[]
  labels: LabelOption[]
  categories: CategoryOption[]
  complications: string[]
  tiers: TierFilterOption[]
  /** What an unset sale-status filter resolves to in the current view, so the
   *  control shows what is actually applied rather than a hollow "All". */
  viewDefaultSaleStatus: SaleStatusFilter
  /** Counts matches for a candidate filter set, so the footer can preview the
   *  draft without applying it. Pure client-side work over the loaded rows. */
  countMatches: (f: CollectionFilters) => number
}

// Token surface + token border + brass focus ring. Native selects do not
// reliably match :focus-visible on pointer interaction, so :focus carries the
// same ring — the browser's own accent must never show through (E1).
const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs accent-brass transition-[color,box-shadow] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** One titled group of filters. Three of these carry the whole dialog, so
 *  eleven controls no longer stack at equal weight (FIXES §6). */
function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function CollectionFiltersDialog({
  // Deliberately renamed: inside this component `filters` is the *draft*, so
  // every control below edits the copy and nothing reaches the list until the
  // dialog closes. `applied` is the committed set, used only to seed the draft
  // and to label the trigger.
  filters: applied,
  onChange,
  guides = [],
  brands,
  movements,
  caliberTypes,
  caseMaterials,
  boxes,
  labels,
  categories,
  complications,
  tiers,
  viewDefaultSaleStatus,
  countMatches,
}: CollectionFiltersDialogProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<CollectionFilters>(applied)

  // Editing eleven controls used to mean eleven URL writes, each re-running the
  // collection's server component — the dialog felt stuck. The draft is local
  // state, so typing is instant; opening reseeds it, closing commits it once.
  function handleOpenChange(next: boolean) {
    if (next) {
      setFilters(applied)
    } else if (canonical(filters) !== canonical(applied)) {
      onChange(filters)
    }
    setOpen(next)
  }

  function set<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) {
    setFilters({ ...filters, [key]: value })
  }

  function toggleLabel(id: string) {
    const next = filters.labelIds.includes(id)
      ? filters.labelIds.filter((x) => x !== id)
      : [...filters.labelIds, id]
    set("labelIds", next)
  }

  function toggleCategory(id: string) {
    const next = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((x) => x !== id)
      : [...filters.categoryIds, id]
    set("categoryIds", next)
  }

  function toggleComplication(name: string) {
    const next = filters.complications.includes(name)
      ? filters.complications.filter((x) => x !== name)
      : [...filters.complications, name]
    set("complications", next)
  }

  function toggleTier(key: string) {
    const next = filters.tierKeys.includes(key)
      ? filters.tierKeys.filter((x) => x !== key)
      : [...filters.tierKeys, key]
    set("tierKeys", next)
  }

  // The trigger reports what is actually filtering the list, not the draft.
  const appliedCount = activeFilterCount(applied)
  const draftCount = activeFilterCount(filters)
  const draftMatches = countMatches(filters)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-1.5" />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {appliedCount > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-2xs font-semibold text-background">
            {appliedCount}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="grid max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter watches</DialogTitle>
        </DialogHeader>

        {/* The body scrolls under the pinned footer, so the match count and
            the actions stay reachable however long the list grows. */}
        <div className="-mx-4 space-y-6 overflow-y-auto px-4">
          <FilterSection title="Ownership">
          {/* Status — every watch is exactly one of these three */}
          <div className="space-y-1.5">
            <FormLabel>Show</FormLabel>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["showOwned", "Owned"],
                  ["showComingSoon", "Coming Soon"],
                  ["showWishlist", "Wish List"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Wish-list source — only meaningful while wish-list is shown */}
            {filters.showWishlist && (
              <div className="space-y-1.5 pl-1 pt-1">
                <span className="text-xs text-muted-foreground">Wish list from</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "", label: "All" },
                    { value: "manual", label: "Manual" },
                    ...guides.map((g) => ({ value: g, label: g })),
                  ].map((opt) => {
                    const selected = filters.wishlistSource === opt.value
                    return (
                      <button
                        key={opt.value || "all"}
                        type="button"
                        onClick={() => set("wishlistSource", opt.value)}
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                          selected
                            ? "bg-brass/15 text-brass ring-1 ring-brass/40"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sale status (§3.6) — the lifecycle, independent of the three
              ownership states above. Sold watches stay in the collection. */}
          <div className="space-y-1.5 pt-1">
            <FormLabel>Sale status</FormLabel>
            <div className="flex flex-wrap gap-1.5">
              {SALE_STATUS_OPTIONS.map((opt) => {
                const selected = (filters.saleStatus || viewDefaultSaleStatus) === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("saleStatus", opt.value)}
                    aria-pressed={selected}
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                      selected
                        ? "bg-brass/15 text-brass ring-1 ring-brass/40"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          </FilterSection>

          <FilterSection title="Attributes">
          {/* Category — multi-select (OR); empty = all categories */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel>Category</FormLabel>
                {filters.categoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => set("categoryIds", [])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const selected = filters.categoryIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                        selected
                          ? "bg-brass/15 text-brass ring-1 ring-brass/40"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Complication — multi-select (OR); a watch matches if it has ANY */}
          {complications.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel>Complication</FormLabel>
                {filters.complications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => set("complications", [])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {complications.map((c) => {
                  const selected = filters.complications.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleComplication(c)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                        selected
                          ? "bg-brass/15 text-brass ring-1 ring-brass/40"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Labels — multi-select; a watch matches if it has ANY selected label */}
          {labels.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel>Labels</FormLabel>
                {filters.labelIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => set("labelIds", [])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const colors = labelColorMap[l.color as LabelColor] ?? labelColorMap.blue
                  const selected = filters.labelIds.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                        selected
                          ? `${colors.bg} ${colors.text} ring-1 ring-current`
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {l.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Brand */}
          <div className="space-y-1.5">
            <FormLabel htmlFor="filter-brand">Brand</FormLabel>
            <select
              id="filter-brand"
              className={SELECT_CLASS}
              value={filters.brandId}
              onChange={(e) => set("brandId", e.target.value)}
            >
              <option value="">Any brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Movement (caliber) */}
          <div className="space-y-1.5">
            <FormLabel htmlFor="filter-movement">Movement</FormLabel>
            <select
              id="filter-movement"
              className={SELECT_CLASS}
              value={filters.movementId}
              onChange={(e) => set("movementId", e.target.value)}
            >
              <option value="">Any movement</option>
              {movements.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Movement type + Case material */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormLabel htmlFor="filter-caliber-type">Movement Type</FormLabel>
              <select
                id="filter-caliber-type"
                className={SELECT_CLASS}
                value={filters.caliberType}
                onChange={(e) => set("caliberType", e.target.value)}
              >
                <option value="">Any type</option>
                {caliberTypes.map((t) => (
                  <option key={t} value={t}>
                    {caliberTypeLabels[t as keyof typeof caliberTypeLabels] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FormLabel htmlFor="filter-case-material">Case Material</FormLabel>
              <select
                id="filter-case-material"
                className={SELECT_CLASS}
                value={filters.caseMaterial}
                onChange={(e) => set("caseMaterial", e.target.value)}
              >
                <option value="">Any material</option>
                {caseMaterials.map((m) => (
                  <option key={m} value={m}>
                    {caseMaterialLabels[m] ?? m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Box (storage location) */}
          {boxes.length > 0 && (
            <div className="space-y-1.5">
              <FormLabel htmlFor="filter-box">Box</FormLabel>
              <select
                id="filter-box"
                className={SELECT_CLASS}
                value={filters.box}
                onChange={(e) => set("box", e.target.value)}
              >
                <option value="">Any box</option>
                {boxes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
          </FilterSection>

          <FilterSection title="Price">
          {/* Price tracking */}
          <div className="space-y-1.5">
            <FormLabel htmlFor="filter-price-tracking">Price Tracking</FormLabel>
            <select
              id="filter-price-tracking"
              className={SELECT_CLASS}
              value={filters.priceTracking}
              onChange={(e) => set("priceTracking", e.target.value as PriceTracking)}
            >
              <option value="">All Watches</option>
              <option value="tracked">Tracked Only</option>
              <option value="untracked">Not Tracked</option>
            </select>
          </div>

          {/* Price Tiers — multi-select (OR); tiers come from Config → Tiers */}
          {tiers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel>Price Tiers</FormLabel>
                {filters.tierKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => set("tierKeys", [])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tiers.map((t) => {
                  const selected = filters.tierKeys.includes(t.key)
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleTier(t.key)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                        selected
                          ? "bg-brass/15 text-brass ring-1 ring-brass/40"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.label}
                      {t.short && <span className="opacity-60">{t.short}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          </FilterSection>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          {/* Previews the draft, so the count still moves as you tick boxes —
              it just costs a local array filter instead of a page render. */}
          <span className="text-sm text-muted-foreground">
            {draftMatches} {draftMatches === 1 ? "match" : "matches"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
              disabled={draftCount === 0}
            >
              Clear all
            </Button>
            <DialogClose render={<Button size="sm" />}>Done</DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
