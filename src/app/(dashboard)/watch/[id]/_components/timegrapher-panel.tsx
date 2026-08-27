"use client"

import { Activity, X } from "lucide-react"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { SectionCard, SECTION_LABEL } from "@/components/section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createTimegrapherRun,
  deleteTimegrapherRun,
  type TimegrapherActionState,
} from "@/lib/actions/timegrapher-actions"
import { toast } from "sonner"
import type { TimegrapherRun } from "@/lib/types/watch"

const FIELD = "bg-card border-border text-xs md:text-xs"

interface TimegrapherPanelProps {
  watchId: string
  runs: TimegrapherRun[]
  /** Lift angle of the watch's linked movement, if one is set and has it. */
  liftAngle?: string | null
  /** Caliber name of the linked movement, for context in the hint. */
  caliberName?: string | null
  /** View page: the same section, minus the controls that change it. */
  readOnly?: boolean
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—"
  const sign = rate > 0 ? "+" : ""
  return `${sign}${rate} s/d`
}

function rateAccent(rate: number | null): string {
  if (rate === null) return ""
  const mag = Math.abs(rate)
  if (mag <= 7) return "text-[var(--chart-2)]"
  if (mag <= 15) return "text-[var(--warning)]"
  return "text-destructive"
}

function formatRunDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Append a degree sign to a bare numeric lift angle (values are stored plain). */
function formatLiftAngle(v: string): string {
  const t = v.trim()
  return /\d$/.test(t) ? `${t}°` : t
}

export function TimegrapherPanel({
  watchId,
  runs,
  liftAngle = null,
  caliberName = null,
  readOnly = false,
}: TimegrapherPanelProps) {
  const [state, formAction, isPending] = useActionState<TimegrapherActionState, FormData>(
    createTimegrapherRun,
    {}
  )
  const [showForm, setShowForm] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success("Timegrapher run saved!")
      formRef.current?.reset()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI to a completed server action
      setShowForm(false)
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  const today = new Date().toISOString().slice(0, 10)

  function handleDelete(runId: string) {
    startDelete(async () => {
      const result = await deleteTimegrapherRun(runId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Run deleted")
      }
    })
  }

  return (
    <SectionCard
      icon={Activity}
      title="Timegrapher"
      contentClassName="space-y-3"
      action={
        readOnly ? undefined : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "Add run"}
          </Button>
        )
      }
    >
      {/* Add-run form */}
      {showForm && !readOnly && (
        <form
          ref={formRef}
          action={formAction}
          className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
        >
          <input type="hidden" name="watch_id" value={watchId} />

          {/* Movement lift angle — so you can set the timegrapher to match */}
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
            {liftAngle ? (
              <span>
                <span className="text-muted-foreground">Lift angle</span>{" "}
                <span className="font-mono font-semibold text-foreground">
                  {formatLiftAngle(liftAngle)}
                </span>
                {caliberName && (
                  <span className="text-muted-foreground"> · {caliberName}</span>
                )}
                <span className="text-muted-foreground">
                  {" "}— set your timegrapher to match.
                </span>
              </span>
            ) : caliberName ? (
              <span className="text-muted-foreground">
                No lift angle on record for {caliberName}. Add it under{" "}
                <Link
                  href="/config?tab=movements"
                  className="underline hover:text-foreground"
                >
                  Config → Movements
                </Link>
                .
              </span>
            ) : (
              <span className="text-muted-foreground">
                No movement linked to this watch — assign one to see its lift angle.
              </span>
            )}
          </div>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="space-y-1">
              <FormLabel className={SECTION_LABEL} htmlFor="tg_run_date">Date</FormLabel>
              <Input
                id="tg_run_date"
                name="run_date"
                type="date"
                defaultValue={today}
                max={today}
                required
                className={FIELD}
              />
            </div>
            <div className="space-y-1">
              <FormLabel className={SECTION_LABEL} htmlFor="tg_rate">Rate (s/day)</FormLabel>
              <Input
                id="tg_rate"
                name="rate_sec_per_day"
                type="number"
                step="0.1"
                className={FIELD}
              />
            </div>
            <div className="space-y-1">
              <FormLabel className={SECTION_LABEL} htmlFor="tg_amplitude">Amplitude (°)</FormLabel>
              <Input
                id="tg_amplitude"
                name="amplitude_deg"
                type="number"
                step="0.1"
                className={FIELD}
                min="100"
                max="360"
              />
            </div>
            <div className="space-y-1">
              <FormLabel className={SECTION_LABEL} htmlFor="tg_beat_error">Beat Error (ms)</FormLabel>
              <Input
                id="tg_beat_error"
                name="beat_error_ms"
                type="number"
                step="0.1"
                className={FIELD}
                min="0"
                max="20"
              />
            </div>
          </div>
          <div className="space-y-1">
            <FormLabel className={SECTION_LABEL} htmlFor="tg_notes">Notes</FormLabel>
            <Textarea
              id="tg_notes"
              name="notes"
              rows={2}
              className={FIELD}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Run"}
            </Button>
          </div>
        </form>
      )}

      {/* Run history */}
      {runs.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground">No runs recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 text-left text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3 font-bold">Date</th>
                <th className="py-2 pr-3 text-right font-bold">Rate</th>
                <th className="py-2 pr-3 text-right font-bold">Ampl.</th>
                <th className="py-2 pr-3 text-right font-bold">Beat Err.</th>
                {!readOnly && <th className="py-2 pl-1 w-8" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {runs.map((run) => (
                <tr key={run.id} className="group align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{formatRunDate(run.run_date)}</div>
                    {run.notes && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {run.notes}
                      </div>
                    )}
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono tabular-nums ${rateAccent(run.rate_sec_per_day)}`}>
                    {formatRate(run.rate_sec_per_day)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {run.amplitude_deg !== null ? `${run.amplitude_deg}°` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {run.beat_error_ms !== null ? `${run.beat_error_ms} ms` : "—"}
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(run.id)}
                        disabled={isDeleting}
                        className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                        title="Delete run"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}
