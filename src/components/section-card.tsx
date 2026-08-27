import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  /** Anchor id, so `?from=watch#market` still lands on the right card. */
  id?: string
  icon: LucideIcon
  title: string
  /** Optional controls pinned to the right of the title row. */
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

/**
 * The one card shell the watch pages share.
 *
 * Edit and View drifted into two different card vocabularies — the edit form
 * had a neutral chip and a display-face title, the view page had its own
 * SpecCard, and the timegrapher panel still wore a pre-v2 emerald gradient. A
 * section should look the same whether or not its fields happen to be
 * editable, so there is exactly one definition of what a section looks like.
 *
 * Identity comes from the icon and the title, never from colour: brass is
 * action, not decoration (design-system E1).
 */
export function SectionCard({
  id,
  icon: Icon,
  title,
  action,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden rounded-xl", className)} id={id}>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2.5 font-display text-md font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

/** Field label / read-only caption: 13px muted, the size of the value below it. */
export const SECTION_LABEL = "text-xs font-medium text-muted-foreground"

/** A group divider inside a section — Movement, Case, Complications. */
export function SectionSubHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <h4 className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
        {children}
      </h4>
      <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  )
}
