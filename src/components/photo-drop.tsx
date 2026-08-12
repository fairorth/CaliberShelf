"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downscaleImage, PHOTO_ACCEPT } from "@/lib/images"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Touch detection via useSyncExternalStore (no setState-in-effect needed).
const noopSubscribe = () => () => {}
const getTouchSnapshot = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0
const getTouchServerSnapshot = () => false

interface PhotoDropProps {
  /** Receives files already downscaled (2000px long edge, JPEG 0.85). */
  onFiles: (files: File[]) => void
  multiple?: boolean
  /** Listen for paste-from-clipboard anywhere on the page. */
  paste?: boolean
  /** Offer a rear-camera capture button on touch devices. */
  capture?: boolean
  disabled?: boolean
  /** Consumer is uploading — shows the label and blocks new picks. */
  busy?: boolean
  busyLabel?: string
  /** Main dropzone line; a sensible default mentions browse/drag/paste. */
  label?: React.ReactNode
  className?: string
}

/**
 * THE upload surface (A3): drag-and-drop, click-to-browse, paste, camera
 * capture on touch, multi-file, client-side downscaling on every path, and
 * error toasts — one component for every photo entry point in the app.
 */
export function PhotoDrop({
  onFiles,
  multiple = false,
  paste = false,
  capture = true,
  disabled = false,
  busy = false,
  busyLabel = "Uploading…",
  label,
  className,
}: PhotoDropProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const isTouch = useSyncExternalStore(noopSubscribe, getTouchSnapshot, getTouchServerSnapshot)

  const blocked = disabled || busy || processing

  const acceptFiles = useCallback(
    async (incoming: FileList | File[] | null | undefined) => {
      if (!incoming || blocked) return
      const images = Array.from(incoming).filter((f) => f.type.startsWith("image/"))
      if (images.length === 0) {
        toast.error("That file isn't an image.")
        return
      }
      const picked = multiple ? images : images.slice(0, 1)
      setProcessing(true)
      try {
        const prepared: File[] = []
        for (const file of picked) {
          prepared.push(await downscaleImage(file))
        }
        onFiles(prepared)
      } finally {
        setProcessing(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (cameraInputRef.current) cameraInputRef.current.value = ""
      }
    },
    [blocked, multiple, onFiles]
  )

  // Paste-from-clipboard (opt-in). Image items only — text pastes into form
  // fields are untouched.
  useEffect(() => {
    if (!paste) return
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []).filter((i) =>
        i.type.startsWith("image/")
      )
      const files = items
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null)
      if (files.length > 0) {
        e.preventDefault()
        void acceptFiles(files)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [paste, acceptFiles])

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple={multiple}
        onChange={(e) => void acceptFiles(e.target.files)}
        className="hidden"
        disabled={blocked}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        capture="environment"
        onChange={(e) => void acceptFiles(e.target.files)}
        className="hidden"
        disabled={blocked}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={blocked}
        onDragOver={(e) => {
          e.preventDefault()
          if (!blocked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void acceptFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-6 text-center transition-colors disabled:opacity-60",
          dragging ? "border-brass/60" : "border-border hover:border-brass/50"
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Upload className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-sm text-foreground">
          {busy ? (
            busyLabel
          ) : processing ? (
            "Optimizing photo…"
          ) : (
            label ?? (
              <>
                <span className="font-medium">Browse</span>, drag
                {paste ? ", or paste" : ""} {multiple ? "photos" : "a photo"} here
              </>
            )
          )}
        </span>
        <span className="font-mono text-2xs text-muted-foreground">
          JPG, PNG, HEIC or WebP
        </span>
      </button>

      {capture && isTouch && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-1.5"
          disabled={blocked}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Take photo
        </Button>
      )}
    </div>
  )
}
