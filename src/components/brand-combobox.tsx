"use client"

import { useState, useMemo, useTransition } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrandInline } from "@/lib/actions/brand-actions"
import { cn } from "@/lib/utils"
import type { Brand } from "@/lib/types/watch"

interface BrandComboboxProps {
  brands: Brand[]
  defaultBrandId?: string
}

export function BrandCombobox({ brands, defaultBrandId }: BrandComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(defaultBrandId ?? "")
  const [localBrands, setLocalBrands] = useState<Brand[]>(brands)
  const [isPending, startTransition] = useTransition()

  const selectedBrand = localBrands.find((b) => b.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return localBrands
    const q = search.toLowerCase()
    return localBrands.filter((b) => b.name.toLowerCase().includes(q))
  }, [localBrands, search])

  const exactMatch = localBrands.some(
    (b) => b.name.toLowerCase() === search.trim().toLowerCase()
  )

  function handleSelect(brand: Brand) {
    setSelectedId(brand.id)
    setSearch("")
    setOpen(false)
  }

  function handleCreateNew() {
    const name = search.trim()
    if (!name) return

    startTransition(async () => {
      const result = await createBrandInline(name)
      if (result.id) {
        const newBrand: Brand = {
          id: result.id,
          user_id: "",
          name,
          country_of_origin: null,
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setLocalBrands((prev) => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedId(result.id)
        setSearch("")
        setOpen(false)
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Hidden input for form submission */}
      <input type="hidden" name="brand_id" value={selectedId} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="default"
              type="button"
              className={cn(
                "w-full justify-between font-normal",
                !selectedBrand && "text-muted-foreground"
              )}
            />
          }
        >
          {selectedBrand ? selectedBrand.name : "Select brand..."}
          <span className="ml-auto text-xs opacity-50">▼</span>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
          <div className="p-2">
            <Input
              placeholder="Search or create brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && !search.trim() && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No brands yet. Type to create one.
              </p>
            )}

            {filtered.map((brand) => (
              <button
                key={brand.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent",
                  brand.id === selectedId && "bg-accent"
                )}
                onClick={() => handleSelect(brand)}
              >
                <span className="w-4 text-center">
                  {brand.id === selectedId ? "✓" : ""}
                </span>
                <span>{brand.name}</span>
                {brand.country_of_origin && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {brand.country_of_origin}
                  </span>
                )}
              </button>
            ))}

            {/* Create new option */}
            {search.trim() && !exactMatch && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm text-primary hover:bg-accent"
                onClick={handleCreateNew}
                disabled={isPending}
              >
                <span className="w-4 text-center">+</span>
                <span>
                  {isPending ? "Creating..." : `Create "${search.trim()}"`}
                </span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
