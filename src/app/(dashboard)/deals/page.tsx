import type { Metadata } from "next"
import Link from "next/link"
import { getWishlistDeals } from "@/lib/queries/deals"
import { formatCurrency, cn } from "@/lib/utils"
import type { DealAvailability } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Deals | CaliberShelf",
}

// Badge treatment per availability state
const AVAILABILITY_BADGE: Record<
  DealAvailability,
  { label: string; className: string }
> = {
  available: {
    label: "Available now!",
    className: "bg-emerald-500/15 text-emerald-400",
  },
  preorder: { label: "Pre-order", className: "bg-sky-500/15 text-sky-400" },
  sold_out: { label: "Sold out", className: "bg-muted text-muted-foreground" },
  not_found: {
    label: "Not found",
    className: "bg-amber-500/15 text-amber-400",
  },
  no_store: {
    label: "No store URL",
    className: "bg-amber-500/10 text-amber-500/80",
  },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground" },
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function DealsPage() {
  const listings = await getWishlistDeals()
  const availableCount = listings.filter(
    (l) => l.deal?.availability === "available"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-display text-lg font-medium tracking-tight">
          Wish List Deals
        </h1>
        <p className="text-sm text-muted-foreground">
          {listings.length} watch{listings.length === 1 ? "" : "es"} tracked
          {availableCount > 0 && (
            <span className="text-emerald-400">
              {" "}
              · {availableCount} available now
            </span>
          )}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="max-w-xl rounded-xl border border-border bg-white/[0.02] px-5 py-6 text-sm text-muted-foreground">
          <p>
            No wish-list watches yet. Mark a watch as{" "}
            <span className="text-foreground">Wish list</span> on its edit page
            and it will show up here with live availability from the brand&apos;s
            store.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Watch</th>
                <th className="px-4 py-3 font-medium">Availability</th>
                <th className="px-4 py-3 text-right font-medium">Retail</th>
                <th className="px-4 py-3 text-right font-medium">Est. cost</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 text-right font-medium">Checked</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(({ watch, deal }, i) => {
                const badge = AVAILABILITY_BADGE[deal?.availability ?? "unknown"]
                return (
                  <tr
                    key={watch.id}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      i % 2 === 1 && "bg-white/[0.02]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/watch/${watch.id}/edit`}
                        className="font-medium hover:text-primary"
                      >
                        {watch.brands?.name}{" "}
                        <span className="text-foreground/90">{watch.model}</span>
                      </Link>
                      {watch.reference_number && (
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {watch.reference_number}
                        </div>
                      )}
                      {deal?.notes && (
                        <div className="mt-0.5 text-xs text-amber-500/80">
                          {deal.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-brass">
                      {deal?.retail_price_cents != null
                        ? formatCurrency(deal.retail_price_cents, deal.currency, true)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {watch.purchase_price_cents != null
                        ? formatCurrency(watch.purchase_price_cents, "USD", true)
                        : "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3">
                      {deal?.product_url ? (
                        <a
                          href={deal.product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                          title={deal.product_title ?? undefined}
                        >
                          {deal.product_title ?? "View listing"}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {deal ? timeAgo(deal.checked_at) : "never"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="max-w-2xl text-xs text-muted-foreground">
        Availability and retail price come from each brand&apos;s official store
        (checked daily). Set a brand&apos;s store URL in Config → Brands to enable
        tracking; pre-owned market prices arrive with the gray-market agent
        (Phase B).
      </p>
    </div>
  )
}
