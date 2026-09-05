import type { Metadata } from "next"
import Link from "next/link"
import { getWatchValuesReport } from "@/lib/queries/watch-values"
import { WatchValuesTable } from "./_components/watch-values-table"

export const metadata: Metadata = {
  title: "Watch Values | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/**
 * The portfolio examination: every watch you hold, what it is worth, WHICH
 * KIND of number that is, and which way it has moved. The Watch List is the
 * schedule (identity and cost); the Market strip is the total; this is the
 * per-watch middle ground neither of them covered.
 */
export default async function WatchValuesReportPage() {
  const report = await getWatchValuesReport()

  return (
    <div className="space-y-5 pb-8 print:space-y-3 print:pb-0">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        ‹ Reports
      </Link>

      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Watch Values
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          What each watch is worth, and how that number was arrived at. Sold
          watches live in the Watch Sales report — a realized figure is not a
          valuation.
        </p>
      </div>

      <WatchValuesTable report={report} />
    </div>
  )
}
