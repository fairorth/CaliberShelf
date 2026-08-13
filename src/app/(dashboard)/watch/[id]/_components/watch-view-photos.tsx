"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Maximize2, Plus } from "lucide-react"
import { TenTenLoupeMark } from "@/components/calibershelf-mark"
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
import { photoSortKey } from "@/lib/photo-lab"
import { toast } from "sonner"
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
          <TenTenLoupeMark size={32} className="rounded-lg opacity-70" />
          <span className="text-sm text-muted-foreground">
            {isPending ? "Uploading…" : "Drop the first frame"}
          </span>
        </button>
      </div>
    )
  }

  const coverUrl = photoUrls[cover.storage_path]
  const lightboxPhoto = lightboxIndex !== null ? ordered[lightboxIndex] : null

  return (
    <div className="space-y-2">
      {fileInput}

      {/* Cover frame — the photo is the subject: contain, never crop (§8). */}
      <div className="group/cover relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-photo">
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
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-brass/16 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.1em] text-brass">
          Cover{cover?.angle ? ` · ${cover.angle}` : ""}
        </span>
        <button
          type="button"
          onClick={() => coverUrl && setLightboxIndex(coverIndex)}
          aria-label="Open lightbox"
          className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-black/45 text-white transition-colors hover:bg-black/60"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Filmstrip: drag to reorder (sort_order); angle tag bottom-left. */}
      <div className="grid grid-cols-6 gap-2">
        {ordered.map((photo, index) => {
          const url = photoUrls[photo.storage_path]
          return (
            <button
              key={photo.id}
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
              aria-label={`View photo ${index + 1}${photo.angle ? ` (${photo.angle})` : ""}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg bg-surface-photo transition-colors duration-150",
                photo.is_cover
                  ? "border-2 border-brass"
                  : "border border-border hover:border-brass"
              )}
            >
              {url && (
                <Image
                  src={url}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized
                />
              )}
              {photo.angle && (
                <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-px font-mono text-2xs uppercase text-white/90">
                  {photo.angle}
                </span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          aria-label="Add a photo"
          className="flex aspect-square items-center justify-center gap-1 rounded-lg border border-dashed border-border font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-brass/60 hover:text-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
        </button>
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
