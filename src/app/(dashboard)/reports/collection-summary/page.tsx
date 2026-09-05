import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWatches } from "@/lib/queries/watches"
import { getPortfolioOverview, valueMixLabel } from "@/lib/queries/portfolio"
import { GainValue } from "@/components/gain-value"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Collection Summary | TenTenLoupe",
}

/** A watch still needs initial editing if its brand is missing or a placeholder. */
function needsBrandEditing(brandName: string | null | undefined): boolean {
  const n = (brandName ?? "").trim().toLowerCase()
  return n === "" || n.startsWith("unknown")
}

function SummaryRow({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="text-md font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export default async function CollectionSummaryPage() {
  const [watches, portfolio] = await Promise.all([
    getWatches(),
    getPortfolioOverview(),
  ])

  // Wish-list watches aren't owned — they stay out of every count and total.
  const owned = watches.filter((w) => !w.is_wishlist)
  const wishlistCount = watches.length - owned.length

  const totalWatches = owned.length
  // §4.3: counts split owned/sold. Sold watches stay in the collection, so
  // the split is total minus recorded sales.
  const soldCount = portfolio.salesCount
  const ownedNotSoldCount = totalWatches - soldCount
  const comingSoonCount = owned.filter((w) => w.is_coming_soon).length
  const unknownBrandCount = owned.filter((w) => needsBrandEditing(w.brand?.name)).length

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ‹ Reports
      </Link>
      <h1 className="font-display text-lg font-semibold tracking-tight">Collection Summary</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-sm">Collection Summary</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <SummaryRow
            label="Total Watches"
            value={totalWatches.toLocaleString()}
            hint={`${ownedNotSoldCount.toLocaleString()} owned · ${soldCount.toLocaleString()} sold`}
          />
          <SummaryRow
            label="Coming Soon"
            value={comingSoonCount.toLocaleString()}
            hint="Ordered, awaiting arrival"
          />
          <SummaryRow
            label="Wish List"
            value={wishlistCount.toLocaleString()}
            hint="Not owned — excluded from all counts and totals"
          />
          <SummaryRow
            label="Unknown / Missing Brand"
            value={unknownBrandCount.toLocaleString()}
            hint="Watches still needing initial details"
          />
          <SummaryRow
            label="Cost Basis"
            value={formatCurrency(portfolio.costBasisCents, "USD")}
            hint="Owned, unsold watches — purchase price plus acquisition costs"
          />
          <SummaryRow
            label="Current Value"
            value={formatCurrency(portfolio.currentValueCents, "USD")}
            hint={`${portfolio.valuedCount} of ${portfolio.ownedCount} owned valued — ${valueMixLabel(portfolio)}`}
          />
          <SummaryRow
            label="Unrealized"
            value={<GainValue gain={portfolio.unrealized} showPct className="text-md" />}
            hint="Value vs basis, over tracked watches with a known purchase price"
          />
        </CardContent>
      </Card>
    </div>
  )
}
