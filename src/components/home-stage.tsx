"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LightTable } from "@/app/(dashboard)/dashboard/_components/light-table"
import { DisplayBoxHome } from "@/components/display-box-home"
import { DISPLAY_BOX_HOME_KEY } from "@/lib/preferences"
import { cn } from "@/lib/utils"
import type { LightTableStats, RotationSet } from "@/lib/queries/light-table"
import type { CurrentDisplayBox } from "@/lib/queries/display-box"

interface HomeStageProps {
  sets: RotationSet[]
  seed: number
  stats: LightTableStats
  displayBox: CurrentDisplayBox | null
}

export function HomeStage({ sets, seed, stats, displayBox }: HomeStageProps) {
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
          Light Table
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
        <LightTable sets={sets} seed={seed} stats={stats} />
      )}
    </div>
  )
}
