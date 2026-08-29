"use client"

import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Called on Enter / form submit. */
  onSubmit?: () => void
  placeholder?: string
  autoFocus?: boolean
  ariaLabel?: string
  /** Wrapper (form) classes — set the width here. */
  className?: string
  /** Opt-in: `/` focuses this field (with a kbd badge advertising it).
   *  Enable only where the header's JumpSearch stands down (the collection),
   *  or two listeners would race for the same key. */
  slashShortcut?: boolean
}

/**
 * Reusable search field: leading magnifier, clear (✕) button when non-empty,
 * Enter-to-submit. Presentational — the parent owns the value and decides what
 * submit/clear do. Used on the home dial page and the collection toolbar.
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search…",
  autoFocus,
  ariaLabel,
  className,
  slashShortcut = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Same contract as JumpSearch: `/` focuses the field from anywhere —
  // except while the user is already typing into something, where a slash
  // is a slash.
  useEffect(() => {
    if (!slashShortcut) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement
      const tag = el?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement | null)?.isContentEditable
      ) {
        return
      }
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [slashShortcut])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className={cn("relative", className)}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-9 text-sm shadow-xs outline-none",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          // Hide the native WebKit clear affordance — we render our own.
          "[&::-webkit-search-cancel-button]:appearance-none"
        )}
      />
      {/* The ✕ takes this spot once there's a query, so the hint only shows
          while the field is empty — which is also when it's useful. */}
      {slashShortcut && !value && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-px font-mono text-2xs text-muted-foreground sm:block">
          /
        </kbd>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
