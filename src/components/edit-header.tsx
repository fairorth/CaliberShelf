import { Suspense } from "react"
import { EditTabs } from "@/components/edit-tabs"

/** Page header for the keep/sell screens: the h1, one line of context, and
 *  the workflow tabs. */
export function EditHeader({
  title,
  subtitle,
  aside,
}: {
  title: string
  subtitle?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {aside}
      </div>
      <Suspense fallback={<div className="h-[37px] border-b border-border" />}>
        <EditTabs />
      </Suspense>
    </div>
  )
}
