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

// Desktop grid columns mapped to Tailwind classes
const desktopColsClass: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
}

// Mobile: cap at 3 columns for touch-friendly sizing
const mobileColsClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-3",
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
      {/* Case info — above the case frame */}
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

      {/* Outer frame — warm wood/leather gradient */}
      <div
        className="overflow-hidden rounded-2xl p-2.5 shadow-2xl sm:p-3"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.30 0.06 55) 0%, oklch(0.22 0.04 50) 50%, oklch(0.28 0.05 55) 100%)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
        }}
      >
        {/* Felt-textured interior */}
        <div
          className="felt-texture overflow-hidden rounded-xl p-3 sm:p-4"
          style={{
            boxShadow:
              "inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -1px 4px rgba(255,255,255,0.03)",
          }}
        >
          {/* Slight perspective tilt on desktop */}
          <div
            className={cn(
              "grid gap-2 sm:gap-3",
              mobileColsClass[cols] ?? "grid-cols-3",
              desktopColsClass[cols] ?? "sm:grid-cols-4",
            )}
            style={{
              perspective: "1200px",
            }}
          >
            {Array.from({ length: capacity }, (_, i) => {
              const watch = slotMap.get(i)
              return (
                <div key={i} className="group/slot">
                  {watch ? (
                    /* Occupied cushion — watch sits on top */
                    <Link
                      href={`/watch/${watch.id}`}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.85_0.03_85)]"
                    >
                      <div className="watch-cushion relative aspect-square overflow-hidden transition-transform duration-300 group-hover/slot:-translate-y-1 group-hover/slot:scale-105">
                        {/* Shadow beneath the watch photo */}
                        <div className="absolute inset-x-[12%] bottom-[15%] h-[10%] rounded-full bg-black/40 blur-md" />

                        {/* Watch photo */}
                        <div className="absolute inset-[8%] overflow-hidden rounded-lg transition-transform duration-300">
                          {watch.cover_photo_url ? (
                            <Image
                              src={watch.cover_photo_url}
                              alt={`${watch.brand.name} ${watch.model}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 15vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-lg bg-[oklch(0.15_0.01_260)] text-2xl">
                              ⌚
                            </div>
                          )}
                        </div>

                        {/* Brand label */}
                        <span className="absolute inset-x-0 bottom-1 text-center text-[8px] font-medium uppercase tracking-wider text-white/50 sm:text-[9px]">
                          {watch.brand.name}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    /* Empty cushion — darker depression */
                    <div className="watch-cushion-empty relative aspect-square">
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white/10">
                        {i + 1}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
