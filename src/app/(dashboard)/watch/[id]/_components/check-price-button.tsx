"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CheckPriceButtonProps {
  watchId: string
  /** false = disabled with an explanatory tooltip (V6). */
  trackingEnabled: boolean
}

interface QuickCheckResult {
  status: "success" | "failed" | "no_data"
  elapsedMs: number
  valueMidCents?: number
  confidence?: string
  costUsd?: number
  error?: string
}

function formatElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

/**
 * "Check price now" (V10) — a QUICK market snapshot that runs synchronously:
 * one fetch, ~1 minute, result on return. The button shows honest elapsed
 * time while it waits; the persisted Run trace below the panel is the
 * after-the-fact record (there is no live step list any more — it used to
 * outstay the run and duplicate the trace).
 */
export function CheckPriceButton({ watchId, trackingEnabled }: CheckPriceButtonProps) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed ticker — purely cosmetic; the server clock is authoritative.
  useEffect(() => {
    if (!running) return
    const startedAt = Date.now()
    setElapsedMs(0)
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [running])

  async function run() {
    setRunning(true)
    try {
      const res = await fetch(`/api/price-check/${watchId}`, { method: "POST" })
      const body = (await res.json().catch(() => null)) as QuickCheckResult | null
      if (res.ok && body?.status === "no_data") {
        // The evidence gate held: nothing real came back, nothing was saved.
        toast.warning(
          body.error ??
            "No usable market data found — existing estimate left unchanged."
        )
        router.refresh()
      } else if (res.ok && body?.status === "success") {
        const mid =
          body.valueMidCents != null
            ? ` — $${Math.round(body.valueMidCents / 100).toLocaleString()}`
            : ""
        const cost = body.costUsd != null ? ` · $${body.costUsd.toFixed(2)} API` : ""
        toast.success(
          `Quick estimate${mid} (${body.confidence ?? "?"} confidence) in ${formatElapsed(body.elapsedMs)}${cost}.`
        )
        router.refresh()
      } else if (res.status === 429) {
        toast.error(body?.error ?? "Already checked within the last hour.")
      } else {
        toast.error(body?.error ?? "The price check failed.")
      }
    } catch {
      toast.error("The price check failed — network error.")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-1.5">
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
          {running ? `Researching · ${formatElapsed(elapsedMs)}` : "Check price now"}
        </Button>
      </span>
      {running && (
        <p className="text-xs text-muted-foreground">
          Quick snapshot — typically about a minute. Leaving this page cancels it.
        </p>
      )}
    </div>
  )
}
