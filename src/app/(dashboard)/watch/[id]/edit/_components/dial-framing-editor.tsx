"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateDialFraming } from "@/lib/actions/watch-actions"

interface DialFramingEditorProps {
  watchId: string
  coverPhotoUrl: string | null
  initialFocalX: number
  initialFocalY: number
  initialZoom: number
}

export function DialFramingEditor({
  watchId,
  coverPhotoUrl,
  initialFocalX,
  initialFocalY,
  initialZoom,
}: DialFramingEditorProps) {
  const [focalX, setFocalX] = useState(initialFocalX)
  const [focalY, setFocalY] = useState(initialFocalY)
  const [zoom, setZoom] = useState(initialZoom)
  const [isPending, startTransition] = useTransition()
  const photoRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const dirty =
    Math.abs(focalX - initialFocalX) > 0.05 ||
    Math.abs(focalY - initialFocalY) > 0.05 ||
    Math.abs(zoom - initialZoom) > 0.005

  if (!coverPhotoUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dial framing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Set a cover photo above, then come back to frame the dial for the home page.
        </CardContent>
      </Card>
    )
  }

  // Convert a pointer position to a focal point as a percentage of the image.
  // Because the editor shows the FULL image, these percentages map 1:1 to the
  // object-position used by the preview and the home-page dial marker.
  function setFocalFromPointer(clientX: number, clientY: number) {
    const el = photoRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    setFocalX(Math.max(0, Math.min(100, x)))
    setFocalY(Math.max(0, Math.min(100, y)))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true
    setFocalFromPointer(e.clientX, e.clientY)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // setPointerCapture can throw without an active pointer — non-fatal.
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    setFocalFromPointer(e.clientX, e.clientY)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  function handleReset() {
    setFocalX(50)
    setFocalY(50)
    setZoom(1)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateDialFraming(watchId, {
        dial_focal_x: Number(focalX.toFixed(2)),
        dial_focal_y: Number(focalY.toFixed(2)),
        dial_zoom: Number(zoom.toFixed(2)),
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Dial framing saved")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dial framing</CardTitle>
        <p className="text-xs text-muted-foreground">
          Drag the crosshair onto the part of the dial you want centered, then zoom
          to crop tight. The preview shows how it appears on the home-page watch face.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {/* Editor photo (full image) with draggable crosshair */}
          <div className="flex-1 space-y-1">
            <div
              ref={photoRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ touchAction: "none" }}
              className="relative w-full cursor-crosshair overflow-hidden rounded-md border bg-black select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- need natural aspect so the crosshair maps 1:1 to image coordinates */}
              <img
                src={coverPhotoUrl}
                alt="Cover"
                draggable={false}
                className="block w-full select-none"
              />
              {/* Crosshair / focal marker */}
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${focalX}%`, top: `${focalY}%` }}
              >
                <div className="h-6 w-6 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.6)]" />
                <div className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-white" />
                <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              focal {focalX.toFixed(0)}%, {focalY.toFixed(0)}%
            </p>
          </div>

          {/* Live 72px dial-marker preview */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative h-[72px] w-[72px] overflow-hidden rounded-full bg-black ring-2 ring-[oklch(0.85_0.03_85)] shadow-md"
              aria-label="Dial preview"
            >
              <Image
                src={coverPhotoUrl}
                alt="Dial preview"
                fill
                sizes="72px"
                className="object-cover"
                style={{
                  objectPosition: `${focalX}% ${focalY}%`,
                  transform: zoom > 1 ? `scale(${zoom})` : undefined,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">preview</p>
          </div>
        </div>

        {/* Zoom slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <label htmlFor="dial-zoom">Zoom</label>
            <span>{zoom.toFixed(2)}×</span>
          </div>
          <input
            id="dial-zoom"
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-foreground"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || isPending}
            size="sm"
          >
            {isPending ? "Saving…" : "Save framing"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            size="sm"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
