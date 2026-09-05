"use client"

import { Archive, CalendarDays, CircleDollarSign, Watch } from "lucide-react"

import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { caliberLabel } from "@/lib/caliber"
import { ComingSoonBadge } from "@/components/coming-soon-badge"
import { WishlistBadge } from "@/components/wishlist-badge"
import { GuideBadge } from "@/components/guide-badge"
import { GainValue } from "@/components/gain-value"
import { WearTodayTileButton } from "./wear-today-tile-button"
import { cn, formatCurrency } from "@/lib/utils"
import type { SaleSummary } from "@/lib/queries/sales"
import type { WatchWithCover } from "@/lib/types/watch"

interface GalleryGridProps {
  watches: WatchWithCover[]
  /** Min tile width in px — the grid uses auto-fill, so columns shrink as tiles grow */
  itemSize: number
  /** Show each watch's price on the tile. Tiles have no column picker, so the
   *  Config → Settings cost preference is the only control they get. */
  showCost?: boolean
  /** Show each watch's purchase price (driven by the Config → Settings toggle). */
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
          ? caliberLabel(watch.movement)
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
        // Only a watch you actually own and still have can be worn.
        const canWear = !sold && !watch.is_wishlist && !watch.is_coming_soon

        return (
        <article
          key={watch.id}
          className={cn(
            // `relative` + the stretched link below: the whole tile is one
            // click target, but it is NOT an <a> wrapping everything, so the
            // Wear today button can be a real <button> instead of interactive
            // content illegally nested inside an anchor.
            "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_16px_30px_rgba(0,0,0,0.4)]",
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
                // A plain centre crop (Phase 9 §1.1). The focal point and zoom
                // are gone with the dial-framing editor: the frame reaching
                // this tile is already the one nearest 1:1, chosen in the
                // query, so it survives a square-ish crop without being aimed
                // by hand. A crop tool bent the photograph to fit the frame;
                // choosing the right photograph is the same fix without 121
                // crosshairs.
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Watch className="h-8 w-8" aria-hidden="true" />
              </div>
            )}

            {/* Ownership status is PERMANENT, top-left. Coming Soon and Wish
                List answer "is this even mine?" — that is identity, not
                incidental metadata, and a tile that only admits it on hover
                reads as an owned watch until you happen to point at it. The
                hover strip below keeps everything that genuinely is
                incidental. */}
            {(watch.is_coming_soon || watch.is_wishlist) && (
              <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
                {watch.is_coming_soon && <ComingSoonBadge />}
                {watch.is_wishlist && <WishlistBadge />}
              </div>
            )}

            {/* Incidental markers overlay the photo's top-right on hover —
                never a permanent strip that outweighs the watch (B6). */}
            <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
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
          <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
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

            {/* Wear today, on the tile. This is what makes tiles-mode filtered
                to a box actually useful: the box IS the week's rotation, so
                logging what you put on should not require a trip to the watch
                page. Owned, unsold watches only — you cannot wear something you
                do not have. `relative z-10` lifts it above the stretched link. */}
            {canWear && (
              <WearTodayTileButton
                watchId={watch.id}
                name={`${watch.brand.name} ${watch.model}`}
                className="relative z-10 mt-2.5"
              />
            )}
          </div>

          {/* The stretched link: last in DOM order so it covers the tile, and
              below anything that lifts itself with z-10. */}
          <Link
            href={`/watch/${watch.id}`}
            className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <span className="sr-only">
              {watch.brand.name} {watch.model}
            </span>
          </Link>
        </article>
        )
      })}
    </div>
  )
}
