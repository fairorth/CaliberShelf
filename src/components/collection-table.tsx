"use client"

import { useRef, useState } from "react"
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
import { movementLabels } from "@/lib/validations/watch"
import { labelColorMap } from "@/lib/validations/label"
import type { WatchWithCover, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface CollectionTableProps {
  watches: WatchWithCover[]
}

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
  const thumbClass = size === "sm"
    ? "h-12 w-12"
    : "h-14 w-14"
  const thumbPx = size === "sm" ? "48px" : "56px"
  const containerRef = useRef<HTMLDivElement>(null)
  const [showAbove, setShowAbove] = useState(false)

  function handleMouseEnter() {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // If thumbnail is in the top 300px of viewport, show popup below; otherwise above
    setShowAbove(rect.top > 300)
  }

  return (
    <div
      ref={containerRef}
      className="group/photo relative"
      onMouseEnter={handleMouseEnter}
    >
      {/* Thumbnail */}
      <div className={`${thumbClass} overflow-hidden rounded-md bg-muted`}>
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            className="object-cover"
            sizes={thumbPx}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
            ⌚
          </div>
        )}
      </div>

      {/* Hover preview — only if we have a photo */}
      {url && (
        <div
          className={`pointer-events-none invisible absolute left-14 z-50 opacity-0 transition-all duration-200 group-hover/photo:visible group-hover/photo:opacity-100 ${
            showAbove ? "bottom-0" : "top-0"
          }`}
        >
          <div className="overflow-hidden rounded-lg border bg-background shadow-xl">
            <div className="relative h-64 w-64">
              <Image
                src={url}
                alt={alt}
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CollectionTable({ watches }: CollectionTableProps) {
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
      {/* Desktop table — hidden on small screens */}
      <div className="hidden sm:block">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Photo</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Movement Type</TableHead>
                <TableHead>Caliber</TableHead>
                <TableHead>Labels</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watches.map((watch) => (
                <TableRow key={watch.id} className="group">
                  <TableCell className="py-2">
                    <Link href={`/watch/${watch.id}`} className="block">
                      <HoverPhoto
                        url={watch.cover_photo_url}
                        alt={`${watch.brand.name} ${watch.model}`}
                        size="sm"
                      />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/watch/${watch.id}`}
                      className="font-medium hover:underline"
                    >
                      {watch.brand.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/watch/${watch.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      {watch.model}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {watch.movement
                      ? movementLabels[watch.movement.movement_type] ?? watch.movement.movement_type
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile stacked cards — visible on small screens */}
      <div className="space-y-2 sm:hidden">
        {watches.map((watch) => (
          <Link
            key={watch.id}
            href={`/watch/${watch.id}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {watch.cover_photo_url ? (
                <Image
                  src={watch.cover_photo_url}
                  alt={`${watch.brand.name} ${watch.model}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                  ⌚
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {watch.brand.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {watch.model}
              </p>
              {watch.movement && (
                <p className="truncate text-xs text-muted-foreground">
                  {movementLabels[watch.movement.movement_type] ?? watch.movement.movement_type}
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
        ))}
      </div>
    </>
  )
}
