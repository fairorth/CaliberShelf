"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AttentionItem, AttentionReport } from "@/lib/queries/attention"
import { ATTENTION_INCLUDE_WISHLIST_KEY } from "@/lib/preferences"

function StatusBadge({ status }: { status: AttentionItem["status"] }) {
  if (status === "wishlist") {
    return (
      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-400">
        Wish List
      </span>
    )
  }
  if (status === "coming_soon") {
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
        Coming Soon
      </span>
    )
  }
  return null
}

function AttentionSection({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string
  icon: string
  items: AttentionItem[]
  emptyText: string
}) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brass/15 text-sm">
            {icon}
          </span>
          {title}
          <span className="ml-auto rounded-full bg-foreground/10 px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">✓ {emptyText}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
                >
                  <span className="font-medium group-hover:text-primary">{item.name}</span>
                  {item.detail && (
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  )}
                  <StatusBadge status={item.status} />
                  <span className="ml-auto flex flex-wrap justify-end gap-1.5">
                    {item.missing.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                      >
                        {m}
                      </span>
                    ))}
                  </span>
                  <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function AttentionReportView({ report }: { report: AttentionReport }) {
  // Wish-list watches are aspirational, so let the user hide them from the
  // worklist. Default ON to preserve the report's prior behavior. Only watches
  // carry a wish-list status; movements/brands are unaffected. The choice is
  // sticky (per-device localStorage) so it survives navigating in and out.
  const [includeWishlist, setIncludeWishlist] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(ATTENTION_INCLUDE_WISHLIST_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only preference
    if (saved !== null) setIncludeWishlist(saved === "1")
  }, [])

  function toggleWishlist(next: boolean) {
    setIncludeWishlist(next)
    localStorage.setItem(ATTENTION_INCLUDE_WISHLIST_KEY, next ? "1" : "0")
  }

  const wishlistCount = report.watches.filter((w) => w.status === "wishlist").length
  const watches = includeWishlist
    ? report.watches
    : report.watches.filter((w) => w.status !== "wishlist")

  const total = report.brands.length + report.movements.length + watches.length

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-display text-lg font-medium tracking-tight">Attention Needed</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Everything is complete 🎉"
            : `${total} item${total === 1 ? "" : "s"} with missing information — click any row to fix it`}
        </p>
      </div>

      {wishlistCount > 0 && (
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeWishlist}
            onChange={(e) => toggleWishlist(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Include wish-list watches
          <span className="text-xs text-muted-foreground">
            {includeWishlist ? `(${wishlistCount})` : `(${wishlistCount} hidden)`}
          </span>
        </label>
      )}

      <div className="space-y-5">
        <AttentionSection
          title="Watches"
          icon="⌚"
          items={watches}
          emptyText="Every watch has its critical specs."
        />
        <AttentionSection
          title="Movements"
          icon="⚙️"
          items={report.movements}
          emptyText="Every in-use movement has lift angle, beat rate, and type."
        />
        <AttentionSection
          title="Brands"
          icon="🏷️"
          items={report.brands}
          emptyText="Every brand has a store URL and type."
        />
      </div>
    </>
  )
}
