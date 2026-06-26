import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWatches } from "@/lib/queries/watches"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Reports | CaliberShelf",
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
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export default async function ReportsPage() {
  const watches = await getWatches()

  const totalWatches = watches.length
  const unknownBrandCount = watches.filter((w) => needsBrandEditing(w.brand?.name)).length
  const pricedWatches = watches.filter((w) => w.purchase_price_cents !== null)
  const totalValueCents = pricedWatches.reduce(
    (sum, w) => sum + (w.purchase_price_cents ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-medium tracking-tight">Reports</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Collection Summary</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <SummaryRow label="Total Watches" value={totalWatches.toLocaleString()} />
          <SummaryRow
            label="Unknown / Missing Brand"
            value={unknownBrandCount.toLocaleString()}
            hint="Watches still needing initial details"
          />
          <SummaryRow
            label="Total Value"
            value={formatCurrency(totalValueCents, "USD")}
            hint={`From ${pricedWatches.length} of ${totalWatches} watches with a recorded price`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
