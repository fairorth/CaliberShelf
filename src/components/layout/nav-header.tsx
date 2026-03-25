"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/collection", label: "Collection", icon: "📋" },
  { href: "/batch-import", label: "Batch Import", icon: "📦" },
  { href: "/wear-log", label: "Wear Log", icon: "📅" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/config", label: "Config", icon: "⚙️" },
]

// Touch detection via useSyncExternalStore (avoids lint error with setState in effect)
const noopSubscribe = () => () => {}
function getTouchSnapshot(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}
function getTouchServerSnapshot(): boolean {
  return false
}

interface NavHeaderProps {
  userEmail: string
}

export function NavHeader({ userEmail }: NavHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useSyncExternalStore(noopSubscribe, getTouchSnapshot, getTouchServerSnapshot)

  // On mobile, Add Watch goes to camera-first flow; on desktop, full form
  const addWatchHref = isMobile ? "/add" : "/collection/new"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
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
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            CaliberShelf
          </Link>
        </div>

        {/* User info + sign out */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userEmail}
          </span>
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
            {/* Add Watch — visually distinct */}
            <Link
              href={addWatchHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>➕</span>
              Add Watch
            </Link>

            <div className="my-2 border-t" />

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
