"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, Table as TableIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { CollectionTable } from "@/components/collection-table"
import { SearchInput } from "@/components/search-input"
import { GalleryGrid } from "./gallery-grid"
import {
  CollectionFiltersDialog,
  EMPTY_FILTERS,
  type CollectionFilters,
} from "./collection-filters"
import { cn, formatCurrency } from "@/lib/utils"
import { SHOW_COST_KEY } from "@/lib/preferences"
import type { Category, WatchWithCover } from "@/lib/types/watch"

interface CollectionViewProps {
  watches: WatchWithCover[]
  categories: Category[]
  /** Latest valuation mid (cents) per watch_id, from watch_valuations. */
  valuationMids: Record<string, number>
}

const ALL = "all"
type ViewMode = "table" | "gallery"
const VIEW_KEY = "collection-view"
const SIZE_KEY = "collection-gallery-size"
const FILTERS_KEY = "collection-filters"
const SORT_KEY = "collection-sort"
const DEFAULT_SIZE = 200
const MIN_SIZE = 120
const MAX_SIZE = 400

const SELECT_CLASS =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type SortKey = "default" | "brand" | "price" | "purchaseDate" | "caseDiameter" | "wearCount"
type SortDir = "asc" | "desc"

const SORT_LABELS: Record<SortKey, string> = {
  default: "Sort: Default",
  brand: "Sort: Brand",
  price: "Sort: Price",
  purchaseDate: "Sort: Purchase date",
  caseDiameter: "Sort: Case size",
  wearCount: "Sort: Wear count",
}

// ── Pure filter/sort helpers ───────────────────────────────────────

/** Free-text match across brand, model, nickname, and reference number.
 *  Whitespace-separated terms are AND-ed (all must appear). */
function matchesQuery(w: WatchWithCover, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = [w.brand.name, w.model, w.nickname ?? "", w.reference_number ?? ""]
    .join(" ")
    .toLowerCase()
  return terms.every((t) => haystack.includes(t))
}

/** Every watch is exactly one status: wish-list beats coming-soon beats owned. */
function matchesStatus(w: WatchWithCover, f: CollectionFilters): boolean {
  if (w.is_wishlist) return f.showWishlist
  if (w.is_coming_soon) return f.showComingSoon
  return f.showOwned
}

function applyFilters(watches: WatchWithCover[], f: CollectionFilters): WatchWithCover[] {
  const minCents = f.minPrice.trim() ? Math.round(parseFloat(f.minPrice) * 100) : null
  const maxCents = f.maxPrice.trim() ? Math.round(parseFloat(f.maxPrice) * 100) : null
  const priceActive = minCents !== null || maxCents !== null

  return watches.filter((w) => {
    if (!matchesStatus(w, f)) return false
    if (f.brandId && w.brand_id !== f.brandId) return false
    if (f.movementId && w.movement_id !== f.movementId) return false
    if (f.caliberType && w.movement?.caliber_type !== f.caliberType) return false
    if (f.caseMaterial && w.case_material !== f.caseMaterial) return false
    if (f.priceTracking === "tracked" && !w.price_check_enabled) return false
    if (f.priceTracking === "untracked" && w.price_check_enabled) return false
    if (priceActive) {
      const p = w.purchase_price_cents
      if (p === null) return false
      if (minCents !== null && p < minCents) return false
      if (maxCents !== null && p > maxCents) return false
    }
    return true
  })
}

function sortValue(w: WatchWithCover, key: SortKey): string | number | null {
  switch (key) {
    case "brand":
      return w.brand.name.toLowerCase()
    case "price":
      return w.purchase_price_cents
    case "purchaseDate":
      return w.purchase_date // "YYYY-MM-DD" sorts lexically
    case "caseDiameter":
      return w.case_diameter_mm
    case "wearCount":
      return w.wear_count ?? 0
    default:
      return null
  }
}

function sortWatches(watches: WatchWithCover[], key: SortKey, dir: SortDir): WatchWithCover[] {
  if (key === "default") return watches
  return [...watches].sort((a, b) => {
    const va = sortValue(a, key)
    const vb = sortValue(b, key)
    // Push missing values to the bottom regardless of direction.
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === "asc" ? cmp : -cmp
  })
}

export function CollectionView({ watches, categories, valuationMids }: CollectionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // View + size preferences are personal, not URL-worthy → localStorage.
  const [view, setView] = useState<ViewMode>("table")
  const [size, setSize] = useState<number>(DEFAULT_SIZE)
  const [showCost, setShowCost] = useState(false)

  // Advanced filters + sort are session state (not URL) — the category filter
  // stays URL-driven so it remains linkable from the dial and table.
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Search text. Local state drives filtering (instant); we seed it from ?q so
  // the home dial can hand a query off, and mirror it back to ?q for shareable
  // URLs. Safe to seed from searchParams here: arriving from home is a fresh
  // mount, and once mounted this box is the sole writer of ?q.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedView === "table" || savedView === "gallery") setView(savedView)
    const savedSize = Number(localStorage.getItem(SIZE_KEY))
    if (savedSize >= MIN_SIZE && savedSize <= MAX_SIZE) setSize(savedSize)
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")

    // Restore saved filters + sort so they survive navigating away and back.
    try {
      const savedFilters = localStorage.getItem(FILTERS_KEY)
      if (savedFilters) setFilters({ ...EMPTY_FILTERS, ...JSON.parse(savedFilters) })
    } catch {
      // ignore malformed stored value
    }
    try {
      const savedSort = localStorage.getItem(SORT_KEY)
      if (savedSort) {
        const parsed = JSON.parse(savedSort) as { key?: SortKey; dir?: SortDir }
        if (parsed.key && parsed.key in SORT_LABELS) setSortKey(parsed.key)
        if (parsed.dir === "asc" || parsed.dir === "desc") setSortDir(parsed.dir)
      }
    } catch {
      // ignore malformed stored value
    }
  }, [])

  // Mirror the search box to ?q (debounced), preserving ?category. Keeps the URL
  // shareable/reloadable without spamming history (replace, not push).
  useEffect(() => {
    if ((searchParams.get("q") ?? "") === query) return
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) params.set("q", query)
      else params.delete("q")
      const qs = params.toString()
      router.replace(qs ? `/collection?${qs}` : "/collection", { scroll: false })
    }, 300)
    return () => clearTimeout(t)
  }, [query, searchParams, router])

  function updateView(next: ViewMode) {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  function updateSize(next: number) {
    setSize(next)
    localStorage.setItem(SIZE_KEY, String(next))
  }

  function updateFilters(next: CollectionFilters) {
    setFilters(next)
    localStorage.setItem(FILTERS_KEY, JSON.stringify(next))
  }

  function persistSort(key: SortKey, dir: SortDir) {
    localStorage.setItem(SORT_KEY, JSON.stringify({ key, dir }))
  }

  function updateSortKey(key: SortKey) {
    setSortKey(key)
    persistSort(key, sortDir)
  }

  function toggleSortDir() {
    const next = sortDir === "asc" ? "desc" : "asc"
    setSortDir(next)
    persistSort(sortKey, next)
  }

  // URL is the source of truth for the category filter.
  const rawCategoryId = searchParams.get("category")
  const selectedId =
    rawCategoryId && categories.some((c) => c.id === rawCategoryId)
      ? rawCategoryId
      : ALL

  // Filter options derived from the actual collection.
  const { brandOptions, movementOptions, caliberTypes, caseMaterials } = useMemo(() => {
    const brandMap = new Map<string, string>()
    const movementMap = new Map<string, string>()
    const caliberSet = new Set<string>()
    const materialSet = new Set<string>()
    for (const w of watches) {
      brandMap.set(w.brand_id, w.brand.name)
      if (w.movement) {
        const label = `${w.movement.manufacturer ? w.movement.manufacturer + " " : ""}${w.movement.caliber_name}`.trim()
        movementMap.set(w.movement.id, label)
        if (w.movement.caliber_type) caliberSet.add(w.movement.caliber_type)
      }
      if (w.case_material) materialSet.add(w.case_material)
    }
    return {
      brandOptions: [...brandMap.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      movementOptions: [...movementMap.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      caliberTypes: [...caliberSet].sort(),
      caseMaterials: [...materialSet].sort(),
    }
  }, [watches])

  // The "X of Y" total is status-scoped so unchecked statuses (e.g. hiding
  // wish-list watches) don't count toward the collection size.
  const ownershipTotal = useMemo(
    () => watches.filter((w) => matchesStatus(w, filters)).length,
    [watches, filters]
  )

  const afterCategory = useMemo(
    () => (selectedId === ALL ? watches : watches.filter((w) => w.category_id === selectedId)),
    [watches, selectedId]
  )
  const afterFilters = useMemo(() => applyFilters(afterCategory, filters), [afterCategory, filters])
  const afterSearch = useMemo(
    () => (query.trim() ? afterFilters.filter((w) => matchesQuery(w, query)) : afterFilters),
    [afterFilters, query]
  )
  const displayed = useMemo(
    () => sortWatches(afterSearch, sortKey, sortDir),
    [afterSearch, sortKey, sortDir]
  )

  // Total value of the watches currently shown (filters + search applied).
  // Only rendered when the per-device "show cost" preference is on.
  const displayedTotalCents = useMemo(
    () => displayed.reduce((sum, w) => sum + (w.purchase_price_cents ?? 0), 0),
    [displayed]
  )

  // In "Tracked Only" mode, also total the latest market values of the
  // displayed watches so the header can show current value and gain/loss.
  const displayedValueCents = useMemo(
    () =>
      filters.priceTracking === "tracked"
        ? displayed.reduce((sum, w) => sum + (valuationMids[w.id] ?? 0), 0)
        : 0,
    [displayed, filters.priceTracking, valuationMids]
  )
  const gainPct =
    displayedValueCents > 0 && displayedTotalCents > 0
      ? ((displayedValueCents - displayedTotalCents) / displayedTotalCents) * 100
      : null

  function handleCategoryChange(val: string | null) {
    if (!val) return
    const url = val === ALL ? "/collection" : `/collection?category=${val}`
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  const triggerLabel =
    selectedId === ALL
      ? "All"
      : categories.find((c) => c.id === selectedId)?.name ?? "All"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-lg font-medium tracking-tight">Collection</h1>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search brand, model, nickname, ref…"
          ariaLabel="Search collection"
          className="w-full sm:w-64"
        />

        <Select value={selectedId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-9 w-[160px]">
            <span className="text-sm">{triggerLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CollectionFiltersDialog
          filters={filters}
          onChange={updateFilters}
          brands={brandOptions}
          movements={movementOptions}
          caliberTypes={caliberTypes}
          caseMaterials={caseMaterials}
          matchCount={afterFilters.length}
        />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <select
            aria-label="Sort by"
            className={SELECT_CLASS}
            value={sortKey}
            onChange={(e) => updateSortKey(e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSortDir}
            disabled={sortKey === "default"}
            aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
            className="flex h-9 w-9 items-center justify-center rounded-md border text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>

        <span className="text-sm text-muted-foreground">
          {displayed.length} of {ownershipTotal}
          {showCost && displayedTotalCents > 0 && (
            <>
              {" · "}
              <span className="font-mono text-brass">
                {formatCurrency(displayedTotalCents, "USD", true)}
              </span>
            </>
          )}
          {showCost && filters.priceTracking === "tracked" && displayedValueCents > 0 && (
            <>
              {" · value "}
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(displayedValueCents, "USD", true)}
              </span>
              {gainPct !== null && (
                <span
                  className={cn(
                    "ml-1.5 font-mono",
                    gainPct >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {gainPct >= 0 ? "+" : ""}
                  {gainPct.toFixed(1)}%
                </span>
              )}
            </>
          )}
        </span>

        {/* Push view controls to the right on wider screens */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {view === "gallery" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Size</span>
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={10}
                value={size}
                onChange={(e) => updateSize(Number(e.target.value))}
                className="h-1 w-32 accent-foreground sm:w-40"
                aria-label="Gallery tile size"
              />
            </label>
          )}

          <div
            role="group"
            aria-label="View mode"
            className="inline-flex overflow-hidden rounded-md border"
          >
            <button
              type="button"
              onClick={() => updateView("table")}
              aria-pressed={view === "table"}
              title="Table view"
              className={cn(
                "flex h-9 items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                view === "table"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => updateView("gallery")}
              aria-pressed={view === "gallery"}
              title="Gallery view"
              className={cn(
                "flex h-9 items-center gap-1.5 border-l px-3 text-xs font-medium transition-colors",
                view === "gallery"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          {query.trim() ? (
            <>
              No watches match{" "}
              <span className="font-medium text-foreground">“{query.trim()}”</span>.
            </>
          ) : (
            "No watches to show."
          )}
        </div>
      ) : view === "table" ? (
        <CollectionTable watches={displayed} showCost={showCost} />
      ) : (
        <GalleryGrid watches={displayed} itemSize={size} showCost={showCost} />
      )}
    </div>
  )
}
