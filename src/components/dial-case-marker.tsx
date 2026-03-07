"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { DisplayCaseWithWatches } from "@/lib/types/watch"

interface DialCaseMarkerProps {
  displayCase: DisplayCaseWithWatches
  hourPosition: number // 1-12
}

export function DialCaseMarker({ displayCase, hourPosition }: DialCaseMarkerProps) {
  const watchCount = displayCase.watches.length
  const capacity = parseInt(displayCase.capacity, 10)
  const firstPhoto = displayCase.watches.find((w) => w.cover_photo_url)?.cover_photo_url

  return (
    <Link
      href={`/case/${displayCase.id}`}
      className={cn(
        "group/marker flex flex-col items-center gap-1",
        "transition-transform duration-200 hover:scale-110",
      )}
      aria-label={`${displayCase.name} case, ${watchCount} of ${capacity} watches`}
    >
      {/* Circular marker */}
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full sm:h-14 sm:w-14",
          "ring-2 ring-[oklch(0.85_0.03_85)] shadow-md",
          "transition-shadow duration-200 group-hover/marker:shadow-[0_0_12px_rgba(200,180,120,0.4)]",
          firstPhoto ? "bg-black" : "bg-[oklch(0.18_0.01_260)]",
        )}
      >
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={displayCase.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <span className="text-sm font-semibold text-[oklch(0.85_0.03_85)] sm:text-base">
            {hourPosition}
          </span>
        )}

        {/* Count badge */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.85_0.03_85)] text-[8px] font-bold text-[oklch(0.12_0.01_260)] sm:h-5 sm:w-5 sm:text-[9px]">
          {watchCount}
        </span>
      </div>

      {/* Case name — visible on larger screens */}
      <span className="hidden max-w-[60px] truncate text-center text-[9px] font-medium text-[oklch(0.7_0.02_85)] sm:block sm:max-w-[80px] sm:text-[10px]">
        {displayCase.name}
      </span>
    </Link>
  )
}
