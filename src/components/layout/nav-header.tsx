"use client"

import { useEffect, useRef, useState } from "react"
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
import { signOut } from "@/lib/actions/auth-actions"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { TenTenLoupeMark } from "@/components/calibershelf-mark"
import { NAV_GROUPS, NAV_HOME, isNavItemActive } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"

interface NavHeaderProps {
  userEmail: string
}

/**
 * The 56px app header (A2): mobile drawer trigger + brand (below lg, where
 * the rail carries the brand), global search, Add Watch, and the account
 * menu. The old centered Home/Collection segmented control and the
 * layout-pushing dropdown menu are gone — small screens get an overlay
 * drawer that never moves the page. There is no theme control: the product
 * is light-only (FIXES-ROUND-1 §1).
 */
export function NavHeader({ userEmail }: NavHeaderProps) {
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

  // Global search: jump to the collection filtered by the query. Hidden on
  // home and the collection list, which carry their own search boxes.
  const isHome = pathname === "/dashboard"
  const showSearch = !isHome && !pathname.startsWith("/collection")
  const submitSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    const href = `/collection?q=${encodeURIComponent(q)}`
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

          {/* Brand — below lg only; the expanded rail carries it at lg+. */}
          <Link
            href="/dashboard"
            onClick={guardClick("/dashboard")}
            className="flex items-center gap-2 lg:hidden"
          >
            <TenTenLoupeMark size={26} className="rounded-lg" />
            <span className="hidden items-baseline gap-1.5 sm:flex">
              <span className="font-display text-md font-medium tracking-tight">
                TenTenLoupe
              </span>
              <span className="font-mono text-2xs text-muted-foreground">
                v{APP_VERSION}
              </span>
            </span>
          </Link>

          {showSearch && (
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={submitSearch}
              placeholder="Search collection…"
              ariaLabel="Search collection"
              className="hidden w-44 md:block lg:w-[280px]"
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
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
            <DrawerLink
              href={NAV_HOME.href}
              label={NAV_HOME.label}
              icon={NAV_HOME.icon}
              active={isNavItemActive(NAV_HOME.href, pathname)}
              onClick={guardClick(NAV_HOME.href)}
            />
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="mt-4">
                <div className="px-2.5 pb-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
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
