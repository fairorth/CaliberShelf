"use client"

import { useMemo, useState } from "react"
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
}

const ALL = "all"

export function CollectionView({ watches, categories }: CollectionViewProps) {
  const [selectedId, setSelectedId] = useState<string>(ALL)

  const filteredWatches = useMemo(() => {
    if (selectedId === ALL) return watches
    return watches.filter((w) => w.category_id === selectedId)
  }, [watches, selectedId])

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
        <Select value={selectedId} onValueChange={(val) => val && setSelectedId(val)}>
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
