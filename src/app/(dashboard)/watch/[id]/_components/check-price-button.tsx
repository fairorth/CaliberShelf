"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CheckPriceButtonProps {
  watchId: string
  /** false = disabled with an explanatory tooltip (V6). */
  trackingEnabled: boolean
}

/**
 * "Check price now" (§3.3) — posts to /api/price-check/[watchId], which runs
 * the same research call as the CLI agent and inserts a valuation row. The
 * run takes a while, so the button holds a pending state rather than blocking
 * navigation. Rate limiting (one run per watch per hour) is server-side.
 */
export function CheckPriceButton({ watchId, trackingEnabled }: CheckPriceButtonProps) {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    try {
      const res = await fetch(`/api/price-check/${watchId}`, { method: "POST" })
      if (res.ok) {
        toast.success("Estimate updated.")
        router.refresh()
      } else if (res.status === 429) {
        const body = await res.json().catch(() => null)
        toast.error(body?.error ?? "Already checked within the last hour.")
      } else {
        const body = await res.json().catch(() => null)
        toast.error(body?.error ?? "The price check failed — try again in a minute.")
      }
    } catch {
      toast.error("The price check failed — try again in a minute.")
    } finally {
      setRunning(false)
    }
  }

  return (
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
        {running ? "Researching · ~40s" : "Check price now"}
      </Button>
    </span>
  )
}
