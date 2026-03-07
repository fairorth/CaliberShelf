"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { caseSizeLayouts } from "@/lib/validations/display-case"
import type { DisplayCaseWithWatches } from "@/lib/types/watch"

interface DisplayCaseViewProps {
  displayCase: DisplayCaseWithWatches
}

export function DisplayCaseView({ displayCase }: DisplayCaseViewProps) {
  const capacity = parseInt(displayCase.capacity, 10)
  const [cols] = caseSizeLayouts[displayCase.capacity] ?? [4, 2]

  // Build slot map
  const slotMap = new Map(
    displayCase.watches.map((w) => [w.case_slot, w])
  )

  return (
    <div className="space-y-4">
      {/* Case info */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{displayCase.name}</h2>
        <Badge variant="secondary">
          {displayCase.watches.length}/{capacity}
        </Badge>
        {displayCase.case_type && (
          <span className="text-sm text-muted-foreground">
            {displayCase.case_type}
          </span>
        )}
      </div>

      {displayCase.description && (
        <p className="text-sm text-muted-foreground">{displayCase.description}</p>
      )}

      {/* Full case grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: capacity }, (_, i) => {
          const watch = slotMap.get(i)
          return (
            <div key={i} className="group/slot">
              {watch ? (
                <Link
                  href={`/watch/${watch.id}`}
                  className="block overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square bg-muted">
                    {watch.cover_photo_url ? (
                      <Image
                        src={watch.cover_photo_url}
                        alt={`${watch.brand.name} ${watch.model}`}
                        fill
                        className="object-cover transition-transform group-hover/slot:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
                        ⌚
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {watch.brand.name}
                    </p>
                    <p className="truncate text-xs font-semibold leading-tight">
                      {watch.nickname || watch.model}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20",
                    "text-xs text-muted-foreground/40"
                  )}
                >
                  {i + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
