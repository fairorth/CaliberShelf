import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAttentionReport } from "@/lib/queries/attention"
import type { AttentionItem } from "@/lib/queries/attention"

export const metadata: Metadata = {
  title: "Attention Needed | CaliberShelf",
}

// Server-rendered on every visit so fixes disappear from the list immediately.
export const dynamic = "force-dynamic"

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
    <Card className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
      <CardHeader className="bg-brass/5">
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
                  <span className="font-medium group-hover:text-primary">
                    {item.name}
                  </span>
                  {item.detail && (
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
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

export default async function AttentionNeededPage() {
  const report = await getAttentionReport()
  const total =
    report.brands.length + report.movements.length + report.watches.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-display text-lg font-medium tracking-tight">
          Attention Needed
        </h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Everything is complete 🎉"
            : `${total} item${total === 1 ? "" : "s"} with missing information — click any row to fix it`}
        </p>
      </div>

      <div className="space-y-5">
        <AttentionSection
          title="Watches"
          icon="⌚"
          items={report.watches}
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

      <p className="max-w-2xl text-xs text-muted-foreground">
        Watches list missing reference number, caliber, case diameter, case
        height, or strap width — the ✨ Auto-fill specs button on each watch can
        find most of these. Movements (in-use only) need lift angle for the
        timegrapher. Brands need a store URL for the deal scanner.
      </p>
    </div>
  )
}
