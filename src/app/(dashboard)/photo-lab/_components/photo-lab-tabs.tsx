"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/photo-lab", label: "Coverage" },
  { href: "/photo-lab/session", label: "Session" },
  { href: "/photo-lab/review", label: "Review" },
]

/** Underline tabs for the Photo Lab shell (04-screen-specs §3). */
export function PhotoLabTabs({ reviewCount }: { reviewCount?: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Photo Lab views" className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/photo-lab"
            ? pathname === "/photo-lab"
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3.5 py-[9px] text-sm transition-colors",
              active
                ? "border-brass text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.label === "Review" && (reviewCount ?? 0) > 0 && (
              <span className="rounded-full bg-primary/14 px-2 py-0.5 font-mono text-2xs tabular-nums text-primary">
                {reviewCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
