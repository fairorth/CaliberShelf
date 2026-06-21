"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { WatchWithCover } from "@/lib/types/watch"

interface DialWatchMarkerProps {
  watch: WatchWithCover
  /** Radial angle of this marker in degrees (-90 = 12 o'clock, 0 = 3 o'clock, …) */
  angleDeg: number
  /** When true, the marker zooms automatically (driven by the sweeping second hand). */
  autoActive?: boolean
  /** Fired when the cursor enters/leaves the marker, so the dial can pause auto-zoom. */
  onHoverChange?: (hovering: boolean) => void
}

export function DialWatchMarker({
  watch,
  angleDeg,
  autoActive = false,
  onHoverChange,
}: DialWatchMarkerProps) {
  const photo = watch.cover_photo_url
  const focalX = watch.dial_focal_x ?? 50
  const focalY = watch.dial_focal_y ?? 50
  const zoom = watch.dial_zoom ?? 1
  // Prefer the nickname when set ("Moonwatch"), else fall back to brand + model.
  const brandModel = `${watch.brand.name} ${watch.model}`
  const nickname = watch.nickname?.trim()
  const caption = nickname || brandModel
  // Keep the full identity in the a11y label even when a nickname is shown.
  const ariaLabel = nickname ? `${nickname} — ${brandModel}` : brandModel

  // Unit vector pointing from the marker back toward the dial center.
  // Used to push the caption inward so it never collides with neighbors.
  const angleRad = (angleDeg * Math.PI) / 180
  // Distance from marker center to caption center (px). Marker radius is 45 (sm)
  // / 35 (mobile), plus a small gap and half the caption height.
  const captionOffset = 56
  // Rounded so server and client serialize identical transform strings (raw
  // Math.cos/sin floats hydrate as a mismatch otherwise).
  const captionX = Math.round(-Math.cos(angleRad) * captionOffset * 10000) / 10000
  const captionY = Math.round(-Math.sin(angleRad) * captionOffset * 10000) / 10000

  return (
    <Link
      href={`/watch/${watch.id}`}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "group/marker relative block",
        "transition-transform duration-300 ease-out hover:scale-[1.9] hover:z-50",
        // Auto-zoom mirrors the hover effect while the second hand passes over.
        autoActive && "scale-[1.9] z-50",
      )}
      aria-label={ariaLabel}
    >
      {/* Circular marker */}
      <div
        className={cn(
          "relative flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-full sm:h-[90px] sm:w-[90px]",
          "ring-2 ring-[oklch(0.85_0.03_85)] shadow-md",
          "transition-shadow duration-200 group-hover/marker:shadow-[0_0_18px_rgba(200,180,120,0.5)]",
          autoActive && "shadow-[0_0_18px_rgba(200,180,120,0.5)]",
          photo ? "bg-black" : "bg-[oklch(0.18_0.01_260)]",
        )}
      >
        {photo ? (
          <Image
            src={photo}
            alt={caption}
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
            {watch.brand.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Watch name — hidden by default to keep the dial uncluttered; revealed
          (radially inward, toward dial center) only while the marker is zoomed,
          whether by hover or by the automatic second-hand sweep. */}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 whitespace-nowrap",
          "text-[11px] font-medium uppercase tracking-wide text-[oklch(0.92_0.03_85)]",
          "opacity-0 transition-opacity duration-300 group-hover/marker:opacity-100",
          autoActive && "opacity-100",
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${captionX}px, ${captionY}px)`,
          textShadow:
            "0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7), 0 0 12px rgba(0,0,0,0.5)",
        }}
      >
        {caption}
      </span>
    </Link>
  )
}
