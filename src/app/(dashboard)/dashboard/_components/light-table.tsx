"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
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
} from "lucide-react"
import { Mark } from "@/components/brand/logo"
import { clockParts, useClockSeconds } from "@/components/layout/header-clock"
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
  bumpGlanceSeenCount,
  DEFAULT_GLANCE_DELAY_SECONDS,
  DEFAULT_GLANCE_ENABLED,
  DEFAULT_HERO_DWELL_SECONDS,
  GLANCE_EXPLAIN_TIMES,
  HOME_ROTATION_SET_KEY,
  readGlanceDelaySeconds,
  readGlanceEnabled,
  readGlanceSeenCount,
  readHeroDwellSeconds,
  readHomeRotationSet,
} from "@/lib/preferences"
import {
  bloomOpacityForLuminance,
  cachedLuminance,
  DEFAULT_BLOOM_OPACITY,
  DEFAULT_SCRIM_STRENGTH,
  sampleThumbLuminance,
  scrimStrengthForLuminance,
} from "@/lib/frame-luminance"
import { caseMaterialLabels } from "@/lib/validations/watch"
import { cn } from "@/lib/utils"
import { frameAspect } from "@/lib/frame-aspect"
import type {
  LightTableFrame,
  LightTableWatch,
  PhotoAngle,
  RotationGroup,
  RotationSet,
} from "@/lib/queries/light-table"

interface LightTableProps {
  /** All rotation sets, prefetched in one pass — switching needs no network. */
  sets: RotationSet[]
  /** Server-generated seed for the rotation shuffle (step 5). */
  seed: number
}

/** Ring geometry (viewBox 36): r=15 → circumference ~94.25 (the mock's value). */
const RING_CIRCUMFERENCE = 94.25

/** Stage height (§2.1, mock 4a). Fixed, so the page's vertical rhythm never
 *  moves; the WIDTH is what follows each photograph. */
const STAGE_HEIGHT = 470

/** Loupe (§2.2): 168px circular window at 2.4× — the mock's defaults. */
const LOUPE_SIZE = 168
const LOUPE_ZOOM = 2.4

/** The strip's own surfaces (Phase 8 §1.1). Literal, and deliberately so: the
 *  strip is a photographic object, the way the glance overlay is, and the
 *  palette has no token meaning "the inside of a film strip". The film
 *  vocabulary is scoped to these two values and the sprocket gradient — the
 *  page ground stays slate. */
const STRIP_BASE = "oklch(0.28 0.010 245)"
const STRIP_CELL = "oklch(0.22 0.008 245)"

/** Sprocket holes: punched in the PAGE background colour so they read as
 *  holes through the strip rather than pale bars painted on it. */
const SPROCKET_STYLE = {
  borderRadius: 2,
  backgroundImage:
    "repeating-linear-gradient(90deg, var(--background) 0 11px, transparent 11px 24px)",
} as const

/** One cell of the fixed rack (§1.2). Every watch renders the same five
 *  angles in the same order, filled or empty, so position becomes information
 *  and the eye learns where to look; anything the rack did not take is
 *  appended after it.
 *
 *  A union rather than one shape with nullable fields: an empty cell always
 *  has an angle (it IS an angle nobody has shot) and never has a frame or a
 *  place in the roving-tabindex list, and saying that in the type means the
 *  JSX needs no assertions to prove it. */
interface StripFrameCell {
  kind: "frame"
  key: string
  /** null only on an appended untagged frame. */
  angle: PhotoAngle | null
  label: string
  frameIndex: number
  /** Position among the strip's FRAME cells — the roving-tabindex list. */
  framePos: number
}

type StripCell =
  | StripFrameCell
  | { kind: "empty"; key: string; angle: PhotoAngle; label: string }

/**
 * `frameIdx` sentinel meaning "whichever frame this watch should land on".
 *
 * The landing frame is per-watch and computed server-side (the widest, hero
 * breaking ties — Phase 8 §1.2), so a reset cannot just write 0. It also
 * cannot write the next watch's index, because the rotation interval advances
 * the WATCH without knowing anything about it. A sentinel resolved at render
 * keeps one line in the timer and still lands on the right frame.
 */
const LANDING_FRAME = -1

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

/** "+2 S/D" — the rate, signed, because a watch running fast and one running
 *  slow are not the same fact. Null when the run recorded no rate. */
function timingShort(w: LightTableWatch): string | null {
  const rate = w.timing?.rateSecPerDay
  if (rate == null) return null
  return `${rate > 0 ? "+" : ""}${rate} S/D`
}

/**
 * The line under the watch's name — now the MOVEMENT line.
 *
 * Movement is the most identifying thing about a watch after its name, so it
 * gets the position directly beneath it rather than a column in the band. The
 * case dimensions and the box moved OUT of here and into the facts band, where
 * they have room and labels; repeating them in both places was the same
 * duplication the frame caption had.
 *
 * The timing reading joins the line only when the watch has actually been on a
 * timegrapher. An unmeasured watch shows nothing at all — this screen does not
 * report work not done.
 */
function specLine(w: LightTableWatch, opts?: { withCase?: boolean }): string {
  const line = [
    w.referenceNumber?.toUpperCase(),
    w.caliberLine?.toUpperCase(),
    w.beatRate?.toUpperCase(),
    w.powerReserve?.toUpperCase(),
    timingShort(w),
    // Glance mode has no facts band, so it carries the case size inline.
    opts?.withCase && w.caseDiameterMm != null ? `${w.caseDiameterMm}MM` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  if (line) return line

  // Plenty of watches have no movement record and no reference number, and an
  // empty line would both look like a load failure and change the block's
  // height as the rotation advances. Fall back to whatever else describes this
  // particular watch rather than leaving a gap.
  const material = w.caseMaterial
    ? (caseMaterialLabels[w.caseMaterial] ?? w.caseMaterial).toUpperCase()
    : null
  // `complication` is stored comma-joined; the middot is this line's separator
  // everywhere else, so it should not switch to commas here.
  const complications = w.complication
    ? w.complication
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .join(" · ")
        .toUpperCase()
    : null
  return [complications, material].filter(Boolean).join(" · ")
}

/** "39 × 11.5 mm", or just the diameter when no height is recorded. */
function caseSize(w: LightTableWatch): string {
  if (w.caseDiameterMm == null) return "—"
  if (w.caseHeightMm == null) return `${w.caseDiameterMm} mm`
  return `${w.caseDiameterMm} × ${w.caseHeightMm} mm`
}

/** "20 mm lugs · 47 mm lug-to-lug" — whichever of the two exists. */
function caseDetail(w: LightTableWatch): string | null {
  const parts = [
    w.strapWidthMm != null ? `${w.strapWidthMm} mm lugs` : null,
    w.lugToLugMm != null ? `${w.lugToLugMm} mm lug-to-lug` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

const EYEBROW = "font-mono text-2xs tracking-[0.14em] text-muted-foreground"

/** The ROTATION menu's groups, in order. The first carries no heading — it is
 *  the standing sets, and a heading over them would only label the obvious. */
const ROTATION_GROUPS: Array<{ group: RotationGroup; heading: string | null }> = [
  { group: "primary", heading: null },
  { group: "guide", heading: "Master Guides" },
  { group: "box", heading: "Boxes" },
]

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

  // ── The scrim's strength (Phase 8 §2) ─────────────────────────
  // Derived from the frame's own mean luminance, not fixed. Seeded from the
  // cache so a frame already measured — by the other FrameField, or on a
  // previous pass of the rotation — paints correctly on its very first frame
  // instead of fading in from mid.
  const [luminance, setLuminance] = useState<number | null>(
    () => cachedLuminance(frame.thumbUrl) ?? null
  )
  useEffect(() => {
    const url = frame.thumbUrl
    let live = true
    // Resolves off the cache when this frame has been measured before, so the
    // repeat case costs a microtask and no pixels. The previous frame's
    // strength is deliberately held until the new one resolves — with the
    // 400ms settle below, that is invisible, where a flash to mid would not
    // be.
    sampleThumbLuminance(url).then((value) => {
      if (live && value != null) setLuminance(value)
    })
    return () => {
      live = false
    }
  }, [frame.thumbUrl])

  const strength =
    luminance != null
      ? scrimStrengthForLuminance(luminance)
      : DEFAULT_SCRIM_STRENGTH
  // §2.1 demotes luminance on the stage from a fix to a nudge: the spill is a
  // blurred copy of the photograph, so a dark frame wants a little less halo
  // and a pale one can afford a little more.
  const bloomOpacity =
    luminance != null
      ? bloomOpacityForLuminance(luminance)
      : DEFAULT_BLOOM_OPACITY

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
        // Matches the sampler's request mode above, so the luminance sample
        // reuses THIS fetch instead of opening a second cache entry for the
        // same thumbnail: browsers key the HTTP cache on CORS mode.
        crossOrigin="anonymous"
        className={cn(
          // max-w-none: preflight gives every <img> `max-width: 100%`, which
          // silently clamped the spill back to the box's own width and made
          // the overhang exist on the vertical axis only.
          "pointer-events-none absolute max-w-none object-cover",
          // Stage: a SPILL of light around the photograph's edges, ~40px past
          // it, rounded off to an ellipse so it reads as glow rather than as a
          // second rectangle behind the first (§2.1, mock 4a). Glance: still a
          // full-bleed field, because there the photograph really is floating
          // in a viewport-sized dark room.
          glance
            ? "inset-0 h-full w-full"
            : "-inset-10 h-[calc(100%+80px)] w-[calc(100%+80px)] rounded-full"
        )}
        style={{
          filter: glance ? "blur(46px) saturate(1.6)" : "blur(40px) saturate(1.5)",
          opacity: glance ? 0.9 : bloomOpacity,
          // Reduced motion keeps the field and drops the drift — the bloom is
          // colour, not motion. The static overscale stays either way.
          transform: reducedMotion && glance ? "scale(1.3)" : undefined,
          animation:
            reducedMotion || !glance
              ? undefined
              : `lt-bloom-drift ${dwellSeconds * 2}s ease-in-out infinite alternate`,
          transition: reducedMotion ? undefined : "opacity 400ms ease-out",
        }}
      />
      {/* Scrim — keeps the sharp frame on a slightly darker field than its own
          bloom so the caption stays legible over any photograph, at a strength
          derived from how bright the photograph actually is (§2).

          The gradient is authored at FULL alpha and the whole layer is then
          dimmed by `opacity`, rather than rebuilding the colour stops per
          frame. Two reasons: one number controls the whole scrim, which is
          exactly what §2 asks for; and opacity is animatable where gradient
          stops are not, so the change from one frame to the next is a soft
          settle instead of a jump. The stop ratios are Phase 7's own values
          (0.10/0.52 and 0.06/0.62), so a genuinely dark frame still lands on
          precisely the scrim Phase 7 specified. */}
      {/* The scrim is a GLANCE-ONLY layer now (§2.1). On the stage it existed
          to rescue a large blurred field the photograph floated in; the box
          now matches the photograph, so there is no field left to correct and
          a scrim would only dim the picture. Glance mode still has one,
          because there the photograph really does sit in a viewport-sized
          room and every caption over it needs ground. */}
      {glance && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 85% at 50% 42%, rgba(0,0,0,0.097) 0%, rgba(0,0,0,1) 100%)",
            opacity: Math.min(0.72, strength * 1.2),
            transition: reducedMotion ? undefined : "opacity 400ms ease-out",
          }}
        />
      )}

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
            // ALWAYS object-contain. The box matching the photograph's aspect
            // is not a licence to crop — it is what makes cropping unnecessary.
            "object-contain",
            // On the stage the photograph now fills its own box, so it can
            // carry the radius and the shadow itself and read as a print lying
            // on a lit surface (§2.1).
            !glance && "rounded-lg shadow-[0_8px_28px_-6px_rgba(0,0,0,0.28)]",
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
          {set.total} {set.group === "guide" ? "chapters" : "watches"} ·{" "}
          {set.withFrames} with frames
        </span>
      </span>
    </DropdownMenuItem>
  )
}

export function LightTable({ sets, seed }: LightTableProps) {
  // The active set, persisted per device. Read after mount (never during SSR,
  // the read-after-mount pattern); an unknown id falls back to "all", and
  // a known-but-frameless set falls back below with a one-line explanation.
  const [requestedSetId, setRequestedSetId] = useState<string>("all")
  useEffect(() => {
    const saved = readHomeRotationSet()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a client-only preference
    if (saved && sets.some((s) => s.id === saved)) setRequestedSetId(saved)
  }, [sets])

  function chooseSet(id: string) {
    setRequestedSetId(id)
    setWatchIdx(0)
    setFrameIdx(LANDING_FRAME)
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
  const [frameIdx, setFrameIdx] = useState(LANDING_FRAME)

  // Per-device dwell — readHeroDwellSeconds() is THE dwell preference; the
  // status label shows it, the rotation (step 5) consumes it.
  const [dwellSeconds, setDwellSeconds] = useState(DEFAULT_HERO_DWELL_SECONDS)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a client-only preference
    setDwellSeconds(readHeroDwellSeconds())
  }, [])

  // Clock for the relative LAST WORN label — null until mounted so SSR and
  // hydration agree (the watch-hero pattern).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists client-side, so SSR and hydration agree
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

  // Roving tabindex for the strip — one Tab stop, arrows within. Indexed by
  // position among the strip's FRAME cells, not by index into `frames`: the
  // rack's left-to-right order is not the frames array's order, and an arrow
  // has to move to the neighbour the eye sees.
  const stripRefs = useRef<(HTMLAnchorElement | null)[]>([])
  function moveStripFocus(from: number, delta: number) {
    if (stripFrameCount === 0) return
    const next = Math.min(stripFrameCount - 1, Math.max(0, from + delta))
    stripRefs.current[next]?.focus()
  }

  // The strip scroller, and which edges still have strip beyond them.
  const stripScrollerRef = useRef<HTMLDivElement | null>(null)
  const [stripEdges, setStripEdges] = useState({ left: false, right: false })

  // Deterministic per-load order: the server seed makes SSR and hydration
  // agree, and re-seeding per set keeps each queue's order stable while you
  // switch back and forth.
  const queue = useMemo(() => {
    const watches = set?.watches ?? []
    if (watches.length < 2) return watches
    return shuffleWith(watches, mulberry32(Math.floor(seed * 0xffffffff)))
  }, [set, seed])

  const watch = queue.length > 0 ? queue[watchIdx % queue.length] : null
  // Memoised on the watch, not rebuilt per render: `?? []` would hand the rack
  // a new array identity every time and rebuild the strip on every keystroke,
  // hover and tick.
  const frames = useMemo(() => watch?.frames ?? [], [watch])
  // The sentinel resolves against THIS watch; an explicit hover/focus choice
  // wins over it, and is clamped in case the frame list shrank underneath.
  const activeFrameIdx =
    frames.length === 0
      ? -1
      : frameIdx === LANDING_FRAME
        ? Math.min(watch?.landingFrameIndex ?? 0, frames.length - 1)
        : Math.min(frameIdx, frames.length - 1)
  const frame = activeFrameIdx >= 0 ? frames[activeFrameIdx] : null

  // ── The fixed rack (§1.2) ────────────────────────────────────
  // FLAT · HERO · PROFILE · CASEBACK · MACRO, always, in that order — each
  // slot either a real frame or an empty shot-list cell — then whatever the
  // rack did not take, appended in the frames array's own order. Position
  // therefore means the same thing on every watch, which is the entire point:
  // the eye learns where to look instead of re-reading the row each time.
  const strip = useMemo<StripCell[]>(() => {
    // `frames` already arrives in strip order from the query — band 1 the
    // filled angle slots in rack order, band 2 the untagged frames — so
    // position here IS display position and needs no re-sorting.
    const cells: StripCell[] = frames.map((f, i) => ({
      kind: "frame",
      key: f.id,
      angle: f.angle,
      label: f.angle ? ANGLE_HEADINGS[f.angle] : "UNTAGGED",
      frameIndex: i,
      framePos: i,
    }))

    // Band 3: the empty shot-list cells, in rack order, AFTER every
    // photograph. Interleaving them at their rack positions is what shipped
    // first, and on a sparsely shot watch it put plus-signs ahead of the
    // photograph — a to-do list with a photo attached. Photographs first.
    const shot = new Set(frames.map((f) => f.angle).filter(Boolean))
    for (const angle of PHOTO_ANGLES) {
      if (shot.has(angle)) continue
      cells.push({
        kind: "empty",
        key: `slot-${angle}`,
        angle,
        label: ANGLE_HEADINGS[angle],
      })
    }

    return cells
  }, [frames])

  const stripFrames = strip.filter((c): c is StripFrameCell => c.kind === "frame")
  const stripFrameCount = stripFrames.length
  const activeStripPos =
    stripFrames.find((c) => c.frameIndex === activeFrameIdx)?.framePos ?? 0

  // Which edges of the strip still have strip beyond them. Measured rather
  // than guessed from the cell count, because whether the rack overflows
  // depends on the viewport as much as on how many frames a watch has — and a
  // fade drawn over a row that already fits reads as a vignette, not an
  // affordance.
  useEffect(() => {
    const el = stripScrollerRef.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 2
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
      // Bail out when nothing changed. A fresh object every scroll event is
      // never Object.is-equal to the last one, so React would re-render the
      // whole stage — frame, strip, facts and all — on every frame of a flick
      // through the strip. Same reason the glance idle handler bails out
      // functionally rather than setting state on every pointermove.
      setStripEdges((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right }
      )
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [strip, watch?.id])

  function stepWatch(delta: number) {
    if (queue.length < 2) return
    setWatchIdx((i) => (i + delta + queue.length) % queue.length)
    setFrameIdx(LANDING_FRAME)
    resetElapsed()
  }

  // ── Glance mode (Phase 7 §2) ─────────────────────────────────
  // Per-device preferences, read after mount like every other one here.
  const [glanceEnabled, setGlanceEnabled] = useState(DEFAULT_GLANCE_ENABLED)
  const [glanceDelay, setGlanceDelay] = useState(DEFAULT_GLANCE_DELAY_SECONDS)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading client-only preferences
    setGlanceEnabled(readGlanceEnabled())
    setGlanceDelay(readGlanceDelaySeconds())
  }, [])

  const [glance, setGlance] = useState(false)
  const glanceActive = glance && glanceEnabled

  // §9 — glance mode reads as a malfunction the first few times it fires, so
  // the first three engagements carry a line saying what happened and where to
  // change it. Counted in localStorage; after that it never appears again.
  const [explainGlance, setExplainGlance] = useState(false)
  useEffect(() => {
    if (!glanceActive) return
    if (readGlanceSeenCount() >= GLANCE_EXPLAIN_TIMES) return
    bumpGlanceSeenCount()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first-run notice, gated on a client-only counter
    setExplainGlance(true)
    // Long enough to read from across the room, short enough that it does not
    // become furniture on the ambient screen.
    const id = setTimeout(() => setExplainGlance(false), 9000)
    return () => clearTimeout(id)
  }, [glanceActive])

  // The same 1s tick the header clock runs on — one subscription, shared, so
  // glance mode never starts a second timer for the same second.
  const clockSeconds = useClockSeconds()
  const glanceParts =
    clockSeconds != null ? clockParts(new Date(clockSeconds * 1000)) : null

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
        setFrameIdx(LANDING_FRAME)
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

  // §2.1 — the box's geometry. Height fixed, width following the photograph,
  // capped at the content width by `maxWidth`. `aspectRatio` with an explicit
  // height gives exactly `height × aspect` and needs no measurement, so the
  // first paint is already right.
  const stageAspect = frameAspect(frame)
  const stageBoxStyle: React.CSSProperties = stageAspect
    ? { height: STAGE_HEIGHT, aspectRatio: `${stageAspect}`, maxWidth: "100%" }
    : // No stored dimensions: the content-width 3:2 fallback, exactly as §2.1
      // specifies. Width-driven rather than height-driven, so it fills the
      // measure the way the pre-aspect stage did.
      { width: "100%", aspectRatio: "3 / 2" }

  const watchName = `${watch.brandName} ${watch.model}`.trim()
  // §1.4 — nulls become invitations, on owned watches only.
  const neverWorn = !watch.isWishlist && watch.wearCount === 0
  const acquiredAge = watch.purchaseDate ? relativeAge(watch.purchaseDate, now) : null

  // The unshot angles are no longer counted here: the strip's empty cells ARE
  // the shot list, and the sentence that used to spell that out was Photo Lab
  // direction sitting on a display screen. The rack still renders every angle
  // from PHOTO_ANGLES, so nothing about the strip changed.
  // §4.1 — the angle stamp appears ONLY when there is an angle, and UNTAGGED
  // survives in exactly one place on the screen: the strip cell's own label.
  // A pill over the photograph reading UNTAGGED is the loudest available way
  // to announce that there is nothing to report.
  // Alt text now, not a visible caption (§ home second pass): the stage's
  // identity block names the watch below the frame, so printing it over the
  // photograph too was saying the same thing twice with the quieter copy
  // sitting on top of the picture. Glance mode still shows the name — there is
  // no identity block there.
  const caption = [frame.angle?.toUpperCase(), watchName.toUpperCase()]
    .filter(Boolean)
    .join(" · ")
  // Phase 6 §2.4's right-aligned SCORE line has no home in the spine: the
  // facts band is four NAMED columns and none of them is a photo grade, the
  // strip header is "THE STRIP and a hairline, nothing more" (Phase 8 §4), and
  // the mock shows no score anywhere. It is the same argument Part 4 makes for
  // the other counters — a grading number is actionable in the Photo Lab and
  // decorative here. `frame.score` stays on the type; nothing on this screen
  // reads it.

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
      className="w-full max-w-[1080px] space-y-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {/* ── One spine, not two columns (Phase 8 §1) ──────────────
          Everything below is full content width, stacked in reading order:
          photograph → who it is → the strip → the facts. The old stage put
          frame+info beside sheet+stats, and two columns of unequal height can
          only agree at the top — so the shorter one always ended early and
          left a hole, and a one-frame watch rendered that frame twice at once.
          Nothing sits beside anything else here except the small control row. */}

      {/* The top row holds the rotation control and nothing else. The
          `On the table` page heading is gone: the phrase survives as the
          NOW ON THE TABLE eyebrow under the frame, where it labels the actual
          watch instead of the page. */}
      <div className="flex justify-end">
        <div className="flex min-w-0 flex-col items-end gap-1.5">
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
                {/* Three headed groups, in the order they were added to the
                    app: the standing sets, then the guides, then the boxes.
                    A group with no members renders nothing at all rather than
                    an empty heading. */}
                {ROTATION_GROUPS.map(({ group, heading }) => {
                  const inGroup = sets.filter((s) => s.group === group)
                  if (inGroup.length === 0) return null
                  return (
                    // Fragment, not a wrapper element: Base UI's menu walks its
                    // own children for roving focus, and a div between the menu
                    // and its items breaks arrow-key navigation.
                    <Fragment key={group}>
                      {heading && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className={EYEBROW}>
                            {heading}
                          </DropdownMenuLabel>
                        </>
                      )}
                      {inGroup.map((s) => (
                        <SetItem
                          key={s.id}
                          set={s}
                          active={s.id === requestedSetId}
                          onChoose={chooseSet}
                        />
                      ))}
                    </Fragment>
                  )
                })}
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-2xs leading-relaxed text-muted-foreground">
                  Only watches with photographed frames enter the rotation.
                </p>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* One number, and it is the counter's denominator (Phase 8 §3).
              The set name is not repeated here — the control above says it. */}
          <p className={EYEBROW}>{queue.length} IN ROTATION</p>
          {fellBack && requested && (
            <p className="text-right text-xs text-muted-foreground">
              {requested.label} has no photographed frames yet — showing All
              Watches.
            </p>
          )}
        </div>
      </div>

      {/* ── The frame (Phase 8 §2.1) ───────────────────────────────
          The box takes its shape from the photograph, not the other way round.
          Height is fixed so the page's vertical rhythm never moves; width is
          `height × aspect`, capped at the content width — so a 3:2 or wider
          frame still fills the page edge to edge and the previous best case is
          unchanged, while a portrait frame sits compact and centred instead of
          taking 54% of the width with bloom filling the rest.

          The aspect comes from STORED dimensions (00048), so the box is right
          on first paint with no layout shift as the rotation advances. A photo
          with no stored dimensions falls back to a content-width 3:2 box —
          a real, supported path, not an error.

          No `overflow-hidden` any more: the bloom is a spill that must escape
          the box, and the photograph carries its own radius. */}
      <div className="flex w-full justify-center">
      <div
        className={cn(
          "relative bg-transparent",
          loupeEnabled && "cursor-crosshair"
        )}
        style={stageBoxStyle}
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
        {/* No caption on the photograph: the identity block directly beneath
            it already names the watch, twice the size. Two labels for one
            subject, one of them competing with the image, is one too many —
            and dropping it takes the scrim with it, so the frame is now
            genuinely unobstructed. The caption survives as the image's alt
            text, where it does real work. */}
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
      </div>

      {/* ── Who it is, and the controls ────────────────────────────
          The one place two things still sit side by side, because the control
          row is small and belongs with the watch it steps through. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="block font-mono text-2xs tracking-[0.2em] text-brass">
            NOW ON THE TABLE
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            {/* The watch is the page's heading now — the page furniture that
                used to outrank it is gone (Phase 8 §1).

                §5: 38px at weight 400, with the model at 26px, also 400. The
                old 38/600 against 19/400 was a 2:1 size jump PLUS a weight
                jump, so the brand overwhelmed the model — which is the more
                identifying half. Size alone carries the hierarchy now, and it
                reads as a gallery label rather than a headline. Both steps are
                on the six-step scale; nothing arbitrary was added. */}
            <h1 className="font-display text-xl font-normal leading-[1.04] tracking-tight">
              {watch.brandName}
            </h1>
            <p className="font-display text-lg font-normal leading-tight text-foreground">
              {watch.model}
            </p>
          </div>
          {/* Always rendered, even when empty: this line's height is part of
              the block's, and letting it collapse made the whole spine shift
              up and down as the rotation stepped between a watch with a
              movement record and one without. */}
          <p className="min-h-[1.1em] font-mono text-2xs tracking-[0.06em] text-muted-foreground">
            {specLine(watch)}
          </p>
        </div>

        {/* Controls (§2.3). The ring and the advance share one interval. */}
        <div className="flex flex-none flex-wrap items-center gap-3">
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
          {/* The words for what the ring is doing, kept beside it so the two
              read as one readout (Phase 6 §2.3 still binding). */}
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
        </div>
      </div>

      {/* ── The strip (Phase 8 §1.1 + §1.2) ────────────────────────
          Replaces the square contact sheet, and is now the ONLY place
          thumbnails exist — which is how the duplicate-image defect goes away
          by construction rather than by a rule someone has to remember.

          The header is the label and a hairline, nothing more (§4): the
          counters that used to sit here described decisions about photographs
          rather than watches, and a strip already communicates frame count by
          being a strip. */}
      <div className="flex items-center gap-2.5">
        <span className={EYEBROW}>THE STRIP</span>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>

      {/* The film vocabulary lives HERE and nowhere else — the page ground
          stays slate. That scoping is what earns the photo-lab feeling without
          the whole-app rewarming the rejected `2b film edge` would have
          forced. The literal dark values are deliberate: this is a
          photographic surface, like the glance overlay below, and no palette
          token means "the inside of a film strip". */}
      <div className="relative">
        <div
          className="overflow-hidden rounded-lg py-2"
          style={{ background: STRIP_BASE }}
        >
          {/* Sprockets, top and bottom. The holes are painted in the PAGE
              background colour, so they read as punched through the strip
              rather than as pale rectangles drawn on top of it. */}
          <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />

          <div
            ref={stripScrollerRef}
            role="group"
            aria-label="The strip — arrow keys browse the shot frames, Enter opens the Photo Lab"
            className="flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onKeyDown={(e) => {
              const step =
                e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : null
              if (step === null) return
              // An arrow pressed inside the strip must never reach the stage's
              // handler: stepping the whole rotation would replace the very
              // strip being navigated.
              e.stopPropagation()
              // Only SHOT frames are in the roving list. An empty shot-list
              // cell is not a frame, so arrows there do nothing and cannot
              // pull focus into the frame list (Phase 7 §1.5).
              if (!(e.target as HTMLElement).dataset.frameTile) return
              e.preventDefault()
              moveStripFocus(activeStripPos, step)
            }}
          >
            {strip.map((cell) => {
              const active =
                cell.kind === "frame" && cell.frameIndex === activeFrameIdx
              const href = `/photo-lab/session?watch=${watch.id}${cell.angle ? `&angle=${cell.angle}` : ""}`
              return (
                <div
                  key={cell.key}
                  className="flex min-w-0 flex-col gap-1"
                  // Grows to fill when the rack fits, never shrinks below a
                  // legible frame — which is what makes the row scroll rather
                  // than squeeze once a watch has more than the five.
                  style={{ flex: "1 0 132px" }}
                >
                  {cell.kind === "frame" ? (
                    <Link
                      ref={(el) => {
                        stripRefs.current[cell.framePos] = el
                      }}
                      // Truthy on purpose: an empty attribute value reads back
                      // as "" and would fail the guard above.
                      data-frame-tile="1"
                      href={href}
                      tabIndex={active ? 0 : -1}
                      onMouseEnter={() => setFrameIdx(cell.frameIndex)}
                      onFocus={() => setFrameIdx(cell.frameIndex)}
                      aria-label={`Frame ${cell.framePos + 1} of ${stripFrameCount}${cell.angle ? ` — ${cell.angle}` : ""} — open in Photo Lab`}
                      aria-current={active || undefined}
                      className={cn(
                        // Inset outline, so the brass reads as a selected frame
                        // ON the strip rather than a card floating above it.
                        "relative block aspect-[3/2] overflow-hidden outline-2 -outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring/60",
                        active ? "outline outline-brass" : "outline-transparent"
                      )}
                      style={{ background: STRIP_CELL }}
                    >
                      <Image
                        src={frames[cell.frameIndex].thumbUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="180px"
                        // A thumbnail is a navigation target, so a crop is
                        // right here — and only here. The sharp frame above is
                        // still object-contain.
                        className="object-cover"
                      />
                    </Link>
                  ) : (
                    <Link
                      href={href}
                      aria-label={`${ANGLE_LABELS[cell.angle]} not shot yet — open the Photo Lab session`}
                      className="flex aspect-[3/2] items-center justify-center border border-dashed border-white/25 text-white/55 transition-colors hover:border-brass hover:text-brass focus-visible:ring-2 focus-visible:ring-ring/60"
                      style={{ background: STRIP_CELL }}
                    >
                      <Plus className="size-4" aria-hidden />
                    </Link>
                  )}
                  {/* The label lives INSIDE the strip, under its frame — and
                      is the one and only place UNTAGGED may appear, muted
                      white, never brass (§4.1): brass would make an absence
                      look like an achievement. */}
                  <span className="truncate text-center font-mono text-2xs tracking-[0.06em] text-white/60">
                    {cell.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div aria-hidden className="mx-3 h-2.5" style={SPROCKET_STYLE} />
        </div>

        {/* Edge fade, no arrows — and only on the side that actually has more
            strip to reach, so a rack that fits shows no vignette at all. */}
        {stripEdges.left && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-lg"
            style={{ background: `linear-gradient(90deg, ${STRIP_BASE}, transparent)` }}
          />
        )}
        {stripEdges.right && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-lg"
            style={{ background: `linear-gradient(270deg, ${STRIP_BASE}, transparent)` }}
          />
        )}
      </div>


      {/* ── The facts (Phase 8 §1) ─────────────────────────────────
          Four labelled columns of equal width. The old three-column row was
          too narrow for the Phase 7 invitation copy, which wrapped mid-phrase
          (`12 May 2026 · 3` / `months ago`); each column now carries a mono
          value and a muted second line instead of one crowded string. */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-3.5 sm:grid-cols-4">
        <div className="flex flex-col gap-[3px]">
          <span className={EYEBROW}>ACQUIRED</span>
          <span className="font-mono text-xs text-foreground">
            {watch.isWishlist || !watch.purchaseDate
              ? "—"
              : formatDay(watch.purchaseDate)}
          </span>
          {!watch.isWishlist && acquiredAge && (
            <span className="text-xs text-muted-foreground">{acquiredAge}</span>
          )}
        </div>

        <div className="flex flex-col gap-[3px]">
          <span className={EYEBROW}>WORN</span>
          {/* The only null that turns brass: an owned watch never worn is an
              invitation. Twelve wears is not a call to action, and a wish-list
              watch is not yours to wear (Phase 7 §1.4). */}
          <span
            className={cn(
              "font-mono text-xs",
              neverWorn ? "text-brass" : "text-foreground"
            )}
          >
            {watch.isWishlist
              ? "not yet owned"
              : neverWorn
                ? "never"
                : `${watch.wearCount} ${watch.wearCount === 1 ? "time" : "times"}`}
          </span>
          {!watch.isWishlist &&
            (neverWorn ? (
              <span className="text-xs text-muted-foreground">give it a day</span>
            ) : (
              watch.lastWornDate && (
                <span className="text-xs text-muted-foreground">
                  last worn {wornLabel(watch.lastWornDate, now)}
                </span>
              )
            ))}
        </div>

        {/* CASE, where COVERAGE used to be. A coverage count is a progress bar
            for the photography backlog — the one thing this screen is not for.
            The case dimensions are the opposite: they are the watch, and they
            are what you actually want to know when one you had forgotten comes
            up in the rotation. */}
        <div className="flex flex-col gap-[3px]">
          <span className={EYEBROW}>CASE</span>
          <span className="font-mono text-xs text-foreground">
            {caseSize(watch)}
          </span>
          {caseDetail(watch) && (
            <span className="text-xs text-muted-foreground">
              {caseDetail(watch)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-[3px]">
          <span className={EYEBROW}>STORED IN</span>
          <span className="font-mono text-xs text-foreground">
            {watch.box ?? "—"}
          </span>
          {watch.boxDescription && (
            <span className="text-xs text-muted-foreground">
              {watch.boxDescription}
            </span>
          )}
        </div>
      </div>

      {watch.guideChapter && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Compass className="size-4 flex-none text-brass" aria-hidden />
          <span className="min-w-0 truncate">{watch.guideChapter}</span>
        </div>
      )}

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

        {/* Top-right: the state must never look like a freeze — and the user
            did not report seeing this at all, so §9 makes it unmissable. It
            was white/20 on black/35 with white/75 text over an arbitrarily
            bright photograph, which is a pill you can look straight past. Solid
            ground, full-strength text, a real border. */}
        <div className="absolute right-6 top-5 flex items-center gap-2 rounded-full border border-white/35 bg-black/60 px-3.5 py-2 shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <MousePointer2 className="size-4 text-card" aria-hidden />
          <span className="font-mono text-2xs tracking-[0.14em] text-card">
            MOVE TO RETURN
          </span>
        </div>

        {/* First-run explanation (§9). Under the pill it points at, so the two
            read as one thing rather than as two unrelated captions. */}
        {explainGlance && (
          <div className="absolute right-6 top-[58px] max-w-[320px] rounded-lg border border-white/25 bg-black/60 px-3.5 py-2.5 shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
            <p className="text-xs leading-relaxed text-card">
              Glance mode — move the mouse to return. Configurable in Config.
            </p>
          </div>
        )}

        {/* Bottom bar — every glyph over the photograph sits on this gradient
            or carries a shadow; the frame beneath can be any brightness. */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end gap-5 px-7 pb-6 pt-12"
          style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.45))" }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-normal leading-none tracking-tight text-card [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              {watch.brandName}
            </p>
            <p className="mt-2 truncate font-mono text-xs tracking-[0.14em] text-white/85">
              {[watch.model.toUpperCase(), specLine(watch, { withCase: true })]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {/* Glance mode promotes the clock (§6.2): a screen seen from across
              a room that shows a beautiful watch AND tells you it is 4:15 is
              useful; one that shows only the watch is a screensaver. Same
              subsidiary-register treatment as the header, one size up, off the
              same tick. */}
          {glanceParts && (
            <div className="flex flex-none items-baseline gap-2 font-mono tabular-nums [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              <span className="text-xl text-card">{glanceParts.hhmm}</span>
              <span className="text-xs text-white/70">{glanceParts.seconds}</span>
              <span className="text-xs tracking-[0.1em] text-white/70">
                {glanceParts.meridiem}
              </span>
            </div>
          )}
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
