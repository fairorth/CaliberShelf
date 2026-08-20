"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Maximize2, Plus } from "lucide-react"
import { Mark } from "@/components/brand/logo"
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
import {
  deleteWatchPhoto,
  reorderWatchPhotos,
  setCoverPhoto,
  setPhotoAngle,
  uploadWatchPhoto,
} from "@/lib/actions/photo-actions"
import { downscaleImage } from "@/lib/images"
import {
  ANGLE_HEADINGS,
  ANGLE_LABELS,
  PHOTO_ANGLES,
  photoSortKey,
} from "@/lib/photo-lab"
import { toast } from "sonner"
import { frameAspect } from "@/lib/frame-aspect"
import { SPROCKET_STYLE, STRIP_BASE, STRIP_CELL } from "@/lib/strip-style"
import { cn } from "@/lib/utils"
import type { PhotoAngle, WatchPhoto } from "@/lib/types/watch"

interface WatchViewPhotosProps {
  photos: WatchPhoto[]
  photoUrls: Record<string, string>
  fullPhotoUrls?: Record<string, string>
  watchId: string
}

/** The watch view page's photo column (A1): cover frame large and
 *  object-contain — never cropped — with a filmstrip below and a dashed
 *  add tile. One click opens the lightbox (D2). */
/** The cover frame's fixed height; the width follows the photograph (§2.2). */
const COVER_HEIGHT = 460

export function WatchViewPhotos({ photos, photoUrls, fullPhotoUrls, watchId }: WatchViewPhotosProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Drag-reorder (D2/00041): optimistic id order until the server round-trips.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
  const dragFrom = useRef<number | null>(null)

  // Filmstrip order = sort_order (falling back to display_order); the cover
  // always occupies the big frame regardless of its strip position (D2).
  const ordered = useMemo(() => {
    const base = [...photos].sort((a, b) => photoSortKey(a) - photoSortKey(b))
    if (!pendingOrder) return base
    const rank = new Map(pendingOrder.map((id, i) => [id, i]))
    return base.sort(
      (a, b) => (rank.get(a.id) ?? base.indexOf(a)) - (rank.get(b.id) ?? base.indexOf(b))
    )
  }, [photos, pendingOrder])
  const cover = ordered.find((p) => p.is_cover) ?? ordered[0]
  const coverIndex = ordered.findIndex((p) => p.id === cover?.id)
  const orderedUrls = ordered.map(
    (p) => fullPhotoUrls?.[p.storage_path] ?? photoUrls[p.storage_path] ?? ""
  )

  function handleTileDrop(toIndex: number) {
    const fromIndex = dragFrom.current
    dragFrom.current = null
    if (fromIndex === null || fromIndex === toIndex) return
    const ids = ordered.map((p) => p.id)
    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)
    setPendingOrder(ids)
    startTransition(async () => {
      const result = await reorderWatchPhotos(watchId, ids)
      if (result.error) {
        toast.error(result.error)
        setPendingOrder(null)
      }
    })
  }

  function handleSetAngle(photoId: string, angle: PhotoAngle | null) {
    startTransition(async () => {
      const result = await setPhotoAngle(photoId, watchId, angle)
      if (result.error) toast.error(result.error)
    })
  }

  function upload(file: File | undefined | null) {
    if (!file) return
    startTransition(async () => {
      // Every upload path downscales client-side (A3).
      const prepared = await downscaleImage(file)
      const formData = new FormData()
      formData.set("photo", prepared)
      try {
        const result = await uploadWatchPhoto(watchId, formData)
        if (result.error) toast.error(result.error)
        else toast.success("Photo uploaded")
      } catch {
        toast.error("Upload failed. The photo may be too large — try a smaller image.")
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    })
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deleteWatchPhoto(photoId, watchId)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Photo deleted")
        setLightboxIndex((prev) =>
          prev === null ? null : ordered.length <= 1 ? null : Math.min(prev, ordered.length - 2)
        )
      }
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      const result = await setCoverPhoto(photoId, watchId)
      if (result.error) toast.error(result.error)
      else toast.success("Cover photo updated")
    })
  }

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic"
      onChange={(e) => upload(e.target.files?.[0])}
      className="hidden"
      disabled={isPending}
    />
  )

  // Empty state: a dashed drop target, not an emoji (design system §6).
  if (photos.length === 0) {
    return (
      <div>
        {fileInput}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            upload(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-surface-photo text-center transition-colors",
            dragging ? "border-brass/60" : "border-border hover:border-brass/50"
          )}
        >
          <Mark size={32} className="rounded-lg opacity-70" />
          <span className="text-sm text-muted-foreground">
            {isPending ? "Uploading…" : "Drop the first frame"}
          </span>
        </button>
      </div>
    )
  }

  const coverUrl = photoUrls[cover.storage_path]
  // The same three bands as the home strip (Phase 8 §1.2): `ordered` already
  // sorts filled slots by rack order then untagged, and the empty shot-list
  // cells go last — photographs before plus-signs.
  const shotAngles = new Set(photos.map((p) => p.angle).filter(Boolean))
  const missingAngles = PHOTO_ANGLES.filter((a) => !shotAngles.has(a))

  const coverAspect = frameAspect({
    imageWidth: cover.image_width ?? null,
    imageHeight: cover.image_height ?? null,
  })
  const lightboxPhoto = lightboxIndex !== null ? ordered[lightboxIndex] : null

  return (
    <div className="space-y-2">
      {fileInput}

      {/* Cover frame (§2.2) — the box takes its shape from the photograph.
          It was a fixed 4:3 with the photo contained inside, and with no bloom
          on this page that left flat grey `--surface-photo` bands either side
          of every portrait frame: the same defect as the home stage, plainer.
          Fixed height, width follows the stored aspect, capped at the column.

          object-contain still. Always — the box being right is what makes
          cropping unnecessary, never a licence for it. */}
      <div
        className="group/cover relative mx-auto overflow-hidden rounded-xl border border-border bg-surface-photo"
        style={
          coverAspect
            ? { height: COVER_HEIGHT, aspectRatio: `${coverAspect}`, maxWidth: "100%" }
            : // Unmeasured: the content-width 3:2 fallback (Phase 8 §2.1).
              { width: "100%", aspectRatio: "3 / 2" }
        }
      >
        <button
          type="button"
          onClick={() => coverUrl && setLightboxIndex(coverIndex)}
          aria-label="View cover photo full size"
          className="absolute inset-0 block h-full w-full cursor-zoom-in"
        >
          {coverUrl && (
            <Image
              src={coverUrl}
              alt="Cover photo"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              unoptimized
            />
          )}
        </button>
        {/* §2.5 — `COVER` is pre-Phase-6 vocabulary; the concept is the hero
            ANGLE. Show the angle name, or nothing at all. Neutral, not brass:
            brass marks meaning, and "this is the cover" is not a meaning worth
            the only accent in the app. */}
        {cover?.angle && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 font-mono text-2xs font-medium uppercase tracking-[0.1em] text-foreground">
            {cover.angle}
          </span>
        )}
        <button
          type="button"
          onClick={() => coverUrl && setLightboxIndex(coverIndex)}
          aria-label="Open lightbox"
          className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-black/45 text-white transition-colors hover:bg-black/60"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* ── The strip (§2.5) ───────────────────────────────────────
          The same vocabulary as the home page: film base, sprockets, 3:2
          frames, the angle name beneath each, and the same filled-before-empty
          order. The square tiles this replaces were a second photo language
          for the same watch — and the `+ ADD` tile said only "there could be
          more", where the shot-list cells say WHICH more, which is the half
          worth having.

          Drag-to-reorder and the lightbox survive unchanged. */}
      <div className="overflow-hidden rounded-lg py-2" style={{ background: STRIP_BASE }}>
        <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />
        <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ordered.map((photo, index) => {
            const url = photoUrls[photo.storage_path]
            return (
              <div
                key={photo.id}
                className="flex min-w-0 flex-col gap-1"
                style={{ flex: "1 0 104px" }}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={() => {
                    dragFrom.current = index
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleTileDrop(index)
                  }}
                  onClick={() => url && setLightboxIndex(index)}
                  aria-label={`View photo ${index + 1}${photo.angle ? ` (${photo.angle})` : ""} full size`}
                  className={cn(
                    // Inset outline so the brass reads as a selected frame ON
                    // the strip rather than a card floating above it.
                    "relative block aspect-[3/2] w-full cursor-zoom-in overflow-hidden outline-2 -outline-offset-2",
                    photo.is_cover ? "outline outline-brass" : "outline-transparent"
                  )}
                  style={{ background: STRIP_CELL }}
                >
                  {url && (
                    <Image
                      src={url}
                      alt={`Photo ${index + 1}`}
                      fill
                      // A thumbnail is a navigation target, so a crop is right
                      // here — and only here.
                      className="object-cover"
                      sizes="140px"
                      unoptimized
                    />
                  )}
                </button>
                {/* The label lives inside the strip, under its frame — muted
                    white, never brass: brass would make an absence look like
                    an achievement. */}
                <span className="truncate text-center font-mono text-2xs tracking-[0.06em] text-white/60">
                  {photo.angle ? ANGLE_HEADINGS[photo.angle] : "UNTAGGED"}
                </span>
              </div>
            )
          })}

          {/* Band 3 — the empty shot-list cells, after every photograph, each
              naming the angle it wants. */}
          {missingAngles.map((angle) => (
            <div
              key={`slot-${angle}`}
              className="flex min-w-0 flex-col gap-1"
              style={{ flex: "1 0 104px" }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                aria-label={`${ANGLE_LABELS[angle]} not shot yet — add a photo`}
                className="flex aspect-[3/2] w-full items-center justify-center border border-dashed border-white/25 text-white/55 transition-colors hover:border-brass hover:text-brass disabled:opacity-50"
                style={{ background: STRIP_CELL }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="truncate text-center font-mono text-2xs tracking-[0.06em] text-white/60">
                {ANGLE_HEADINGS[angle]}
              </span>
            </div>
          ))}
        </div>
        <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />
      </div>

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
      >
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
          angle={lightboxPhoto.angle}
          onSetAngle={(angle) => handleSetAngle(lightboxPhoto.id, angle)}
          keysDisabled={confirmDeleteId !== null}
        />
      )}
    </div>
  )
}
