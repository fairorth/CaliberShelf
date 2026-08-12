"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Check, ChevronDown, Copy, ImageOff, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhotoDrop } from "@/components/photo-drop"
import { uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { ANGLE_LABELS, gradeForScore, PHOTO_ANGLES, watchFolderName } from "@/lib/photo-lab"
import type { PhotoAngle, WatchImageScore } from "@/lib/types/watch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/** localStorage key shared with Quick Capture (D3): the active session watch. */
export const SESSION_WATCH_KEY = "photo-lab-session-watch"

export type SessionFrame = Pick<
  WatchImageScore,
  "id" | "rel_path" | "composite_score" | "angle_class" | "stack_role" | "review_state"
>

interface SessionWatch {
  id: string
  brand: string
  model: string
  nickname: string | null
  coverUrl: string | null
}

interface SessionViewProps {
  watches: SessionWatch[]
  selected: SessionWatch | null
  imagesPath: string
  frames: SessionFrame[]
  angleCounts: Record<PhotoAngle, number>
  presetAngle: PhotoAngle | null
}

/** The C1 pre-flight, straight from docs/photo-lab.md — read-only. */
const C1_CHECKLIST: string[] = [
  "M mode · ISO 100 · f/8 · shutter to taste against the histogram",
  "Fixed white balance · RAW (.CR3) · electronic first curtain · single drive",
  "One-Shot AF, 1-point — subject detection / tracking / eye / Preview-AF all OFF",
  "Back-button AF (half-press = metering only; AF-ON = metering + AF)",
  "Lens operation when AF unavailable = Continue focus search",
  "RF100mm: focus limiter FULL · IS OFF on tripod · SA ring neutral + locked",
  "Overhead geometry: ~16–20″ sensor-to-watch, dial parallel, watch fills 70–80%",
  "EOS Utility destination = PC + card — verify with a test frame",
]

export function SessionView({
  watches,
  selected,
  imagesPath,
  frames,
  angleCounts,
  presetAngle,
}: SessionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Persist / resume the active session watch so Capture inherits it (D1/D3).
  useEffect(() => {
    if (selected) {
      localStorage.setItem(SESSION_WATCH_KEY, selected.id)
    } else if (!searchParams.get("watch")) {
      const stored = localStorage.getItem(SESSION_WATCH_KEY)
      if (stored && watches.some((w) => w.id === stored)) {
        router.replace(`/photo-lab/session?watch=${stored}`)
      }
    }
  }, [selected, searchParams, router, watches])

  function pick(id: string) {
    setPickerOpen(false)
    localStorage.setItem(SESSION_WATCH_KEY, id)
    router.push(`/photo-lab/session?watch=${id}`)
  }

  const folderPath =
    selected && imagesPath
      ? `${imagesPath.replace(/[\\/]+$/, "")}\\${watchFolderName(selected.brand, selected.model, selected.id)}`
      : null

  async function copyPath() {
    if (!folderPath) return
    try {
      await navigator.clipboard.writeText(folderPath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy — select and copy the path manually.")
    }
  }

  async function handlePhoneCaptures(files: File[]) {
    if (!selected) return
    setUploading(true)
    let ok = 0
    for (const file of files) {
      const fd = new FormData()
      fd.set("photo", file)
      try {
        const result = await uploadWatchPhoto(selected.id, fd)
        if (result.error) toast.error(`${file.name}: ${result.error}`)
        else ok++
      } catch {
        toast.error(`${file.name}: upload failed.`)
      }
    }
    if (ok > 0) toast.success(`${ok} frame${ok === 1 ? "" : "s"} uploaded`)
    setUploading(false)
  }

  // ── Watch picker (no session watch yet) ──────────────────────────
  if (!selected) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick the session watch. One watch, many frames — the folder-per-watch
          routing is the CaliberShelf linkage.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {watches.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => pick(w.id)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-brass/50"
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                {w.coverUrl ? (
                  <Image src={w.coverUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{w.brand}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {w.nickname || w.model}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-[22px] lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {/* Session watch header */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {selected.coverUrl ? (
              <Image src={selected.coverUrl} alt="" fill className="object-cover" sizes="48px" unoptimized />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {selected.brand}{" "}
              <span className="font-normal text-muted-foreground">
                {selected.nickname || selected.model}
              </span>
            </p>
            <p className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
              Session watch
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen((o) => !o)}>
            Change
          </Button>
          <Button
            size="sm"
            render={<Link href="/capture" />}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Open capture
          </Button>
        </div>

        {pickerOpen && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-3">
            {watches.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => pick(w.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors",
                  w.id === selected.id
                    ? "border-brass/50 bg-brass/10"
                    : "border-border hover:border-brass/40"
                )}
              >
                <span className="truncate">
                  {w.brand} {w.nickname || w.model}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* THE prominent element: the capture folder path (D1). */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            EOS Utility destination — point it here at session start
          </p>
          {folderPath ? (
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-surface-photo px-3 py-2.5 font-mono text-xs text-foreground">
                {folderPath}
              </code>
              <Button variant="outline" onClick={copyPath} className="shrink-0 gap-1.5">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-chart-2" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copy
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Watch Images folder configured — set it in Config → Settings, then run{" "}
              <code className="font-mono text-xs">npm run sync-watch-folders</code>.
            </p>
          )}
        </div>

        {/* Frames landed so far — scored capture-folder frames, newest first. */}
        <div className="space-y-2.5">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Frames landed · newest first
          </p>
          {frames.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Nothing scored yet for this watch — shoot, then run{" "}
              <code className="font-mono text-xs">npm run photo-score</code>.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {frames.map((f) => (
                <div
                  key={f.id}
                  className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border bg-surface-photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photo-lab/frame/${f.id}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {f.composite_score != null && (
                    <span className="absolute left-1 top-1 rounded-full bg-chart-2/18 px-1.5 py-px font-mono text-2xs text-chart-2 backdrop-blur">
                      {gradeForScore(f.composite_score)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phone captures — the shared uploader in multi-frame mode (A3). */}
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> Phone captures
          </p>
          <PhotoDrop
            multiple
            paste
            onFiles={(files) => void handlePhoneCaptures(files)}
            busy={uploading}
          />
        </div>
      </div>

      {/* Rail: target angles + the C1 pre-flight. */}
      <div className="space-y-3.5">
        <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Target angles
          </p>
          <div className="space-y-0">
            {PHOTO_ANGLES.map((a) => {
              const count = angleCounts[a]
              const isPreset = presetAngle === a
              return (
                <div
                  key={a}
                  className={cn(
                    "flex items-center justify-between border-b border-border/60 py-[9px] last:border-b-0",
                    isPreset && "-mx-2 rounded-lg border-b-0 bg-brass/10 px-2"
                  )}
                >
                  <span className={cn("text-xs", isPreset ? "font-medium text-brass" : "text-muted-foreground")}>
                    {ANGLE_LABELS[a]}
                    {isPreset && " · this session"}
                  </span>
                  {count > 0 ? (
                    <span className="flex h-[22px] items-center rounded-full bg-secondary px-2 font-mono text-2xs text-muted-foreground">
                      {count}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed font-mono text-2xs",
                        isPreset ? "border-brass/60 text-brass" : "border-border text-muted-foreground"
                      )}
                    >
                      0
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer select-none items-center justify-between p-4 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            C1 pre-flight · docs/photo-lab.md
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ul className="space-y-0 px-4 pb-4">
            {C1_CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 py-[9px] text-xs leading-relaxed text-muted-foreground last:border-b-0"
              >
                {item}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
