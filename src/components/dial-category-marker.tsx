"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CategoryWithWatches } from "@/lib/types/watch"

interface DialCategoryMarkerProps {
  category: CategoryWithWatches
  /** Radial angle of this marker in degrees (-90 = 12 o'clock, 0 = 3 o'clock, …) */
  angleDeg: number
}

export function DialCategoryMarker({ category, angleDeg }: DialCategoryMarkerProps) {
  const watchCount = category.watches.length
  const coverWatch = category.watches.find((w) => w.cover_photo_url)
  const firstPhoto = coverWatch?.cover_photo_url
  const focalX = coverWatch?.dial_focal_x ?? 50
  const focalY = coverWatch?.dial_focal_y ?? 50
  const zoom = coverWatch?.dial_zoom ?? 1

  // Unit vector pointing from the marker back toward the dial center.
  // Used to push the caption inward so it never collides with neighbors.
  const angleRad = (angleDeg * Math.PI) / 180
  const inwardX = -Math.cos(angleRad)
  const inwardY = -Math.sin(angleRad)
  // Distance from marker center to caption center (px). Marker radius is 45 (sm)
  // / 35 (mobile), plus a small gap and half the caption height.
  const captionOffset = 56

  return (
    <Link
      href={`/category/${category.id}`}
      className={cn(
        "group/marker relative block",
        "transition-transform duration-300 ease-out hover:scale-[1.9] hover:z-50",
      )}
      aria-label={`${category.name} category, ${watchCount} ${watchCount === 1 ? "watch" : "watches"}`}
    >
      {/* Circular marker */}
      <div
        className={cn(
          "relative flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full sm:h-[90px] sm:w-[90px]",
          "ring-2 ring-[oklch(0.85_0.03_85)] shadow-md",
          "transition-shadow duration-200 group-hover/marker:shadow-[0_0_18px_rgba(200,180,120,0.5)]",
          firstPhoto ? "bg-black" : "bg-[oklch(0.18_0.01_260)]",
        )}
      >
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={category.name}
            fill
            className="object-cover"
            sizes="240px"
            style={{
              objectPosition: `${focalX}% ${focalY}%`,
              transform: zoom > 1 ? `scale(${zoom})` : undefined,
            }}
          />
        ) : (
          <span className="text-base font-semibold text-[oklch(0.85_0.03_85)] sm:text-lg">
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Category name — positioned radially inward (toward dial center) so it
          never collides with neighboring markers, even while hover-zoomed. */}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 hidden whitespace-nowrap",
          "text-[11px] font-medium uppercase tracking-wide text-[oklch(0.92_0.03_85)] sm:block",
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${inwardX * captionOffset}px, ${inwardY * captionOffset}px)`,
          textShadow:
            "0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7), 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        {category.name}
      </span>
    </Link>
  )
}
