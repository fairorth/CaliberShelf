import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWatches } from "@/lib/queries/watches"
import { formatCurrency } from "@/lib/utils"
import type { WatchWithCover } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Watches by Category | CaliberShelf",
}

export const dynamic = "force-dynamic"

interface CatGroup {
  id: string | null
  name: string
  watches: WatchWithCover[]
  subtotalCents: number
}

export default async function ByCategoryPage() {
  const all = await getWatches()
  const owned = all.filter((w) => !w.is_wishlist)

  const groups = new Map<string, CatGroup>()
  for (const w of owned) {
    const id = w.category_id ?? "none"
    const name = w.category?.name ?? "Uncategorized"
    let g = groups.get(id)
    if (!g) {
      g = { id: w.category_id ?? null, name, watches: [], subtotalCents: 0 }
      groups.set(id, g)
    }
    g.watches.push(w)
    g.subtotalCents += w.purchase_price_cents ?? 0
  }

  const ordered = [...groups.values()].sort(
    (a, b) => b.subtotalCents - a.subtotalCents || b.watches.length - a.watches.length
  )
  const grandTotal = ordered.reduce((s, g) => s + g.subtotalCents, 0)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-medium tracking-tight">Watches by Category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {owned.length} owned {owned.length === 1 ? "watch" : "watches"} across{" "}
          {ordered.length} {ordered.length === 1 ? "category" : "categories"} ·{" "}
          <span className="font-mono text-brass">{formatCurrency(grandTotal, "USD", true)}</span> total at cost
        </p>
      </div>

      {ordered.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No owned watches yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordered.map((g) => (
            <Card key={g.id ?? "none"} className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
              <CardHeader className="bg-brass/5 pb-2">
                <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-base">
                  {g.id ? (
                    <Link href={`/collection?category=${g.id}`} className="underline-offset-2 hover:underline">
                      {g.name}
                    </Link>
                  ) : (
                    <span>{g.name}</span>
                  )}
                  <span className="text-sm font-normal text-muted-foreground">
                    {g.watches.length} {g.watches.length === 1 ? "watch" : "watches"} ·{" "}
                    <span className="font-mono text-brass">{formatCurrency(g.subtotalCents, "USD", true)}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ul className="divide-y divide-border/50">
                  {g.watches
                    .slice()
                    .sort((a, b) => (b.purchase_price_cents ?? 0) - (a.purchase_price_cents ?? 0))
                    .map((w) => (
                      <li key={w.id}>
                        <Link
                          href={`/watch/${w.id}`}
                          className="group flex items-center justify-between gap-3 px-6 py-2 text-sm hover:bg-accent/40"
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-medium group-hover:text-primary">
                              {w.brand?.name} {w.model}
                            </span>
                            {w.nickname && (
                              <span className="ml-2 text-xs text-muted-foreground">{w.nickname}</span>
                            )}
                            {w.is_coming_soon && (
                              <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                coming soon
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-mono text-muted-foreground">
                            {w.purchase_price_cents != null
                              ? formatCurrency(w.purchase_price_cents, "USD", true)
                              : "—"}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
