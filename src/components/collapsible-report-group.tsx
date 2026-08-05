"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Props {
  title: ReactNode
  /** If set, the title becomes a link (click navigates; rest of header toggles). */
  titleHref?: string
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/** A report group card whose body collapses/expands when its header is clicked. */
export function CollapsibleReportGroup({
  title,
  titleHref,
  summary,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
      <CardHeader
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className="flex cursor-pointer select-none flex-row flex-wrap items-baseline justify-between gap-2 bg-brass/5 pb-2"
      >
        <div className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90"
            )}
          />
          {titleHref ? (
            <Link
              href={titleHref}
              onClick={(e) => e.stopPropagation()}
              className="text-base font-semibold underline-offset-2 hover:underline"
            >
              {title}
            </Link>
          ) : (
            <span className="text-base font-semibold">{title}</span>
          )}
        </div>
        {summary != null && (
          <span className="shrink-0 text-sm font-normal text-muted-foreground">{summary}</span>
        )}
      </CardHeader>
      {open && <CardContent className="px-0 pb-0">{children}</CardContent>}
    </Card>
  )
}
