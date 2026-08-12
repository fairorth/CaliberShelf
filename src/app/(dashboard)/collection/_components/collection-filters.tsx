"use client"

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
import { Label as FormLabel } from "@/components/ui/label"
import { caseMaterialLabels } from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { labelColorMap, type LabelColor } from "@/lib/validations/label"
import { cn } from "@/lib/utils"

// ── Filter shape ───────────────────────────────────────────────────

export type PriceTracking = "" | "tracked" | "untracked" // "" = all watches

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
  tierKeys: [],
  labelIds: [],
  categoryIds: [],
  complications: [],
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
  filters: CollectionFilters
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
  matchCount: number
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function CollectionFiltersDialog({
  filters,
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
  matchCount,
}: CollectionFiltersDialogProps) {
  const count = activeFilterCount(filters)

  function set<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) {
    onChange({ ...filters, [key]: value })
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

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-1.5" />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {count > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-2xs font-semibold text-background">
            {count}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter watches</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
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
                            ? "bg-primary/15 text-primary ring-1 ring-primary/40"
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
                          ? "bg-primary/15 text-primary ring-1 ring-primary/40"
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
                          ? "bg-primary/15 text-primary ring-1 ring-primary/40"
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
                          ? "bg-primary/15 text-primary ring-1 ring-primary/40"
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
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={count === 0}
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
