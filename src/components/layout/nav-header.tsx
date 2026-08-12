"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BadgeDollarSign,
  CalendarDays,
  ChartColumn,
  Compass,
  Images,
  Info,
  Link2,
  List,
  Moon,
  PackagePlus,
  Plus,
  Settings,
  Sun,
  Tag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/search-input"
import { signOut } from "@/lib/actions/auth-actions"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"
import { CaliberShelfMark } from "@/components/calibershelf-mark"

// Menu groups render with a separator between them: assets | analysis |
// acquisition & imagery | system. Icons are lucide only (E2).
const navGroups: { href: string; label: string; icon: LucideIcon }[][] = [
  [
    { href: "/collection", label: "Collection", icon: List },
    { href: "/brands", label: "Brands", icon: Tag },
    { href: "/straps", label: "Straps", icon: Link2 },
  ],
  [
    { href: "/wear-log", label: "Wear Log", icon: CalendarDays },
    { href: "/reports", label: "Reports", icon: ChartColumn },
    { href: "/guides", label: "Guides", icon: Compass },
  ],
  [
    { href: "/deals", label: "Deals", icon: BadgeDollarSign },
    { href: "/gallery", label: "Gallery", icon: Images },
    { href: "/batch-import", label: "Batch Import", icon: PackagePlus },
  ],
  [
    { href: "/config", label: "Config", icon: Settings },
    { href: "/about", label: "About", icon: Info },
  ],
]

interface NavHeaderProps {
  userEmail: string
}

export function NavHeader({ userEmail }: NavHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { interceptNavigation } = useUnsavedChanges()
  const { resolvedTheme, setTheme } = useTheme()

  // Consult the unsaved-changes guard before following any nav link (C1).
  // When a dirty form intercepts, the provider shows its confirm dialog and
  // navigates on "Discard" — so all we do here is cancel the default follow.
  const guardClick = (href: string) => (e: React.MouseEvent) => {
    if (interceptNavigation(href)) e.preventDefault()
    setMenuOpen(false)
  }
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- next-themes needs a mounted guard to avoid SSR theme mismatch
    setMounted(true)
  }, [])

  // Add Watch → the desktop-first quick-add (basics now, full specs on Edit).
  const addWatchHref = "/add"

  // Centered top-level nav (desktop): Home = the dial, Collection = the list
  // (and any watch detail, which is reached from the collection).
  const isHome = pathname === "/dashboard"
  const isCollection = pathname.startsWith("/collection") || pathname.startsWith("/watch")

  // Global search: jump to the collection filtered by the query. Hidden on
  // home and the collection list, which carry their own (state-owning) search
  // boxes — pushing ?q= at the collection view would not re-seed its local
  // state. Watch detail pages DO get it (navigating there is a fresh mount).
  const showSearch = !isHome && !pathname.startsWith("/collection")
  const submitSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    const href = `/collection?q=${encodeURIComponent(q)}`
    if (!interceptNavigation(href)) router.push(href)
    setSearchQuery("")
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-14 items-center justify-between px-4">
        {/* Centered Home / Collection segmented nav (desktop only — the
            hamburger covers navigation on mobile and the extra routes). */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-muted p-1 sm:flex">
          <Link
            href="/dashboard"
            onClick={guardClick("/dashboard")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
              isHome
                ? "bg-brass/15 text-brass"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/collection"
            onClick={guardClick("/collection")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
              isCollection
                ? "bg-brass/15 text-brass"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Collection
          </Link>
        </nav>

        {/* Hamburger + title — visible at all sizes */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <Link href="/dashboard" onClick={guardClick("/dashboard")} className="flex items-center gap-2">
            <CaliberShelfMark size={26} className="rounded-lg" />
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-md font-medium tracking-tight">
                CaliberShelf
              </span>
              <span className="font-mono text-2xs text-muted-foreground">
                v{APP_VERSION}
              </span>
            </span>
          </Link>
        </div>

        {/* Search + add watch + user info + theme toggle + sign out */}
        <div className="flex items-center gap-3">
          {showSearch && (
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={submitSearch}
              placeholder="Search collection…"
              ariaLabel="Search collection"
              className="hidden w-44 md:block lg:w-56"
            />
          )}
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
          {/* Always-visible shortcut to quick-add — no hamburger required. */}
          <Button
            size="sm"
            render={<Link href={addWatchHref} onClick={guardClick(addWatchHref)} />}
            title="Add a watch"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Watch</span>
          </Button>
          <button
            type="button"
            aria-label="Toggle light/dark theme"
            title="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Dropdown nav — visible at all sizes when open */}
      {menuOpen && (
        <nav className="border-t p-3">
          <div className="space-y-1">
            {/* Search (the header box is hidden below md) */}
            {showSearch && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={submitSearch}
                placeholder="Search collection…"
                ariaLabel="Search collection"
                className="mb-2 md:hidden"
              />
            )}

            {/* Add Watch */}
            <Link
              href={addWatchHref}
              onClick={guardClick(addWatchHref)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Watch
            </Link>

            {navGroups.map((group, gi) => (
              <div key={gi} className="space-y-1">
                {gi > 0 && <div className="mx-3 my-2 border-t border-border" />}
                {group.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={guardClick(item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
