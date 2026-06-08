"use client"

import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import type { WatchWithCover } from "@/lib/types/watch"

interface GalleryGridProps {
  watches: WatchWithCover[]
  /** Min tile width in px — the grid uses auto-fill, so columns shrink as tiles grow */
  itemSize: number
}

export function GalleryGrid({ watches, itemSize }: GalleryGridProps) {
  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">⌚</span>
        <h3 className="mt-4 text-lg font-semibold">No watches match this filter</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try changing the category filter above.
        </p>
      </div>
    )
  }

  // Round the sizes hint down to the nearest 32px bucket so Next.js can
  // reuse cached image variants across small slider movements.
  const sizesHint = `${Math.ceil(itemSize / 32) * 32}px`

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
      }}
    >
      {watches.map((watch) => {
        const caliber = watch.movement?.caliber_name
        const typeLabel = watch.movement?.caliber_type
          ? caliberTypeLabels[watch.movement.caliber_type] ?? watch.movement.caliber_type
          : null
        const movementLine = caliber
          ? typeLabel
            ? `${caliber} (${typeLabel})`
            : caliber
          : null

        return (
        <Link
          key={watch.id}
          href={`/watch/${watch.id}`}
          className="group flex flex-col gap-2"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/40 group-hover:shadow-md">
            {watch.cover_photo_url ? (
              <Image
                src={watch.cover_photo_url}
                alt={`${watch.brand.name} ${watch.model}`}
                fill
                sizes={sizesHint}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                ⌚
              </div>
            )}
          </div>
          <div className="px-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {watch.brand.name} {watch.model}
            </p>
            {movementLine && (
              <p className="truncate text-xs text-muted-foreground">
                {movementLine}
              </p>
            )}
          </div>
        </Link>
        )
      })}
    </div>
  )
}
