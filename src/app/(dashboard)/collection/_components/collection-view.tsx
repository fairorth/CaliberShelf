"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { CollectionTable } from "@/components/collection-table"
import type { Category, WatchWithCover } from "@/lib/types/watch"

interface CollectionViewProps {
  watches: WatchWithCover[]
  categories: Category[]
  initialCategoryId?: string
}

const ALL = "all"

export function CollectionView({
  watches,
  categories,
  initialCategoryId,
}: CollectionViewProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string>(initialCategoryId ?? ALL)

  const filteredWatches = useMemo(() => {
    if (selectedId === ALL) return watches
    return watches.filter((w) => w.category_id === selectedId)
  }, [watches, selectedId])

  // Keep URL in sync so refresh / share / browser-back behave correctly.
  function handleChange(val: string | null) {
    if (!val) return
    setSelectedId(val)
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
        <Select value={selectedId} onValueChange={handleChange}>
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
      </div>

      <CollectionTable watches={filteredWatches} />
    </div>
  )
}
