"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { caseSizeLayouts } from "@/lib/validations/display-case"
import type { DisplayCaseWithWatches } from "@/lib/types/watch"

interface DisplayCaseCardProps {
  displayCase: DisplayCaseWithWatches
}

export function DisplayCaseCard({ displayCase }: DisplayCaseCardProps) {
  const capacity = parseInt(displayCase.capacity, 10)
  const [cols] = caseSizeLayouts[displayCase.capacity] ?? [4, 2]
  const watchCount = displayCase.watches.length

  // Build slot map for the miniature grid
  const slotMap = new Map(
    displayCase.watches.map((w) => [w.case_slot, w])
  )

  // For large cases, only show the first few rows
  const maxSlotsToShow = Math.min(capacity, cols * 3) // max 3 rows in preview

  return (
    <Link href={`/case/${displayCase.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{displayCase.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {watchCount}/{capacity}
            </Badge>
          </div>
          {displayCase.case_type && (
            <p className="text-xs text-muted-foreground">{displayCase.case_type}</p>
          )}
        </CardHeader>

        <CardContent>
          {/* Miniature case grid */}
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: maxSlotsToShow }, (_, i) => {
              const watch = slotMap.get(i)
              return (
                <div
                  key={i}
                  className={cn(
                    "relative aspect-square rounded-sm",
                    watch
                      ? "bg-muted"
                      : "border border-dashed border-muted-foreground/20 bg-muted/30"
                  )}
                >
                  {watch?.cover_photo_url ? (
                    <Image
                      src={watch.cover_photo_url}
                      alt={`${watch.brand.name} ${watch.model}`}
                      fill
                      className="rounded-sm object-cover"
                      sizes="60px"
                    />
                  ) : watch ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      ⌚
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {capacity > maxSlotsToShow && (
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              +{capacity - maxSlotsToShow} more slots
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
