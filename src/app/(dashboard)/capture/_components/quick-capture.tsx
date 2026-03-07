"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"
import type { WatchWithCover } from "@/lib/types/watch"

interface QuickCaptureProps {
  watches: WatchWithCover[]
}

type Step = "capture" | "select" | "confirm"

export function QuickCapture({ watches }: QuickCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("capture")
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedWatch, setSelectedWatch] = useState<WatchWithCover | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const [uploadedWatchId, setUploadedWatchId] = useState<string | null>(null)

  function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStep("select")
  }

  function handleSelectWatch(watch: WatchWithCover) {
    setSelectedWatch(watch)
    setStep("confirm")
  }

  function handleBack() {
    if (step === "confirm") {
      setSelectedWatch(null)
      setStep("select")
    } else if (step === "select") {
      setCapturedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setStep("capture")
    }
  }

  function handleUpload() {
    if (!capturedFile || !selectedWatch) return

    const formData = new FormData()
    formData.set("photo", capturedFile)

    startTransition(async () => {
      try {
        const result = await uploadWatchPhoto(selectedWatch.id, formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Photo uploaded!")
          setUploadedWatchId(selectedWatch.id)
          // Clean up
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setCapturedFile(null)
          setPreviewUrl(null)
          setSelectedWatch(null)
          setStep("capture")
        }
      } catch {
        toast.error("Upload failed. The photo may be too large — try a smaller image.")
      }
    })
  }

  function handleTakeAnother() {
    setUploadedWatchId(null)
    setStep("capture")
  }

  // Filter watches by search query
  const filteredWatches = watches.filter((w) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      w.model.toLowerCase().includes(q) ||
      w.brand.name.toLowerCase().includes(q) ||
      (w.reference_number?.toLowerCase().includes(q) ?? false)
    )
  })

  // Success state after upload
  if (uploadedWatchId) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="text-5xl">✅</div>
        <p className="text-lg font-medium">Photo uploaded successfully!</p>
        <div className="flex gap-3">
          <Button onClick={handleTakeAnother}>Take Another</Button>
          <Button variant="outline" render={<Link href={`/watch/${uploadedWatchId}`} />}>
            View Watch
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileCapture}
        className="hidden"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={step === "capture" ? "font-bold text-foreground" : ""}>
          1. Capture
        </span>
        <span>→</span>
        <span className={step === "select" ? "font-bold text-foreground" : ""}>
          2. Select Watch
        </span>
        <span>→</span>
        <span className={step === "confirm" ? "font-bold text-foreground" : ""}>
          3. Upload
        </span>
      </div>

      {/* Step 1: Capture */}
      {step === "capture" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-5xl transition-transform active:scale-95"
            aria-label="Take photo"
          >
            📷
          </button>
          <p className="text-sm text-muted-foreground">
            Tap to take a photo with your camera
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => galleryInputRef.current?.click()}
          >
            Or choose from gallery
          </Button>
        </div>
      )}

      {/* Step 2: Select Watch */}
      {step === "select" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              ← Back
            </Button>
            <span className="text-sm font-medium">Select a watch for this photo</span>
          </div>

          {/* Preview thumbnail */}
          {previewUrl && (
            <div className="flex justify-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Search */}
          <Input
            placeholder="Search by brand, model, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11"
          />

          {/* Watch grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredWatches.map((watch) => (
              <button
                key={watch.id}
                type="button"
                onClick={() => handleSelectWatch(watch)}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent active:bg-accent min-h-[88px]"
              >
                {watch.cover_photo_url ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-md">
                    <Image
                      src={watch.cover_photo_url}
                      alt={watch.model}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg">
                    ⌚
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-medium leading-tight line-clamp-1">
                    {watch.brand.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight line-clamp-1">
                    {watch.model}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filteredWatches.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No watches match your search.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Confirm & Upload */}
      {step === "confirm" && selectedWatch && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              ← Back
            </Button>
            <span className="text-sm font-medium">Confirm upload</span>
          </div>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              {/* Photo preview */}
              {previewUrl && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Captured"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Watch info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{selectedWatch.brand.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {selectedWatch.model}
                </p>
                {selectedWatch.reference_number && (
                  <p className="text-xs text-muted-foreground">
                    Ref: {selectedWatch.reference_number}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Uploading..." : "Upload Photo"}
            </Button>
            <Button variant="outline" onClick={handleBack} disabled={isPending}>
              Change Watch
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
