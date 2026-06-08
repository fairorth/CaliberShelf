"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, Table as TableIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { CollectionTable } from "@/components/collection-table"
import { GalleryGrid } from "./gallery-grid"
import { cn } from "@/lib/utils"
import type { Category, WatchWithCover } from "@/lib/types/watch"

interface CollectionViewProps {
  watches: WatchWithCover[]
  categories: Category[]
}

const ALL = "all"
type ViewMode = "table" | "gallery"
const VIEW_KEY = "collection-view"
const SIZE_KEY = "collection-gallery-size"
const DEFAULT_SIZE = 200
const MIN_SIZE = 120
const MAX_SIZE = 400

export function CollectionView({ watches, categories }: CollectionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // View + size preferences are personal, not URL-worthy → localStorage.
  // Start on table to match prior behavior; upgrade after hydration if a
  // saved preference exists. The brief flash is acceptable for SPA chrome.
  const [view, setView] = useState<ViewMode>("table")
  const [size, setSize] = useState<number>(DEFAULT_SIZE)

  useEffect(() => {
    // One-time hydration of prefs from localStorage — server can't read it,
    // so we render defaults on the server and upgrade on mount. This is the
    // canonical "read external store after hydration" case that the
    // set-state-in-effect rule is not meant to catch.
    const savedView = localStorage.getItem(VIEW_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedView === "table" || savedView === "gallery") setView(savedView)
    const savedSize = Number(localStorage.getItem(SIZE_KEY))
    if (savedSize >= MIN_SIZE && savedSize <= MAX_SIZE) setSize(savedSize)
  }, [])

  function updateView(next: ViewMode) {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  function updateSize(next: number) {
    setSize(next)
    localStorage.setItem(SIZE_KEY, String(next))
  }

  // URL is the source of truth for the category filter — soft navigations
  // update it and this component re-reads on every render.
  const rawCategoryId = searchParams.get("category")
  const selectedId =
    rawCategoryId && categories.some((c) => c.id === rawCategoryId)
      ? rawCategoryId
      : ALL

  const filteredWatches = useMemo(() => {
    if (selectedId === ALL) return watches
    return watches.filter((w) => w.category_id === selectedId)
  }, [watches, selectedId])

  function handleCategoryChange(val: string | null) {
    if (!val) return
    const url = val === ALL ? "/collection" : `/collection?category=${val}`
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  // Render the trigger label manually — base-ui's controlled SelectValue
  // can otherwise display the raw value (UUID). See CLAUDE.md.
  const triggerLabel =
    selectedId === ALL
      ? "All"
      : categories.find((c) => c.id === selectedId)?.name ?? "All"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Collection</h1>

        <Select value={selectedId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-9 w-[180px]">
            <span className="text-sm">{triggerLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {filteredWatches.length} of {watches.length}
        </span>

        {/* Push view controls to the right on wider screens */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {view === "gallery" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Size</span>
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={10}
                value={size}
                onChange={(e) => updateSize(Number(e.target.value))}
                className="h-1 w-32 accent-foreground sm:w-40"
                aria-label="Gallery tile size"
              />
            </label>
          )}

          <div
            role="group"
            aria-label="View mode"
            className="inline-flex overflow-hidden rounded-md border"
          >
            <button
              type="button"
              onClick={() => updateView("table")}
              aria-pressed={view === "table"}
              title="Table view"
              className={cn(
                "flex h-9 items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                view === "table"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => updateView("gallery")}
              aria-pressed={view === "gallery"}
              title="Gallery view"
              className={cn(
                "flex h-9 items-center gap-1.5 border-l px-3 text-xs font-medium transition-colors",
                view === "gallery"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <CollectionTable watches={filteredWatches} />
      ) : (
        <GalleryGrid watches={filteredWatches} itemSize={size} />
      )}
    </div>
  )
}
