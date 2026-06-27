"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import { CaliberShelfLogo } from "@/components/calibershelf-logo"
import { DialWatchMarker } from "@/components/dial-watch-marker"
import type { WatchWithCover } from "@/lib/types/watch"

interface WatchDialProps {
  /** All watches eligible to appear on the dial (must have a cover photo). */
  watches: WatchWithCover[]
  /** Server-generated seed so the initial random layout matches across SSR/hydration. */
  seed: number
}

/** Compute hour and minute hand angles from current time */
function getHandAngles() {
  const now = new Date()
  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hourAngle = h * 30 + m * 0.5
  const minuteAngle = m * 6 + s * 0.1
  return { hourAngle, minuteAngle }
}

// useSyncExternalStore pattern for clock hands — subscribes to a 60s interval
let handListeners: Array<() => void> = []
let currentHands = { hourAngle: 0, minuteAngle: 0 }

function subscribeHands(cb: () => void) {
  handListeners.push(cb)
  if (handListeners.length === 1) {
    // First subscriber — start interval
    currentHands = getHandAngles()
    const id = setInterval(() => {
      currentHands = getHandAngles()
      handListeners.forEach((l) => l())
    }, 60_000)
    return () => {
      handListeners = handListeners.filter((l) => l !== cb)
      if (handListeners.length === 0) clearInterval(id)
    }
  }
  return () => {
    handListeners = handListeners.filter((l) => l !== cb)
  }
}

function getHandsSnapshot() {
  return currentHands
}

const serverHands = { hourAngle: 0, minuteAngle: 0 }
function getHandsServerSnapshot() {
  return serverHands
}

/** 12 positions around the dial — index 0 = 12 o'clock, 1 = 1 o'clock, etc. */
const POSITIONS = Array.from({ length: 12 }, (_, i) => {
  const angleDeg = i * 30 - 90 // -90 so index 0 starts at top (12 o'clock)
  const angleRad = (angleDeg * Math.PI) / 180
  const radius = 33 // percentage from center — keeps the larger markers inside the dial face
  return {
    index: i,
    hourLabel: i === 0 ? 12 : i,
    angleDeg,
    // Round to 4 decimals so server and client serialize identical style strings
    // (raw Math.cos/sin floats hydrate as a mismatch otherwise).
    x: Math.round((50 + radius * Math.cos(angleRad)) * 10000) / 10000,
    y: Math.round((50 + radius * Math.sin(angleRad)) * 10000) / 10000,
    // Rotation for tick marks — points toward center
    tickRotation: i * 30,
  }
})

// Auto-zoom hold window: the second hand sweeps 6°/sec, so 18° ≈ 3 seconds.
// A marker stays zoomed for this long as the hand passes over its position.
const AUTO_HOLD_DEG = 18

// Polished silver bezel: a top-down dome highlight layered over rotational
// conic reflections (4 bright + 4 dark sweeps) so the ring reads as round,
// shiny stainless steel rather than a flat gray disc.
const SILVER_BEZEL =
  "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.18) 100%), " +
  "conic-gradient(from 0deg, " +
  "oklch(0.88 0.004 240) 0deg, oklch(0.55 0.006 248) 45deg, " +
  "oklch(0.85 0.004 240) 90deg, oklch(0.5 0.006 248) 135deg, " +
  "oklch(0.9 0.004 240) 180deg, oklch(0.55 0.006 248) 225deg, " +
  "oklch(0.84 0.004 240) 270deg, oklch(0.5 0.006 248) 315deg, " +
  "oklch(0.88 0.004 240) 360deg)"
// Bright polished-steel gradient for small parts (lugs, crown stem/knob).
const STEEL_PART =
  "linear-gradient(135deg, oklch(0.86 0.006 240), oklch(0.52 0.008 248) 45%, oklch(0.72 0.008 240) 70%, oklch(0.46 0.006 252))"

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

/** Map a watch list onto the 12 dial positions, padding empty slots with null. */
function toAssignment(list: WatchWithCover[]): (WatchWithCover | null)[] {
  const out: (WatchWithCover | null)[] = Array(12).fill(null)
  for (let i = 0; i < 12; i++) out[i] = list[i] ?? null
  return out
}

export function WatchDial({ watches, seed }: WatchDialProps) {
  const hands = useSyncExternalStore(subscribeHands, getHandsSnapshot, getHandsServerSnapshot)
  const secondHandRef = useRef<HTMLDivElement>(null)

  // Only watches with a cover photo can appear on the dial.
  const eligible = useMemo(
    () => watches.filter((w) => w.cover_photo_url),
    [watches]
  )

  // Initial 12 unique watches — seeded so SSR and the first client render agree
  // (and so the layout is freshly random on each page load, with no flash).
  const [assignments, setAssignments] = useState<(WatchWithCover | null)[]>(() =>
    toAssignment(shuffleWith(eligible, mulberry32(Math.floor(seed * 0xffffffff))))
  )

  // Which marker is auto-zoomed right now (driven by the sweeping second hand).
  const [autoActiveIndex, setAutoActiveIndex] = useState<number | null>(null)
  // Tracks how many markers the cursor is currently over. While > 0, the user is
  // hovering and manual hover takes precedence — auto-zoom pauses.
  const hoverCountRef = useRef(0)
  const userHoveringRef = useRef(false)
  // Last position the second hand was over, used to detect when a zoom completes.
  const lastActiveRef = useRef<number | null>(null)

  function handleMarkerHover(hovering: boolean) {
    hoverCountRef.current = Math.max(0, hoverCountRef.current + (hovering ? 1 : -1))
    userHoveringRef.current = hoverCountRef.current > 0
    if (userHoveringRef.current) {
      setAutoActiveIndex(null)
      lastActiveRef.current = null
    }
  }

  // Replace the watch at position `p` with a random one not already on the dial,
  // keeping all 12 displayed watches unique.
  const swapPosition = useCallback(
    (p: number) => {
      setAssignments((prev) => {
        if (eligible.length <= 12) return prev // no spare watches to rotate in
        const shown = new Set(prev.map((w) => w?.id))
        const candidates = eligible.filter((w) => !shown.has(w.id))
        if (candidates.length === 0) return prev
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        const next = prev.slice()
        next[p] = pick
        return next
      })
    },
    [eligible]
  )

  // Set second hand CSS animation start angle (DOM-only, no state).
  // Includes the millisecond fraction so the visual hand aligns with the
  // time-derived angle the auto-zoom ticker computes below.
  useEffect(() => {
    if (secondHandRef.current) {
      const now = new Date()
      const s = now.getSeconds() + now.getMilliseconds() / 1000
      secondHandRef.current.style.setProperty("--second-start", `${s * 6}deg`)
    }
  }, [])

  // Auto-zoom ticker: follow the second hand and zoom whichever position it is
  // sweeping over. When a position's zoom finishes, swap in a fresh watch.
  // Pauses entirely while the user is hovering.
  useEffect(() => {
    if (eligible.length === 0) return

    const id = setInterval(() => {
      if (userHoveringRef.current) {
        setAutoActiveIndex(null)
        lastActiveRef.current = null
        return
      }
      const now = new Date()
      // Hand angle clockwise from 12 o'clock; position i sits at i*30°.
      const handAngle = ((now.getSeconds() + now.getMilliseconds() / 1000) * 6) % 360
      let next: number | null = null
      for (let i = 0; i < 12; i++) {
        const delta = (((handAngle - i * 30) % 360) + 360) % 360
        if (delta < AUTO_HOLD_DEG) {
          next = i
          break
        }
      }
      // The hand just left a position (its 3s zoom completed) — rotate that watch.
      const prev = lastActiveRef.current
      if (prev !== null && prev !== next) {
        swapPosition(prev)
      }
      lastActiveRef.current = next
      setAutoActiveIndex((cur) => (cur === next ? cur : next))
    }, 200)

    return () => clearInterval(id)
  }, [eligible, swapPosition])

  return (
    <div
      role="navigation"
      aria-label="Watches"
      className="relative mx-auto aspect-square w-[82vw] max-w-[560px]"
    >
      {/* Layer 0: Strap + lugs + crown — rendered first so the case (bezel)
          paints on top of them, letting their ends tuck under the case like a
          real wristwatch. The protruding parts (strap ends, crown knob) stay
          visible beyond the round case. */}

      {/* Strap — top piece, extends up and behind the case */}
      <div
        aria-hidden="true"
        className="watch-strap absolute"
        style={{
          left: "29%",
          width: "42%",
          top: "-34%",
          height: "42%",
          borderRadius: "18px 18px 6px 6px",
        }}
      />
      {/* Strap — bottom piece, extends down and behind the case */}
      <div
        aria-hidden="true"
        className="watch-strap absolute"
        style={{
          left: "29%",
          width: "42%",
          bottom: "-34%",
          height: "42%",
          borderRadius: "6px 6px 18px 18px",
        }}
      />

      {/* Lugs — four polished-steel horns bridging the case to the strap */}
      {[
        { left: "27.5%", right: undefined, top: "3%", bottom: undefined, rotate: 22 },
        { left: undefined, right: "27.5%", top: "3%", bottom: undefined, rotate: -22 },
        { left: "27.5%", right: undefined, top: undefined, bottom: "3%", rotate: -22 },
        { left: undefined, right: "27.5%", top: undefined, bottom: "3%", rotate: 22 },
      ].map((lug, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="absolute"
          style={{
            left: lug.left,
            right: lug.right,
            top: lug.top,
            bottom: lug.bottom,
            width: "9%",
            height: "16%",
            background: STEEL_PART,
            borderRadius: "5px",
            transform: `rotate(${lug.rotate}deg)`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)",
          }}
        />
      ))}

      {/* Crown — fluted silver crown at 3 o'clock */}
      {/* Stem: short steel neck tucked under the case edge */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          right: "-1.5%",
          top: "50%",
          width: "4.5%",
          height: "6%",
          transform: "translateY(-50%)",
          background: STEEL_PART,
          borderRadius: "2px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      />
      {/* Knob: fluted cylinder protruding past the case */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          right: "-5.5%",
          top: "50%",
          width: "5.5%",
          height: "13%",
          transform: "translateY(-50%)",
          background:
            "repeating-linear-gradient(90deg, oklch(0.9 0.005 240) 0px, oklch(0.9 0.005 240) 2px, oklch(0.52 0.008 248) 2px, oklch(0.52 0.008 248) 4px)",
          borderRadius: "3px",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.45)",
        }}
      />

      {/* Layer 1: Outer bezel — polished silver, domed */}
      <div
        className="absolute inset-0 rounded-full shadow-2xl"
        style={{
          background: SILVER_BEZEL,
          boxShadow:
            "0 10px 38px rgba(0,0,0,0.6), inset 0 3px 5px rgba(255,255,255,0.6), inset 0 -4px 7px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(255,255,255,0.14)",
        }}
      />

      {/* Layer 2: Inner dial face */}
      <div
        className={cn(
          "dial-sunburst absolute rounded-full",
          "inset-[5%]",
        )}
        style={{
          boxShadow:
            "inset 0 2px 8px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3)",
        }}
      />

      {/* Layer 3: Minute track — subtle ring */}
      <div
        className="absolute rounded-full border border-[oklch(0.85_0.03_85)]/10"
        style={{ inset: "9%" }}
      />

      {/* Layer 4: Hour markers / Watch positions */}
      {POSITIONS.map((pos) => {
        const watch = assignments[pos.index]

        return (
          <div
            key={pos.index}
            className={cn(
              "absolute hover:z-50",
              autoActiveIndex === pos.index && "z-50",
            )}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {watch ? (
              <DialWatchMarker
                watch={watch}
                angleDeg={pos.angleDeg}
                autoActive={autoActiveIndex === pos.index}
                onHoverChange={handleMarkerHover}
              />
            ) : (
              /* Empty tick mark — gold index pointing at center */
              <div aria-hidden="true">
                <div
                  className="h-3 w-[2px] rounded-full bg-[oklch(0.85_0.03_85)]/60 sm:h-4"
                  style={{
                    transform: `rotate(${pos.tickRotation}deg)`,
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Layer 5: Clock hands */}
      <div className="pointer-events-none absolute inset-0">
        {/* Hour hand */}
        <div
          className="absolute left-1/2 origin-bottom"
          style={{
            bottom: "50%",
            height: "22%",
            width: "3px",
            marginLeft: "-1.5px",
            background: "linear-gradient(to top, oklch(0.85 0.03 85), oklch(0.75 0.02 85))",
            borderRadius: "2px",
            transform: `rotate(${hands.hourAngle}deg)`,
            transition: "transform 0.3s ease",
            boxShadow: "0 0 4px rgba(0,0,0,0.5)",
          }}
        />
        {/* Minute hand */}
        <div
          className="absolute left-1/2 origin-bottom"
          style={{
            bottom: "50%",
            height: "30%",
            width: "2px",
            marginLeft: "-1px",
            background: "linear-gradient(to top, oklch(0.85 0.03 85), oklch(0.9 0.02 85))",
            borderRadius: "1.5px",
            transform: `rotate(${hands.minuteAngle}deg)`,
            transition: "transform 0.3s ease",
            boxShadow: "0 0 3px rgba(0,0,0,0.4)",
          }}
        />
        {/* Second hand */}
        <div
          ref={secondHandRef}
          className="absolute left-1/2 origin-bottom"
          style={{
            bottom: "50%",
            height: "34%",
            width: "1px",
            marginLeft: "-0.5px",
            background: "oklch(0.65 0.2 27)",
            borderRadius: "1px",
            animation: "secondHandSweep 60s linear infinite",
            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
          }}
        />
        {/* Center cap */}
        <div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-4 sm:w-4"
          style={{
            background: "radial-gradient(circle at 35% 35%, oklch(0.85 0.03 85), oklch(0.5 0.02 80))",
            boxShadow: "0 0 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Layer 6: Brand logo + name — grouped above center */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ top: "26%" }}
      >
        <CaliberShelfLogo size={36} className="opacity-70 sm:hidden" />
        <CaliberShelfLogo size={48} className="hidden opacity-70 sm:block" />
        <span
          className="text-[9px] font-light uppercase tracking-[0.3em] text-[oklch(0.65_0.02_85)] sm:text-[11px]"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          CaliberShelf
        </span>
      </div>
    </div>
  )
}
