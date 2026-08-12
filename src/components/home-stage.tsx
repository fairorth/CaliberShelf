"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { WatchHero } from "@/components/watch-hero"
import { DisplayBoxHome } from "@/components/display-box-home"
import { DISPLAY_BOX_HOME_KEY } from "@/lib/preferences"
import { cn } from "@/lib/utils"
import type { WatchWithCover } from "@/lib/types/watch"
import type { CurrentDisplayBox } from "@/lib/queries/display-box"

interface HomeStageProps {
  watches: WatchWithCover[]
  seed: number
  stats: { watches: number; brands: number; wornThisWeek: number }
  displayBox: CurrentDisplayBox | null
}

export function HomeStage({ watches, seed, stats, displayBox }: HomeStageProps) {
  const [showBox, setShowBox] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only preference
    setShowBox(localStorage.getItem(DISPLAY_BOX_HOME_KEY) === "1")
  }, [])

  function choose(next: boolean) {
    setShowBox(next)
    localStorage.setItem(DISPLAY_BOX_HOME_KEY, next ? "1" : "0")
  }

  const pill = "px-3.5 py-1.5 text-xs font-medium transition-colors"
  const active = "bg-brass text-brass-foreground"
  const idle = "text-muted-foreground hover:text-foreground"

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative z-10 inline-flex overflow-hidden rounded-full border border-border">
        <button
          type="button"
          onClick={() => choose(false)}
          aria-pressed={!showBox}
          className={cn(pill, !showBox ? active : idle)}
        >
          Living Dial
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          aria-pressed={showBox}
          className={cn(pill, showBox ? active : idle)}
        >
          Display Box
        </button>
      </div>

      {showBox ? (
        displayBox && displayBox.watches.length > 0 ? (
          <DisplayBoxHome box={displayBox} />
        ) : (
          <div className="mx-auto max-w-md rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No display box yet. Head to the{" "}
              <Link href="/wear-log" className="font-medium text-primary underline">
                Wear Log
              </Link>{" "}
              and press <b>Create Display Box</b> to assemble this week&apos;s rotation.
            </p>
          </div>
        )
      ) : (
        // Extra top padding clears the watch's top lug, which overhangs the case.
        <div className="pt-10 sm:pt-14">
          <WatchHero watches={watches} seed={seed} stats={stats} />
        </div>
      )}
    </div>
  )
}
