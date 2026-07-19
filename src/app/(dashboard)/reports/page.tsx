import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Reports | CaliberShelf",
}

interface ReportLink {
  slug: string
  title: string
  description: string
  available: boolean
}

const REPORTS: ReportLink[] = [
  {
    slug: "collection-summary",
    title: "Collection Summary",
    description: "Counts, watches needing details, and total collection value.",
    available: true,
  },
  {
    slug: "valuations",
    title: "Watch Valuations",
    description: "Agent-researched market values by run date, with drill-down to evidence.",
    available: true,
  },
  {
    slug: "attention-needed",
    title: "Attention Needed",
    description:
      "Brands, movements, and watches with missing critical information — click through to fix each one.",
    available: true,
  },
  {
    slug: "wear-summary",
    title: "Wear Summary",
    description: "How often and how recently you wear each watch.",
    available: false,
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-medium tracking-tight">Reports</h1>

      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <Link key={report.slug} href={`/reports/${report.slug}`} className="group block">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  {report.title}
                  {!report.available && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                      Coming soon
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
