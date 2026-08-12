"use client"

import { Search } from "lucide-react"

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  searchCatalogWatches,
  type CatalogWatch,
} from "@/lib/actions/chronoscout-actions"

interface CatalogComboboxProps {
  /** Seeds the search box the first time the picker opens (e.g. the model). */
  defaultQuery?: string
  /** Called when the user picks a match. The parent applies the dimensions. */
  onApply: (row: CatalogWatch) => void
  disabled?: boolean
}

/** One-line dimension summary for a catalog row (omits missing values). */
function dimsSummary(w: CatalogWatch): string {
  const parts: string[] = []
  if (w.diameter_mm != null) parts.push(`${w.diameter_mm}mm`)
  if (w.thickness_mm != null) parts.push(`${w.thickness_mm}mm thick`)
  if (w.lug_to_lug_mm != null) parts.push(`L2L ${w.lug_to_lug_mm}`)
  if (w.between_lugs_mm != null) parts.push(`lug ${w.between_lugs_mm}`)
  if (w.weight_g != null) parts.push(`${w.weight_g}g`)
  return parts.join(" · ")
}

export function CatalogCombobox({ defaultQuery = "", onApply, disabled }: CatalogComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<CatalogWatch[]>([])
  const [loading, setLoading] = useState(false)
  const seededRef = useRef(false)

  // Seed the box from the model name the first time the picker opens.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && !seededRef.current && !search && defaultQuery.trim()) {
      seededRef.current = true
      setSearch(defaultQuery.trim())
    }
  }

  // Debounced catalog search whenever the query changes while open.
  useEffect(() => {
    if (!open) return
    const q = search.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const rows = await searchCatalogWatches(q)
        setResults(rows)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search, open])

  function pick(row: CatalogWatch) {
    onApply(row)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="shrink-0 border-brass/40 text-brass hover:bg-brass/10 hover:text-brass"
            title="Find this model in the ChronoScout catalog and fill empty dimensions"
          />
        }
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" /> Find in catalog
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(28rem,90vw)] p-0">
        <div className="p-2">
          <Input
            placeholder="Search brand + model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          )}
          {!loading && search.trim().length >= 2 && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No catalog matches. Try fewer or different words.
            </p>
          )}
          {!loading && search.trim().length < 2 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Type at least two characters.
            </p>
          )}

          {results.map((row) => {
            const dims = dimsSummary(row)
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => pick(row)}
                className="flex w-full items-center gap-3 border-t px-3 py-2 text-left hover:bg-accent"
              >
                {row.image_src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.image_src}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded object-contain"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded bg-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{row.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dims || "no dimensions on file"}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <p className="border-t px-3 py-1.5 text-2xs text-muted-foreground">
          Data provided by Chronoscout
        </p>
      </PopoverContent>
    </Popover>
  )
}
