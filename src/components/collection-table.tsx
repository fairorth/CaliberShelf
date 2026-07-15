"use client"

import { useEffect, useRef, useState, useMemo } from "react"
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
import { cn, formatCurrency } from "@/lib/utils"
import type { WatchWithCover, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface CollectionTableProps {
  watches: WatchWithCover[]
  /** Show each watch's purchase price (driven by the Config → Settings toggle). */
  showCost?: boolean
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

type SortKey = "category" | "brand" | "model" | "nickname" | "reference" | "movementType" | "caliber" | "wearCount" | "price"
type SortDir = "asc" | "desc"

function getSortValue(watch: WatchWithCover, key: SortKey): string {
  switch (key) {
    case "category":
      return (watch.category?.name ?? "zzz").toLowerCase()
    case "brand":
      return watch.brand.name.toLowerCase()
    case "model":
      return watch.model.toLowerCase()
    case "nickname":
      return watch.nickname ? watch.nickname.toLowerCase() : "zzz" // push empty to bottom
    case "reference":
      return watch.reference_number ? watch.reference_number.toLowerCase() : "zzz"
    case "movementType":
      return watch.movement
        ? (watch.movement.caliber_type ? (caliberTypeLabels[watch.movement.caliber_type] ?? watch.movement.caliber_type) : "—").toLowerCase()
        : "zzz" // push empty to bottom
    case "caliber":
      return watch.movement
        ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim().toLowerCase()
        : "zzz"
    case "wearCount":
    case "price":
      return "" // these sort numerically in the comparator below
  }
}

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
  worn: 64,
  price: 104,
}

/** Drag target on a header's right edge. Stops propagation so a resize
 *  never triggers the header's sort button. */
function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize touch-none select-none after:absolute after:inset-y-1.5 after:right-[3px] after:w-px after:bg-border/70 hover:after:bg-brass/70 active:after:bg-brass"
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
  className,
  alignRight,
}: {
  label: string
  sortKey: SortKey
  colId: ColumnId
  currentKey: SortKey | null
  currentDir: SortDir
  onSort: (key: SortKey) => void
  onResizeStart: (e: React.PointerEvent, col: ColumnId) => void
  className?: string
  alignRight?: boolean
}) {
  const isActive = currentKey === sortKey
  return (
    <TableHead className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80 transition-colors hover:text-foreground",
          isActive && "text-foreground",
          alignRight ? "w-full justify-end" : "text-left"
        )}
      >
        {label}
        <span className="text-[10px]">
          {isActive ? (currentDir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
      <ResizeHandle onPointerDown={(e) => onResizeStart(e, colId)} />
    </TableHead>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function LabelBadge({ label }: { label: Label }) {
  const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
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
          <div className="flex h-full items-center justify-center text-lg text-muted-foreground">⌚</div>
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

export function CollectionTable({ watches, showCost = false }: CollectionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

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
    "worn",
    ...(showCost ? (["price"] as ColumnId[]) : []),
  ]

  // Sort watches
  const sorted = useMemo(() => {
    if (!sortKey) return watches
    return [...watches].sort((a, b) => {
      if (sortKey === "price") {
        const pa = a.purchase_price_cents
        const pb = b.purchase_price_cents
        // Watches without a price always sort to the bottom.
        if (pa === null && pb === null) return 0
        if (pa === null) return 1
        if (pb === null) return -1
        return sortDir === "asc" ? pa - pb : pb - pa
      }
      if (sortKey === "wearCount") {
        const wa = a.wear_count ?? 0
        const wb = b.wear_count ?? 0
        return sortDir === "asc" ? wa - wb : wb - wa
      }
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      const cmp = va.localeCompare(vb)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [watches, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">⌚</span>
        <h3 className="mt-4 text-lg font-semibold">No watches yet</h3>
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
                <TableHead className="relative text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
                  Photo
                  <ResizeHandle onPointerDown={(e) => handleResizeStart(e, "photo")} />
                </TableHead>
                <SortableHeader label="Category" sortKey="category" colId="category" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Brand" sortKey="brand" colId="brand" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Model" sortKey="model" colId="model" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Nickname" sortKey="nickname" colId="nickname" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Ref #" sortKey="reference" colId="reference" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Movement Type" sortKey="movementType" colId="movementType" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Caliber" sortKey="caliber" colId="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} />
                <SortableHeader label="Worn" sortKey="wearCount" colId="worn" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} className="text-right" alignRight />
                {showCost && (
                  <SortableHeader label="Price" sortKey="price" colId="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} onResizeStart={handleResizeStart} className="text-right" alignRight />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((watch, i) => (
                <TableRow
                  key={watch.id}
                  className={cn(
                    "group",
                    // Zebra striping: a faint neutral band alternating with a faint blue band.
                    i % 2 === 0
                      ? "bg-[oklch(0.78_0.012_245_/_0.05)]"
                      : "bg-[oklch(0.6_0.11_233_/_0.12)]"
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
                    <Link href={`/watch/${watch.id}/edit`} className="font-display text-[15.5px] font-semibold hover:underline">
                      {watch.brand.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/watch/${watch.id}/edit`} className="text-muted-foreground hover:underline">
                      {watch.model}
                    </Link>
                    {watch.is_coming_soon && <ComingSoonBadge className="ml-2 align-middle" />}
                    {watch.is_wishlist && <WishlistBadge className="ml-2 align-middle" />}
                    {watch.price_check_enabled && (
                      <span
                        title="Price checking enabled"
                        className="ml-2 align-middle font-mono text-[13px] font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        $$
                      </span>
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
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {watch.reference_number || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movementTypeLabel(watch)}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {watch.movement
                      ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums text-muted-foreground">
                    {watch.wear_count ?? 0}
                  </TableCell>
                  {showCost && (
                    <TableCell className="text-right font-mono text-[13.5px] font-medium tabular-nums text-brass">
                      {priceLabel(watch)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  <div className="flex h-full items-center justify-center text-lg text-muted-foreground">⌚</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {watch.category && (
                  <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                    {watch.category.name}
                  </p>
                )}
                <p className="text-sm font-semibold leading-tight">
                  {watch.brand.name}
                  {watch.is_coming_soon && <ComingSoonBadge className="ml-2 align-middle" />}
                  {watch.is_wishlist && <WishlistBadge className="ml-2 align-middle" />}
                  {watch.price_check_enabled && (
                    <span
                      title="Price checking enabled"
                      className="ml-2 align-middle font-mono text-[13px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      $$
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{watch.model}</p>
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
