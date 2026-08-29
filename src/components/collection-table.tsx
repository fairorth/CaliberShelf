"use client"

import { Archive, ArrowDown, ArrowUp, ChevronsUpDown, CircleDollarSign, Columns3, Filter, Watch } from "lucide-react"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { labelColorMap } from "@/lib/validations/label"
import { ComingSoonBadge } from "@/components/coming-soon-badge"
import { WishlistBadge } from "@/components/wishlist-badge"
import { GuideBadge } from "@/components/guide-badge"
import { GainValue } from "@/components/gain-value"
import { gainVersusBasis } from "@/lib/queries/gain"
import { caliberLabel } from "@/lib/caliber"
import { cn, formatCurrency } from "@/lib/utils"
import type { SaleSummary } from "@/lib/queries/sales"
import type { WatchWithCover, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface CollectionTableProps {
  /** Already sorted by the collection view — the single sort owner (B3). */
  watches: WatchWithCover[]
  /** Show each watch's purchase price (driven by the Config → Settings toggle). */
  showCost?: boolean
  /** watch_id → collection-guide name, for badging guide members. */
  guideNames?: Record<string, string>
  /** Brand cell click → filter the collection by that brand. */
  onBrandClick?: (brandId: string) => void
  /** Category cell click → filter the collection by that category. */
  onCategoryClick?: (categoryId: string) => void
  /** Current sort, owned by the collection view (B3). */
  sortKey: TableSortKey | null
  sortDir: TableSortDir
  /** Header click — the view toggles direction / switches key. */
  onSortChange: (key: TableSortKey) => void
  /** Visible columns, owned by the collection view so the Columns menu can
   *  sit in the toolbar's second band rather than orphaned above the table. */
  chosenColumns: ColumnId[]
  /** watch_id → net proceeds + realized gain for sold watches (§3.6). */
  saleSummaries?: Record<string, SaleSummary>
  /** watch_id → latest agent valuation mid (cents) — drives Value + Gain. */
  valuationMids?: Record<string, number>
}

function priceLabel(watch: WatchWithCover): string {
  return watch.purchase_price_cents !== null
    ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
    : "—"
}

/** "Aug 12, 2026" — the T00:00:00 suffix avoids the UTC off-by-one. */
function purchasedLabel(watch: WatchWithCover): string {
  return watch.purchase_date
    ? new Date(watch.purchase_date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"
}

/** Movement column text: the plain type label — Quartz, Automatic, or Manual. */
function movementTypeLabel(watch: WatchWithCover): string {
  const ct = watch.movement?.caliber_type
  if (!ct) return "—"
  return caliberTypeLabels[ct] ?? ct
}

// ── Sorting ────────────────────────────────────────────────────────
// The table renders headers only; sort state and the actual ordering live
// in the collection view — one sort owner (B3).

export type TableSortKey =
  | "category"
  | "brand"
  | "model"
  | "nickname"
  | "reference"
  | "movementType"
  | "caliber"
  | "box"
  | "wearCount"
  | "purchaseDate"
  | "price"
  | "value"
  | "gain"
export type TableSortDir = "asc" | "desc"

// ── Column widths (resizable, persisted) ───────────────────────────

export type ColumnId =
  | "photo"
  | "category"
  | "brand"
  | "model"
  | "nickname"
  | "reference"
  | "movementType"
  | "caliber"
  | "box"
  | "worn"
  | "purchased"
  | "price"
  | "value"
  | "gain"

/** Money columns share Price's gate: hidden unless Config → "show cost". */
export const MONEY_COLUMNS: ColumnId[] = ["price", "value", "gain"]

const COLUMN_WIDTHS_KEY = "collection-col-widths"
const MIN_COL_WIDTH = 56
/** 64px thumbnail + 8px cell padding a side. */
const PHOTO_COL_WIDTH = 80

// Column visibility (B5): eight on by default; Nickname, Caliber and Price
// are opt-in via the Columns dropdown, persisted per device.
const VISIBLE_COLUMNS_KEY = "collection-visible-columns"
const COLUMN_ORDER: ColumnId[] = [
  "photo",
  "category",
  "brand",
  "model",
  "nickname",
  "reference",
  "movementType",
  "caliber",
  "box",
  "worn",
  "purchased",
  "price",
  "value",
  "gain",
]
// Seven by default. Movement Type was the eighth (DECISIONS §7) but is empty
// in 101 of 161 rows — nine of the first twelve on screen — so it read as a
// blank column sitting between Model and Price. It stays one click away in the
// Columns menu for anyone who wants it; it is not worth ~130px of the default
// table to show an em-dash. Reference is nearly as sparse (103/161) but is an
// identifier people scan for, so it stays.
const DEFAULT_VISIBLE: ColumnId[] = [
  "photo",
  "brand",
  "model",
  "category",
  "reference",
  "box",
  "worn",
]
export const COLUMN_LABELS: Record<ColumnId, string> = {
  photo: "Photo",
  category: "Category",
  brand: "Brand",
  model: "Model",
  nickname: "Nickname",
  reference: "Ref #",
  movementType: "Movement Type",
  caliber: "Caliber",
  box: "Box",
  worn: "Worn",
  purchased: "Purchased",
  price: "Price",
  value: "Value",
  gain: "Gain",
}

/**
 * Column visibility (B5), persisted per device. It lives in a hook rather than
 * inside the table so the collection view can own the state and render the
 * Columns menu in the toolbar's second band (FIXES §3) — previously the menu
 * was stranded on its own right-aligned line above the table.
 */
export function useColumnVisibility() {
  const [chosenColumns, setChosenColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as ColumnId[]
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((id) => COLUMN_ORDER.includes(id))
        // Photo is a normal toggleable column now (perf: with it off, no
        // thumbnails mount). Legacy saved arrays always contained it, so
        // nothing changes for existing devices until they untick it.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (valid.length > 0) setChosenColumns(valid)
      }
    } catch {
      // ignore malformed stored value
    }
  }, [])

  const toggleColumn = useCallback((id: ColumnId) => {
    setChosenColumns((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { chosenColumns, toggleColumn }
}

/** The Columns chooser — a view-specific control for table view only. */
export function ColumnsMenu({
  chosenColumns,
  toggleColumn,
  showCost,
}: {
  chosenColumns: ColumnId[]
  toggleColumn: (id: ColumnId) => void
  showCost: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 gap-1.5" />}
      >
        <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* GroupLabel requires a Group ancestor in Base UI — without it the
            menu throws MenuGroupRootContext is missing the moment it opens. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COLUMN_ORDER.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={chosenColumns.includes(id)}
              onCheckedChange={() => toggleColumn(id)}
              disabled={MONEY_COLUMNS.includes(id) && !showCost}
            >
              {COLUMN_LABELS[id]}
              {MONEY_COLUMNS.includes(id) && !showCost && " (enable in Config)"}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Widths are re-balanced so the eight-column default fits a 1440px viewport
// (≈1192px of table once the 200px rail and page padding are removed) with
// room to spare. Photo and Category were over-wide; Ref, Box and Worn were
// starved enough to clip their own headers — "WORN" was cut off (FIXES §4).
const DEFAULT_WIDTHS: Record<ColumnId, number> = {
  // 64px image + 8px cell padding each side.
  photo: PHOTO_COL_WIDTH,
  // Sized to their longest real values plus the filter funnel, which reserves
  // its width at rest so revealing it on hover cannot shove the text sideways.
  // 96 clipped "Chronograph" in 19 rows; 148 clipped "Vacheron Constantin" in
  // 11. Both are the longest value in their column, not outliers.
  category: 116,
  brand: 168,
  // Model carries the status badges (WISH LIST + the guide name), which cost
  // ~160px before the name gets a pixel. At 200 the name truncated to a single
  // letter, so it takes the lion's share and Movement Type — whose values are
  // one short word — gives most of it back. Widened again in round 3: the name
  // was still truncating to "Historiqu…" against its badges. Now that the table
  // shrink-wraps, Model gets a real width instead of absorbing whatever the
  // viewport left over, which is what pinned Price to the far right. 400 rather
  // than 420 so widening Category and Brand keeps the default set inside a
  // 1400px viewport without a horizontal scrollbar.
  model: 400,
  nickname: 136,
  reference: 152,
  // 104 was too tight for the "Movement Type" header itself, which ran into
  // the Box heading. The column is sized by its label, not its values.
  movementType: 132,
  caliber: 136,
  box: 112,
  worn: 72,
  // "Aug 12, 2026" in 12px mono plus padding.
  purchased: 112,
  price: 104,
  value: 100,
  gain: 100,
}

// Below 1200px the eight-column default stops fitting. Fall back to a
// six-column set rather than introducing horizontal scroll (FIXES §4).
const NARROW_BREAKPOINT = "(max-width: 1199px)"
const NARROW_VISIBLE: ColumnId[] = [
  "photo",
  "brand",
  "model",
  "category",
  "reference",
  "worn",
]

/** Drag target on a header's right edge. Stops propagation so a resize
 *  never triggers the header's sort button. Keyboard: focus + arrow keys
 *  adjust the column width (F2). */
function ResizeHandle({
  label,
  onPointerDown,
  onKeyResize,
}: {
  label: string
  onPointerDown: (e: React.PointerEvent) => void
  onKeyResize: (delta: number) => void
}) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          onKeyResize(-16)
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          onKeyResize(16)
        }
      }}
      title={`Drag to resize the ${label} column`}
      // 11px of grab area immediately left of the divider, with the visible
      // rule sitting on the boundary itself — so you aim at the line you can
      // see, with a target wide enough to hit. It stays inside the cell rather
      // than straddling: an overhanging handle on the last column widens the
      // table's scroll area and leaves the container permanently scrolled by a
      // few pixels. The rule thickens to brass on hover, so you can tell what
      // you have hold of before you start dragging.
      className="absolute right-0 top-0 z-20 h-full w-[11px] cursor-col-resize touch-none select-none after:absolute after:inset-y-1.5 after:right-0 after:w-px after:rounded-full after:bg-border/70 after:transition-all hover:after:inset-y-0 hover:after:w-0.5 hover:after:bg-brass focus-visible:outline-none focus-visible:after:inset-y-0 focus-visible:after:w-0.5 focus-visible:after:bg-brass active:after:inset-y-0 active:after:w-0.5 active:after:bg-brass"
    />
  )
}

function SortableHeader({
  label,
  sortKey,
  colId,
  currentKey,
  currentDir,
  onSort,
  onResizeStart,
  onKeyResize,
  className,
  alignRight,
}: {
  label: string
  sortKey: TableSortKey
  colId: ColumnId
  currentKey: TableSortKey | null
  currentDir: TableSortDir
  onSort: (key: TableSortKey) => void
  /** Omitted for the flex column, whose width is not the user's to set. */
  onResizeStart?: (e: React.PointerEvent, col: ColumnId) => void
  onKeyResize?: (col: ColumnId, delta: number) => void
  className?: string
  alignRight?: boolean
}) {
  const isActive = currentKey === sortKey
  return (
    <TableHead
      aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("relative", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 truncate text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground",
          isActive && "text-foreground",
          alignRight ? "w-full justify-end" : "text-left"
        )}
      >
        {label}
        <span className="text-2xs">
          {isActive ? (currentDir === "asc" ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />) : <ChevronsUpDown className="h-3 w-3 opacity-60" aria-hidden="true" />}
        </span>
      </button>
      {onResizeStart && onKeyResize && (
        <ResizeHandle
          label={label}
          onPointerDown={(e) => onResizeStart(e, colId)}
          onKeyResize={(delta) => onKeyResize(colId, delta)}
        />
      )}
    </TableHead>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function LabelBadge({ label }: { label: Label }) {
  const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${colors.bg} ${colors.text}`}
    >
      {label.name}
    </span>
  )
}

function HoverPhoto({
  url,
  thumbUrl,
  alt,
  size,
}: {
  /** Full-size cover — the hover preview only. */
  url: string | null
  /** ~192px cover — the thumbnail. Falls back to the full one if absent. */
  thumbUrl?: string | null
  alt: string
  size: "sm" | "md"
}) {
  const thumbClass = size === "sm" ? "h-16 w-16" : "h-20 w-20"
  const thumbPx = size === "sm" ? "64px" : "80px"
  const containerRef = useRef<HTMLDivElement>(null)
  const [showAbove, setShowAbove] = useState(false)
  // The preview used to be mounted for every row and merely hidden, so the
  // table requested two images per watch — 312 of them on a 161-watch
  // collection. It now mounts on first hover and stays mounted, so the zoom
  // is instant on every subsequent hover of that row.
  const [everHovered, setEverHovered] = useState(false)

  function handleMouseEnter() {
    setEverHovered(true)
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setShowAbove(rect.top > 300)
  }

  return (
    <div
      ref={containerRef}
      className="group/photo relative"
      onMouseEnter={handleMouseEnter}
    >
      {/* `relative` is load-bearing: next/image `fill` positions against the
          nearest positioned ancestor, and without it here the image escaped
          this square and sized itself to the outer wrapper — i.e. to the whole
          PHOTO column. At a wide column that produced a ~290x48 letterbox
          strip through the middle of the watch, which is exactly the reported
          bug. Square, object-cover, fixed size: the thumbnail must not depend
          on the column width at all. */}
      <div className={`${thumbClass} relative shrink-0 overflow-hidden rounded-md bg-muted`}>
        {url ? (
          <Image
            src={thumbUrl ?? url}
            alt={alt}
            fill
            className="object-cover"
            sizes={thumbPx}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><Watch className="h-5 w-5" aria-hidden="true" /></div>
        )}
      </div>
      {url && everHovered && (
        <div
          className={`pointer-events-none invisible absolute left-20 z-50 opacity-0 transition-all duration-200 group-hover/photo:visible group-hover/photo:opacity-100 ${
            showAbove ? "bottom-0" : "top-0"
          }`}
        >
          <div className="overflow-hidden rounded-lg border bg-background shadow-xl">
            <div className="relative h-64 w-64">
              <Image src={url} alt={alt} fill className="object-cover" sizes="256px" unoptimized />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * A cell whose whole area filters the collection instead of opening the watch.
 *
 * This used to be a 16px funnel that only existed on hover, sitting beside a
 * value that navigated — so the obvious click (the brand name) did the one
 * thing the icon promised it wouldn't. The funnel is now decoration marking
 * the cell as filterable; the button underneath is the entire cell.
 *
 * That is a deliberate narrowing of B5's "one row, one destination": the row
 * still opens the watch everywhere else, but these two columns belong to the
 * filter.
 */
function FilterCell({
  label,
  title,
  ariaLabel,
  onFilter,
  className,
}: {
  label: string
  title: string
  ariaLabel: string
  /** Omitted when there is nothing to filter on (no category) — renders plain. */
  onFilter?: () => void
  className?: string
}) {
  if (!onFilter) {
    return (
      <TableCell className={className}>
        <span className="truncate">{label}</span>
      </TableCell>
    )
  }
  return (
    // p-0 on the cell, p-2 on the button: the button inherits the padding it
    // replaces, so its hit area is the cell rather than just the text.
    <TableCell className={cn("p-0", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onFilter()
        }}
        title={title}
        aria-label={ariaLabel}
        className="flex h-full w-full min-w-0 items-center gap-1 p-2 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brass/50"
      >
        <span className="truncate">{label}</span>
        <Filter
          className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
          aria-hidden="true"
        />
      </button>
    </TableCell>
  )
}

// ── Main Component ─────────────────────────────────────────────────

export function CollectionTable({
  watches,
  showCost = false,
  guideNames,
  onBrandClick,
  onCategoryClick,
  sortKey,
  sortDir,
  onSortChange,
  chosenColumns,
  saleSummaries,
  valuationMids,
}: CollectionTableProps) {
  const router = useRouter()

  // Selected row (Ctrl/Cmd+click — plain click navigates, B5). Distinct
  // from hover — the future hook for bulk actions (B4).
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Narrow viewports drop to the six-column set (FIXES §4).
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(NARROW_BREAKPOINT)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia is unavailable during SSR
    setIsNarrow(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Column widths — user-resizable via header drag handles, persisted per device.
  const [colWidths, setColWidths] = useState<Record<ColumnId, number>>(DEFAULT_WIDTHS)
  const widthsRef = useRef(colWidths)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as Partial<Record<ColumnId, number>>
      const next = { ...DEFAULT_WIDTHS }
      for (const id of Object.keys(DEFAULT_WIDTHS) as ColumnId[]) {
        const w = parsed[id]
        if (typeof w === "number" && Number.isFinite(w)) {
          next[id] = Math.max(MIN_COL_WIDTH, Math.round(w))
        }
      }
      widthsRef.current = next
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColWidths(next)
    } catch {
      // ignore malformed stored value
    }
  }, [])

  // Arrow-key resize for keyboard users (F2). Persists like a drag does.
  function handleKeyResize(col: ColumnId, delta: number) {
    setColWidths((prev) => {
      const next = {
        ...prev,
        [col]: Math.max(MIN_COL_WIDTH, Math.round(prev[col] + delta)),
      }
      widthsRef.current = next
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(next))
      return next
    })
  }

  function handleResizeStart(e: React.PointerEvent, col: ColumnId) {
    e.preventDefault()
    e.stopPropagation()
    // Start from the rendered width so the first drag pixel tracks the cursor
    // even when the browser distributed leftover table width to this column.
    const th = (e.target as HTMLElement).closest("th")
    const startWidth = th?.getBoundingClientRect().width ?? colWidths[col]
    const startX = e.clientX

    function onMove(ev: PointerEvent) {
      const w = Math.max(MIN_COL_WIDTH, Math.round(startWidth + ev.clientX - startX))
      setColWidths((prev) => {
        const next = { ...prev, [col]: w }
        widthsRef.current = next
        return next
      })
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widthsRef.current))
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Price stays gated by the Config → Settings "show cost" preference on top
  // of the column choice (B5). Below 1200px the set narrows to six (FIXES §4).
  const effectiveChosen = isNarrow
    ? chosenColumns.filter((id) => NARROW_VISIBLE.includes(id))
    : chosenColumns
  const visibleColumns: ColumnId[] = COLUMN_ORDER.filter(
    (id) => effectiveChosen.includes(id) && (!MONEY_COLUMNS.includes(id) || showCost)
  )
  const isVisible = (id: ColumnId) => visibleColumns.includes(id)

  // Plain click navigates to the watch; Ctrl/Cmd+click toggles selection (B5).
  function handleRowClick(e: React.MouseEvent, watchId: string) {
    if (e.ctrlKey || e.metaKey) {
      setSelectedRowId((prev) => (prev === watchId ? null : watchId))
      return
    }
    router.push(`/watch/${watchId}`)
  }

  // Sorting happens in the collection view (B3) — render as given.
  const sorted = watches
  const handleSort = onSortChange

  // The table is sized explicitly rather than left to shrink-to-fit. `w-fit`
  // alone cannot work here: the Table primitive wraps itself in a `w-full`
  // div, so the wrapper sizes to the table, the table to the wrapper, and the
  // browser resolves the circle by taking all the width available — which is
  // the proportional stretch we are trying to avoid. An exact pixel width on
  // both makes each column literally its own width.
  const tableWidth = visibleColumns.reduce((sum, id) => sum + colWidths[id], 0)


  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Watch className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h3 className="mt-4 text-md font-semibold">No watches yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first watch to start building your collection.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table. The Columns chooser lives in the collection toolbar's
          second band, not here — see ColumnsMenu (FIXES §3). */}
      <div className="hidden sm:block">
        {/* Scroll is confined to the table. Without this the overflow escapes
            to <main>, which drags the page header sideways and slices the
            SHOWING/COST figures at the viewport edge (FIXES §4). With the
            default column set there is nothing to scroll; it only engages
            once the user opts extra columns in. */}
        {/* Sized to the table so the border hugs it instead of framing a strip
            of empty space; max-w-full so a wide column set scrolls rather than
            pushing the page sideways. */}
        <div
          className="max-w-full overflow-x-auto rounded-lg border"
          // +2 for the wrapper's own 1px borders: box-sizing is border-box, so
          // without it the content box is 2px narrower than the table and the
          // container scrolls by those 2px at every viewport.
          style={{ width: tableWidth + 2 }}
        >
          {/* w-auto, not w-full: a fixed-layout table that is told to fill its
              container treats the colgroup widths as proportions and inflates
              every column to match — which is how a 72px PHOTO became 138px at
              2400px. Shrink-wrapping makes the widths literal, so a column is
              exactly as wide as it says and resizing one column moves only that
              boundary. */}
          <Table className="w-auto table-fixed" style={{ width: tableWidth }}>
            {/* Every column carries its own pixel width. The table shrink-wraps
                (see w-auto below) so these are honoured exactly rather than
                treated as ratios — that is what stops PHOTO inflating on a wide
                monitor, without needing a flex column. */}
            <colgroup>
              {visibleColumns.map((id) => (
                <col key={id} style={{ width: colWidths[id] }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                {isVisible("photo") && (
                  <TableHead className="relative text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Photo
                    <ResizeHandle
                      label="Photo"
                      onPointerDown={(e) => handleResizeStart(e, "photo")}
                      onKeyResize={(delta) => handleKeyResize("photo", delta)}
                    />
                  </TableHead>
                )}
                {isVisible("category") && <SortableHeader label="Category" sortKey="category" colId="category" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("brand") && <SortableHeader label="Brand" sortKey="brand" colId="brand" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("model") && <SortableHeader label="Model" sortKey="model" colId="model" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("nickname") && <SortableHeader label="Nickname" sortKey="nickname" colId="nickname" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("reference") && <SortableHeader label="Ref #" sortKey="reference" colId="reference" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("movementType") && <SortableHeader label="Movement Type" sortKey="movementType" colId="movementType" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("caliber") && <SortableHeader label="Caliber" sortKey="caliber" colId="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("box") && <SortableHeader label="Box" sortKey="box" colId="box" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("worn") && <SortableHeader label="Worn" sortKey="wearCount" colId="worn" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />}
                {isVisible("purchased") && <SortableHeader label="Purchased" sortKey="purchaseDate" colId="purchased" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />}
                {isVisible("price") && (
                  <SortableHeader label="Price" sortKey="price" colId="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />
                )}
                {isVisible("value") && <SortableHeader label="Value" sortKey="value" colId="value" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />}
                {isVisible("gain") && <SortableHeader label="Gain" sortKey="gain" colId="gain" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((watch, i) => (
                <TableRow
                  key={watch.id}
                  onClick={(e) => handleRowClick(e, watch.id)}
                  aria-selected={selectedRowId === watch.id}
                  className={cn(
                    // Sold rows keep their place but recede (§3.6) — the row
                    // is history, not inventory.
                    watch.sale_status === "sold" && "opacity-55 [&_img]:grayscale-[0.7]",
                    // Quiet zebra (B4, FIXES §5): alternate rows step one
                    // notch off the page surface — --muted at 70% is ~2% L
                    // below --background in light mode, readable without
                    // shouting, and it keeps plain --muted chips legible on
                    // top. Skipped on the selected row so the two background
                    // utilities never race in the cascade; hover: variants
                    // are emitted after plain utilities, so hover still wins.
                    "group cursor-pointer border-b border-border/60",
                    i % 2 === 1 && selectedRowId !== watch.id && "bg-muted/70",
                    selectedRowId === watch.id
                      ? "bg-accent/60 shadow-[inset_2px_0_0_var(--brass)] hover:bg-accent/60"
                      : "hover:bg-accent/40 hover:shadow-[inset_2px_0_0_var(--brass)]"
                  )}
                >
                  {isVisible("photo") && (
                    <TableCell className="py-2">
                      <HoverPhoto
                        url={watch.cover_photo_url}
                        thumbUrl={watch.cover_thumb_url}
                        alt={`${watch.brand.name} ${watch.model}`}
                        size="sm"
                      />
                    </TableCell>
                  )}
                  {isVisible("category") && (
                    <FilterCell
                      className="text-muted-foreground"
                      label={watch.category?.name ?? "—"}
                      onFilter={
                        watch.category && onCategoryClick
                          ? () => onCategoryClick(watch.category!.id)
                          : undefined
                      }
                      title={`Show all ${watch.category?.name}`}
                      ariaLabel={`Filter by category ${watch.category?.name}`}
                    />
                  )}
                  {isVisible("brand") && (
                    <FilterCell
                      className="text-sm font-medium"
                      label={watch.brand.name}
                      onFilter={
                        onBrandClick ? () => onBrandClick(watch.brand_id) : undefined
                      }
                      title={`Show all ${watch.brand.name}`}
                      ariaLabel={`Filter by brand ${watch.brand.name}`}
                    />
                  )}
                  {isVisible("model") && (
                    // The cell must clip: model name + status badges routinely
                    // exceed the fixed column width, and with table-fixed the
                    // overflow printed straight over the Ref # column. The name
                    // truncates; the badges are status and always stay legible.
                    <TableCell className="overflow-hidden">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-muted-foreground">{watch.model}</span>
                        {watch.sale_status === "sold" && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 align-middle font-mono text-2xs uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                            Sold
                          </span>
                        )}
                        {watch.sale_status === "listed" && (
                          <span className="shrink-0 rounded-full px-2 py-0.5 align-middle font-mono text-2xs uppercase tracking-wide text-brass ring-1 ring-brass/45">
                            Listed
                          </span>
                        )}
                        {watch.sale_status === "candidate" && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 align-middle font-mono text-2xs uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                            Candidate
                          </span>
                        )}
                        {watch.is_coming_soon && <ComingSoonBadge className="shrink-0 align-middle" />}
                        {watch.is_wishlist && <WishlistBadge className="shrink-0 align-middle" />}
                        {watch.is_wishlist && guideNames?.[watch.id] && (
                          <GuideBadge name={guideNames[watch.id]} className="shrink-0 align-middle" />
                        )}
                        {/* title goes on the wrapper: lucide icons take no title
                            prop, and the tooltip is the point (§5). */}
                        {watch.price_check_enabled && (
                          <span
                            title="Price checking enabled"
                            className="inline-flex shrink-0 align-middle"
                          >
                            <CircleDollarSign
                              aria-label="Price checking enabled"
                              className="h-3.5 w-3.5 text-brass"
                            />
                          </span>
                        )}
                      </span>
                    </TableCell>
                  )}
                  {isVisible("nickname") && (
                    <TableCell className="text-muted-foreground">
                      {watch.nickname || "—"}
                    </TableCell>
                  )}
                  {isVisible("reference") && (
                    <TableCell className="truncate font-mono text-xs text-muted-foreground">
                      {watch.reference_number || "—"}
                    </TableCell>
                  )}
                  {isVisible("movementType") && (
                    <TableCell className="text-muted-foreground">
                      {movementTypeLabel(watch)}
                    </TableCell>
                  )}
                  {isVisible("caliber") && (
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {watch.movement
                        ? caliberLabel(watch.movement)
                        : "—"}
                    </TableCell>
                  )}
                  {isVisible("box") && (
                    <TableCell className="truncate text-xs text-muted-foreground">
                      {watch.box || "\u2014"}
                    </TableCell>
                  )}
                  {isVisible("worn") && (
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {watch.wear_count ?? 0}
                    </TableCell>
                  )}
                  {isVisible("purchased") && (
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {purchasedLabel(watch)}
                    </TableCell>
                  )}
                  {isVisible("price") && (
                    <TableCell className="text-right font-mono text-xs font-medium tabular-nums text-foreground">
                      {/* A sold row shows what it actually returned, with the
                          realized gain beneath — not what it once cost (§3.6). */}
                      {watch.sale_status === "sold" && saleSummaries?.[watch.id] ? (
                        <span className="flex flex-col items-end leading-tight">
                          <span>
                            {formatCurrency(saleSummaries[watch.id].netProceedsCents)}
                          </span>
                          <GainValue
                            gain={saleSummaries[watch.id].gain}
                            wholeDollars
                            className="text-2xs font-normal"
                          />
                        </span>
                      ) : (
                        priceLabel(watch)
                      )}
                    </TableCell>
                  )}
                  {/* Value + Gain are unrealized-market columns: sold watches
                      show — here (their realized story lives in Price, §3.6). */}
                  {isVisible("value") && (
                    <TableCell className="text-right font-mono text-xs font-medium tabular-nums text-foreground">
                      {watch.sale_status !== "sold" && valuationMids?.[watch.id] != null
                        ? formatCurrency(valuationMids[watch.id], "USD", true)
                        : "—"}
                    </TableCell>
                  )}
                  {isVisible("gain") && (
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      <GainValue
                        gain={
                          watch.sale_status !== "sold" && valuationMids?.[watch.id] != null
                            ? gainVersusBasis(valuationMids[watch.id], watch)
                            : null
                        }
                        wholeDollars
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Visible legend — markers must not carry meaning only in a title (E2/F2). */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CircleDollarSign className="h-3 w-3 text-brass" aria-hidden="true" />
            price tracked
          </span>
          <span className="flex items-center gap-1">
            <Archive className="h-3 w-3" aria-hidden="true" />
            storage box
          </span>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-2 sm:hidden">
        {sorted.map((watch) => (
          <div
            key={watch.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              watch.sale_status === "sold" && "opacity-55 [&_img]:grayscale-[0.7]"
            )}
          >
            <Link
              href={`/watch/${watch.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {watch.cover_photo_url ? (
                  <Image
                    src={watch.cover_thumb_url ?? watch.cover_photo_url}
                    alt={`${watch.brand.name} ${watch.model}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground"><Watch className="h-5 w-5" aria-hidden="true" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {watch.category && (
                  <p className="truncate text-2xs uppercase tracking-wide text-muted-foreground">
                    {watch.category.name}
                  </p>
                )}
                <p className="text-sm font-semibold leading-tight">
                  {watch.brand.name}
                  {watch.sale_status === "sold" && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle font-mono text-2xs uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                      Sold
                    </span>
                  )}
                  {watch.is_coming_soon && <ComingSoonBadge className="ml-2 align-middle" />}
                  {watch.is_wishlist && <WishlistBadge className="ml-2 align-middle" />}
                  {watch.is_wishlist && guideNames?.[watch.id] && (
                    <GuideBadge name={guideNames[watch.id]} className="ml-2 align-middle" />
                  )}
                  {watch.price_check_enabled && (
                    <span
                      title="Price checking enabled"
                      className="ml-2 inline-flex align-middle"
                    >
                      <CircleDollarSign
                        aria-label="Price checking enabled"
                        className="h-3.5 w-3.5 text-brass"
                      />
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{watch.model}</p>
                {watch.box && (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Archive className="h-3 w-3 shrink-0" aria-hidden="true" /> {watch.box}</p>
                )}
                {showCost &&
                  (watch.sale_status === "sold" && saleSummaries?.[watch.id] ? (
                    <p className="flex items-baseline gap-2 text-sm font-medium tabular-nums">
                      {formatCurrency(saleSummaries[watch.id].netProceedsCents)}
                      <GainValue
                        gain={saleSummaries[watch.id].gain}
                        wholeDollars
                        className="text-xs font-normal"
                      />
                    </p>
                  ) : (
                    <p className="text-sm font-medium tabular-nums">{priceLabel(watch)}</p>
                  ))}
                {watch.movement && (
                  <p className="truncate text-xs text-muted-foreground">
                    {watch.movement.caliber_type ? (caliberTypeLabels[watch.movement.caliber_type] ?? watch.movement.caliber_type) : "—"}
                    {watch.movement.caliber_name ? ` · ${watch.movement.caliber_name}` : ""}
                  </p>
                )}
                {watch.labels && watch.labels.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {watch.labels.map((label) => (
                      <LabelBadge key={label.id} label={label} />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
