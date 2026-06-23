"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react"

interface PhotoLightboxProps {
  /** Ordered signed URLs for the watch's photos. */
  urls: string[]
  /** Index of the photo to show. */
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

/**
 * Full-screen image viewer with zoom + pan. Works on desktop (wheel, drag,
 * double-click) and mobile (buttons, double-tap, touch-drag to pan).
 */
export function PhotoLightbox({ urls, index, onIndexChange, onClose }: PhotoLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const url = urls[index]
  const hasMultiple = urls.length > 1

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  const centerScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
  }, [])

  // Re-center whenever the zoom level changes so the image stays in view.
  useEffect(() => {
    centerScroll()
  }, [zoom, centerScroll])

  // Reset zoom when switching photos.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1)
  }, [index])

  const goPrev = useCallback(() => {
    if (urls.length < 2) return
    onIndexChange((index - 1 + urls.length) % urls.length)
  }, [index, urls.length, onIndexChange])

  const goNext = useCallback(() => {
    if (urls.length < 2) return
    onIndexChange((index + 1) % urls.length)
  }, [index, urls.length, onIndexChange])

  // Keyboard controls + lock body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
      else if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + 0.5))
      else if (e.key === "-") setZoom((z) => clampZoom(z - 0.5))
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, goPrev, goNext])

  // Wheel zoom (non-passive listener so we can preventDefault the page scroll).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      setZoom((z) => clampZoom(z - e.deltaY * 0.002))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  // Drag-to-pan (mouse only — touch devices pan via native scroll).
  const drag = useRef<{ x: number; y: number } | null>(null)
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || zoom <= 1) return
    drag.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !scrollRef.current) return
    scrollRef.current.scrollLeft -= e.clientX - drag.current.x
    scrollRef.current.scrollTop -= e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
  }
  function onPointerUp() {
    drag.current = null
  }

  function toggleZoom() {
    setZoom((z) => (z > 1 ? 1 : 2.5))
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 text-white">
        <span className="text-sm tabular-nums text-white/70">
          {hasMultiple ? `${index + 1} / ${urls.length}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <ToolbarButton label="Zoom out" onClick={() => setZoom((z) => clampZoom(z - 0.5))} disabled={zoom <= MIN_ZOOM}>
            <Minus className="h-5 w-5" />
          </ToolbarButton>
          <span className="w-12 text-center text-sm tabular-nums text-white/70">{Math.round(zoom * 100)}%</span>
          <ToolbarButton label="Zoom in" onClick={() => setZoom((z) => clampZoom(z + 0.5))} disabled={zoom >= MAX_ZOOM}>
            <Plus className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label="Reset zoom" onClick={() => setZoom(1)} disabled={zoom === 1}>
            <RotateCcw className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Image stage */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-auto overscroll-contain"
          style={{ cursor: zoom > 1 ? "grab" : "zoom-in", touchAction: "pan-x pan-y" }}
          onDoubleClick={toggleZoom}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            className="flex min-h-full min-w-full items-center justify-center"
            style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- full-res image needed for crisp zoom; next/image would downscale */}
            <img
              src={url}
              alt="Watch photo"
              draggable={false}
              className="max-h-full max-w-full object-contain select-none"
            />
          </div>
        </div>

        {/* Prev / Next */}
        {hasMultiple && (
          <>
            <NavButton side="left" onClick={goPrev} label="Previous photo">
              <ChevronLeft className="h-6 w-6" />
            </NavButton>
            <NavButton side="right" onClick={goNext} label="Next photo">
              <ChevronRight className="h-6 w-6" />
            </NavButton>
          </>
        )}
      </div>

      <p className="pb-3 text-center text-xs text-white/40">
        Double-click to zoom · drag or scroll to pan · Esc to close
      </p>
    </div>
  )
}

function ToolbarButton({
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
      className="flex h-9 w-9 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/15 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function NavButton({
  children,
  side,
  onClick,
  label,
}: {
  children: React.ReactNode
  side: "left" | "right"
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === "left" ? "left-2" : "right-2"
      } flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20`}
    >
      {children}
    </button>
  )
}
