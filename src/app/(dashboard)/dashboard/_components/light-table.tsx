"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Aperture,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  MousePointer2,
  Plus,
  Search,
} from "lucide-react"
import { Mark } from "@/components/brand/logo"
import { ANGLE_HEADINGS, ANGLE_LABELS, PHOTO_ANGLES } from "@/lib/photo-lab"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DEFAULT_GLANCE_DELAY_SECONDS,
  DEFAULT_GLANCE_ENABLED,
  DEFAULT_HERO_DWELL_SECONDS,
  HOME_ROTATION_SET_KEY,
  readGlanceDelaySeconds,
  readGlanceEnabled,
  readHeroDwellSeconds,
  readHomeRotationSet,
} from "@/lib/preferences"
import { cn } from "@/lib/utils"
import type {
  LightTableFrame,
  LightTableStats,
  LightTableWatch,
  RotationSet,
} from "@/lib/queries/light-table"

interface LightTableProps {
  /** All rotation sets, prefetched in one pass — switching needs no network. */
  sets: RotationSet[]
  /** Server-generated seed for the rotation shuffle (step 5). */
  seed: number
  stats: LightTableStats
}

/** Ring geometry (viewBox 36): r=15 → circumference ~94.25 (the mock's value). */
const RING_CIRCUMFERENCE = 94.25

/** Loupe (§2.2): 168px circular window at 2.4× — the mock's defaults. */
const LOUPE_SIZE = 168
const LOUPE_ZOOM = 2.4

/** Contact-sheet grid columns — arrow-key stepping needs the row width. */
const GRID_COLS = 3

/** One timer owns both the ring and the advance (§2.3) — a CSS animation plus
 *  a JS timer drift apart, and the ring is the dwell's only honest readout. */
const TICK_MS = 200

/** Seeded PRNG (mulberry32), lifted from watch-hero: deterministic so SSR and
 *  hydration agree while each page load still gets a different order. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWith<T>(arr: T[], rng: () => number): T[] {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** The shot-list sentence counts in words, and the count can only be 1–5. */
const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five"]

/** "14 Mar 2024" — deterministic (no Date/locale) so SSR and hydration agree. */
function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${String(Number(d)).padStart(2, "0")} ${MONTHS[Number(m) - 1]} ${y}`
}

/**
 * "today" · "yesterday" · "12 days ago" · "3 months ago" · "a year ago".
 * Null until the clock mounts, so SSR and hydration render the same markup
 * (the `now`-after-mount pattern). One formatter for both the ACQUIRED age
 * and LAST WORN — extended for months and years rather than duplicated.
 */
function relativeAge(iso: string, now: Date | null): string | null {
  if (!now) return null
  const days = Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso + "T00:00:00").getTime()) / 86_400_000)
  )
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30.44)
  if (months < 12) return months === 1 ? "a month ago" : `${months} months ago`
  const years = Math.floor(days / 365.25)
  return years === 1 ? "a year ago" : `${years} years ago`
}

/** LAST WORN: the relative age once mounted, the plain date before that. */
function wornLabel(iso: string, now: Date | null): string {
  return relativeAge(iso, now) ?? formatDay(iso)
}

/** "M79030N-0001 · MT5402 · 39MM" — whatever exists, in that order. */
function specLine(w: LightTableWatch): string {
  return [
    w.referenceNumber?.toUpperCase(),
    w.caliberLine?.toUpperCase(),
    w.caseDiameterMm != null ? `${w.caseDiameterMm}MM` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

const EYEBROW = "font-mono text-2xs tracking-[0.14em] text-muted-foreground"

/**
 * The photograph and the field it sits on — the ONE definition of the bloom
 * (Phase 7 §1.1), rendered by both the stage and the glance overlay.
 *
 * The sharp frame stays `object-contain` in every variant: the letterbox is
 * filled by a blurred copy of the image behind it, never by cropping the
 * photograph. That prohibition is why Phase 6 exists.
 *
 * Renders as absolutely-positioned layers, so the caller owns the box (and its
 * size, radius, pointer handlers and chrome) while this owns the picture.
 */
function FrameField({
  frame,
  alt,
  variant,
  dwellSeconds,
  reducedMotion,
}: {
  frame: LightTableFrame
  alt: string
  variant: "stage" | "glance"
  /** Drift runs one pass across the dwell, restarted per frame by the key. */
  dwellSeconds: number
  reducedMotion: boolean
}) {
  const glance = variant === "glance"

  // Retry state lives here so the component is self-contained; keyed by url,
  // so rotating to another frame resets the count without an effect.
  const [load, setLoad] = useState<{ url: string; failures: number }>({
    url: "",
    failures: 0,
  })
  const failures = load.url === frame.url ? load.failures : 0

  return (
    <>
      {/* Bloom — the thumb, not the full frame: a 34px blur destroys all
          detail, so the large render would buy nothing and cost a big GPU
          filter. Overscaled so the blur's soft edge never shows a rim.
          No will-change: a permanently promoted blurred layer is what cooks a
          laptop over an eight-hour day. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a plain img is
          the right element here: next/image would either take `priority` (and
          compete with the sharp frame for LCP) or lazy-load, and a lazy image
          never loads in a not-yet-painted tab, which would drop the bloom back
          to grey. Eager + fetchPriority=low is exactly the behaviour wanted,
          and the source is a 192px thumb. */}
      <img
        src={frame.thumbUrl}
        alt=""
        aria-hidden
        fetchPriority="low"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          filter: glance ? "blur(46px) saturate(1.6)" : "blur(34px) saturate(1.5)",
          opacity: glance ? 0.9 : 0.85,
          // Reduced motion keeps the field and drops the drift — the bloom is
          // colour, not motion. The static overscale stays either way.
          transform: reducedMotion ? "scale(1.3)" : undefined,
          animation: reducedMotion
            ? undefined
            : `lt-bloom-drift ${dwellSeconds * 2}s ease-in-out infinite alternate`,
        }}
      />
      {/* Scrim — keeps the sharp frame on a darker field than its own bloom so
          the caption stays legible over any photograph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: glance
            ? "radial-gradient(110% 85% at 50% 42%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.62) 100%)"
            : "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.52) 100%)",
        }}
      />

      {failures >= 2 ? (
        <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-white/80">
          This frame didn&rsquo;t load. It is still being prepared — the next
          visit will have it.
        </span>
      ) : (
        <Image
          // The retry remounts the element, re-requesting the same signed URL
          // once the cold Supabase transform has had time to finish.
          key={`${frame.url}#${failures}`}
          src={frame.url}
          alt={alt}
          fill
          unoptimized
          // The stage frame is the page's LCP element and the whole point of
          // the screen — never lazy. The glance copy is not: it mounts after a
          // minute of idling and must not compete for the initial load.
          priority={!glance}
          sizes={glance ? "100vw" : "480px"}
          className={cn(
            "object-contain",
            // Glance insets the photograph to leave the caption bar its room.
            glance && "!top-[26px] !bottom-[96px] !h-auto max-h-[calc(100%-122px)]"
          )}
          style={
            reducedMotion
              ? undefined
              : {
                  // One fade-in, then the slow drift. Both restart with the
                  // key above, so every frame gets exactly one forward pass.
                  animation: `lt-fade-in 600ms ease-out both, lt-drift ${dwellSeconds}s ease-in-out infinite alternate`,
                }
          }
          onError={() => {
            const url = frame.url
            setTimeout(() => {
              setLoad((prev) =>
                prev.url === url
                  ? { url, failures: prev.failures + 1 }
                  : { url, failures: 1 }
              )
            }, 1200)
          }}
        />
      )}
    </>
  )
}

/** One row of the ROTATION menu: name, both counts, brass check when active. */
function SetItem({
  set,
  active,
  onChoose,
}: {
  set: RotationSet
  active: boolean
  onChoose: (id: string) => void
}) {
  return (
    <DropdownMenuItem
      onClick={() => onChoose(set.id)}
      className="flex items-start gap-2"
    >
      <Check
        className={cn("mt-0.5 size-4 flex-none text-brass", !active && "opacity-0")}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{set.label}</span>
        <span className="block font-mono text-2xs text-muted-foreground">
          {set.total} {set.isGuide ? "chapters" : "watches"} · {set.withFrames} with
          frames
        </span>
      </span>
    </DropdownMenuItem>
  )
}

export function LightTable({ sets, seed, stats }: LightTableProps) {
  // The active set, persisted per device. Read after mount (never during SSR,
  // the DISPLAY_BOX_HOME_KEY pattern); an unknown id falls back to "all", and
  // a known-but-frameless set falls back below with a one-line explanation.
  const [requestedSetId, setRequestedSetId] = useState<string>("all")
  useEffect(() => {
    const saved = readHomeRotationSet()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only preference
    if (saved && sets.some((s) => s.id === saved)) setRequestedSetId(saved)
  }, [sets])

  function chooseSet(id: string) {
    setRequestedSetId(id)
    setWatchIdx(0)
    setFrameIdx(0)
    resetElapsed()
    try {
      localStorage.setItem(HOME_ROTATION_SET_KEY, id)
    } catch {
      // Storage unavailable — the choice simply doesn't outlive the session.
    }
  }

  const requested = sets.find((s) => s.id === requestedSetId)
  const fallback = sets.find((s) => s.id === "all")
  const set =
    requested && requested.watches.length > 0
      ? requested
      : fallback && fallback.watches.length > 0
        ? fallback
        : null
  const fellBack = requested != null && set != null && set.id !== requested.id

  const [watchIdx, setWatchIdx] = useState(0)
  const [frameIdx, setFrameIdx] = useState(0)

  // Per-device dwell — readHeroDwellSeconds() is THE dwell preference; the
  // status label shows it, the rotation (step 5) consumes it.
  const [dwellSeconds, setDwellSeconds] = useState(DEFAULT_HERO_DWELL_SECONDS)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only preference
    setDwellSeconds(readHeroDwellSeconds())
  }, [])

  // Clock for the relative LAST WORN label — null until mounted so SSR and
  // hydration agree (the watch-hero pattern).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock mounts client-only so SSR and hydration agree
    setNow(new Date())
  }, [])

  // prefers-reduced-motion freezes the whole stage (lifted from watch-hero):
  // no auto-advance, no ring sweep, no loupe.
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only media query
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // The loupe is hover furniture — on touch (`hover: none`) it would fight
  // scrolling, so it never mounts there; tapping a thumbnail is the touch
  // equivalent (§2.2).
  const [canHover, setCanHover] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only media query
    setCanHover(window.matchMedia("(hover: hover)").matches)
  }, [])

  // Loupe position: px offsets for placement, fractional for background-position.
  const [loupe, setLoupe] = useState<{
    x: number
    y: number
    fx: number
    fy: number
  } | null>(null)
  const loupeEnabled = canHover && !reducedMotion

  // Roving tabindex for the contact-sheet grid — one Tab stop, arrows within.
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([])
  function moveGridFocus(from: number, delta: number) {
    const n = frames.length
    if (n === 0) return
    const next = Math.min(n - 1, Math.max(0, from + delta))
    tileRefs.current[next]?.focus()
  }

  // Deterministic per-load order: the server seed makes SSR and hydration
  // agree, and re-seeding per set keeps each queue's order stable while you
  // switch back and forth.
  const queue = useMemo(() => {
    const watches = set?.watches ?? []
    if (watches.length < 2) return watches
    return shuffleWith(watches, mulberry32(Math.floor(seed * 0xffffffff)))
  }, [set, seed])

  const watch = queue.length > 0 ? queue[watchIdx % queue.length] : null
  const frames = watch?.frames ?? []
  const frame = frames.length > 0 ? frames[Math.min(frameIdx, frames.length - 1)] : null

  function stepWatch(delta: number) {
    if (queue.length < 2) return
    setWatchIdx((i) => (i + delta + queue.length) % queue.length)
    setFrameIdx(0)
    resetElapsed()
  }

  // ── Glance mode (Phase 7 §2) ─────────────────────────────────
  // Per-device preferences, read after mount like every other one here.
  const [glanceEnabled, setGlanceEnabled] = useState(DEFAULT_GLANCE_ENABLED)
  const [glanceDelay, setGlanceDelay] = useState(DEFAULT_GLANCE_DELAY_SECONDS)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to client-only preferences
    setGlanceEnabled(readGlanceEnabled())
    setGlanceDelay(readGlanceDelaySeconds())
  }, [])

  const [glance, setGlance] = useState(false)
  const glanceActive = glance && glanceEnabled

  // The idle timer is armed and reset by REAL INPUT ONLY. Deliberately not
  // keyed to the rotation's own state: re-arming on every advance would mean
  // a dwell shorter than the delay could never let it fire (§2.3).
  useEffect(() => {
    if (!glanceEnabled) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const arm = () => {
      if (timer) clearTimeout(timer)
      // Never engage on a hidden tab — there is nobody to glance at it.
      if (document.hidden) return
      timer = setTimeout(() => setGlance(true), glanceDelay * 1000)
    }
    const onInput = () => {
      // Functional bail-out: a pointermove while already awake must not
      // re-render, or every mouse twitch repaints the stage.
      setGlance((g) => (g ? false : g))
      arm()
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer)
      } else {
        arm()
      }
    }
    const EVENTS = [
      "pointermove",
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
    ] as const
    for (const type of EVENTS) {
      document.addEventListener(type, onInput, { passive: true })
    }
    document.addEventListener("visibilitychange", onVisibility)
    arm()
    return () => {
      if (timer) clearTimeout(timer)
      for (const type of EVENTS) document.removeEventListener(type, onInput)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [glanceEnabled, glanceDelay])

  // ── Rotation (§2.3) ──────────────────────────────────────────
  // Hovering the stage pauses, as does an open ROTATION menu; reduced motion
  // and a single-watch queue stop it outright.
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  /** Restart the dwell — both the ref the tick reads and the painted ring. */
  function resetElapsed() {
    elapsedRef.current = 0
    setElapsed(0)
  }

  const dwellMs = dwellSeconds * 1000
  const canRotate = queue.length > 1 && !reducedMotion
  // §2.3, the bug worth naming: if the pointer happens to be resting on the
  // stage when glance mode engages, `hovered` stays true forever and the
  // ambient screen sits on one watch all day looking broken. Glance mode is
  // the one state where hover does not pause.
  const paused = (hovered && !glanceActive) || menuOpen
  const running = canRotate && !paused

  // Refs so the interval never needs re-creating (and so a paused tick is a
  // no-op rather than a torn-down timer that loses its accumulated elapsed).
  const runningRef = useRef(running)
  const dwellRef = useRef(dwellMs)
  const queueLenRef = useRef(queue.length)
  // Elapsed lives in a ref as well as state: the ref is what the tick reads
  // and writes, the state exists only to repaint the ring. Advancing from
  // inside a setElapsed updater instead would nest one state update in
  // another's updater — updaters must be pure, and React discards the work,
  // which froze the ring and stalled the advance the first time this shipped.
  const elapsedRef = useRef(0)
  useEffect(() => {
    runningRef.current = running
    dwellRef.current = dwellMs
    queueLenRef.current = queue.length
  }, [running, dwellMs, queue.length])

  useEffect(() => {
    if (!canRotate) return
    // Accumulate REAL time, not tick counts: a background tab clamps timers to
    // ~1Hz, so counting 200ms per tick would stretch a 30s dwell to 150s and
    // the ring would lie about how much of it is left.
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const delta = now - last
      last = now
      if (!runningRef.current) return
      elapsedRef.current += delta
      if (elapsedRef.current >= dwellRef.current) {
        elapsedRef.current = 0
        setWatchIdx((i) => (i + 1) % Math.max(1, queueLenRef.current))
        setFrameIdx(0)
      }
      setElapsed(elapsedRef.current)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [canRotate])

  // Ring sweep: elapsed/dwell as stroke-dashoffset. Frozen at empty when the
  // rotation cannot run, so a still ring never implies a running timer.
  const progress = canRotate ? Math.min(1, elapsed / dwellMs) : 0
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress)

  if (!set || !watch || !frame) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing on the table yet. Add photos to a watch — or import a capture
          session in the{" "}
          <Link href="/photo-lab" className="font-medium text-primary underline">
            Photo Lab
          </Link>{" "}
          — and the light table lights up.
        </p>
      </div>
    )
  }

  const watchName = `${watch.brandName} ${watch.model}`.trim()
  // §1.4 — nulls become invitations, on owned watches only.
  const neverWorn = !watch.isWishlist && watch.wearCount === 0
  const acquiredAge = watch.purchaseDate ? relativeAge(watch.purchaseDate, now) : null

  // §1.5 — the angles this watch has no frame for, in the canonical order.
  // Derived from the frames themselves, so the cells can never disagree with
  // the thumbnails beside them.
  const shotAngles = new Set(frames.map((f) => f.angle).filter(Boolean))
  const missingAngles = PHOTO_ANGLES.filter((a) => !shotAngles.has(a))
  const shotListLine =
    missingAngles.length === 1
      ? "One angle still to shoot — the empty cell is the shot list, not a hole in the layout."
      : `${COUNT_WORDS[missingAngles.length] ?? missingAngles.length} angles still to shoot — the empty cells are the shot list, not a hole in the layout.`
  const caption = `${frame.angle ? frame.angle.toUpperCase() : "UNTAGGED FRAME"} · ${watchName.toUpperCase()}`
  const scoreLabel =
    frame.score != null
      ? `SCORE ${Math.round(frame.score)}`
      : watch.isWishlist
        ? "REFERENCE"
        : null

  return (
    <>
    <div
      role="group"
      aria-label="Light table — hover to pause, arrow keys to step"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={(e) => {
        // The contact sheet stops arrow events it consumes, so these only
        // fire when focus is outside the grid.
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          stepWatch(-1)
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          stepWatch(1)
        }
      }}
      className="w-full max-w-[1080px] space-y-3.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {/* ── Header: title + eyebrow, ROTATION control (§2.1) ── */}
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-display text-lg font-semibold tracking-tight">
            On the table
          </h1>
          <p className={EYEBROW}>
            <span className="text-brass">{set.displayName}</span>
            <span> · </span>
            <span>
              {set.total} {set.isGuide ? "CHAPTERS" : "WATCHES"} · {set.withFrames}{" "}
              WITH FRAMES
            </span>
          </p>
          {fellBack && requested && (
            <p className="text-xs text-muted-foreground">
              {requested.label} has no photographed frames yet — showing All
              Watches.
            </p>
          )}
        </div>

        {/* ROTATION menu (§2.1). Every set is prefetched, so switching is
            instant and needs no round trip. An open menu pauses the rotation. */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`Rotation set: ${set.label}`}
                className="flex h-[34px] flex-none items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-foreground transition-colors hover:border-brass/50"
              />
            }
          >
            <Layers className="size-4 text-muted-foreground" aria-hidden />
            <span className={EYEBROW}>ROTATION</span>
            <span className="font-medium">{set.label}</span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuGroup>
              {sets
                .filter((s) => !s.isGuide)
                .map((s) => (
                  <SetItem
                    key={s.id}
                    set={s}
                    active={s.id === requestedSetId}
                    onChoose={chooseSet}
                  />
                ))}
              {sets.some((s) => s.isGuide) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className={EYEBROW}>
                    Master Guides
                  </DropdownMenuLabel>
                  {sets
                    .filter((s) => s.isGuide)
                    .map((s) => (
                      <SetItem
                        key={s.id}
                        set={s}
                        active={s.id === requestedSetId}
                        onChoose={chooseSet}
                      />
                    ))}
                </>
              )}
              <DropdownMenuSeparator />
              <p className="px-2 py-1.5 text-2xs leading-relaxed text-muted-foreground">
                Only watches with photographed frames enter the rotation.
              </p>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
        {/* ── Left column: frame, controls, info ── */}
        <div className="flex w-full flex-col gap-3 md:w-[480px] md:flex-none">
          {/* The selected frame. FrameField owns the picture and the bloom
              behind it (Phase 7 §1.1); this box owns the size, the radius and
              the loupe. The frame is still object-contain — the letterbox is
              filled with colour, never cropped away. */}
          <div
            className={cn(
              "relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-surface-photo",
              loupeEnabled && "cursor-crosshair"
            )}
            onPointerEnter={
              loupeEnabled
                ? (e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - r.left
                    const y = e.clientY - r.top
                    setLoupe({ x, y, fx: x / r.width, fy: y / r.height })
                  }
                : undefined
            }
            onPointerMove={
              loupeEnabled
                ? (e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - r.left
                    const y = e.clientY - r.top
                    setLoupe({ x, y, fx: x / r.width, fy: y / r.height })
                  }
                : undefined
            }
            onPointerLeave={loupeEnabled ? () => setLoupe(null) : undefined}
          >
            <FrameField
              frame={frame}
              alt={caption}
              variant="stage"
              dwellSeconds={dwellSeconds}
              reducedMotion={reducedMotion}
            />
            {/* Caption scrim — the caption must survive a bright frame. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent"
            />
            <span className="absolute bottom-3 left-3.5 font-mono text-2xs tracking-[0.16em] text-white/90">
              {caption}
            </span>
            {frame.angle && (
              <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2.5 py-[3px] font-mono text-2xs font-medium tracking-[0.14em] text-foreground">
                {frame.angle.toUpperCase()}
              </span>
            )}
            {/* The loupe (§2.2): the same image at 2.4×, background-positioned
                from the pointer's fractional offset. pointer-events: none. */}
            {loupe && loupeEnabled && (
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-end justify-center rounded-full border-[3px] border-card bg-surface-photo bg-no-repeat pb-3 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_14px_34px_rgba(0,0,0,0.45)]"
                style={{
                  left: loupe.x,
                  top: loupe.y,
                  width: LOUPE_SIZE,
                  height: LOUPE_SIZE,
                  marginLeft: -LOUPE_SIZE / 2,
                  marginTop: -LOUPE_SIZE / 2,
                  backgroundImage: `url(${frame.url})`,
                  backgroundSize: `${LOUPE_ZOOM * 100}%`,
                  backgroundPosition: `${loupe.fx * 100}% ${loupe.fy * 100}%`,
                }}
              >
                <span className="font-mono text-2xs tracking-[0.14em] text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
                  {LOUPE_ZOOM}×
                </span>
              </div>
            )}
          </div>

          {/* Controls row (§2.3). The ring is static until step 5. */}
          <div className="flex flex-none items-center gap-3">
            <div className="relative size-[30px] flex-none">
              <svg viewBox="0 0 36 36" className="block size-[30px] -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-border"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-brass"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <Aperture
                className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-brass"
                aria-hidden
              />
            </div>
            <span className="font-mono text-2xs tracking-[0.12em] text-muted-foreground">
              {String((watchIdx % queue.length) + 1).padStart(2, "0")} /{" "}
              {String(queue.length).padStart(2, "0")}
            </span>
            <span aria-hidden className="h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => stepWatch(-1)}
              className="flex h-[30px] items-center gap-1.5 px-2 text-xs text-foreground transition-colors hover:text-brass"
            >
              <ChevronLeft className="size-4 text-muted-foreground" aria-hidden />
              Previous
            </button>
            <button
              type="button"
              onClick={() => stepWatch(1)}
              className="flex h-[30px] items-center gap-1.5 px-2 text-xs text-foreground transition-colors hover:text-brass"
            >
              Next
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </button>
            <span aria-hidden className="h-4 w-px bg-border" />
            <Link
              href={`/watch/${watch.id}`}
              className="flex items-center gap-1.5 text-xs font-medium text-brass"
            >
              Open watch
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <span className="flex-1" />
            <span
              className={cn(
                "font-mono text-2xs",
                paused && canRotate ? "text-brass" : "text-muted-foreground"
              )}
            >
              {!canRotate
                ? reducedMotion
                  ? "MOTION OFF"
                  : "SINGLE FRAME"
                : paused
                  ? "PAUSED"
                  : `EVERY ${dwellSeconds}S`}
            </span>
          </div>

          {/* Info block (§2.4): the FACTS. The name moved to the editorial
              block at the top of the right column (§1.3) — the subject should
              not be set smaller than the page furniture. Score only on the
              right: capture data (EXIF, stack depth) is not persisted; see
              design_handoff_v3 §1 open question, settled 2026-08-15 — the line
              arrives with 10-capture-data. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 border-t border-border pt-3">
            {scoreLabel && (
              <div className="flex justify-end">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {scoreLabel}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-0.5">
                <span className={cn("block", EYEBROW)}>ACQUIRED</span>
                <span className="block font-mono text-xs text-foreground">
                  {watch.isWishlist || !watch.purchaseDate ? (
                    "—"
                  ) : (
                    <>
                      {formatDay(watch.purchaseDate)}
                      {acquiredAge && (
                        <span className="text-muted-foreground"> · {acquiredAge}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className={cn("block", EYEBROW)}>WORN</span>
                {/* The only null that turns brass: an owned watch never worn is
                    an invitation. Twelve wears is not a call to action, and a
                    wish-list watch is not yours to wear (§1.4). */}
                <span
                  className={cn(
                    "block font-mono text-xs",
                    neverWorn ? "text-brass" : "text-foreground"
                  )}
                >
                  {watch.isWishlist
                    ? "not yet owned"
                    : neverWorn
                      ? "never — give it a day"
                      : `${watch.wearCount} ${watch.wearCount === 1 ? "time" : "times"}`}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className={cn("block", EYEBROW)}>LAST WORN</span>
                <span className="block font-mono text-xs text-foreground">
                  {watch.isWishlist || !watch.lastWornDate
                    ? "—"
                    : wornLabel(watch.lastWornDate, now)}
                </span>
              </div>
            </div>

            {watch.guideChapter && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Compass className="size-4 flex-none text-brass" aria-hidden />
                <span className="min-w-0 truncate">{watch.guideChapter}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: the watch, then its contact sheet ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Editorial block (§1.3): the subject is the headline. The page
              title stays at text-lg; the brand takes text-xl, the top of the
              six-step scale — no new sizes. */}
          <div className="flex-none space-y-0.5">
            <span className="block font-mono text-2xs tracking-[0.14em] text-brass">
              NOW ON THE TABLE
            </span>
            <h2 className="font-display text-xl font-semibold leading-none tracking-tight">
              {watch.brandName}
            </h2>
            <p className="font-display text-md leading-tight text-foreground">
              {watch.model}
            </p>
            {specLine(watch) && (
              <p className="font-mono text-2xs tracking-[0.06em] text-muted-foreground">
                {specLine(watch)}
              </p>
            )}
          </div>

          <div className="flex flex-none items-center gap-2.5">
            <span className={EYEBROW}>FRAMES</span>
            <span aria-hidden className="h-px flex-1 bg-border" />
            {/* "N OF 5 SHOT" rather than "N / 5 ANGLES" (§1.4): the same
                number, read as progress through a shot list instead of as a
                score out of five. */}
            <span className="font-mono text-2xs text-muted-foreground">
              {frames.length} KEPT · {watch.coveredAngles} OF 5 SHOT
            </span>
          </div>

          {/* Thumbnails are navigation targets — object-cover is correct HERE
              and only here. Hover or focus raises a frame into the main view;
              the grid is a real focusable list (one Tab stop, arrows within,
              Enter opens the Photo Lab session) — never hover-only. */}
          <div
            role="group"
            aria-label="Frames and shot list — arrow keys browse the shot frames, Enter opens the Photo Lab"
            className="grid flex-none grid-cols-3 gap-2"
            onKeyDown={(e) => {
              const step =
                e.key === "ArrowRight"
                  ? 1
                  : e.key === "ArrowLeft"
                    ? -1
                    : e.key === "ArrowDown"
                      ? GRID_COLS
                      : e.key === "ArrowUp"
                        ? -GRID_COLS
                        : null
              if (step === null) return
              // An arrow pressed anywhere in the contact sheet must never reach
              // the stage's handler: stepping the whole rotation would replace
              // the very grid the user is navigating.
              e.stopPropagation()
              // Only SHOT frames are in the roving list. A shot-list cell is
              // not a frame, so arrows there do nothing and cannot pull focus
              // into the frame list (§1.5).
              if (!(e.target as HTMLElement).dataset.frameTile) return
              e.preventDefault()
              moveGridFocus(Math.min(frameIdx, frames.length - 1), step)
            }}
          >
            {frames.map((f, i) => {
              const active = i === Math.min(frameIdx, frames.length - 1)
              return (
                <Link
                  key={f.id}
                  ref={(el) => {
                    tileRefs.current[i] = el
                  }}
                  // Truthy on purpose: an empty attribute value reads back as
                  // "" and would fail the guard below, disabling the arrows.
                  data-frame-tile="1"
                  href={`/photo-lab/session?watch=${watch.id}${f.angle ? `&angle=${f.angle}` : ""}`}
                  tabIndex={active ? 0 : -1}
                  onMouseEnter={() => setFrameIdx(i)}
                  onFocus={() => setFrameIdx(i)}
                  aria-label={`Frame ${i + 1} of ${frames.length}${f.angle ? ` — ${f.angle}` : ""} — open in Photo Lab`}
                  aria-current={active || undefined}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg bg-surface-photo outline-2 outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring/60",
                    active ? "outline outline-brass" : "outline-transparent"
                  )}
                >
                  <Image
                    src={f.thumbUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="160px"
                    className="object-cover"
                  />
                  {f.angle && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-card/90 px-1.5 py-px font-mono text-2xs font-medium tracking-[0.06em] text-foreground">
                      {f.angle.toUpperCase()}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* The grid always completes (§1.5): one inert cell per unshot
                angle, so a one-frame watch reads as a shot list rather than a
                two-thirds-empty column. These are NOT frames — no ref, no
                hover/focus raise, no place in the arrow-key list — each is its
                own tab stop that opens the session for that angle. */}
            {missingAngles.map((angle) => (
              <Link
                key={`slot-${angle}`}
                href={`/photo-lab/session?watch=${watch.id}&angle=${angle}`}
                aria-label={`${ANGLE_LABELS[angle]} not shot yet — open the Photo Lab session`}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-brass/50 hover:text-brass focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Plus className="size-4" aria-hidden />
                <span className="font-mono text-2xs tracking-[0.06em]">
                  {ANGLE_HEADINGS[angle]}
                </span>
              </Link>
            ))}
          </div>

          {missingAngles.length > 0 && (
            <p className="flex-none text-xs leading-relaxed text-muted-foreground">
              {shotListLine}
            </p>
          )}

          <div className="flex flex-none items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
            <Search className="mt-px size-4 flex-none text-brass" aria-hidden />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Hover a frame to bring it up. Hover the big frame for the loupe.
            </span>
          </div>

          <div className="mt-auto flex flex-none flex-col gap-1.5 border-t border-border pt-3">
            {/* Coverage moved up to the FRAMES rail (§1.4) — repeating it here
                as "0 / 5 angles" was the second place a null read as a score. */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Frames kept this month</span>
              <span className="font-mono tabular-nums">{stats.framesThisMonth}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Awaiting review</span>
              <Link
                href="/photo-lab/review"
                className="font-mono tabular-nums text-brass underline-offset-2 hover:underline"
              >
                {stats.awaitingReview}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Glance mode (§2.2) ────────────────────────────────────
        A fixed layer over the rail and the header: the frame needs the whole
        viewport, and an overlay is far more reversible than negotiating with
        the shell layout. The rotation keeps running underneath — that is the
        entire point. No controls, no thumbnails, no stats, no menu. */}
    {glanceActive && (
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Glance mode — move the pointer or press Escape to return"
        className="fixed inset-0 z-50 overflow-hidden [animation:lt-glance-in_500ms_ease-out]"
        // A dark base for the 500ms before the bloom paints, and for the rare
        // frame that fails to load. Same rgba idiom as the scrims above.
        style={{ background: "rgba(10,10,12,0.96)" }}
      >
        <FrameField
          frame={frame}
          alt={caption}
          variant="glance"
          dwellSeconds={dwellSeconds}
          reducedMotion={reducedMotion}
        />

        {/* Top-left: the one screen a visitor sees from across the room, so it
            may as well be signed. */}
        <div className="absolute left-7 top-6 flex items-center gap-2.5 opacity-50">
          <Mark size={22} decorative />
          <span className="font-mono text-2xs tracking-[0.3em] text-white/85">
            LOUPE
          </span>
        </div>

        {/* Top-right: the state must never look like a freeze. */}
        <div className="absolute right-6 top-5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5">
          <MousePointer2 className="size-3.5 text-white/75" aria-hidden />
          <span className="font-mono text-2xs tracking-[0.12em] text-white/75">
            MOVE TO RETURN
          </span>
        </div>

        {/* Bottom bar — every glyph over the photograph sits on this gradient
            or carries a shadow; the frame beneath can be any brightness. */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end gap-5 px-7 pb-6 pt-12"
          style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.45))" }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-semibold leading-none tracking-tight text-card [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              {watch.brandName}
            </p>
            <p className="mt-2 truncate font-mono text-xs tracking-[0.14em] text-white/85">
              {[watch.model.toUpperCase(), specLine(watch)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex flex-none items-center gap-3">
            <span className="font-mono text-2xs tracking-[0.14em] text-white/70">
              {String((watchIdx % queue.length) + 1).padStart(2, "0")} /{" "}
              {String(queue.length).padStart(2, "0")}
            </span>
            {/* The same ring, still sweeping the real dwell off the same
                interval — not a second timer. */}
            <svg viewBox="0 0 36 36" className="block size-[26px] -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-brass"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
              />
            </svg>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
