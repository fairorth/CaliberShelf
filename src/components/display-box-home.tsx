"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { setWearingWatch } from "@/lib/actions/display-box-actions"
import type { CurrentDisplayBox, DisplayBoxEntry } from "@/lib/queries/display-box"

const CASE_BG =
  "repeating-linear-gradient(97deg, rgba(0,0,0,.05) 0 3px, rgba(255,255,255,.02) 3px 7px)," +
  "linear-gradient(112deg,#6b4426 0%,#7d5230 22%,#5f3c22 46%,#84592f 68%,#5a3a20 100%)"
const TRAY_BG =
  "repeating-linear-gradient(93deg, rgba(0,0,0,.06) 0 4px, rgba(255,255,255,.015) 4px 9px)," +
  "linear-gradient(120deg,#4d3018,#5c3a1f 50%,#472c15)"
const SLOT_BG = "linear-gradient(#2f1d0e,#3b2513)"

function Cell({
  entry,
  isWearing,
  disabled,
  onWear,
}: {
  entry: DisplayBoxEntry
  isWearing: boolean
  disabled: boolean
  onWear: (id: string) => void
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl p-2.5 sm:p-3"
      style={{
        background: SLOT_BG,
        boxShadow: isWearing
          ? "0 0 0 2px rgba(201,162,75,.9) inset, 0 8px 16px rgba(0,0,0,.5) inset"
          : "0 8px 16px rgba(0,0,0,.5) inset, 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#20140a] shadow-[0_4px_10px_rgba(0,0,0,.5)_inset]">
        {entry.coverUrl ? (
          <Image
            src={entry.coverUrl}
            alt={entry.name}
            fill
            sizes="(max-width: 640px) 42vw, 190px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-[#7a6448]">
            ⌚
          </div>
        )}
        {entry.boxWearCount > 0 && (
          <span
            className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur-sm"
            title={`Worn ${entry.boxWearCount}× from this box`}
          >
            ⌚ {entry.boxWearCount}
          </span>
        )}
      </div>

      <div className="w-full text-center leading-tight">
        <div className="truncate text-[11px] font-semibold text-[#efe7d5]">{entry.name}</div>
        {entry.box && (
          <div className="mt-0.5 font-mono text-[9px] text-amber-300/80">▣ {entry.box}</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onWear(entry.watchId)}
        disabled={disabled && !isWearing}
        className={
          isWearing
            ? "w-full rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-2 py-1.5 text-[11px] font-bold text-emerald-300"
            : "w-full rounded-lg border border-amber-500/40 bg-gradient-to-b from-[#f0d488] to-[#d9b656] px-2 py-1.5 text-[11px] font-bold text-[#20242b] transition hover:brightness-105 disabled:opacity-50"
        }
      >
        {isWearing ? "Wearing ⌚" : "Wear now"}
      </button>
    </div>
  )
}

export function DisplayBoxHome({ box }: { box: CurrentDisplayBox }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [wearingId, setWearingId] = useState<string | null>(box.wearingWatchId)

  // Resync when the server data changes (after a refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to refreshed server truth
    setWearingId(box.wearingWatchId)
  }, [box.wearingWatchId])

  function wear(id: string) {
    if (id === wearingId) return
    setWearingId(id) // optimistic single-select
    startTransition(async () => {
      const res = await setWearingWatch(id)
      if (res.error) {
        toast.error(res.error)
        setWearingId(box.wearingWatchId)
      } else {
        toast.success("Now wearing — wear logged!")
        router.refresh()
      }
    })
  }

  const rows: DisplayBoxEntry[][] = [
    box.watches.slice(0, 4),
    box.watches.slice(4, 8),
    box.watches.slice(8, 11),
  ]

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div
        className="relative rounded-[26px] border border-[#3c2614] p-4 sm:p-6"
        style={{
          backgroundImage: CASE_BG,
          boxShadow:
            "0 40px 80px -30px rgba(0,0,0,.85), 0 2px 0 rgba(255,255,255,.10) inset, 0 -18px 40px rgba(0,0,0,.35) inset",
        }}
      >
        {/* brass hinges */}
        <div className="pointer-events-none absolute -top-[6px] left-0 right-0 flex justify-center gap-40">
          <span className="h-3 w-16 rounded bg-gradient-to-b from-[#e7c977] to-[#9c7726] shadow" />
          <span className="h-3 w-16 rounded bg-gradient-to-b from-[#e7c977] to-[#9c7726] shadow" />
        </div>

        <div
          className="space-y-3 rounded-2xl p-3 sm:p-4"
          style={{
            backgroundImage: TRAY_BG,
            boxShadow: "0 14px 30px rgba(0,0,0,.55) inset, 0 1px 0 rgba(255,255,255,.06)",
          }}
        >
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
            >
              {row.map((entry) => (
                <Cell
                  key={entry.watchId}
                  entry={entry}
                  isWearing={wearingId === entry.watchId}
                  disabled={isPending}
                  onWear={wear}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
