"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, Download, LayoutGrid, Table as TableIcon } from "lucide-react"
import {
  CollectionTable,
  ColumnsMenu,
  MONEY_COLUMNS,
  useColumnVisibility,
  type TableSortKey,
} from "@/components/collection-table"
import { collectionCsv, downloadCsv } from "@/lib/collection-csv"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/search-input"
import { caliberLabel } from "@/lib/caliber"
import { ATTACHMENT_LEVELS } from "@/lib/validations/watch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { GalleryGrid } from "./gallery-grid"
import { ActiveFilterChips } from "./active-filter-chips"
import {
  CollectionFiltersDialog,
  activeFilterCount,
  defaultSaleStatus,
  filtersFromParams,
  filtersToParams,
  type CollectionFilters,
} from "./collection-filters"
import type { SaleSummary } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/gain"
import { cn, formatCurrency } from "@/lib/utils"
import { COLLECTION_RETURN_KEY, SHOW_COST_KEY } from "@/lib/preferences"
import { KNOWN_COMPLICATIONS } from "@/lib/validations/watch"
import { tierBandForCents, type TierBand } from "@/lib/tiers"
import type { Category, WatchWithCover } from "@/lib/types/watch"

interface CollectionViewProps {
  watches: WatchWithCover[]
  categories: Category[]
  /** Latest valuation mid (cents) per watch_id, from watch_valuations. */
  valuationMids: Record<string, number>
  /** The user's configured price-tier bands (Config → Tiers). */
  tierBands: TierBand[]
  /** watch_id → collection-guide name, for badging guide members. */
  guideNames?: Record<string, string>
  /** watch_id → net proceeds + realized gain, for sold rows (§3.6). */
  saleSummaries?: Record<string, SaleSummary>
}

type ViewMode = "table" | "gallery"
const VIEW_KEY = "collection-view"
const SIZE_KEY = "collection-gallery-size"
const FILTERS_KEY = "collection-filters"
const SORT_KEY = "collection-sort"
const DEFAULT_SIZE = 200
const MIN_SIZE = 120
const MAX_SIZE = 400

// Three fixed tile densities replace the old continuous slider (B1).
const TILE_DENSITIES = [
  { label: "S", title: "Small", size: 150 },
  { label: "M", title: "Medium", size: 200 },
  { label: "L", title: "Large", size: 280 },
] as const

// One sort owner (B3): a single {key, dir} lives here and covers both the
// tile-view dropdown keys and every table header key.
type SortKey = "default" | "caseDiameter" | TableSortKey
type SortDir = "asc" | "desc"

// The tile-view dropdown offers this curated subset…
const DROPDOWN_SORT_KEYS: SortKey[] = [
  "default",
  "brand",
  "price",
  "purchaseDate",
  "caseDiameter",
  "wearCount",
]

// …while labels cover every key so the trigger stays readable even when a
// table-header sort carries over into tile view.
const SORT_LABELS: Record<SortKey, string> = {
  default: "Sort: Default",
  brand: "Sort: Brand",
  price: "Sort: Price",
  purchaseDate: "Sort: Purchase date",
  caseDiameter: "Sort: Case size",
  wearCount: "Sort: Wear count",
  category: "Sort: Category",
  model: "Sort: Model",
  nickname: "Sort: Nickname",
  reference: "Sort: Reference",
  movementType: "Sort: Movement type",
  caliber: "Sort: Caliber",
  box: "Sort: Box",
  attachment: "Sort: Attachment",
  value: "Sort: Value",
  gain: "Sort: Gain",
}

const ALL_SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[]

/** Labelled mono stat for the toolbar's identity band (B1). */
function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("font-mono text-xs tabular-nums text-foreground", valueClassName)}>
        {value}
      </span>
    </span>
  )
}

// ── Pure filter/sort helpers ───────────────────────────────────────

/** Free-text match across brand, model, nickname, reference number, and box.
 *  Whitespace-separated terms are AND-ed (all must appear). */
function matchesQuery(w: WatchWithCover, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = [w.brand.name, w.model, w.nickname ?? "", w.reference_number ?? "", w.box ?? ""]
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

/** Wish-list source: all ("") · hand-added ("manual") · a specific guide name. */
function matchesWishlistSource(
  w: WatchWithCover,
  f: CollectionFilters,
  guideNames: Record<string, string>
): boolean {
  if (!w.is_wishlist || !f.wishlistSource) return true
  const guide = guideNames[w.id]
  return f.wishlistSource === "manual" ? !guide : guide === f.wishlistSource
}

/** Sale lifecycle (§3.6). "unsold" is everything you still hold, whatever
 *  stage it is at; the two named stages narrow further. */
function matchesSaleStatus(w: WatchWithCover, f: CollectionFilters): boolean {
  switch (f.saleStatus) {
    case "unsold":
      return w.sale_status !== "sold"
    case "listed":
      return w.sale_status === "listed"
    case "sold":
      return w.sale_status === "sold"
    default:
      return true
  }
}

function applyFilters(
  watches: WatchWithCover[],
  f: CollectionFilters,
  tierBands: TierBand[],
  guideNames: Record<string, string>
): WatchWithCover[] {
  return watches.filter((w) => {
    if (!matchesStatus(w, f)) return false
    if (!matchesSaleStatus(w, f)) return false
    if (!matchesWishlistSource(w, f, guideNames)) return false
    if (f.brandId && w.brand_id !== f.brandId) return false
    if (f.movementId && w.movement_id !== f.movementId) return false
    if (f.caliberType && w.movement?.caliber_type !== f.caliberType) return false
    if (f.caseMaterial && w.case_material !== f.caseMaterial) return false
    if (f.box && (w.box ?? "") !== f.box) return false
    if (f.complications.length > 0) {
      // A watch matches if it carries ANY selected complication.
      const comps = (w.complication ?? "").split(",").map((c) => c.trim()).filter(Boolean)
      if (!f.complications.some((c) => comps.includes(c))) return false
    }
    if (f.labelIds.length > 0) {
      // OR semantics: keep the watch if it carries any selected label.
      const labels = w.labels ?? []
      if (!f.labelIds.some((id) => labels.some((l) => l.id === id))) return false
    }
    if (f.categoryIds.length > 0 && !f.categoryIds.includes(w.category_id)) return false
    if (f.priceTracking === "tracked" && !w.price_check_enabled) return false
    if (f.priceTracking === "untracked" && w.price_check_enabled) return false
    if (f.tierKeys.length > 0) {
      const key = tierBandForCents(w.purchase_price_cents, tierBands).key
      if (!f.tierKeys.includes(key)) return false
    }
    return true
  })
}

function sortValue(
  w: WatchWithCover,
  key: SortKey,
  valuationMids: Record<string, number>
): string | number | null {
  switch (key) {
    case "brand":
      return w.brand.name.toLowerCase()
    case "price":
      return w.purchase_price_cents
    case "purchaseDate":
      return w.purchase_date // "YYYY-MM-DD" sorts lexically
    case "value":
      return valuationMids[w.id] ?? null
    case "gain": {
      const mid = valuationMids[w.id]
      return mid != null ? (gainVersusBasis(mid, w)?.cents ?? null) : null
    }
    case "caseDiameter":
      return w.case_diameter_mm
    case "wearCount":
      return w.wear_count ?? 0
    case "category":
      return w.category?.name.toLowerCase() ?? null
    case "model":
      return w.model.toLowerCase()
    case "nickname":
      return w.nickname?.toLowerCase() ?? null
    case "reference":
      return w.reference_number?.toLowerCase() ?? null
    case "movementType":
      return w.movement?.caliber_type?.toLowerCase() ?? null
    case "caliber":
      return w.movement
        ? (caliberLabel(w.movement) ?? "").toLowerCase()
        : null
    case "box":
      return w.box?.toLowerCase() ?? null
    // Rank, not label — alphabetical would put High above Max. Ascending is
    // strongest-first, matching ATTACHMENT_LEVELS.
    case "attachment":
      return w.attachment ? ATTACHMENT_LEVELS.indexOf(w.attachment) : null
    default:
      return null
  }
}

function sortWatches(
  watches: WatchWithCover[],
  key: SortKey,
  dir: SortDir,
  valuationMids: Record<string, number>
): WatchWithCover[] {
  // Sold watches group to the bottom regardless of the active sort (§3.6) —
  // they are history, and interleaving them would break every column's
  // reading order. This runs even with no sort applied.
  const soldLast = (a: WatchWithCover, b: WatchWithCover) =>
    Number(a.sale_status === "sold") - Number(b.sale_status === "sold")

  if (key === "default") return [...watches].sort(soldLast)
  return [...watches].sort((a, b) => {
    const bySold = soldLast(a, b)
    if (bySold !== 0) return bySold
    const va = sortValue(a, key, valuationMids)
    const vb = sortValue(b, key, valuationMids)
    // Push missing values to the bottom regardless of direction.
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === "asc" ? cmp : -cmp
  })
}

export function CollectionView({ watches, categories, valuationMids, tierBands, guideNames, saleSummaries }: CollectionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Column visibility is owned here so the Columns menu can live in the
  // toolbar's second band alongside the chips (FIXES §3).
  const { chosenColumns, toggleColumn } = useColumnVisibility()

  // View + size preferences are personal, not URL-worthy → localStorage.
  const [view, setView] = useState<ViewMode>("table")
  const [size, setSize] = useState<number>(DEFAULT_SIZE)
  const [showCost, setShowCost] = useState(false)

  // The URL owns the whole filter set — read it, never mirror it into state
  // (CLAUDE.md: a soft navigation re-renders without re-mounting, so seeded
  // useState would go stale). This is what makes a filtered collection
  // survive a trip out to a watch and back, and what makes it linkable.
  const rawFilters = useMemo(() => filtersFromParams(searchParams), [searchParams])
  // An unset ?sale resolves against the view (§3.6): tiles browse what you
  // still own, the table is the two-sided ledger. An explicit choice wins.
  const viewDefaultSale = defaultSaleStatus(view)
  const filters = useMemo(
    () =>
      rawFilters.saleStatus
        ? rawFilters
        : { ...rawFilters, saleStatus: viewDefaultSale },
    [rawFilters, viewDefaultSale]
  )

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
    if (savedSize >= MIN_SIZE && savedSize <= MAX_SIZE) {
      // Snap legacy slider values onto the fixed S/M/L densities.
      const nearest = TILE_DENSITIES.reduce((best, d) =>
        Math.abs(d.size - savedSize) < Math.abs(best.size - savedSize) ? d : best
      )
      setSize(nearest.size)
    }
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")

    // Filters live in the URL now, never localStorage — drop any stale value
    // an older version left behind. Sort is a preference and does restore.
    localStorage.removeItem(FILTERS_KEY)
    try {
      const savedSort = localStorage.getItem(SORT_KEY)
      if (savedSort) {
        const parsed = JSON.parse(savedSort) as { key?: SortKey; dir?: SortDir }
        if (parsed.key && ALL_SORT_KEYS.includes(parsed.key)) setSortKey(parsed.key)
        if (parsed.dir === "asc" || parsed.dir === "desc") setSortDir(parsed.dir)
      }
    } catch {
      // ignore malformed stored value
    }
    // One sort owner now (B3) — drop the legacy table-sort key.
    try {
      localStorage.removeItem("collection-table-sort")
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

  // Record the list as it currently stands so the watch view's breadcrumb can
  // return to this exact collection — filters, search and all.
  useEffect(() => {
    try {
      sessionStorage.setItem(COLLECTION_RETURN_KEY, searchParams.toString())
    } catch {
      // Storage unavailable — the breadcrumb falls back to a bare collection.
    }
  }, [searchParams])

  function updateView(next: ViewMode) {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  function updateSize(next: number) {
    setSize(next)
    localStorage.setItem(SIZE_KEY, String(next))
  }

  // Filter edits rewrite the query string in place. `replace`, not `push`:
  // eleven controls would otherwise bury the page under history entries, and
  // replace still leaves the filtered URL in history — so Back from a watch
  // returns to the filtered list, which is the whole point.
  function updateFilters(next: CollectionFilters) {
    const qs = filtersToParams(next, searchParams).toString()
    startTransition(() => {
      router.replace(qs ? `/collection?${qs}` : "/collection", { scroll: false })
    })
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

  // Table headers are the only sort control in table view (B3): clicking a
  // header switches to that key, or flips direction when already active.
  function handleTableSort(key: TableSortKey) {
    if (sortKey === key) {
      toggleSortDir()
    } else {
      setSortKey(key)
      setSortDir("asc")
      persistSort(key, "asc")
    }
  }

  // Filter options derived from the actual collection.
  const { brandOptions, movementOptions, caliberTypes, caseMaterials, boxOptions, labelOptions } = useMemo(() => {
    const brandMap = new Map<string, string>()
    const movementMap = new Map<string, string>()
    const caliberSet = new Set<string>()
    const materialSet = new Set<string>()
    const boxSet = new Set<string>()
    const labelMap = new Map<string, { name: string; color: string }>()
    for (const w of watches) {
      brandMap.set(w.brand_id, w.brand.name)
      if (w.movement) {
        const label = caliberLabel(w.movement) ?? ""
        movementMap.set(w.movement.id, label)
        if (w.movement.caliber_type) caliberSet.add(w.movement.caliber_type)
      }
      if (w.case_material) materialSet.add(w.case_material)
      if (w.box) boxSet.add(w.box)
      for (const l of w.labels ?? []) labelMap.set(l.id, { name: l.name, color: l.color })
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
      boxOptions: [...boxSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      labelOptions: [...labelMap.entries()]
        .map(([id, { name, color }]) => ({ id, name, color }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [watches])

  // Complication filter offers exactly the supported set (the same
  // KNOWN_COMPLICATIONS the watch form uses), never free-text "other" values.
  const complicationOptions = [...KNOWN_COMPLICATIONS]

  // Guides that actually have wish-list members, for the wish-list sub-filter.
  const guideOptions = useMemo(
    () => [...new Set(Object.values(guideNames ?? {}))].sort(),
    [guideNames]
  )

  // Price-tier filter options come from the user's configured tiers, plus a
  // "No price" bucket for watches without a purchase price.
  const tierOptions = useMemo(
    () => [
      ...tierBands.map((b) => ({ key: `t${b.tier}`, label: b.label, short: b.short })),
      { key: "unpriced", label: "No price", short: "" },
    ],
    [tierBands]
  )

  // The "X of Y" total is status-scoped so unchecked statuses (e.g. hiding
  // wish-list watches) don't count toward the collection size.
  const ownershipTotal = useMemo(
    () => watches.filter((w) => matchesStatus(w, filters)).length,
    [watches, filters]
  )

  const afterFilters = useMemo(
    () => applyFilters(watches, filters, tierBands, guideNames ?? {}),
    [watches, filters, tierBands, guideNames]
  )

  // Lets the filter dialog preview a draft's match count without applying it.
  const countMatches = useCallback(
    (f: CollectionFilters) => applyFilters(watches, f, tierBands, guideNames ?? {}).length,
    [watches, tierBands, guideNames]
  )
  const afterSearch = useMemo(
    () => (query.trim() ? afterFilters.filter((w) => matchesQuery(w, query)) : afterFilters),
    [afterFilters, query]
  )
  const displayed = useMemo(
    () => sortWatches(afterSearch, sortKey, sortDir, valuationMids),
    [afterSearch, sortKey, sortDir, valuationMids]
  )

  // Sold watches are excluded from every money total (§3.6) — their value is
  // realized, not current — but they still appear in the list and the counts.
  const displayedUnsold = useMemo(
    () => displayed.filter((w) => w.sale_status !== "sold"),
    [displayed]
  )
  const soldShown = displayed.length - displayedUnsold.length

  // Total cost of the watches currently shown (filters + search applied).
  // Only rendered when the per-device "show cost" preference is on.
  const displayedTotalCents = useMemo(
    () => displayedUnsold.reduce((sum, w) => sum + (w.purchase_price_cents ?? 0), 0),
    [displayedUnsold]
  )

  // In "Tracked Only" mode, also total the latest market values of the
  // displayed watches so the header can show current value and gain/loss.
  const displayedValueCents = useMemo(
    () =>
      filters.priceTracking === "tracked"
        ? displayedUnsold.reduce((sum, w) => sum + (valuationMids[w.id] ?? 0), 0)
        : 0,
    [displayedUnsold, filters.priceTracking, valuationMids]
  )
  const gainPct =
    displayedValueCents > 0 && displayedTotalCents > 0
      ? ((displayedValueCents - displayedTotalCents) / displayedTotalCents) * 100
      : null

  // Band 2 carries the chips and the view-specific controls. It renders only
  // when it has something to hold — never an empty band, never a lone
  // floating button (FIXES §3). Columns is table view's only such control;
  // tiles view's sort and density sit in band 1.
  // The Filters badge counts only what the user explicitly chose, so the
  // view's own default never reads as a filter they applied — but the chip row
  // still states it, because a list that is quietly hiding rows must say so.
  const hasChips =
    activeFilterCount(rawFilters) > 0 || filters.saleStatus !== "all"
  const hasViewControls = view === "table"

  return (
    <div className="space-y-4">
      {/* Band 1 — identity + labelled stats (B1). */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-lg font-semibold tracking-tight">Collection</h1>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <Stat label="Showing" value={`${displayed.length}/${ownershipTotal}`} />
          {soldShown > 0 && <Stat label="Sold" value={String(soldShown)} />}
          {showCost && displayedTotalCents > 0 && (
            <Stat label="Cost" value={formatCurrency(displayedTotalCents, "USD", true)} />
          )}
          {showCost && filters.priceTracking === "tracked" && displayedValueCents > 0 && (
            <>
              <Stat label="Value" value={formatCurrency(displayedValueCents, "USD", true)} />
              {gainPct !== null && (
                <Stat
                  label="Delta"
                  value={`${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%`}
                  valueClassName={
                    gainPct >= 0 ? "text-chart-2" : "text-destructive"
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Toolbar band 1 — search (grows), Filters, then the view control. */}
      <div className="flex flex-wrap items-center gap-3">
        {/* "Filter", not "Search". This bar and the header's jump are two
            different verbs and must not look like the same promise: the jump
            answers "where is X" and navigates; this one answers "which of
            these match X" and narrows the list in place, owning ?q. Naming
            the count makes the scope explicit — it filters THESE watches. */}
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Filter these ${afterFilters.length} ${afterFilters.length === 1 ? "watch" : "watches"}…`}
          ariaLabel="Filter the collection"
          className="w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-md"
          // The header's JumpSearch stands down on /collection, so `/` is
          // free here — same muscle memory, this page's own search box.
          slashShortcut
        />

        <CollectionFiltersDialog
          filters={filters}
          onChange={updateFilters}
          guides={guideOptions}
          brands={brandOptions}
          movements={movementOptions}
          caliberTypes={caliberTypes}
          caseMaterials={caseMaterials}
          boxes={boxOptions}
          complications={complicationOptions}
          tiers={tierOptions}
          labels={labelOptions}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          viewDefaultSaleStatus={viewDefaultSale}
          countMatches={countMatches}
        />

        {/* Sort — only in tile view; table headers own sorting there (B3). */}
        {view === "gallery" && (
          <div className="flex items-center gap-1">
            <Select
              value={sortKey}
              onValueChange={(val) => {
                if (val) updateSortKey(val as SortKey)
              }}
            >
              <SelectTrigger aria-label="Sort by" className="h-9 w-[180px]">
                <span className="text-sm">{SORT_LABELS[sortKey]}</span>
              </SelectTrigger>
              <SelectContent>
                {DROPDOWN_SORT_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={toggleSortDir}
              disabled={sortKey === "default"}
              aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
              title={sortDir === "asc" ? "Ascending" : "Descending"}
              className="flex h-9 w-9 items-center justify-center rounded-md border text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              {sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        )}

        {/* View controls pinned right */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {view === "gallery" && (
            <div
              role="group"
              aria-label="Tile density"
              className="inline-flex overflow-hidden rounded-md border"
            >
              {TILE_DENSITIES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => updateSize(d.size)}
                  aria-pressed={size === d.size}
                  title={`${d.title} tiles`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center text-xs font-medium transition-colors first:border-l-0 [&:not(:first-child)]:border-l",
                    size === d.size
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
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
              title="Tile view"
              className={cn(
                "flex h-9 items-center gap-1.5 border-l px-3 text-xs font-medium transition-colors",
                view === "gallery"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Tiles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar band 2 — chips left (the page states what is filtering it,
          B2), view-specific controls right. Absent entirely when empty. */}
      {(hasChips || hasViewControls) && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <ActiveFilterChips
              filters={filters}
              onChange={updateFilters}
              brands={brandOptions}
              movements={movementOptions}
              labels={labelOptions}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              tiers={tierOptions}
            />
          </div>
          {view === "table" && (
            <ColumnsMenu
              chosenColumns={chosenColumns}
              toggleColumn={toggleColumn}
              showCost={showCost}
            />
          )}
          {/* Export what's on screen: displayed rows (filtered + sorted) ×
              chosen columns, money columns gated the same as the table. */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() =>
              downloadCsv(
                collectionCsv(
                  displayed,
                  chosenColumns.filter(
                    (id) => !MONEY_COLUMNS.includes(id) || showCost
                  ),
                  valuationMids,
                  saleSummaries
                ),
                `tentenloupe-collection-${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </Button>
        </div>
      )}

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
        <CollectionTable
          watches={displayed}
          showCost={showCost}
          guideNames={guideNames}
          // Clicking a value focuses the list on it — it replaces that filter
          // rather than adding to it, which is what "show me the Omegas" means.
          onBrandClick={(brandId) => updateFilters({ ...filters, brandId })}
          onCategoryClick={(categoryId) =>
            updateFilters({ ...filters, categoryIds: [categoryId] })
          }
          sortKey={sortKey === "default" || sortKey === "caseDiameter" ? null : sortKey}
          sortDir={sortDir}
          onSortChange={handleTableSort}
          chosenColumns={chosenColumns}
          saleSummaries={saleSummaries}
          valuationMids={valuationMids}
        />
      ) : (
        <GalleryGrid
          watches={displayed}
          itemSize={size}
          showCost={showCost}
          guideNames={guideNames}
          saleSummaries={saleSummaries}
        />
      )}
    </div>
  )
}
