import { createClient } from "@/lib/supabase/server"

/**
 * The stored trace of the most recent price-check run for one watch.
 *
 * The live trace in the button is gone the moment you navigate away; this is
 * the same data read back out of `agent_run_items`, so a run you kicked off
 * yesterday can still be inspected — which is the point of recording where the
 * minutes went.
 */
export interface TraceRow {
  label: string
  /** web_search · web_fetch · thinking · model · turn (or 'valuation' for CLI runs). */
  kind: string | null
  ok: boolean
  detail: string | null
  /** Step duration (00049). Older rows carry it in `detail` text instead. */
  durationMs: number | null
}

export interface AgentTrace {
  runId: string
  status: string
  startedAt: string
  durationMs: number | null
  webSearches: number
  costUsdMicros: number
  rows: TraceRow[]
}

export async function getLatestPriceCheckTrace(
  watchId: string
): Promise<AgentTrace | null> {
  const supabase = await createClient()

  // agent_runs has no watch column — the link is the item's entity_id, so the
  // newest item for this watch identifies the newest run that touched it.
  const { data: newest } = await supabase
    .from("agent_run_items")
    .select(
      "run_id, created_at, agent_runs!inner(id, agent, status, started_at, duration_ms, web_searches, cost_usd_micros)"
    )
    .eq("entity_id", watchId)
    .eq("agent_runs.agent", "price-check")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!newest) return null
  const run = (newest as unknown as {
    run_id: string
    agent_runs: {
      status: string
      started_at: string
      duration_ms: number | null
      web_searches: number
      cost_usd_micros: number
    }
  }).agent_runs

  const { data: items } = await supabase
    .from("agent_run_items")
    .select("label, field, action, detail, duration_ms")
    .eq("run_id", newest.run_id)
    .eq("entity_id", watchId)
    .order("created_at", { ascending: true })

  return {
    runId: newest.run_id,
    status: run.status,
    startedAt: run.started_at,
    durationMs: run.duration_ms,
    webSearches: run.web_searches,
    costUsdMicros: run.cost_usd_micros,
    rows: (items ?? []).map((it) => ({
      label: it.label,
      kind: it.field,
      ok: it.action !== "failed",
      detail: it.detail,
      durationMs: (it as { duration_ms?: number | null }).duration_ms ?? null,
    })),
  }
}
