"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"

const navItems = [
  { href: "/collection", label: "Collection", icon: "📋" },
  { href: "/batch-import", label: "Batch Import", icon: "📦" },
  { href: "/wear-log", label: "Wear Log", icon: "📅" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/config", label: "Config", icon: "⚙️" },
]

interface NavHeaderProps {
  userEmail: string
}

export function NavHeader({ userEmail }: NavHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
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

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-14 items-center justify-between px-4">
        {/* Centered Home / Collection segmented nav (desktop only — the
            hamburger covers navigation on mobile and the extra routes). */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-[11px] border border-border bg-white/[0.04] p-1 sm:flex">
          <Link
            href="/dashboard"
            className={cn(
              "rounded-lg px-4 py-1.5 text-[13.5px] font-medium transition-colors",
              isHome
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/collection"
            className={cn(
              "rounded-lg px-4 py-1.5 text-[13.5px] font-medium transition-colors",
              isCollection
                ? "bg-primary text-primary-foreground"
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
          <Link href="/dashboard" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-medium tracking-tight">
              CaliberShelf
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              v{APP_VERSION}
            </span>
          </Link>
        </div>

        {/* User info + theme toggle + sign out */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
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
            {/* Add Watch */}
            <Link
              href={addWatchHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>➕</span>
              Add Watch
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href ||
                    pathname.startsWith(item.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
