"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CaliberShelfLogo } from "@/components/calibershelf-logo"
import { DialCategoryMarker } from "@/components/dial-category-marker"
import { Button } from "@/components/ui/button"
import type { CategoryWithWatches } from "@/lib/types/watch"

interface WatchDialProps {
  categories: CategoryWithWatches[]
  totalWatches: number
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
  const radius = 40 // percentage from center
  return {
    index: i,
    hourLabel: i === 0 ? 12 : i,
    x: 50 + radius * Math.cos(angleRad),
    y: 50 + radius * Math.sin(angleRad),
    // Rotation for tick marks — points toward center
    tickRotation: i * 30,
  }
})

export function WatchDial({ categories, totalWatches }: WatchDialProps) {
  const hands = useSyncExternalStore(subscribeHands, getHandsSnapshot, getHandsServerSnapshot)
  const secondHandRef = useRef<HTMLDivElement>(null)

  // Set second hand CSS animation start angle (DOM-only, no state)
  useEffect(() => {
    if (secondHandRef.current) {
      const s = new Date().getSeconds()
      secondHandRef.current.style.setProperty("--second-start", `${s * 6}deg`)
    }
  }, [])

  // Map categories to dial positions (ordered by display_order, max 12)
  const categoryPositions = new Map<number, CategoryWithWatches>()
  categories.slice(0, 12).forEach((c, i) => {
    categoryPositions.set(i, c)
  })

  return (
    <div
      role="navigation"
      aria-label="Display cases"
      className="relative mx-auto aspect-square w-[85vw] max-w-[600px]"
    >
      {/* Layer 1: Outer bezel — brushed steel */}
      <div
        className="absolute inset-0 rounded-full shadow-2xl"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.45 0.015 80), oklch(0.30 0.01 70) 30%, oklch(0.38 0.012 75) 60%, oklch(0.25 0.008 60))",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)",
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

      {/* Layer 4: Hour markers / Category positions */}
      {POSITIONS.map((pos) => {
        const category = categoryPositions.get(pos.index)

        return (
          <div
            key={pos.index}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {category ? (
              <DialCategoryMarker
                category={category}
                hourPosition={pos.hourLabel}
              />
            ) : (
              /* Empty tick mark — gold index pointing at center */
              <div
                className="flex flex-col items-center gap-0.5"
                aria-hidden="true"
              >
                <div
                  className="h-3 w-[2px] rounded-full bg-[oklch(0.85_0.03_85)]/60 sm:h-4"
                  style={{
                    transform: `rotate(${pos.tickRotation}deg)`,
                  }}
                />
                <span className="text-[8px] font-light text-[oklch(0.85_0.03_85)]/40 sm:text-[10px]">
                  {pos.hourLabel}
                </span>
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

      {/* Layer 6: Brand logo — positioned below 12 o'clock like a luxury dial */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ top: "18%" }}
      >
        <CaliberShelfLogo size={40} className="opacity-70 sm:hidden" />
        <CaliberShelfLogo size={56} className="hidden opacity-70 sm:block" />
      </div>

      {/* Layer 7: Center content — brand name + stats */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto flex flex-col items-center gap-0.5 text-center">
          <span
            className="text-[9px] font-light uppercase tracking-[0.3em] text-[oklch(0.65_0.02_85)] sm:text-[11px]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            CaliberShelf
          </span>

          {totalWatches > 0 ? (
            <span
              className="text-[8px] text-[oklch(0.5_0.02_85)] sm:text-[10px]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            >
              {totalWatches} {totalWatches === 1 ? "watch" : "watches"}
            </span>
          ) : categories.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-7 border-[oklch(0.85_0.03_85)]/30 bg-transparent text-[10px] text-[oklch(0.85_0.03_85)]/80 hover:bg-[oklch(0.85_0.03_85)]/10 sm:text-xs"
              render={<Link href="/config" />}
            >
              Create your first category
            </Button>
          ) : (
            <span
              className="text-[8px] text-[oklch(0.5_0.02_85)] sm:text-[10px]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            >
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
