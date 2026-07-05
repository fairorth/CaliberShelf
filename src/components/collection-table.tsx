"use client"

import { useRef, useState, useMemo } from "react"
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

/** Movement column text: "Mechanical · Automatic" for mechanical calibers, else
 * the plain type label (e.g. "Quartz"). Matches the redesign's Movement column. */
function movementTypeLabel(watch: WatchWithCover): string {
  const ct = watch.movement?.caliber_type
  if (!ct) return "—"
  const label = caliberTypeLabels[ct] ?? ct
  return /autom|manual/i.test(ct) || /Automatic|Manual/.test(label)
    ? `Mechanical · ${label}`
    : label
}

// ── Sorting ────────────────────────────────────────────────────────

type SortKey = "category" | "brand" | "model" | "movementType" | "caliber" | "labels" | "wearCount" | "price"
type SortDir = "asc" | "desc"

function getSortValue(watch: WatchWithCover, key: SortKey): string {
  switch (key) {
    case "category":
      return (watch.category?.name ?? "zzz").toLowerCase()
    case "brand":
      return watch.brand.name.toLowerCase()
    case "model":
      return watch.model.toLowerCase()
    case "movementType":
      return watch.movement
        ? (watch.movement.caliber_type ? (caliberTypeLabels[watch.movement.caliber_type] ?? watch.movement.caliber_type) : "—").toLowerCase()
        : "zzz" // push empty to bottom
    case "caliber":
      return watch.movement
        ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim().toLowerCase()
        : "zzz"
    case "labels":
      return watch.labels?.map((l) => l.name).sort().join(",").toLowerCase() ?? ""
    case "wearCount":
    case "price":
      return "" // these sort numerically in the comparator below
  }
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
  alignRight,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey | null
  currentDir: SortDir
  onSort: (key: SortKey) => void
  className?: string
  alignRight?: boolean
}) {
  const isActive = currentKey === sortKey
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80 transition-colors hover:text-foreground",
          isActive && "text-foreground",
          alignRight ? "w-full justify-end" : "text-left"
        )}
      >
        {label}
        <span className="text-[10px]">
          {isActive ? (currentDir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px] text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">Photo</TableHead>
                <SortableHeader label="Category" sortKey="category" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Brand" sortKey="brand" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Model" sortKey="model" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Movement Type" sortKey="movementType" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Caliber" sortKey="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Labels" sortKey="labels" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Worn" sortKey="wearCount" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" alignRight />
                {showCost && (
                  <SortableHeader label="Price" sortKey="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" alignRight />
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
                    <Link href={`/watch/${watch.id}`} className="block">
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
                    <Link href={`/watch/${watch.id}`} className="font-display text-[15.5px] font-semibold hover:underline">
                      {watch.brand.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/watch/${watch.id}`} className="text-muted-foreground hover:underline">
                      {watch.model}
                    </Link>
                    {watch.is_coming_soon && <ComingSoonBadge className="ml-2 align-middle" />}
                    {watch.is_wishlist && <WishlistBadge className="ml-2 align-middle" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movementTypeLabel(watch)}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {watch.movement
                      ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {watch.labels && watch.labels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {watch.labels.map((label) => (
                          <LabelBadge key={label.id} label={label} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
