import type { Metadata } from "next"
import { ReportPlaceholder } from "../_components/report-placeholder"

export const metadata: Metadata = {
  title: "Wear Summary | CaliberShelf",
}

export default function WearSummaryPage() {
  return (
    <ReportPlaceholder
      title="Wear Summary"
      description="How often and how recently you wear each watch — most- and least-worn, streaks, and rotation balance — drawn from your wear logs."
    />
  )
}
