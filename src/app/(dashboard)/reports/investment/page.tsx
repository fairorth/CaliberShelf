import type { Metadata } from "next"
import { ReportPlaceholder } from "../_components/report-placeholder"

export const metadata: Metadata = {
  title: "Investment | CaliberShelf",
}

export default function InvestmentPage() {
  return (
    <ReportPlaceholder
      title="Investment"
      description="Cost basis, current valuation, and gains over time — how your collection is performing as an investment."
    />
  )
}
