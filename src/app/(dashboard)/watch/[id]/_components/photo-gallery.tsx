"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { Star, Trash2, Watch } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { WatchPhoto } from "@/lib/types/watch"

// TODO(D1/Phase 3): drag-reorder (sort_order) and per-photo angle tags
// (flat · hero · profile · caseback · macro) land with the Photo Lab.

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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {ordered.map((photo, index) => {
          const url = photoUrls[photo.storage_path]
          const isHero = index === 0
          return (
            <div
              key={photo.id}
              className={cn(
                "group/photo relative overflow-hidden rounded-lg bg-muted",
                isHero && ordered.length > 1 && "col-span-2 row-span-2",
                isHero && ordered.length === 1 && "col-span-2",
                "aspect-square"
              )}
            >
              {/* Single click opens the lightbox (D2). */}
              <button
                type="button"
                onClick={() => url && setLightboxIndex(index)}
                aria-label={`View photo ${index + 1} full size`}
                className="absolute inset-0 block h-full w-full cursor-zoom-in"
              >
                {url ? (
                  <Image
                    src={url}
                    alt={`Watch photo ${index + 1}`}
                    fill
                    // The hero is the subject → contain on a neutral field.
                    // Small tiles are a dense grid → cover is acceptable.
                    className={isHero ? "object-contain" : "object-cover"}
                    sizes={
                      isHero
                        ? "(max-width: 768px) 100vw, 50vw"
                        : "(max-width: 768px) 50vw, 25vw"
                    }
                    priority={isHero}
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground">
                    Loading...
                  </span>
                )}
              </button>

              {/* §2.5 — `COVER` is pre-Phase-6 vocabulary; the concept is the
                  hero ANGLE. Show the angle name, or nothing. That also settles
                  §3.9, since the badge that rendered blue here and brass-grey
                  on the view page no longer exists in either. */}
              {photo.angle && (
                <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-card/90 px-2 py-[3px] font-mono text-2xs font-medium uppercase tracking-[0.1em] text-foreground">
                  {photo.angle}
                </span>
              )}

              {/* Per-tile hover actions (replace the select-then-act footer). */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/photo:opacity-100">
                {!photo.is_cover && (
                  <TileAction
                    label="Set as cover"
                    disabled={isPending}
                    onClick={() => handleSetCover(photo.id)}
                  >
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </TileAction>
                )}
                <TileAction
                  label="Delete photo"
                  disabled={isPending}
                  onClick={() => setConfirmDeleteId(photo.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </TileAction>
              </div>
            </div>
          )
        })}
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
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:opacity-100 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
