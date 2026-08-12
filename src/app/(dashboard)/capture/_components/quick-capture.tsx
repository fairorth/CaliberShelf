"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, ImageOff, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhotoDrop } from "@/components/photo-drop"
import { deleteWatchPhoto, uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { downscaleImage, PHOTO_ACCEPT } from "@/lib/images"
import { SESSION_WATCH_KEY } from "@/app/(dashboard)/photo-lab/session/_components/session-view"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { WatchWithCover } from "@/lib/types/watch"

interface QuickCaptureProps {
  watches: WatchWithCover[]
}

type StripStatus = "uploading" | "done" | "error" | "removed"

interface StripFrame {
  localId: string
  previewUrl: string
  status: StripStatus
  photoId?: string
}

/**
 * Quick Capture, watch-first (D3): choose the watch once — or inherit the
 * Photo Lab session watch — then shoot repeatedly. Every frame lands in the
 * filmstrip immediately with an undo; uploads run in the background.
 */
export function QuickCapture({ watches }: QuickCaptureProps) {
  const owned = watches
  const [watchId, setWatchId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [strip, setStrip] = useState<StripFrame[]>([])
  const [changing, setChanging] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Inherit the Photo Lab's active session watch (D1/D3).
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_WATCH_KEY)
    if (stored && owned.some((w) => w.id === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from a client-only store
      setWatchId((prev) => prev ?? stored)
    }
  }, [owned])

  const watch = watchId ? (owned.find((w) => w.id === watchId) ?? null) : null

  function selectWatch(id: string) {
    setWatchId(id)
    setChanging(false)
    localStorage.setItem(SESSION_WATCH_KEY, id)
  }

  function updateFrame(localId: string, patch: Partial<StripFrame>) {
    setStrip((prev) => prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f)))
  }

  /** Frames appear in the strip immediately; uploads run behind them. */
  function handleFiles(files: File[]) {
    if (!watch) return
    for (const file of files) {
      const localId = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setStrip((prev) => [{ localId, previewUrl, status: "uploading" }, ...prev])
      void (async () => {
        const fd = new FormData()
        fd.set("photo", file)
        try {
          const result = await uploadWatchPhoto(watch.id, fd)
          if (result.error || !result.photoId) {
            updateFrame(localId, { status: "error" })
            toast.error(result.error ?? "Upload failed.")
          } else {
            updateFrame(localId, { status: "done", photoId: result.photoId })
          }
        } catch {
          updateFrame(localId, { status: "error" })
          toast.error("Upload failed — the photo may be too large.")
        }
      })()
    }
  }

  /** Camera input (the shutter) bypasses the dropzone for speed. */
  async function handleShutter(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const prepared = await downscaleImage(file)
    handleFiles([prepared])
  }

  function undo(frame: StripFrame) {
    if (!watch || !frame.photoId) return
    updateFrame(frame.localId, { status: "removed" })
    void (async () => {
      const result = await deleteWatchPhoto(frame.photoId!, watch.id)
      if (result.error) {
        toast.error(result.error)
        updateFrame(frame.localId, { status: "done" })
      }
    })()
  }

  const filteredWatches = owned.filter((w) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      w.model.toLowerCase().includes(q) ||
      w.brand.name.toLowerCase().includes(q) ||
      (w.reference_number?.toLowerCase().includes(q) ?? false)
    )
  })

  // ── Step 0 (once): choose the watch ─────────────────────────────
  if (!watch || changing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the watch first — then shoot as many frames as the session needs.
        </p>
        <Input
          placeholder="Search by brand, model, or reference…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredWatches.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => selectWatch(w.id)}
              className="flex min-h-[88px] flex-col items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent active:bg-accent"
            >
              {w.cover_photo_url ? (
                <span className="relative h-12 w-12 overflow-hidden rounded-lg">
                  <Image src={w.cover_photo_url} alt={w.model} fill className="object-cover" sizes="48px" unoptimized />
                </span>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ImageOff className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <span className="text-center">
                <span className="line-clamp-1 block text-xs font-medium leading-tight">
                  {w.brand.name}
                </span>
                <span className="line-clamp-1 block text-xs leading-tight text-muted-foreground">
                  {w.model}
                </span>
              </span>
            </button>
          ))}
        </div>
        {filteredWatches.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No watches match your search.
          </p>
        )}
      </div>
    )
  }

  const activeFrames = strip.filter((f) => f.status !== "removed")

  return (
    <div className="space-y-4">
      {/* Persistent session-watch header */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
          {watch.cover_photo_url ? (
            <Image src={watch.cover_photo_url} alt="" fill className="object-cover" sizes="44px" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{watch.brand.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {watch.nickname || watch.model}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
          Change
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/photo-lab/session?watch=${watch.id}`} />}
        >
          Session
        </Button>
      </div>

      {/* The shutter — a real control, camera-first on touch devices. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        capture="environment"
        onChange={(e) => void handleShutter(e)}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          aria-label="Take photo"
          className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-brass bg-brass/10 text-brass transition-transform active:scale-95"
        >
          <Camera className="h-9 w-9" aria-hidden="true" />
        </button>
        <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
          Shutter · frames upload in the background
        </p>
      </div>

      {/* Filmstrip — instant feedback, undo per frame (D3). */}
      {activeFrames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeFrames.map((f) => (
            <div
              key={f.localId}
              className={cn(
                "relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-lg border bg-surface-photo",
                f.status === "error" ? "border-destructive" : "border-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
              {f.status === "uploading" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              )}
              {f.status === "done" && (
                <button
                  type="button"
                  onClick={() => undo(f)}
                  aria-label="Undo upload"
                  title="Undo"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-destructive"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Multi-select from the gallery — the shared component (A3/D3). */}
      <PhotoDrop multiple capture={false} onFiles={handleFiles} />
    </div>
  )
}
