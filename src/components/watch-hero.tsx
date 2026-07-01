"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { DEFAULT_HERO_DWELL_SECONDS, readHeroDwellSeconds } from "@/lib/preferences"
import type { WatchWithCover } from "@/lib/types/watch"

interface HeroStats {
  watches: number
  brands: number
  wornThisWeek: number
}

interface WatchHeroProps {
  /** All watches eligible for the hero (must have a cover photo). */
  watches: WatchWithCover[]
  /** Server-generated seed so the initial shuffle matches across SSR/hydration. */
  seed: number
  /** Headline stats for the line under the hero. */
  stats: HeroStats
}

/** The brass rim line completes one full lap every this many seconds — a
 *  continuous minute sweep, independent of the (configurable) watch swap. */
const RING_SECONDS = 60

/** Countdown ring geometry (viewBox 0..100). Dash length 300 ≥ circumference
 *  (~298.5) so the ring reads as empty at the start of each lap. */
const RING_R = 47.5
const RING_LEN = 300

/** Small seeded PRNG (mulberry32) — deterministic so SSR and hydration agree. */
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

function metaLine(watch: WatchWithCover): string {
  const m = watch.movement
  if (!m) return ""
  const type = m.caliber_type ? caliberTypeLabels[m.caliber_type] ?? m.caliber_type : null
  const caliber = `${m.manufacturer ? m.manufacturer + " " : ""}${m.caliber_name}`.trim()
  return [type, caliber].filter(Boolean).join("  ·  ")
}

/** One full-frame photo layer, framed by the watch's saved dial focal point + zoom. */
function PhotoLayer({ watch, fade }: { watch: WatchWithCover; fade?: boolean }) {
  const focalX = watch.dial_focal_x ?? 50
  const focalY = watch.dial_focal_y ?? 50
  const zoom = watch.dial_zoom ?? 1
  return (
    <div
      className="absolute inset-0"
      style={fade ? { animation: "cshero-fade 1s ease" } : undefined}
    >
      <Image
        src={watch.cover_photo_url!}
        alt={`${watch.brand.name} ${watch.model}`}
        fill
        unoptimized
        sizes="560px"
        className="object-cover"
        style={{
          objectPosition: `${focalX}% ${focalY}%`,
          transform: zoom > 1 ? `scale(${zoom})` : undefined,
        }}
      />
    </div>
  )
}

export function WatchHero({ watches, seed, stats }: WatchHeroProps) {
  // Deterministic shuffle (seeded) → SSR/hydration agree, fresh order per load.
  const order = useMemo(() => {
    const eligible = watches.filter((w) => w.cover_photo_url)
    return shuffleWith(eligible, mulberry32(Math.floor(seed * 0xffffffff)))
  }, [watches, seed])

  const [idx, setIdx] = useState(0)

  // Per-device dwell (seconds each watch stays up). Starts at the default so SSR
  // and first client render agree; the saved preference is read after mount.
  const [dwellSeconds, setDwellSeconds] = useState(DEFAULT_HERO_DWELL_SECONDS)
  useEffect(() => {
    setDwellSeconds(readHeroDwellSeconds())
  }, [])

  // Read the live list length from a ref so the swap interval only re-creates on
  // a genuine dwell change — never stacked by re-renders / Strict Mode / Fast
  // Refresh, which would swap too fast.
  const orderLenRef = useRef(order.length)
  useEffect(() => {
    orderLenRef.current = order.length
  }, [order.length])

  useEffect(() => {
    const id = setInterval(() => {
      const n = orderLenRef.current
      if (n > 1) setIdx((i) => (i + 1) % n)
    }, dwellSeconds * 1000)
    return () => clearInterval(id)
  }, [dwellSeconds])

  const current = order.length ? order[idx % order.length] : null

  // Keep the prior watch mounted underneath so the incoming one cross-fades over
  // it. `previous` lags `current` by one commit: the effect stores each current
  // after paint, so during the render right after a swap it still holds the old
  // one. (State, not a ref — refs can't be read during render.)
  const [previous, setPrevious] = useState<WatchWithCover | null>(null)
  useEffect(() => {
    setPrevious(current)
  }, [current])

  if (!current) {
    return (
      <div className="flex flex-col items-center">
        <div className="grid aspect-square w-[88vw] max-w-[560px] place-items-center rounded-full border border-dashed border-border text-center text-sm text-muted-foreground">
          Add a cover photo to a watch<br />to feature it here.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Case + lugs + crown */}
      <div className="relative mx-auto aspect-square w-[88vw] max-w-[560px]">
        <Lug position="top" />
        <Lug position="bottom" />

        {/* Crown — 3 o'clock */}
        <div
          aria-hidden="true"
          className="absolute z-[1] flex items-center"
          style={{ right: "-4.2%", top: "50%", width: "6%", height: "8.2%", transform: "translateY(-50%)" }}
        >
          <div
            style={{
              width: "34%",
              height: "42%",
              marginRight: "-6%",
              borderRadius: "1px 2px 2px 1px",
              background: "linear-gradient(180deg,#dadfe3,#909799 40%,#6c727a)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,.5), 0 1px 2px rgba(0,0,0,.4)",
            }}
          />
          <div
            style={{
              width: "66%",
              height: "100%",
              borderRadius: "2px 7px 7px 2px",
              background: "repeating-linear-gradient(90deg,#e6eaed 0 1.6px,#878d94 1.6px 3.2px)",
              boxShadow:
                "inset 0 4px 5px -2px rgba(255,255,255,.6), inset 0 -6px 7px -3px rgba(0,0,0,.55), inset -3px 0 5px -2px rgba(0,0,0,.4), 0 2px 5px rgba(0,0,0,.45)",
            }}
          />
        </div>

        {/* Case — polished steel */}
        <div
          className="absolute inset-0 z-[2] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 36% 28%, #f0f2f4, #b4babf 42%, #6a7077 72%, #3f454b)",
            boxShadow:
              "0 26px 60px rgba(0,0,0,.55), inset 0 3px 6px rgba(255,255,255,.5), inset 0 -8px 18px rgba(0,0,0,.4)",
          }}
        >
          {/* Dial interior — the featured watch photo */}
          <Link
            href={`/watch/${current.id}`}
            aria-label={`${current.brand.name} ${current.model}`}
            className="group absolute overflow-hidden rounded-full"
            style={{
              inset: "4.82%",
              boxShadow: "inset 0 0 0 3px #0c1014, inset 0 0 40px rgba(0,0,0,.6)",
            }}
          >
            <div className="absolute inset-0 bg-[#0c1014]" />

            {/* Outgoing (previous) photo sits underneath the incoming fade. */}
            {previous && previous.id !== current.id && <PhotoLayer key={`prev-${previous.id}`} watch={previous} />}
            <PhotoLayer key={`cur-${current.id}`} watch={current} fade />

            {/* Domed-crystal reflection + inner vignette */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-70"
              style={{
                background:
                  "radial-gradient(120% 90% at 30% 16%, rgba(255,255,255,.24), rgba(255,255,255,.05) 28%, transparent 52%)",
                boxShadow: "inset 0 0 70px rgba(0,0,0,.6)",
              }}
            />

            {/* Brass rim line — one continuous lap per minute, independent of the
                30s watch swap (no idx key, so it never restarts on a swap). */}
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="0.8" />
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="#c9a25e"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeDasharray={RING_LEN}
                style={{ animation: `cshero-ring ${RING_SECONDS}s linear infinite` }}
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Caption — "now showing" */}
      <div key={current.id} className="mt-[88px] text-center sm:mt-[112px]" style={{ animation: "csfade .5s ease" }}>
        <div className="font-display text-[24px] font-semibold leading-[1.1] sm:text-[28px]">
          {current.nickname || current.model}
        </div>
        <div className="mt-0.5 font-display text-[17px] text-muted-foreground sm:text-[19px]">
          {current.brand.name}
        </div>
        {metaLine(current) && (
          <div className="mt-3 font-mono text-[12px] text-muted-foreground">{metaLine(current)}</div>
        )}
        <Link
          href={`/watch/${current.id}`}
          className="mt-5 inline-block rounded-[10px] border border-primary px-5 py-2 text-[13px] text-primary transition-colors hover:bg-primary/10"
        >
          View watch →
        </Link>
      </div>

      {/* Stat line */}
      <div className="mt-10 flex gap-[26px] font-mono text-[12px] text-muted-foreground">
        <span>
          <span className="text-foreground/80">{stats.watches}</span> watches
        </span>
        <span className="opacity-40">|</span>
        <span>
          <span className="text-foreground/80">{stats.brands}</span> brands
        </span>
        <span className="opacity-40">|</span>
        <span>
          <span className="text-foreground/80">{stats.wornThisWeek}</span> worn this week
        </span>
      </div>
    </div>
  )
}

/** A steel lug: two prongs at the case edges with a spring bar spanning the gap. */
function Lug({ position }: { position: "top" | "bottom" }) {
  const top = position === "top"
  const prongRadius = top ? "8px 8px 3px 3px" : "3px 3px 8px 8px"
  const barEdge = top ? { top: "6%" } : { bottom: "6%" }
  const prongEdge = top ? { bottom: 0 } : { top: 0 }
  const pinEdge = top ? { top: "8%" } : { bottom: "8%" }
  return (
    <div
      aria-hidden="true"
      className="absolute left-1/2 z-[1] -translate-x-1/2"
      style={{ width: "49.6%", height: "14.3%", ...(top ? { top: "-8.2%" } : { bottom: "-8.2%" }) }}
    >
      <div
        className="absolute"
        style={{
          left: "0.7%",
          ...prongEdge,
          width: "6.5%",
          height: "95%",
          borderRadius: prongRadius,
          background: "linear-gradient(100deg,#eef1f3,#a4aab0 48%,#5d636b)",
          boxShadow: "inset 1.5px 1px 1px rgba(255,255,255,.55), inset -1px 0 2px rgba(0,0,0,.3)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "0.7%",
          ...prongEdge,
          width: "6.5%",
          height: "95%",
          borderRadius: prongRadius,
          background: "linear-gradient(-100deg,#eef1f3,#a4aab0 48%,#5d636b)",
          boxShadow: "inset -1.5px 1px 1px rgba(255,255,255,.55), inset 1px 0 2px rgba(0,0,0,.3)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "0.8%",
          right: "0.8%",
          ...barEdge,
          height: "11%",
          borderRadius: "5px",
          background: "linear-gradient(180deg,#f4f6f8,#b4bac0 42%,#787e86)",
          boxShadow: "0 1px 2px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.6)",
        }}
      />
      <div
        className="absolute"
        style={{ left: 0, ...pinEdge, width: "2.5%", height: "9%", borderRadius: "2px", background: "#d4d9dd", boxShadow: "inset 0 1px 1px rgba(255,255,255,.6)" }}
      />
      <div
        className="absolute"
        style={{ right: 0, ...pinEdge, width: "2.5%", height: "9%", borderRadius: "2px", background: "#d4d9dd", boxShadow: "inset 0 1px 1px rgba(255,255,255,.6)" }}
      />
    </div>
  )
}
