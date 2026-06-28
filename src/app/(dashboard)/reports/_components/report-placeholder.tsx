import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

/** Placeholder shown for reports that are designed but not yet built. */
export function ReportPlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ‹ Reports
      </Link>
      <h1 className="font-display text-lg font-medium tracking-tight">{title}</h1>
      <Card className="max-w-xl">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-4xl" aria-hidden="true">
            🚧
          </span>
          <p className="text-base font-medium">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
