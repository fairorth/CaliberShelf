"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteWatchPhoto, setCoverPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { WatchPhoto } from "@/lib/types/watch"

interface PhotoGalleryProps {
  photos: WatchPhoto[]
  photoUrls: Record<string, string>
  watchId: string
}

export function PhotoGallery({ photos, photoUrls, watchId }: PhotoGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    photos[0]?.id ?? null
  )
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Ordered signed URLs aligned to `photos` (index-stable for the lightbox).
  const orderedUrls = photos.map((p) => photoUrls[p.storage_path] ?? "")

  const lightbox =
    lightboxIndex !== null ? (
      <PhotoLightbox
        urls={orderedUrls}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    ) : null

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed bg-muted">
        <div className="text-center">
          <span className="text-5xl">⌚</span>
          <p className="mt-2 text-sm text-muted-foreground">No photos yet</p>
        </div>
      </div>
    )
  }

  const selectedPhoto = photos.find((p) => p.id === selectedId) ?? photos[0]

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deleteWatchPhoto(photoId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Photo deleted")
        // Select the first remaining photo
        const remaining = photos.filter((p) => p.id !== photoId)
        setSelectedId(remaining[0]?.id ?? null)
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

  // Single photo — just show it large
  if (photos.length === 1) {
    const url = photoUrls[photos[0].storage_path]
    return (
      <div className="space-y-3">
        <div
          className="group/photo relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-muted"
          onDoubleClick={() => url && setLightboxIndex(0)}
        >
          {url ? (
            <Image
              src={url}
              alt="Watch photo"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading...
            </div>
          )}
          {photos[0].is_cover && (
            <Badge className="absolute left-2 top-2">Cover</Badge>
          )}
          {url && <ZoomButton onClick={() => setLightboxIndex(0)} />}
        </div>
        {lightbox}
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the photo. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(photos[0].id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    )
  }

  // Multi-photo — 2-column grid with hero
  return (
    <div className="space-y-3">
      {/* Photo grid: first image is hero (2×2), rest fill in */}
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, index) => {
          const url = photoUrls[photo.storage_path]
          const isHero = index === 0
          const isSelected = photo.id === selectedPhoto?.id

          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedId(photo.id)}
              onDoubleClick={() => url && setLightboxIndex(index)}
              className={cn(
                "group/photo relative cursor-zoom-in overflow-hidden rounded-lg bg-muted transition-all",
                isHero ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2"
                  : "ring-1 ring-transparent hover:ring-muted-foreground/30"
              )}
            >
              {url ? (
                <Image
                  src={url}
                  alt={`Watch photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes={
                    isHero
                      ? "(max-width: 768px) 100vw, 50vw"
                      : "(max-width: 768px) 50vw, 25vw"
                  }
                  priority={isHero}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              )}
              {photo.is_cover && (
                <Badge className="absolute left-2 top-2 text-[10px]">Cover</Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions for selected photo */}
      {selectedPhoto && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Selected: Photo {photos.indexOf(selectedPhoto) + 1}
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLightboxIndex(photos.indexOf(selectedPhoto))}
          >
            <Maximize2 className="mr-1 h-3.5 w-3.5" /> Zoom
          </Button>
          {!selectedPhoto.is_cover && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleSetCover(selectedPhoto.id)}
            >
              Set as Cover
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the photo. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(selectedPhoto.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      {lightbox}
    </div>
  )
}

/** Small overlay button to open the lightbox; used on non-button image containers. */
function ZoomButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Zoom photo"
      title="Zoom"
      onClick={onClick}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 focus-visible:opacity-100 group-hover/photo:opacity-100"
    >
      <Maximize2 className="h-4 w-4" />
    </button>
  )
}
