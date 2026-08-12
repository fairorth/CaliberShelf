"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  uploadInspirationImage,
  updateInspirationNote,
  deleteInspirationImage,
} from "@/lib/actions/inspiration-actions"
import { INSPIRATION_NOTE_MAX } from "@/lib/validations/inspiration"
import { toast } from "sonner"
import type { InspirationImageWithUrls } from "@/lib/types/inspiration"

interface InspirationGalleryProps {
  images: InspirationImageWithUrls[]
}

/** One tile: image, inline note editor, delete — masonry-friendly. */
function GalleryTile({
  image,
  onOpen,
  disabled,
}: {
  image: InspirationImageWithUrls
  onOpen: () => void
  disabled: boolean
}) {
  const [note, setNote] = useState(image.note ?? "")
  const [isPending, startTransition] = useTransition()
  const savedNote = useRef(image.note ?? "")

  function saveNote() {
    const next = note.trim()
    if (next === savedNote.current) return
    startTransition(async () => {
      const result = await updateInspirationNote(image.id, next)
      if (result.error) {
        toast.error(result.error)
        setNote(savedNote.current)
      } else {
        savedNote.current = next
      }
    })
  }

  function handleDelete() {
    if (!confirm("Remove this image from the gallery?")) return
    startTransition(async () => {
      const result = await deleteInspirationImage(image.id)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <figure className="group mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in"
        title="View full size"
      >
        {image.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.thumb_url}
            alt={image.note ?? "Inspiration image"}
            loading="lazy"
            className="w-full transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-muted text-lg opacity-40">
            🖼️
          </div>
        )}
      </button>
      <figcaption className="flex items-center gap-1.5 px-2.5 py-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
          }}
          maxLength={INSPIRATION_NOTE_MAX}
          placeholder="Add a note…"
          disabled={disabled || isPending}
          className="h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-border focus:border-ring"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled || isPending}
          title="Delete image"
          className="shrink-0 rounded p-1 text-xs opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
        >
          🗑️
        </button>
      </figcaption>
    </figure>
  )
}

export function InspirationGallery({ images }: InspirationGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, startUpload] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<InspirationImageWithUrls | null>(null)

  const uploadFile = useCallback((file: File) => {
    setPreview(URL.createObjectURL(file))
    const formData = new FormData()
    formData.set("image", file)
    startUpload(async () => {
      try {
        const result = await uploadInspirationImage(formData)
        if (result.error) toast.error(result.error)
        else toast.success("Added to the gallery!")
      } catch {
        toast.error("Upload failed. The image may be too large — try a smaller one.")
      }
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    })
  }, [])

  // Paste-to-upload — the primary way in. Image clipboard items only, so
  // pasting text into the note inputs is untouched.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (isUploading) return
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      )
      const pasted = item?.getAsFile()
      if (pasted) {
        e.preventDefault()
        uploadFile(pasted)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [isUploading, uploadFile])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
          }}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading…" : "Upload Image"}
        </Button>
        <p className="font-mono text-2xs text-muted-foreground">
          or paste a copied image (Ctrl+V)
        </p>
      </div>

      {images.length === 0 && !preview ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <span className="text-5xl">📸</span>
          <h3 className="mt-4 text-md font-semibold">Nothing pinned yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            See a watch photo that makes you stop scrolling? Copy it and paste it
            here — build the board your photo lab aspires to.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {preview && (
            <figure className="relative mb-4 break-inside-avoid overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Upload preview" className="w-full opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </figure>
          )}
          {images.map((img) => (
            <GalleryTile
              key={img.id}
              image={img}
              onOpen={() => setLightbox(img)}
              disabled={isUploading}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {lightbox?.note ?? "Inspiration image"}
          </DialogTitle>
          {lightbox?.full_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.full_url}
              alt={lightbox.note ?? "Inspiration image"}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
          )}
          {lightbox?.note && (
            <p className="rounded-lg bg-background/85 px-3 py-1.5 text-center text-sm backdrop-blur">
              {lightbox.note}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
