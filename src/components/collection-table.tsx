"use client"

import { Archive, ArrowDown, ArrowUp, ChevronsUpDown, CircleDollarSign, Watch } from "lucide-react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
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
  /** Brand cell click → filter by that brand (mirrors the category link). */
  onBrandClick?: (brandId: string) => void
  /** Current sort, owned by the collection view (B3). */
  sortKey: TableSortKey | null
  sortDir: TableSortDir
  /** Header click — the view toggles direction / switches key. */
  onSortChange: (key: TableSortKey) => void
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

type ColumnId =
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

const DEFAULT_WIDTHS: Record<ColumnId, number> = {
  photo: 64,
  category: 112,
  brand: 144,
  model: 208,
  nickname: 136,
  reference: 144,
  movementType: 152,
  caliber: 136,
  box: 120,
  worn: 64,
  price: 104,
}

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
      className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize touch-none select-none after:absolute after:inset-y-1.5 after:right-[3px] after:w-px after:bg-border/70 hover:after:bg-brass/70 focus-visible:outline-none focus-visible:after:bg-brass active:after:bg-brass"
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
  onResizeStart: (e: React.PointerEvent, col: ColumnId) => void
  onKeyResize: (col: ColumnId, delta: number) => void
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
      <ResizeHandle
        label={label}
        onPointerDown={(e) => onResizeStart(e, colId)}
        onKeyResize={(delta) => onKeyResize(colId, delta)}
      />
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
  const thumbClass = size === "sm" ? "h-12 w-12" : "h-14 w-14"
  const thumbPx = size === "sm" ? "48px" : "56px"
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
      <div className={`${thumbClass} overflow-hidden rounded-md bg-muted`}>
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

// ── Main Component ─────────────────────────────────────────────────

export function CollectionTable({
  watches,
  showCost = false,
  guideNames,
  onBrandClick,
  sortKey,
  sortDir,
  onSortChange,
}: CollectionTableProps) {
  // Selected row (click anywhere in a row that isn't a link/button). Distinct
  // from hover — the future hook for bulk actions (B4).
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

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

  const visibleColumns: ColumnId[] = [
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
    ...(showCost ? (["price"] as ColumnId[]) : []),
  ]

  // Sorting happens in the collection view (B3) — render as given.
  const sorted = watches
  const handleSort = onSortChange

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
      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="rounded-lg border">
          <Table className="table-fixed">
            <colgroup>
              {visibleColumns.map((id) => (
                <col key={id} style={{ width: colWidths[id] }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="relative text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Photo
                  <ResizeHandle
                    label="Photo"
                    onPointerDown={(e) => handleResizeStart(e, "photo")}
                    onKeyResize={(delta) => handleKeyResize("photo", delta)}
                  />
                </TableHead>
                <SortableHeader label="Category" sortKey="category" colId="category" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Brand" sortKey="brand" colId="brand" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Model" sortKey="model" colId="model" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Nickname" sortKey="nickname" colId="nickname" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Ref #" sortKey="reference" colId="reference" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Movement Type" sortKey="movementType" colId="movementType" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Caliber" sortKey="caliber" colId="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Box" sortKey="box" colId="box" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} />
                <SortableHeader label="Worn" sortKey="wearCount" colId="worn" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />
                {showCost && (
                  <SortableHeader label="Price" sortKey="price" colId="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} onKeyResize={handleKeyResize} className="text-right" alignRight />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((watch) => (
                <TableRow
                  key={watch.id}
                  onClick={() =>
                    setSelectedRowId((prev) => (prev === watch.id ? null : watch.id))
                  }
                  aria-selected={selectedRowId === watch.id}
                  className={cn(
                    // No stripe at rest — a hairline per row reads more
                    // instrument-like and survives light mode (B4).
                    "group border-b border-border/60",
                    selectedRowId === watch.id
                      ? "bg-accent/60 shadow-[inset_2px_0_0_var(--brass)] hover:bg-accent/60"
                      : "hover:bg-accent/40 hover:shadow-[inset_2px_0_0_var(--brass)]"
                  )}
                >
                  <TableCell className="py-2">
                    <Link href={`/watch/${watch.id}/edit`} className="block">
                      <HoverPhoto
                        url={watch.cover_photo_url}
                        alt={`${watch.brand.name} ${watch.model}`}
                        size="sm"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {watch.category ? (
                      <Link
                        href={`/collection?category=${watch.category.id}`}
                        className="hover:underline hover:text-foreground"
                      >
                        {watch.category.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {onBrandClick ? (
                      // Filters to this brand — same affordance as the category link.
                      <button
                        type="button"
                        onClick={() => onBrandClick(watch.brand_id)}
                        title={`Show all ${watch.brand.name}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {watch.brand.name}
                      </button>
                    ) : (
                      <Link href={`/watch/${watch.id}/edit`} className="text-sm font-medium hover:underline">
                        {watch.brand.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/watch/${watch.id}/edit`} className="text-muted-foreground hover:underline">
                      {watch.model}
                    </Link>
                    {watch.is_coming_soon && <ComingSoonBadge className="ml-2 align-middle" />}
                    {watch.is_wishlist && <WishlistBadge className="ml-2 align-middle" />}
                    {watch.is_wishlist && guideNames?.[watch.id] && (
                      <GuideBadge name={guideNames[watch.id]} className="ml-2 align-middle" />
                    )}
                    {watch.price_check_enabled && (
                      <CircleDollarSign
                        aria-label="Price checking enabled"
                        className="ml-2 inline h-3.5 w-3.5 align-middle text-emerald-600 dark:text-emerald-400"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {watch.nickname ? (
                      <Link href={`/watch/${watch.id}/edit`} className="hover:underline">
                        {watch.nickname}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {watch.reference_number || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movementTypeLabel(watch)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {watch.movement
                      ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim()
                      : "—"}
                  </TableCell>
                  <TableCell className="truncate text-xs text-muted-foreground">
                    {watch.box || "\u2014"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {watch.wear_count ?? 0}
                  </TableCell>
                  {showCost && (
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
            <CircleDollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
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
              href={`/watch/${watch.id}/edit`}
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
                    <CircleDollarSign
                      aria-label="Price checking enabled"
                      className="ml-2 inline h-3.5 w-3.5 align-middle text-emerald-600 dark:text-emerald-400"
                    />
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
