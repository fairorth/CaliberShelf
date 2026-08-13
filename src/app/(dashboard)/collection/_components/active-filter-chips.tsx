"use client"

import { X } from "lucide-react"
import { caseMaterialLabels } from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import {
  EMPTY_FILTERS,
  type CollectionFilters,
  type BrandOption,
  type MovementOption,
  type LabelOption,
  type CategoryOption,
  type TierFilterOption,
} from "./collection-filters"

interface ActiveFilterChipsProps {
  filters: CollectionFilters
  onChange: (next: CollectionFilters) => void
  brands: BrandOption[]
  movements: MovementOption[]
  labels: LabelOption[]
  categories: CategoryOption[]
  tiers: TierFilterOption[]
}

interface Chip {
  key: string
  label: string
  onClear: () => void
}

/**
 * The visible truth about what is filtering the collection right now (B2).
 * One chip per active filter, each individually clearable, plus Clear all.
 * Chips are state, not action → muted surface, never brass.
 */
export function ActiveFilterChips({
  filters,
  onChange,
  brands,
  movements,
  labels,
  categories,
  tiers,
}: ActiveFilterChipsProps) {
  const chips: Chip[] = []
  const f = filters

  if (!f.showOwned || !f.showComingSoon || !f.showWishlist) {
    const shown = [
      f.showOwned && "Owned",
      f.showComingSoon && "Coming soon",
      f.showWishlist && "Wish list",
    ].filter(Boolean)
    chips.push({
      key: "status",
      label: shown.length === 0 ? "Status: none" : `Status: ${shown.join(" + ")}`,
      onClear: () =>
        onChange({ ...f, showOwned: true, showComingSoon: true, showWishlist: true }),
    })
  }

  if (f.showWishlist && f.wishlistSource) {
    chips.push({
      key: "wishlist-source",
      label: `Wish list from: ${f.wishlistSource === "manual" ? "Manual" : f.wishlistSource}`,
      onClear: () => onChange({ ...f, wishlistSource: "" }),
    })
  }

  if (f.brandId) {
    chips.push({
      key: "brand",
      label: `Brand: ${brands.find((b) => b.id === f.brandId)?.name ?? "Unknown"}`,
      onClear: () => onChange({ ...f, brandId: "" }),
    })
  }

  if (f.movementId) {
    chips.push({
      key: "movement",
      label: `Movement: ${movements.find((m) => m.id === f.movementId)?.label ?? "Unknown"}`,
      onClear: () => onChange({ ...f, movementId: "" }),
    })
  }

  if (f.caliberType) {
    chips.push({
      key: "caliber-type",
      label: `Type: ${caliberTypeLabels[f.caliberType as keyof typeof caliberTypeLabels] ?? f.caliberType}`,
      onClear: () => onChange({ ...f, caliberType: "" }),
    })
  }

  if (f.caseMaterial) {
    chips.push({
      key: "case-material",
      label: `Material: ${caseMaterialLabels[f.caseMaterial] ?? f.caseMaterial}`,
      onClear: () => onChange({ ...f, caseMaterial: "" }),
    })
  }

  if (f.box) {
    chips.push({
      key: "box",
      label: `Box: ${f.box}`,
      onClear: () => onChange({ ...f, box: "" }),
    })
  }

  for (const name of f.complications) {
    chips.push({
      key: `complication-${name}`,
      label: name,
      onClear: () =>
        onChange({ ...f, complications: f.complications.filter((c) => c !== name) }),
    })
  }

  for (const id of f.labelIds) {
    chips.push({
      key: `label-${id}`,
      label: `Label: ${labels.find((l) => l.id === id)?.name ?? "Unknown"}`,
      onClear: () => onChange({ ...f, labelIds: f.labelIds.filter((x) => x !== id) }),
    })
  }

  for (const id of f.categoryIds) {
    chips.push({
      key: `category-${id}`,
      label: `Category: ${categories.find((c) => c.id === id)?.name ?? "Unknown"}`,
      onClear: () =>
        onChange({ ...f, categoryIds: f.categoryIds.filter((x) => x !== id) }),
    })
  }

  if (f.priceTracking) {
    chips.push({
      key: "price-tracking",
      label: f.priceTracking === "tracked" ? "Tracked only" : "Not tracked",
      onClear: () => onChange({ ...f, priceTracking: "" }),
    })
  }

  for (const key of f.tierKeys) {
    chips.push({
      key: `tier-${key}`,
      label: `Tier: ${tiers.find((t) => t.key === key)?.label ?? key}`,
      onClear: () => onChange({ ...f, tierKeys: f.tierKeys.filter((x) => x !== key) }),
    })
  }

  if (chips.length === 0) return null

  function clearAll() {
    onChange(EMPTY_FILTERS)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1 text-xs font-medium text-muted-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onClear}
            aria-label={`Clear filter: ${chip.label}`}
            className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="ml-1 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
