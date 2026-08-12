"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Maximize2, Plus } from "lucide-react"
import { CaliberShelfMark } from "@/components/calibershelf-mark"
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
import { deleteWatchPhoto, setCoverPhoto, uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { WatchPhoto } from "@/lib/types/watch"

// TODO(D1/Phase 3): drag-reorder (sort_order) and per-photo angle tags land
// with the Photo Lab migrations; the filmstrip then shows each tile's angle.

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

  // Cover first — the cover is the hero, always (D2).
  const ordered = useMemo(
    () => [...photos].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0)),
    [photos]
  )
  const cover = ordered[0]
  const orderedUrls = ordered.map(
    (p) => fullPhotoUrls?.[p.storage_path] ?? photoUrls[p.storage_path] ?? ""
  )

  function upload(file: File | undefined | null) {
    if (!file) return
    const formData = new FormData()
    formData.set("photo", file)
    startTransition(async () => {
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
          <CaliberShelfMark size={32} className="rounded-lg opacity-70" />
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
          onClick={() => coverUrl && setLightboxIndex(0)}
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
          Cover
        </span>
        <button
          type="button"
          onClick={() => coverUrl && setLightboxIndex(0)}
          aria-label="Open lightbox"
          className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-black/45 text-white transition-colors hover:bg-black/60"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Filmstrip: every frame + a dashed add tile (A3 uploader arrives in
          Phase 2/A3; the tile uses the shared upload action meanwhile). */}
      <div className="grid grid-cols-6 gap-2">
        {ordered.map((photo, index) => {
          const url = photoUrls[photo.storage_path]
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => url && setLightboxIndex(index)}
              aria-label={`View photo ${index + 1}`}
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
          keysDisabled={confirmDeleteId !== null}
        />
      )}
    </div>
  )
}
