"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface TimegrapherPanelProps {
  watchId: string
  runs: TimegrapherRun[]
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—"
  const sign = rate > 0 ? "+" : ""
  return `${sign}${rate} s/d`
}

function rateAccent(rate: number | null): string {
  if (rate === null) return ""
  const mag = Math.abs(rate)
  if (mag <= 7) return "text-emerald-700 dark:text-emerald-400"
  if (mag <= 15) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400"
}

function formatRunDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function TimegrapherPanel({ watchId, runs }: TimegrapherPanelProps) {
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
    <Card className="overflow-hidden border-l-4 border-l-emerald-400/40 dark:border-l-emerald-500/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-transparent dark:from-emerald-950/30 dark:via-emerald-900/10 dark:to-transparent pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 text-sm shadow-sm">
            📈
          </span>
          Timegrapher
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ Add Run"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add-run form */}
        {showForm && (
          <form
            ref={formRef}
            action={formAction}
            className="space-y-4 rounded-md border border-border/60 bg-muted/30 p-4"
          >
            <input type="hidden" name="watch_id" value={watchId} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FormLabel htmlFor="tg_run_date">Date</FormLabel>
                <Input
                  id="tg_run_date"
                  name="run_date"
                  type="date"
                  defaultValue={today}
                  max={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="tg_rate">Rate (s/day)</FormLabel>
                <Input
                  id="tg_rate"
                  name="rate_sec_per_day"
                  type="number"
                  step="0.1"
                  placeholder="e.g. +3.5 or -2"
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="tg_amplitude">Amplitude (°)</FormLabel>
                <Input
                  id="tg_amplitude"
                  name="amplitude_deg"
                  type="number"
                  step="0.1"
                  min="100"
                  max="360"
                  placeholder="e.g. 285"
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="tg_beat_error">Beat Error (ms)</FormLabel>
                <Input
                  id="tg_beat_error"
                  name="beat_error_ms"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  placeholder="e.g. 0.3"
                />
              </div>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="tg_notes">Notes (optional)</FormLabel>
              <Textarea
                id="tg_notes"
                name="notes"
                placeholder="e.g. Dial up, fully wound, after service..."
                rows={2}
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
          <p className="py-2 text-sm text-muted-foreground italic">
            No timegrapher runs logged yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <th className="py-2 pr-3 font-bold">Date</th>
                  <th className="py-2 pr-3 text-right font-bold">Rate</th>
                  <th className="py-2 pr-3 text-right font-bold">Ampl.</th>
                  <th className="py-2 pr-3 text-right font-bold">Beat Err.</th>
                  <th className="py-2 pl-1 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {runs.map((run) => (
                  <tr key={run.id} className="group align-top">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{formatRunDate(run.run_date)}</div>
                      {run.notes && (
                        <div className="mt-0.5 text-xs italic text-muted-foreground">
                          {run.notes}
                        </div>
                      )}
                    </td>
                    <td className={`py-2.5 pr-3 text-right font-medium tabular-nums ${rateAccent(run.rate_sec_per_day)}`}>
                      {formatRate(run.rate_sec_per_day)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {run.amplitude_deg !== null ? `${run.amplitude_deg}°` : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {run.beat_error_ms !== null ? `${run.beat_error_ms} ms` : "—"}
                    </td>
                    <td className="py-2.5 pl-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(run.id)}
                        disabled={isDeleting}
                        className="text-xs text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                        title="Delete run"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
