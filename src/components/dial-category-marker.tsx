"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CategoryWithWatches } from "@/lib/types/watch"

interface DialCategoryMarkerProps {
  category: CategoryWithWatches
}

export function DialCategoryMarker({ category }: DialCategoryMarkerProps) {
  const watchCount = category.watches.length
  const firstPhoto = category.watches.find((w) => w.cover_photo_url)?.cover_photo_url

  return (
    <Link
      href={`/category/${category.id}`}
      className={cn(
        "group/marker flex flex-col items-center gap-1",
        "transition-transform duration-200 hover:scale-110",
      )}
      aria-label={`${category.name} category, ${watchCount} ${watchCount === 1 ? "watch" : "watches"}`}
    >
      {/* Circular marker */}
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full sm:h-[72px] sm:w-[72px]",
          "ring-2 ring-[oklch(0.85_0.03_85)] shadow-md",
          "transition-shadow duration-200 group-hover/marker:shadow-[0_0_12px_rgba(200,180,120,0.4)]",
          firstPhoto ? "bg-black" : "bg-[oklch(0.18_0.01_260)]",
        )}
      >
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={category.name}
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <span className="text-sm font-semibold text-[oklch(0.85_0.03_85)] sm:text-base">
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Count badge */}
        {watchCount > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.85_0.03_85)] text-[9px] font-bold text-[oklch(0.12_0.01_260)] sm:h-6 sm:w-6 sm:text-[10px]">
            {watchCount}
          </span>
        )}
      </div>

      {/* Category name — visible on larger screens */}
      <span className="hidden max-w-[60px] truncate text-center text-[9px] font-medium text-[oklch(0.7_0.02_85)] sm:block sm:max-w-[80px] sm:text-[10px]">
        {category.name}
      </span>
    </Link>
  )
}
