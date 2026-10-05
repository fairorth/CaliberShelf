"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

/** The keep/sell workflow, in the order it is done: sort the floor piles,
 *  rate, settle the close calls, read the result, then count the money. */
const TABS = [
  { href: "/market/edit/sort", label: "Sort" },
  { href: "/market/edit/rate", label: "Rate" },
  { href: "/market/edit/faceoff", label: "Head-to-head" },
  { href: "/market/edit", label: "The Edit" },
  { href: "/market/to-sell", label: "To Sell" },
] as const

export function EditTabs() {
  const pathname = usePathname()
  const params = useSearchParams()
  // The Edit's target and λ ride along to the head-to-heads (which ask about
  // the cut line those two settings draw) and back again.
  const carry = new URLSearchParams()
  for (const k of ["target", "lambda"]) {
    const v = params.get(k)
    if (v) carry.set(k, v)
  }
  const qs = carry.toString()

  return (
    <nav aria-label="Keep or sell" className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((t) => {
        const active = pathname === t.href
        const carries = t.href === "/market/edit" || t.href === "/market/edit/faceoff"
        return (
          <Link
            key={t.href}
            href={carries && qs ? `${t.href}?${qs}` : t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-brass text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
