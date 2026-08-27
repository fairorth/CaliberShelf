"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Loader2, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CheckPriceButtonProps {
  watchId: string
  /** false = disabled with an explanatory tooltip (V6). */
  trackingEnabled: boolean
}

interface TraceStep {
  seq: number
  kind: string
  label: string
  ok: boolean
  detail?: string
  ms: number | null
}

interface JobView {
  runId: string
  status: "running" | "success" | "failed" | "unknown"
  elapsedMs: number
  steps: TraceStep[]
  error: string | null
}

const POLL_MS = 2000

function formatElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

function StepIcon({ kind, ok }: { kind: string; ok: boolean }) {
  const className = cn("h-3.5 w-3.5 shrink-0", !ok && "text-destructive")
  if (kind === "web_fetch") return <Globe className={className} aria-hidden="true" />
  if (kind === "web_search") return <Search className={className} aria-hidden="true" />
  return <Loader2 className={cn(className, "opacity-50")} aria-hidden="true" />
}

/**
 * "Check price now" (§3.3) — starts a background research job and polls it.
 *
 * The run is an agentic web search that has been observed taking anywhere from
 * 100 seconds to 33 minutes, so the old shape (await one long fetch behind a
 * spinner labelled "~40s") had no honest way to report itself. Now the POST
 * returns a run id at once, this polls it, and every search and fetch shows up
 * with its own duration as it happens — which is also the trace we need to see
 * where the time actually goes.
 *
 * Navigating away does not cancel anything: the job lives on the server, and
 * coming back re-attaches to it.
 */
export function CheckPriceButton({ watchId, trackingEnabled }: CheckPriceButtonProps) {
  const router = useRouter()
  const [job, setJob] = useState<JobView | null>(null)
  const [starting, setStarting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const running = job?.status === "running" || starting

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const settle = useCallback(
    (view: JobView) => {
      stopPolling()
      if (view.status === "success") {
        toast.success(`Estimate updated in ${formatElapsed(view.elapsedMs)}.`)
        router.refresh()
      } else if (view.status === "failed") {
        toast.error(view.error ?? "The price check failed.")
      }
    },
    [router, stopPolling]
  )

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/price-check/${watchId}`)
      if (!res.ok) return
      const view = (await res.json()) as JobView
      if (view.status === "unknown") {
        // The server restarted mid-run. Say so rather than spinning forever.
        stopPolling()
        setJob(null)
        toast.error("The run was lost when the server restarted.")
        return
      }
      setJob(view)
      if (view.status !== "running") settle(view)
    } catch {
      // a dropped poll is not a failed run — the next tick retries
    }
  }, [watchId, settle, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(poll, POLL_MS)
  }, [poll, stopPolling])

  // Re-attach to a run already going for this watch (a reload, or a return
  // from another page). The job outlives the tab that started it.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/price-check/${watchId}`)
        if (!res.ok || cancelled) return
        const view = (await res.json()) as JobView
        if (cancelled || view.status !== "running") return
        setJob(view)
        startPolling()
      } catch {
        // no run to re-attach to
      }
    })()
    return () => {
      cancelled = true
    }
  }, [watchId, startPolling])

  useEffect(() => stopPolling, [stopPolling])

  async function run() {
    setStarting(true)
    setJob(null)
    try {
      const res = await fetch(`/api/price-check/${watchId}`, { method: "POST" })
      const body = await res.json().catch(() => null)
      if (res.ok || res.status === 202) {
        setJob(body as JobView)
        startPolling()
      } else if (res.status === 429) {
        toast.error(body?.error ?? "Already checked within the last hour.")
      } else {
        toast.error(body?.error ?? "The price check could not be started.")
      }
    } catch {
      toast.error("The price check could not be started.")
    } finally {
      setStarting(false)
    }
  }

  // Newest first: the interesting step is the one happening now.
  const steps = job?.steps ? [...job.steps].reverse() : []

  return (
    <div className="space-y-2.5">
      <span
        title={
          trackingEnabled
            ? undefined
            : "Turn on price checking on the edit form first (requires a reference number)."
        }
      >
        <Button
          onClick={run}
          disabled={!trackingEnabled || running}
          className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
        >
          <RefreshCw
            className={running ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            aria-hidden="true"
          />
          {/* No fake estimate. A run takes as long as it takes, and the honest
              thing to show is how long it has actually been going. */}
          {running
            ? `Researching · ${formatElapsed(job?.elapsedMs ?? 0)}`
            : "Check price now"}
        </Button>
      </span>

      {job && job.status === "running" && (
        <p className="text-xs text-muted-foreground">
          This runs on the server — you can leave this page and come back.
        </p>
      )}

      {steps.length > 0 && (
        <ol className="space-y-1 overflow-x-auto rounded-lg border border-border bg-muted/30 px-3 py-2">
          {steps.map((step) => (
            <li key={step.seq} className="flex items-center gap-2 text-xs">
              <StepIcon kind={step.kind} ok={step.ok} />
              <span className="min-w-0 flex-1 truncate text-foreground">{step.label}</span>
              {step.detail && (
                <span
                  className={cn(
                    "shrink-0",
                    step.ok ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  {step.ok ? step.detail : <span className="inline-flex items-center gap-1"><X className="h-3 w-3" aria-hidden="true" />{step.detail}</span>}
                </span>
              )}
              {step.ms != null && (
                <span className="w-12 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                  {(step.ms / 1000).toFixed(1)}s
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
