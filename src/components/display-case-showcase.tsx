"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { caseSizeLayouts } from "@/lib/validations/display-case"
import type { DisplayCaseWithWatches } from "@/lib/types/watch"

interface DisplayCaseShowcaseProps {
  displayCase: DisplayCaseWithWatches
}

export function DisplayCaseShowcase({ displayCase }: DisplayCaseShowcaseProps) {
  const [isOpen, setIsOpen] = useState(false)
  const capacity = parseInt(displayCase.capacity, 10)
  const [cols] = caseSizeLayouts[displayCase.capacity] ?? [4, 2]
  const watchCount = displayCase.watches.length

  // Build slot map
  const slotMap = new Map(
    displayCase.watches.map((w) => [w.case_slot, w])
  )

  // For large cases, limit visible rows in closed state
  const maxSlotsToShow = Math.min(capacity, cols * 3)

  return (
    <div
      className="group/case"
      style={{ perspective: "900px" }}
    >
      <div
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Case body — dark felt interior */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border shadow-lg transition-shadow duration-500",
            isOpen
              ? "shadow-2xl"
              : "cursor-pointer hover:shadow-xl"
          )}
          style={{
            background: "linear-gradient(145deg, #1a1a2e, #16213e)",
          }}
          onClick={() => !isOpen && setIsOpen(true)}
          role={isOpen ? undefined : "button"}
          tabIndex={isOpen ? undefined : 0}
          onKeyDown={(e) => {
            if (!isOpen && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault()
              setIsOpen(true)
            }
          }}
          aria-label={isOpen ? undefined : `Open ${displayCase.name} case`}
        >
          {/* Inner shadow for depth */}
          <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]" />

          {/* Watch grid */}
          <div className="relative z-10 p-3">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: maxSlotsToShow }, (_, i) => {
                const watch = slotMap.get(i)
                return (
                  <div key={i} className="relative">
                    {watch ? (
                      isOpen ? (
                        <Link
                          href={`/watch/${watch.id}`}
                          className="group/watch block overflow-hidden rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:scale-110 hover:z-10"
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/10">
                            {watch.cover_photo_url ? (
                              <Image
                                src={watch.cover_photo_url}
                                alt={`${watch.brand.name} ${watch.model}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 10vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl text-white/30">
                                ⌚
                              </div>
                            )}
                          </div>
                          <p className="mt-1 truncate text-center text-[10px] font-medium text-white/70">
                            {watch.brand.name}
                          </p>
                        </Link>
                      ) : (
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/10">
                          {watch.cover_photo_url ? (
                            <Image
                              src={watch.cover_photo_url}
                              alt={`${watch.brand.name} ${watch.model}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 10vw"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xl text-white/30">
                              ⌚
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="aspect-square rounded-lg border border-dashed border-white/10 bg-white/5" />
                    )}
                  </div>
                )
              })}
            </div>

            {capacity > maxSlotsToShow && (
              <p className="mt-1 text-center text-[10px] text-white/40">
                +{capacity - maxSlotsToShow} more slots
              </p>
            )}
          </div>

          {/* Glass lid overlay — only visible when closed */}
          <div
            className={cn(
              "absolute inset-0 z-20 rounded-xl transition-all duration-600",
              isOpen
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            )}
            style={{
              transformOrigin: "top center",
              transform: isOpen ? "rotateX(-85deg)" : "rotateX(0deg)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Glass background */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/8 to-white/3 backdrop-blur-[1px]" />

            {/* Glass shine sweep */}
            <div className="glass-shine absolute inset-0 rounded-xl" />

            {/* Glass reflection line at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Case label on glass */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <h3 className="text-sm font-semibold text-white drop-shadow-md">
                {displayCase.name}
              </h3>
              <Badge
                variant="secondary"
                className="bg-black/40 text-[10px] text-white/80 backdrop-blur-sm"
              >
                {watchCount}/{capacity}
              </Badge>
            </div>
          </div>
        </div>

        {/* Close button — only when open */}
        {isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#16213e] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-[#1a1a2e] hover:text-white"
          >
            Close Case
          </button>
        )}
      </div>
    </div>
  )
}
