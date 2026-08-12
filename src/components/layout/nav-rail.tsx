"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CaliberShelfMark } from "@/components/calibershelf-mark"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { NAV_GROUPS, NAV_HOME, isNavItemActive } from "@/components/layout/nav-items"
import type { NavItem } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"

/**
 * The persistent navigation rail (A2, 04-screen-specs §2):
 * - ≥lg: 200px expanded with visible group headings
 * - md: 56px icon-only with tooltips and hairline group dividers
 * - hidden below md (the header's overlay drawer covers small screens)
 */
type GuardClick = (href: string) => (e: React.MouseEvent) => void

function ExpandedItem({
  item,
  pathname,
  guardClick,
}: {
  item: NavItem
  pathname: string
  guardClick: GuardClick
}) {
  const active = isNavItemActive(item.href, pathname)
  return (
    <Link
      href={item.href}
      onClick={guardClick(item.href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
        active
          ? "bg-brass/14 font-medium text-brass"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  )
}

function IconItem({
  item,
  pathname,
  guardClick,
}: {
  item: NavItem
  pathname: string
  guardClick: GuardClick
}) {
  const active = isNavItemActive(item.href, pathname)
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={item.href}
            onClick={guardClick(item.href)}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150",
              active
                ? "bg-brass/14 text-brass"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          />
        }
      >
        <item.icon className="h-4 w-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function NavRail() {
  const pathname = usePathname()
  const { interceptNavigation } = useUnsavedChanges()

  const guardClick: GuardClick = (href) => (e) => {
    if (interceptNavigation(href)) e.preventDefault()
  }

  return (
    <>
      {/* ≥lg — 200px expanded */}
      <nav
        aria-label="Primary"
        className="hidden w-[200px] shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-border bg-surface-rail px-3 py-3.5 lg:flex"
      >
        <Link
          href="/dashboard"
          onClick={guardClick("/dashboard")}
          className="flex items-center gap-2.5 px-1.5 pt-1"
        >
          <CaliberShelfMark size={26} className="rounded-lg" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-md font-semibold tracking-tight">
              CaliberShelf
            </span>
            <span className="font-mono text-2xs text-muted-foreground">v{APP_VERSION}</span>
          </span>
        </Link>

        <div className="flex flex-col gap-0.5">
          <ExpandedItem item={NAV_HOME} pathname={pathname} guardClick={guardClick} />
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="flex flex-col gap-0.5">
            <div className="px-2.5 pb-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              {group.heading}
            </div>
            {group.items.map((item) => (
              <ExpandedItem key={item.href} item={item} pathname={pathname} guardClick={guardClick} />
            ))}
          </div>
        ))}
      </nav>

      {/* md — 56px icon-only, Config's group pinned to the bottom */}
      <nav
        aria-label="Primary"
        className="hidden w-14 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-border bg-surface-rail py-3.5 md:flex lg:hidden"
      >
        <Link
          href="/dashboard"
          onClick={guardClick("/dashboard")}
          aria-label="Home"
          className="mb-1"
        >
          <CaliberShelfMark size={32} className="rounded-lg" />
        </Link>
        <IconItem item={NAV_HOME} pathname={pathname} guardClick={guardClick} />
        {NAV_GROUPS.slice(0, -1).map((group) => (
          <div key={group.heading} className="flex flex-col items-center gap-1">
            <div className="mb-2 h-px w-6 bg-border" aria-hidden="true" />
            {group.items.map((item) => (
              <IconItem key={item.href} item={item} pathname={pathname} guardClick={guardClick} />
            ))}
          </div>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1 pt-3">
          <div className="mb-2 h-px w-6 bg-border" aria-hidden="true" />
          {NAV_GROUPS[NAV_GROUPS.length - 1].items.map((item) => (
            <IconItem key={item.href} item={item} pathname={pathname} guardClick={guardClick} />
          ))}
        </div>
      </nav>
    </>
  )
}
