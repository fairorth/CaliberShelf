"use client"

import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { ComingSoonBadge } from "@/components/coming-soon-badge"
import { WishlistBadge } from "@/components/wishlist-badge"
import { formatCurrency } from "@/lib/utils"
import type { WatchWithCover } from "@/lib/types/watch"

interface GalleryGridProps {
  watches: WatchWithCover[]
  /** Min tile width in px — the grid uses auto-fill, so columns shrink as tiles grow */
  itemSize: number
  /** Show each watch's purchase price (driven by the Config → Settings toggle). */
  showCost?: boolean
}

export function GalleryGrid({ watches, itemSize, showCost = false }: GalleryGridProps) {
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
      className="grid gap-[18px]"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
      }}
    >
      {watches.map((watch) => {
        const typeLabel = watch.movement?.caliber_type
          ? caliberTypeLabels[watch.movement.caliber_type] ?? watch.movement.caliber_type
          : null
        // Caliber line (bottom-left): manufacturer + caliber name, e.g. "Miyota 8215".
        const caliberLine = watch.movement
          ? `${watch.movement.manufacturer ? watch.movement.manufacturer + " " : ""}${watch.movement.caliber_name}`.trim()
          : null
        const priceLabel =
          showCost && watch.purchase_price_cents !== null
            ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
            : null
        const showFooter = Boolean(caliberLine) || priceLabel !== null
        const wearCount = watch.wear_count ?? 0

        return (
        <Link
          key={watch.id}
          href={`/watch/${watch.id}`}
          className="group flex flex-col overflow-hidden rounded-[13px] border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_16px_30px_rgba(0,0,0,0.4)]"
        >
          {/* Header strip — movement type sits above the photo (small, top-left)
              so it never covers the watch image. */}
          <div className="flex h-7 items-center px-3 pt-1">
            {typeLabel && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                {typeLabel}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              {watch.is_coming_soon && <ComingSoonBadge />}
              {watch.is_wishlist && <WishlistBadge />}
              {wearCount > 0 && (
                <span
                  title={`Worn ${wearCount} ${wearCount === 1 ? "time" : "times"}`}
                  className="font-mono text-[10px] text-muted-foreground"
                >
                  ◷ {wearCount}
                </span>
              )}
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden border-y border-border/70 bg-[radial-gradient(circle_at_50%_38%,#222a33,#12161c_80%)]">
            {watch.cover_photo_url ? (
              <Image
                src={watch.cover_photo_url}
                alt={`${watch.brand.name} ${watch.model}`}
                fill
                sizes={sizesHint}
                // Covers are already small pre-generated thumbnails (~65KB);
                // load them straight from Supabase's CDN instead of paying for
                // (uncacheable, signed-URL) Next image optimization.
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                ⌚
              </div>
            )}
          </div>
          <div className="px-3.5 pb-4 pt-3">
            <p className="truncate font-display text-base font-semibold leading-tight">
              {watch.brand.name}
            </p>
            <p className="truncate text-[13px] text-muted-foreground">{watch.model}</p>
            {showFooter && (
              <div className="mt-2.5 flex items-start justify-between gap-2.5 border-t border-border pt-2.5">
                {/* Caliber name wraps up to 3 lines (then ellipsis) so long
                    movement names aren't clipped to a few characters when the
                    price shares the row. */}
                <span className="min-w-0 flex-1 font-mono text-[10.5px] leading-snug text-muted-foreground/80 [overflow-wrap:anywhere] line-clamp-3">
                  {caliberLine ?? ""}
                </span>
                {priceLabel && (
                  <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums text-brass">
                    {priceLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
        )
      })}
    </div>
  )
}
