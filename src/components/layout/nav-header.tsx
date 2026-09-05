"use client"

import { useEffect, useRef, useState } from "react"
import { SEARCH_ALL_STATUS_QS } from "@/app/(dashboard)/collection/_components/collection-filters"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/search-input"
import { JumpSearch } from "@/components/layout/jump-search"
import { HeaderClock } from "@/components/layout/header-clock"
import { signOut } from "@/lib/actions/auth-actions"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { Mark, Wordmark } from "@/components/brand/logo"
import { NAV_GROUPS, isNavItemActive } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"
import type { JumpIndex } from "@/lib/queries/jump"

interface NavHeaderProps {
  userEmail: string
  /** Everything the jump can reach, handed over once (Phase 8 §6.1). */
  jumpIndex: JumpIndex
}

/**
 * The 56px app header (A2): mobile drawer trigger + brand (below lg, where
 * the rail carries the brand), global search, Add Watch, and the account
 * menu. The old centered Home/Collection segmented control and the
 * layout-pushing dropdown menu are gone — small screens get an overlay
 * drawer that never moves the page. There is no theme control: the product
 * is light-only (FIXES-ROUND-1 §1).
 */
export function NavHeader({ userEmail, jumpIndex }: NavHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { interceptNavigation } = useUnsavedChanges()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Consult the unsaved-changes guard before following any nav link (C1).
  const guardClick = (href: string) => (e: React.MouseEvent) => {
    if (interceptNavigation(href)) e.preventDefault()
    setDrawerOpen(false)
  }

  // Escape closes the drawer; focus moves into it while open (F2).
  useEffect(() => {
    if (!drawerOpen) return
    drawerRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false)
      // Minimal focus trap: keep Tab cycling inside the drawer panel.
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  // The JUMP is present everywhere, including /dashboard — Phase 8 §6.1
  // removes the old hide-on-home condition, because reaching a watch from the
  // home page used to mean a trip through the collection, and Enter here goes
  // straight to /watch/[id] instead.
  //
  // The collection keeps its own in-page search box, which owns ?q and filters
  // the list you are looking at. Two fields side by side on that one screen
  // would be two different promises, so the jump stands down there.
  const showJump = !pathname.startsWith("/collection")
  // The legacy collection-filter field survives only inside the small-screen
  // drawer, where the jump's result panel has nowhere to open.
  const showSearch = !pathname.startsWith("/collection")
  const submitSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    const href = `/collection?q=${encodeURIComponent(q)}&${SEARCH_ALL_STATUS_QS}`
    if (!interceptNavigation(href)) router.push(href)
    setSearchQuery("")
    setDrawerOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Drawer trigger — small screens only; md+ has the rail. */}
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            {drawerOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Brand — below md only. The rail appears at md and carries the
              mark from there up, so anything here would be a second logo
              within 80px of it. The rail mark is the persistent anchor; this
              exists only for the drawer breakpoint, where there is no rail. */}
          <Link
            href="/dashboard"
            onClick={guardClick("/dashboard")}
            className="flex items-center gap-2 md:hidden"
          >
            {/* The 56px header cannot hold the three-line lockup, so this uses
                the shared wordmark's inline form rather than a local copy —
                one definition means the colon cannot render differently here
                than it does in the rail. Below sm the mark stands alone. */}
            <Mark size={26} decorative />
            <Wordmark inline className="hidden sm:flex" />
          </Link>

          {showJump && (
            <JumpSearch
              index={jumpIndex}
              className="hidden w-[300px] md:block"
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {/* Right-aligned, before Add Watch (§6.2). Hidden on the narrowest
              screens, where the header has to choose between the time and the
              primary action. */}
          <HeaderClock className="hidden sm:flex" />
          <span aria-hidden className="hidden h-[18px] w-px bg-border sm:block" />
          <Button
            size="sm"
            render={<Link href="/add" onClick={guardClick("/add")} />}
            title="Add a watch"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add Watch</span>
          </Button>
          {/* Account menu — avatar circle with the account actions. */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-muted text-sm font-medium uppercase text-foreground transition-colors hover:bg-accent"
                />
              }
            >
              {userEmail.charAt(0) || "?"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* GroupLabel requires a Group ancestor in Base UI (see the
                  Columns menu) — without it this crashes when opened. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="max-w-[220px] truncate font-normal text-muted-foreground">
                  {userEmail}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void signOut()
                  }}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ≤sm overlay drawer — overlays the page, never pushes layout (A2). */}
      {drawerOpen && (
        <div className="fixed inset-0 top-14 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[rgba(7,9,12,0.66)]"
          />
          <div
            ref={drawerRef}
            id="nav-drawer"
            role="dialog"
            aria-label="Navigation"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[264px] overflow-y-auto border-r border-border bg-surface-rail px-3 py-4 shadow-[14px_0_40px_rgba(0,0,0,0.5)] outline-none"
          >
            {showSearch && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={submitSearch}
                placeholder="Search collection…"
                ariaLabel="Search collection"
                className="mb-3"
              />
            )}
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="mt-4">
                <div className="px-2.5 pb-2 font-mono text-2xs uppercase leading-[1.5] tracking-[0.14em] text-muted-foreground">
                  {group.heading}
                </div>
                {group.items.map((item) => (
                  <DrawerLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isNavItemActive(item.href, pathname)}
                    onClick={guardClick(item.href)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function DrawerLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: "true" }>
  active: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        // 10px padding → 44px minimum touch target (04-screen-specs §2).
        "flex items-center gap-2.5 rounded-lg p-2.5 text-sm transition-colors",
        active
          ? "bg-brass/14 font-medium text-brass"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  )
}
