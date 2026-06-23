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
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { caseMaterialLabels } from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"

// ── Filter shape ───────────────────────────────────────────────────

export interface CollectionFilters {
  brandId: string
  movementId: string
  caliberType: string
  caseMaterial: string
  minPrice: string // dollars, as typed
  maxPrice: string
}

export const EMPTY_FILTERS: CollectionFilters = {
  brandId: "",
  movementId: "",
  caliberType: "",
  caseMaterial: "",
  minPrice: "",
  maxPrice: "",
}

export function activeFilterCount(f: CollectionFilters): number {
  let n = 0
  if (f.brandId) n++
  if (f.movementId) n++
  if (f.caliberType) n++
  if (f.caseMaterial) n++
  if (f.minPrice || f.maxPrice) n++
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

interface CollectionFiltersDialogProps {
  filters: CollectionFilters
  onChange: (next: CollectionFilters) => void
  brands: BrandOption[]
  movements: MovementOption[]
  caliberTypes: string[]
  caseMaterials: string[]
  matchCount: number
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function CollectionFiltersDialog({
  filters,
  onChange,
  brands,
  movements,
  caliberTypes,
  caseMaterials,
  matchCount,
}: CollectionFiltersDialogProps) {
  const count = activeFilterCount(filters)

  function set<K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) {
    onChange({ ...filters, [key]: value })
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
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">
            {count}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter watches</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Price range */}
          <div className="space-y-1.5">
            <FormLabel>Price range ($)</FormLabel>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => set("minPrice", e.target.value)}
                aria-label="Minimum price"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
                aria-label="Maximum price"
              />
            </div>
          </div>
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
