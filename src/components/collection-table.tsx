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
import { cn, formatCurrency } from "@/lib/utils"
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
}

function priceLabel(watch: WatchWithCover): string {
  return watch.purchase_price_cents !== null
    ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
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
  | "price"
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
  | "price"

const COLUMN_WIDTHS_KEY = "collection-col-widths"
const MIN_COL_WIDTH = 56
/** 56px thumbnail + 8px cell padding a side. Not user-adjustable — see below. */
const PHOTO_COL_WIDTH = 72
/**
 * The single column left at `width: auto`, so it absorbs all the slack when the
 * table is wider than its fixed columns instead of every column inflating.
 * Model is the right one: it holds the longest values and its badges, and it
 * was the column truncating to "Historiques Chronom…" while PHOTO sat on
 * hundreds of pixels of empty space.
 */
const FLEX_COLUMN: ColumnId = "model"
/** Floor for the flex column, so it scrolls rather than collapsing. */
const FLEX_MIN_WIDTH = 260

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
  "price",
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
const COLUMN_LABELS: Record<ColumnId, string> = {
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
  price: "Price",
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (valid.length > 0) setChosenColumns(valid.includes("photo") ? valid : ["photo", ...valid])
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
          {COLUMN_ORDER.filter((id) => id !== "photo").map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={chosenColumns.includes(id)}
              onCheckedChange={() => toggleColumn(id)}
              disabled={id === "price" && !showCost}
            >
              {COLUMN_LABELS[id]}
              {id === "price" && !showCost && " (enable in Config)"}
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
  // 56px image + 8px cell padding each side. Fixed and NOT resizable: the
  // photo cell has exactly one job at exactly one size, so any other width can
  // only add dead space. A stored width from a previous build is ignored for
  // this column — that is how the review ended up with a ~300px photo column.
  photo: PHOTO_COL_WIDTH,
  category: 96,
  brand: 148,
  // Model carries the status badges (WISH LIST + the guide name), which cost
  // ~160px before the name gets a pixel. At 200 the name truncated to a single
  // letter, so it takes the lion's share and Movement Type — whose values are
  // one short word — gives most of it back. Widened again in round 3: the name
  // was still truncating to "Historiqu…" against its badges.
  model: 320,
  nickname: 136,
  reference: 152,
  // 104 was too tight for the "Movement Type" header itself, which ran into
  // the Box heading. The column is sized by its label, not its values.
  movementType: 132,
  caliber: 136,
  box: 112,
  worn: 72,
  price: 104,
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
      // The handle is a keyboard stop, so its focus state has to be visible.
      // It was outline-none plus a 1px hairline that only changed colour —
      // indistinguishable from the resting state, which is what makes a
      // focused handle read as an unexplained mark in a header cell.
      className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize touch-none select-none after:absolute after:inset-y-1.5 after:right-[3px] after:w-px after:rounded-full after:bg-border/70 after:transition-all hover:after:bg-brass/70 focus-visible:outline-none focus-visible:after:inset-y-0 focus-visible:after:right-[2px] focus-visible:after:w-0.5 focus-visible:after:bg-brass active:after:bg-brass"
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
  alt,
  size,
}: {
  url: string | null
  alt: string
  size: "sm" | "md"
}) {
  const thumbClass = size === "sm" ? "h-14 w-14" : "h-16 w-16"
  const thumbPx = size === "sm" ? "56px" : "64px"
  const containerRef = useRef<HTMLDivElement>(null)
  const [showAbove, setShowAbove] = useState(false)

  function handleMouseEnter() {
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
          <Image src={url} alt={alt} fill className="object-cover" sizes={thumbPx} unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><Watch className="h-5 w-5" aria-hidden="true" /></div>
        )}
      </div>
      {url && (
        <div
          className={`pointer-events-none invisible absolute left-14 z-50 opacity-0 transition-all duration-200 group-hover/photo:visible group-hover/photo:opacity-100 ${
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
        // Photo is fixed. Skipping it here is what retires a stored width from
        // an older build, which is how a ~300px photo column outlived the
        // default that replaced it.
        if (id === "photo") continue
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
    (id) => effectiveChosen.includes(id) && (id !== "price" || showCost)
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

  // Floor for the table: the fixed columns at their set widths plus the flex
  // column's minimum. Past this the container scrolls, so opting several extra
  // columns in can never squeeze Model to nothing.
  const tableMinWidth =
    visibleColumns.reduce(
      (sum, id) => sum + (id === FLEX_COLUMN ? FLEX_MIN_WIDTH : colWidths[id]),
      0
    ) + 2

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
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed" style={{ minWidth: tableMinWidth }}>
            {/* Model's column is deliberately `auto` while every other column
                is a fixed pixel width. In a fixed table layout the colgroup
                widths are a *ratio*, not a pin: when they sum to less than the
                table, the surplus is shared out proportionally, so on a wide
                monitor a 72px PHOTO inflated to 138px at 2400px and further
                still beyond that — a 56px thumbnail marooned in a wide empty
                cell. Leaving exactly one column auto sends the entire surplus
                there instead, which is both the fix and where the width was
                wanted. */}
            <colgroup>
              {visibleColumns.map((id) => (
                <col
                  key={id}
                  style={id === FLEX_COLUMN ? undefined : { width: colWidths[id] }}
                />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                {/* No resize handle: the column is a fixed 72px around a fixed
                    56px thumbnail, so dragging it could only add dead space. */}
                <TableHead className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Photo
                </TableHead>
                {isVisible("category") && <SortableHeader label="Category" sortKey="category" colId="category" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("brand") && <SortableHeader label="Brand" sortKey="brand" colId="brand" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {/* Model has no resize handle: it is the flex column, so its
                    width is whatever the other columns leave it. Narrow another
                    column and Model grows to match. */}
                {isVisible("model") && <SortableHeader label="Model" sortKey="model" colId="model" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />}
                {isVisible("nickname") && <SortableHeader label="Nickname" sortKey="nickname" colId="nickname" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("reference") && <SortableHeader label="Ref #" sortKey="reference" colId="reference" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("movementType") && <SortableHeader label="Movement Type" sortKey="movementType" colId="movementType" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("caliber") && <SortableHeader label="Caliber" sortKey="caliber" colId="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("box") && <SortableHeader label="Box" sortKey="box" colId="box" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />}
                {isVisible("worn") && <SortableHeader label="Worn" sortKey="wearCount" colId="worn" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />}
                {isVisible("price") && (
                  <SortableHeader label="Price" sortKey="price" colId="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((watch, i) => (
                <TableRow
                  key={watch.id}
                  onClick={(e) => handleRowClick(e, watch.id)}
                  aria-selected={selectedRowId === watch.id}
                  className={cn(
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
                  <TableCell className="py-2">
                    <HoverPhoto
                      url={watch.cover_photo_url}
                      alt={`${watch.brand.name} ${watch.model}`}
                      size="sm"
                    />
                  </TableCell>
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
                        ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim()
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
                  {isVisible("price") && (
                    <TableCell className="text-right font-mono text-xs font-medium tabular-nums text-foreground">
                      {priceLabel(watch)}
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
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors"
          >
            <Link
              href={`/watch/${watch.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {watch.cover_photo_url ? (
                  <Image
                    src={watch.cover_photo_url}
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
                {showCost && (
                  <p className="text-sm font-medium tabular-nums">{priceLabel(watch)}</p>
                )}
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
