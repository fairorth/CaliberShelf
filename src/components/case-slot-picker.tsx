"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { caseSizeLayouts } from "@/lib/validations/display-case"
import type { CaseSize, WatchWithCover } from "@/lib/types/watch"

interface CaseSlotPickerProps {
  capacity: CaseSize
  occupiedSlots: Array<{
    slot: number
    watchName: string
    thumbnailUrl?: string | null
  }>
  defaultSlot?: number
  /** Exclude a specific watch ID from occupied display (when editing a watch) */
  excludeWatchId?: string
  watches?: WatchWithCover[]
}

export function CaseSlotPicker({
  capacity,
  occupiedSlots,
  defaultSlot,
  excludeWatchId,
  watches,
}: CaseSlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(defaultSlot ?? null)
  const totalSlots = parseInt(capacity, 10)
  const [cols] = caseSizeLayouts[capacity] ?? [4, 2]

  // Build occupation map
  const slotMap = new Map<number, { watchName: string; thumbnailUrl?: string | null }>()
  for (const slot of occupiedSlots) {
    // If we're editing a watch, don't show it as occupied in its current slot
    const matchingWatch = watches?.find((w) => w.case_slot === slot.slot)
    if (excludeWatchId && matchingWatch?.id === excludeWatchId) continue
    slotMap.set(slot.slot, slot)
  }

  return (
    <div className="space-y-2">
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="case_slot"
        value={selectedSlot !== null ? selectedSlot.toString() : ""}
      />

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalSlots }, (_, i) => {
          const occupied = slotMap.get(i)
          const isSelected = selectedSlot === i
          const isDisabled = !!occupied

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => setSelectedSlot(i)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs transition-colors",
                isDisabled
                  ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground"
                  : isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                    : "border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent"
              )}
              title={occupied ? occupied.watchName : `Slot ${i + 1} (available)`}
            >
              {occupied ? (
                <>
                  {occupied.thumbnailUrl ? (
                    <Image
                      src={occupied.thumbnailUrl}
                      alt={occupied.watchName}
                      fill
                      className="rounded-md object-cover opacity-60"
                      sizes="80px"
                    />
                  ) : (
                    <span className="text-lg opacity-40">⌚</span>
                  )}
                  <span className="z-10 truncate px-0.5 text-[9px] font-medium">
                    {occupied.watchName}
                  </span>
                </>
              ) : isSelected ? (
                <span className="text-lg">✓</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
