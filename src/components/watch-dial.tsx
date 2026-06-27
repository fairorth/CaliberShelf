"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { caliberTypeLabels } from "@/lib/validations/movement"
import type { WatchWithCover } from "@/lib/types/watch"

interface DialStats {
  watches: number
  brands: number
  wornThisWeek: number
}

interface WatchDialProps {
  /** All watches eligible to appear on the dial (must have a cover photo). */
  watches: WatchWithCover[]
  /** Server-generated seed so the initial random layout matches across SSR/hydration. */
  seed: number
  /** Headline stats for the line under the dial. */
  stats: DialStats
}

/** Each watch is spotlighted for this many seconds before the dial advances. */
const HIGHLIGHT_SECONDS = 5

/** 12 hour positions as percentages of the dial box.
 *  i = 0 sits at 12 o'clock, advancing clockwise. The ring radius is 196/253 of
 *  the dial radius (≈38.7% of the dial width from center), matching the design. */
const RING_RADIUS_PCT = 38.7
const POSITIONS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180
  return {
    index: i,
    // Round to 4dp so SSR and hydration serialize identical style strings.
    x: Math.round((50 + RING_RADIUS_PCT * Math.sin(a)) * 10000) / 10000,
    y: Math.round((50 - RING_RADIUS_PCT * Math.cos(a)) * 10000) / 10000,
  }
})

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

/** Fisher–Yates shuffle (copy) using the supplied random fn. */
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
  const type = m.caliber_type
    ? caliberTypeLabels[m.caliber_type] ?? m.caliber_type
    : null
  const caliber = `${m.manufacturer ? m.manufacturer + " " : ""}${m.caliber_name}`.trim()
  return [type, caliber].filter(Boolean).join("  ·  ")
}

export function WatchDial({ watches, seed, stats }: WatchDialProps) {
  // The 12 watches shown around the dial — seeded so SSR and the first client
  // render agree, and freshly random on each page load.
  const dial = useMemo(() => {
    const eligible = watches.filter((w) => w.cover_photo_url)
    return shuffleWith(eligible, mulberry32(Math.floor(seed * 0xffffffff))).slice(0, 12)
  }, [watches, seed])

  // `now` drives the hands and the 5-second spotlight rotation. It starts null
  // (server + first client render) so hydration matches; a 1s interval then
  // takes over on the client.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    // Start the clock on the client. The first setState is the documented
    // exception to react-hooks/set-state-in-effect (server can't know the time).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const s = now ? now.getSeconds() : 0
  const m = now ? now.getMinutes() : 0
  const h = now ? now.getHours() : 0
  const hourDeg = (h % 12) * 30 + m * 0.5
  const minDeg = m * 6 + s * 0.1
  const secDeg = s * 6

  // Swap one second early — as the sweeping second hand's leading edge first
  // meets a marker (1s before its exact index), per the dial's minute spots.
  const activeIndex = Math.floor((s + 1) / HIGHLIGHT_SECONDS) % 12
  const active = dial[activeIndex] ?? null
  const activeLabel = `${String(activeIndex + 1).padStart(2, "0")} / 12`

  return (
    <div className="flex flex-col items-center">
      {/* Case + lugs + crown */}
      <div className="relative mx-auto aspect-square w-[88vw] max-w-[560px]">
        {/* Lug — top (two steel prongs + spring bar) */}
        <Lug position="top" />
        {/* Lug — bottom */}
        <Lug position="bottom" />
        {/* Crown — 3 o'clock */}
        <div
          aria-hidden="true"
          className="absolute z-[1] flex items-center"
          style={{ right: "-3.4%", top: "50%", transform: "translateY(-50%)" }}
        >
          <div
            style={{
              width: "2%",
              height: "3%",
              marginRight: "-0.35%",
              borderRadius: "1px 2px 2px 1px",
              background: "linear-gradient(180deg,#dadfe3,#909799 40%,#6c727a)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,.5), 0 1px 2px rgba(0,0,0,.4)",
            }}
          />
          <div
            style={{
              width: "3.9%",
              height: "8.2%",
              borderRadius: "2px 7px 7px 2px",
              background:
                "repeating-linear-gradient(90deg,#e6eaed 0 1.6px,#878d94 1.6px 3.2px)",
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
          {/* Dial — navy guilloché + sunburst rays */}
          <div
            className="absolute overflow-hidden rounded-full"
            style={{
              inset: "4.82%",
              boxShadow: "inset 0 0 0 3px #0c1014, inset 0 0 40px rgba(0,0,0,.6)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 42%, #16406b, #081a30 78%)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-50"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.05) 0deg 2deg, rgba(255,255,255,0) 2deg 9deg)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "inset 0 0 90px rgba(0,0,0,.55)" }}
            />

            {/* Monogram */}
            <div
              className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ top: "27%" }}
            >
              <div
                className="mx-auto mb-1.5 grid h-[26px] w-[26px] place-items-center rounded-full font-display text-[12px] sm:h-[30px] sm:w-[30px] sm:text-[13px]"
                style={{
                  border: "1px solid rgba(220,232,248,.45)",
                  color: "rgba(220,232,248,.7)",
                }}
              >
                CS
              </div>
              <div
                className="font-display text-[8px] sm:text-[10px]"
                style={{ letterSpacing: "4px", color: "rgba(220,232,248,.55)" }}
              >
                CALIBERSHELF
              </div>
            </div>

            {/* Watch thumbnails */}
            {POSITIONS.map((pos) => {
              const watch = dial[pos.index]
              if (!watch) return null
              const isActive = pos.index === activeIndex
              const focalX = watch.dial_focal_x ?? 50
              const focalY = watch.dial_focal_y ?? 50
              const zoom = watch.dial_zoom ?? 1
              return (
                <Link
                  key={watch.id}
                  href={`/watch/${watch.id}`}
                  aria-label={`${watch.brand.name} ${watch.model}`}
                  className="absolute overflow-hidden rounded-full"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: "14.62%",
                    height: "14.62%",
                    transform: `translate(-50%,-50%) scale(${isActive ? 1.297 : 1})`,
                    transition: "transform .55s cubic-bezier(.4,0,.2,1), box-shadow .55s ease",
                    zIndex: isActive ? 6 : 2,
                    opacity: isActive ? 1 : 0.8,
                    background: "#15181b",
                    boxShadow: isActive
                      ? "0 0 0 2px var(--primary), 0 0 26px 3px color-mix(in srgb, var(--primary) 53%, transparent), 0 8px 18px rgba(0,0,0,.55)"
                      : "0 3px 10px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.08)",
                  }}
                >
                  <Image
                    src={watch.cover_photo_url!}
                    alt={`${watch.brand.name} ${watch.model}`}
                    fill
                    unoptimized
                    sizes="120px"
                    className="object-cover"
                    style={{
                      objectPosition: `${focalX}% ${focalY}%`,
                      transform: zoom > 1 ? `scale(${zoom})` : undefined,
                    }}
                  />
                </Link>
              )
            })}

            {/* Hands */}
            <div className="pointer-events-none absolute inset-0 z-[7]">
              {/* Hour */}
              <div
                className="absolute left-1/2 origin-bottom"
                style={{
                  bottom: "50%",
                  height: "20%",
                  width: "3px",
                  marginLeft: "-1.5px",
                  borderRadius: "3px",
                  background: "linear-gradient(to top, #99a0a7, #fdfdfd)",
                  transform: `rotate(${hourDeg}deg)`,
                  transition: now ? "transform 0.3s ease" : undefined,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))",
                }}
              />
              {/* Minute */}
              <div
                className="absolute left-1/2 origin-bottom"
                style={{
                  bottom: "50%",
                  height: "31%",
                  width: "2.5px",
                  marginLeft: "-1.25px",
                  borderRadius: "2.5px",
                  background: "linear-gradient(to top, #99a0a7, #fdfdfd)",
                  transform: `rotate(${minDeg}deg)`,
                  transition: now ? "transform 0.3s ease" : undefined,
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))",
                }}
              />
              {/* Second */}
              <div
                className="absolute left-1/2 origin-bottom"
                style={{
                  bottom: "50%",
                  height: "39%",
                  width: "1.4px",
                  marginLeft: "-0.7px",
                  background: "#c8402f",
                  transform: `rotate(${secDeg}deg)`,
                  transition: now ? "transform 0.2s cubic-bezier(.4,2.2,.6,1)" : undefined,
                }}
              />
              {/* Center cap */}
              <div
                className="absolute left-1/2 top-1/2 h-[2.4%] w-[2.4%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "#0e1116", boxShadow: "0 0 0 1.5px #c8402f" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Caption — "now showing" */}
      <div
        key={activeIndex}
        className="mt-[88px] text-center sm:mt-[112px]"
        style={{ animation: "csfade .5s ease" }}
      >
        <div className="mb-3 font-mono text-[11px] tracking-[3px] text-primary">
          NOW SHOWING · {activeLabel}
        </div>
        <div className="font-display text-[28px] font-semibold leading-[1.05] sm:text-[34px]">
          {active ? active.brand.name : "—"}
        </div>
        {active && (
          <div className="mt-0.5 font-display text-[18px] italic text-muted-foreground sm:text-[20px]">
            {active.nickname || active.model}
          </div>
        )}
        {active && metaLine(active) && (
          <div className="mt-3 font-mono text-[12px] text-muted-foreground">
            {metaLine(active)}
          </div>
        )}
        {active && (
          <Link
            href={`/watch/${active.id}`}
            className="mt-5 inline-block rounded-[10px] border border-primary px-5 py-2 text-[13px] text-primary transition-colors hover:bg-primary/10"
          >
            View watch →
          </Link>
        )}
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
      style={{
        width: "49.6%",
        height: "14.3%",
        ...(top ? { top: "-8.2%" } : { bottom: "-8.2%" }),
      }}
    >
      {/* Left prong */}
      <div
        className="absolute"
        style={{
          left: "0.7%",
          ...prongEdge,
          width: "6.5%",
          height: "95%",
          borderRadius: prongRadius,
          background: "linear-gradient(100deg,#eef1f3,#a4aab0 48%,#5d636b)",
          boxShadow:
            "inset 1.5px 1px 1px rgba(255,255,255,.55), inset -1px 0 2px rgba(0,0,0,.3)",
        }}
      />
      {/* Right prong */}
      <div
        className="absolute"
        style={{
          right: "0.7%",
          ...prongEdge,
          width: "6.5%",
          height: "95%",
          borderRadius: prongRadius,
          background: "linear-gradient(-100deg,#eef1f3,#a4aab0 48%,#5d636b)",
          boxShadow:
            "inset -1.5px 1px 1px rgba(255,255,255,.55), inset 1px 0 2px rgba(0,0,0,.3)",
        }}
      />
      {/* Spring bar */}
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
      {/* End pins */}
      <div
        className="absolute"
        style={{
          left: 0,
          ...pinEdge,
          width: "2.5%",
          height: "9%",
          borderRadius: "2px",
          background: "#d4d9dd",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,.6)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: 0,
          ...pinEdge,
          width: "2.5%",
          height: "9%",
          borderRadius: "2px",
          background: "#d4d9dd",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,.6)",
        }}
      />
    </div>
  )
}
