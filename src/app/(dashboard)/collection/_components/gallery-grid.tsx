"use client"

import { Archive, CalendarDays, CircleDollarSign, Watch } from "lucide-react"

import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { ComingSoonBadge } from "@/components/coming-soon-badge"
import { WishlistBadge } from "@/components/wishlist-badge"
import { GuideBadge } from "@/components/guide-badge"
import { GainValue } from "@/components/gain-value"
import { cn, formatCurrency } from "@/lib/utils"
import type { SaleSummary } from "@/lib/queries/sales"
import type { WatchWithCover } from "@/lib/types/watch"

interface GalleryGridProps {
  watches: WatchWithCover[]
  /** Min tile width in px — the grid uses auto-fill, so columns shrink as tiles grow */
  itemSize: number
  /** Show each watch's purchase price (driven by the Config → Settings toggle). */
  showCost?: boolean
  /** watch_id → collection-guide name, for badging guide members. */
  guideNames?: Record<string, string>
  /** watch_id → net proceeds + realized gain for sold watches (§3.6). */
  saleSummaries?: Record<string, SaleSummary>
}

export function GalleryGrid({ watches, itemSize, showCost = false, guideNames, saleSummaries }: GalleryGridProps) {
  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Watch className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h3 className="mt-4 text-md font-semibold">No watches match this filter</h3>
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
        // A sold tile shows what it returned, not what it cost (§3.6).
        const sold = watch.sale_status === "sold"
        const sale = sold ? saleSummaries?.[watch.id] : undefined
        const priceLabel = !showCost
          ? null
          : sale
            ? formatCurrency(sale.netProceedsCents)
            : watch.purchase_price_cents !== null
              ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
              : null
        const showFooter = Boolean(caliberLine) || priceLabel !== null
        const wearCount = watch.wear_count ?? 0

        // Frame the cover with the stored dial focal point + zoom, exactly as
        // the home hero does (B6) — never a bare centred crop.
        const focalX = watch.dial_focal_x ?? 50
        const focalY = watch.dial_focal_y ?? 50
        const zoom = watch.dial_zoom ?? 1

        return (
        <Link
          key={watch.id}
          href={`/watch/${watch.id}`}
          className={cn(
            "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_16px_30px_rgba(0,0,0,0.4)]",
            sold && "opacity-55 [&_img]:grayscale-[0.7]"
          )}
        >
          {/* Photo first: 4:5 portrait from the tile's top edge (B6). */}
          <div className="relative aspect-[4/5] overflow-hidden border-b border-border/70 bg-surface-photo">
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
                style={{
                  objectPosition: `${focalX}% ${focalY}%`,
                  transform: zoom > 1 ? `scale(${zoom})` : undefined,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Watch className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            {/* Status badges overlay the photo's top-right on hover — never a
                permanent strip that outweighs the watch (B6). */}
            <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              {watch.is_coming_soon && <ComingSoonBadge />}
              {watch.is_wishlist && <WishlistBadge />}
              {watch.is_wishlist && guideNames?.[watch.id] && (
                <GuideBadge name={guideNames[watch.id]} />
              )}
              {watch.price_check_enabled && (
                <span
                  title="Price checking enabled"
                  className="rounded-full bg-background/85 p-1 backdrop-blur"
                >
                  <CircleDollarSign
                    aria-label="Price checking enabled"
                    className="h-3.5 w-3.5 text-brass"
                  />
                </span>
              )}
              {wearCount > 0 && (
                <span
                  aria-label={`Worn ${wearCount} ${wearCount === 1 ? "time" : "times"}`}
                  className="flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 font-mono text-2xs text-muted-foreground backdrop-blur"
                >
                  <CalendarDays className="h-3 w-3" aria-hidden="true" /> {wearCount}
                </span>
              )}
            </div>
          </div>
          <div className="px-3.5 pb-4 pt-3">
            <p className="truncate text-sm font-medium leading-tight">
              {watch.brand.name}
            </p>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{watch.model}</span>
              {sold && (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                  Sold
                </span>
              )}
            </p>
            {watch.box && (
              <p
                title={`Stored in ${watch.box}`}
                className="mt-1 truncate font-mono text-2xs uppercase tracking-[0.06em] text-muted-foreground"
              >
                <Archive className="h-3 w-3" aria-hidden="true" /> {watch.box}
              </p>
            )}
            {(showFooter || typeLabel) && (
              <div className="mt-2.5 flex items-start justify-between gap-2.5 border-t border-border pt-2.5">
                {/* Movement type + caliber share the footer (B6); the caliber
                    wraps up to 3 lines so long names aren't clipped. */}
                <span className="min-w-0 flex-1 font-mono text-2xs leading-snug text-muted-foreground [overflow-wrap:anywhere] line-clamp-3">
                  {[typeLabel, caliberLine].filter(Boolean).join(" · ")}
                </span>
                {priceLabel && (
                  <span className="flex shrink-0 flex-col items-end leading-tight">
                    <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                      {priceLabel}
                    </span>
                    {sale && (
                      <GainValue gain={sale.gain} wholeDollars className="text-2xs" />
                    )}
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
