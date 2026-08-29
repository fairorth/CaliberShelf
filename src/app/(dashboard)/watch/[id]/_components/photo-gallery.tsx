"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Star, Trash2, Watch } from "lucide-react"
import { PhotoLightbox } from "./photo-lightbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteWatchPhoto, setCoverPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"
import { ANGLE_HEADINGS, ANGLE_LABELS, PHOTO_ANGLES } from "@/lib/photo-lab"
import { frameAspect } from "@/lib/frame-aspect"
import { SPROCKET_STYLE, STRIP_BASE, STRIP_CELL } from "@/lib/strip-style"
import { cn } from "@/lib/utils"
import type { WatchPhoto } from "@/lib/types/watch"

/** Cap so a very tall frame cannot run off the screen in the sidebar. */
const HERO_MAX_HEIGHT = 560

/** The two fields `frameAspect` needs, from a WatchPhoto. */
function toFrameDims(p: WatchPhoto) {
  return { imageWidth: p.image_width ?? null, imageHeight: p.image_height ?? null }
}

interface PhotoGalleryProps {
  photos: WatchPhoto[]
  /** Display-sized signed URLs (keyed by storage_path). */
  photoUrls: Record<string, string>
  /** Larger signed URLs for the zoom lightbox (falls back to photoUrls). */
  fullPhotoUrls?: Record<string, string>
  watchId: string
}

export function PhotoGallery({ photos, photoUrls, fullPhotoUrls, watchId }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Hero = cover, always (D2). The cover photo sorts first and occupies the
  // 2×2 slot; the rest keep their stored order.
  const ordered = useMemo(
    () => [...photos].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0)),
    [photos]
  )

  // Ordered signed URLs aligned to `ordered` (index-stable for the lightbox).
  // Prefer the larger "full" URLs so zooming stays crisp.
  const orderedUrls = ordered.map(
    (p) => fullPhotoUrls?.[p.storage_path] ?? photoUrls[p.storage_path] ?? ""
  )

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deleteWatchPhoto(photoId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Photo deleted")
        // Keep the lightbox in range now that the array will shrink.
        setLightboxIndex((prev) =>
          prev === null ? null : ordered.length <= 1 ? null : Math.min(prev, ordered.length - 2)
        )
      }
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      const result = await setCoverPhoto(photoId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cover photo updated")
      }
    })
  }

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed bg-muted">
        <div className="text-center">
          <Watch className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted-foreground">No photos yet</p>
        </div>
      </div>
    )
  }

  const lightboxPhoto = lightboxIndex !== null ? ordered[lightboxIndex] : null

  const hero = ordered[0]
  const heroUrl = hero ? photoUrls[hero.storage_path] : undefined
  const heroAspect = hero ? frameAspect(toFrameDims(hero)) : null

  // Same three bands as the home strip (Phase 8 §1.2, carried over by §2.5):
  // filled angle slots in rack order, then untagged frames, then the empty
  // shot-list cells. Photographs before plus-signs, always.
  const shotAngles = new Set(photos.map((p) => p.angle).filter(Boolean))
  const missingAngles = PHOTO_ANGLES.filter((a) => !shotAngles.has(a))
  const stripOrder = [...photos].sort((a, b) => {
    const rank = (p: WatchPhoto) =>
      p.angle == null ? PHOTO_ANGLES.length : PHOTO_ANGLES.indexOf(p.angle)
    return (
      rank(a) - rank(b) ||
      (a.sort_order ?? a.display_order) - (b.sort_order ?? b.display_order)
    )
  })

  return (
    <div className="space-y-3">
      {/* ── The hero (§2.2) ────────────────────────────────────────
          Same rule as the home stage: fixed height, width follows the
          photograph's stored aspect, capped at the column. This page had no
          bloom at all, so a portrait frame sat in a square box between two
          flat grey bands — the defect in its plainest form. The box now hugs
          the photograph, so there is nothing left to fill.

          object-contain still. Always. */}
      {hero && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => heroUrl && setLightboxIndex(0)}
            aria-label="View the cover photo full size"
            className="group/photo relative block cursor-zoom-in overflow-hidden rounded-lg bg-surface-photo"
            // Width-driven here, unlike the home stage and the view page.
            // This is a sidebar preview in a fixed column, so filling the
            // column is what uses the space; a fixed height would leave a
            // portrait frame narrow with the column empty either side. The
            // aspect is still the photograph's own and the cap stops a very
            // tall frame running off the screen — never a crop.
            style={
              heroAspect
                ? { width: "100%", aspectRatio: `${heroAspect}`, maxHeight: HERO_MAX_HEIGHT }
                : { width: "100%", aspectRatio: "3 / 2" }
            }
          >
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt="Cover photo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 420px"
                priority
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                Loading…
              </span>
            )}
            {hero.angle && (
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-card/90 px-2 py-[3px] font-mono text-2xs font-medium uppercase tracking-[0.1em] text-foreground">
                {hero.angle}
              </span>
            )}
            <span className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover/photo:opacity-100">
              <TileAction
                label="Delete photo"
                disabled={isPending}
                onClick={() => setConfirmDeleteId(hero.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </TileAction>
            </span>
          </button>
        </div>
      )}

      {/* ── The strip (§2.5) ───────────────────────────────────────
          The same vocabulary as the home page, so one watch does not speak two
          photo languages. The old square tiles plus `+ ADD` said "there could
          be more"; the shot-list cells say WHICH more, which is the useful
          half. */}
      <div className="overflow-hidden rounded-lg py-2" style={{ background: STRIP_BASE }}>
        <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />
        <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stripOrder.map((photo) => {
            const index = ordered.findIndex((p) => p.id === photo.id)
            const url = photoUrls[photo.storage_path]
            return (
              <div
                key={photo.id}
                className="group/frame flex min-w-0 flex-col gap-1"
                style={{ flex: "1 0 96px" }}
              >
                <button
                  type="button"
                  onClick={() => url && setLightboxIndex(index)}
                  aria-label={`View photo ${index + 1} full size`}
                  className={cn(
                    "relative block aspect-[3/2] w-full cursor-zoom-in overflow-hidden outline-2 -outline-offset-2",
                    photo.is_cover ? "outline outline-brass" : "outline-transparent"
                  )}
                  style={{ background: STRIP_CELL }}
                >
                  {url && (
                    <Image
                      src={url}
                      alt=""
                      fill
                      // A thumbnail is a navigation target, so a crop is right
                      // here — and only here.
                      className="object-cover"
                      sizes="120px"
                      unoptimized
                    />
                  )}
                  {!photo.is_cover && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Set as cover"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetCover(photo.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSetCover(photo.id)
                        }
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white/80 opacity-0 transition-opacity hover:text-brass group-hover/frame:opacity-100"
                    >
                      <Star className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </button>
                <span className="truncate text-center font-mono text-2xs tracking-[0.06em] text-white/60">
                  {photo.angle ? ANGLE_HEADINGS[photo.angle] : "UNTAGGED"}
                </span>
              </div>
            )
          })}

          {/* Band 3 — what is still to shoot, named. */}
          {missingAngles.map((angle) => (
            <Link
              key={`slot-${angle}`}
              href={`/photo-lab/session?watch=${watchId}&angle=${angle}`}
              aria-label={`${ANGLE_LABELS[angle]} not shot yet — open the Photo Lab session`}
              className="flex min-w-0 flex-col gap-1"
              style={{ flex: "1 0 96px" }}
            >
              <span
                className="flex aspect-[3/2] w-full items-center justify-center border border-dashed border-white/25 text-white/55 transition-colors hover:border-brass hover:text-brass"
                style={{ background: STRIP_CELL }}
              >
                <Plus className="size-4" aria-hidden="true" />
              </span>
              <span className="truncate text-center font-mono text-2xs tracking-[0.06em] text-white/60">
                {ANGLE_HEADINGS[angle]}
              </span>
            </Link>
          ))}
        </div>
        <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />
      </div>

      {/* Delete confirmation (shared by tile actions and the lightbox). */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
      >
        {/* Above the lightbox (z-100) so deleting from inside it works. */}
        <AlertDialogContent className="z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the photo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId)
                setConfirmDeleteId(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightboxIndex !== null && lightboxPhoto && (
        <PhotoLightbox
          urls={orderedUrls}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          isCover={lightboxPhoto.is_cover}
          onSetCover={() => handleSetCover(lightboxPhoto.id)}
          onDelete={() => setConfirmDeleteId(lightboxPhoto.id)}
          keysDisabled={confirmDeleteId !== null}
        />
      )}
    </div>
  )
}

function TileAction({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  // NOT a real <button>: this control sits inside the hero tile, which is
  // itself a <button> — nesting them is invalid HTML and a hydration error.
  // Same role="button" span pattern as the strip's cover star, including
  // stopPropagation so a delete click can't also open the lightbox.
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) onClick()
        }
      }}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:opacity-100 aria-disabled:cursor-default aria-disabled:opacity-40"
    >
      {children}
    </span>
  )
}
