import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { getWatches } from "@/lib/queries/watches"
import { getBoxConfig } from "@/lib/queries/box-config"
import { boxLabel } from "@/lib/boxes"
import { formatCurrency } from "@/lib/utils"
import { CollapsibleReportGroup } from "@/components/collapsible-report-group"
import type { WatchWithCover } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Watches by Box | CaliberShelf",
}

export const dynamic = "force-dynamic"

const NO_BOX = "__none__"

interface BoxGroup {
  key: string
  name: string
  watches: WatchWithCover[]
  subtotalCents: number
}

export default async function ByBoxPage() {
  const [all, boxConfig] = await Promise.all([getWatches(), getBoxConfig()])
  const owned = all.filter((w) => !w.is_wishlist)

  const groups = new Map<string, BoxGroup>()
  for (const w of owned) {
    const box = (w.box ?? "").trim()
    // "No box" lists only watches that are here and need a home — a coming-soon
    // watch without a box isn't misplaced, it just hasn't arrived.
    if (!box && w.is_coming_soon) continue
    const key = box || NO_BOX
    const name = box || "No box assigned"
    let g = groups.get(key)
    if (!g) {
      g = { key, name, watches: [], subtotalCents: 0 }
      groups.set(key, g)
    }
    g.watches.push(w)
    g.subtotalCents += w.purchase_price_cents ?? 0
  }

  // Assigned boxes first (natural sort: Box1, Box2, … Box10); "No box" last.
  const ordered = [...groups.values()].sort((a, b) => {
    if (a.key === NO_BOX) return 1
    if (b.key === NO_BOX) return -1
    return a.name.localeCompare(b.name, undefined, { numeric: true })
  })

  const grandTotal = ordered.reduce((s, g) => s + g.subtotalCents, 0)
  const boxCount = ordered.filter((g) => g.key !== NO_BOX).length
  const shownCount = ordered.reduce((s, g) => s + g.watches.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-medium tracking-tight">Watches by Box</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shownCount} owned {shownCount === 1 ? "watch" : "watches"} across{" "}
          {boxCount} {boxCount === 1 ? "box" : "boxes"} ·{" "}
          <span className="font-mono tabular-nums text-foreground">{formatCurrency(grandTotal, "USD", true)}</span>{" "}
          total at cost
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
            <CollapsibleReportGroup
              key={g.key}
              defaultOpen={false}
              title={g.key === NO_BOX ? g.name : boxLabel(g.name, boxConfig.descriptions)}
              summary={
                <>
                  {g.watches.length} {g.watches.length === 1 ? "watch" : "watches"} ·{" "}
                  <span className="font-mono tabular-nums text-foreground">
                    {formatCurrency(g.subtotalCents, "USD", true)}
                  </span>
                </>
              }
            >
              <ul className="divide-y divide-border/50">
                {g.watches
                  .slice()
                  .sort(
                    (a, b) =>
                      (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "") ||
                      (a.model ?? "").localeCompare(b.model ?? "")
                  )
                  .map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/watch/${w.id}/edit?from=box`}
                        className="group flex items-center justify-between gap-3 px-6 py-2 text-sm hover:bg-accent/40"
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-medium group-hover:text-primary">
                            {w.brand?.name} {w.model}
                          </span>
                          {w.nickname && (
                            <span className="ml-2 text-xs text-muted-foreground">{w.nickname}</span>
                          )}
                          {w.dial_color && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({w.dial_color})
                            </span>
                          )}
                          {w.category?.name && (
                            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {w.category.name}
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
            </CollapsibleReportGroup>
          ))}
        </div>
      )}
    </div>
  )
}
