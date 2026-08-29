import type { Metadata } from "next"
import Link from "next/link"
import { getWatchListReport } from "@/lib/queries/watch-list"
import { WatchListTable } from "./_components/watch-list-table"

export const metadata: Metadata = {
  title: "Watch List | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/**
 * The full schedule: every watch with its identifying basics, cost and latest
 * agent valuation. Built to leave the app — CSV (Excel-ready) and the print
 * dialog for PDF; the print output is the records/insurance schedule. The
 * table itself (sorting, wish-list toggle, exports) is client-side; this
 * shell only fetches.
 */
export default async function WatchListReportPage() {
  const report = await getWatchListReport()

  return (
    <div className="space-y-5 pb-8 print:space-y-3 print:pb-0">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        ‹ Reports
      </Link>

      <h1 className="font-display text-lg font-semibold tracking-tight">
        Watch List
      </h1>

      <WatchListTable report={report} />
    </div>
  )
}
