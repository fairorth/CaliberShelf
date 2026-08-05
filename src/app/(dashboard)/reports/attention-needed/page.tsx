import type { Metadata } from "next"
import { getAttentionReport } from "@/lib/queries/attention"
import { AttentionReportView } from "./_components/attention-report"

export const metadata: Metadata = {
  title: "Attention Needed | CaliberShelf",
}

// Server-rendered on every visit so fixes disappear from the list immediately.
export const dynamic = "force-dynamic"

export default async function AttentionNeededPage() {
  const report = await getAttentionReport()

  return (
    <div className="space-y-6">
      <AttentionReportView report={report} />

      <p className="max-w-2xl text-xs text-muted-foreground">
        Watches list missing reference number, caliber, case diameter, case
        height, strap width, or a storage box — the ✨ Auto-fill specs button on
        each watch finds most of the specs; the box you set yourself. Only
        owned watches are flagged for a missing box. Movements (in-use only) need
        lift angle for the timegrapher. Brands need a store URL for the deal
        scanner.
      </p>
    </div>
  )
}
