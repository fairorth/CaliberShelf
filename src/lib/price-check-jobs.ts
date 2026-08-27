// In-process registry of running price checks.
//
// A price check is an agentic web-research run. The run log shows real ones
// taking anywhere from 100 seconds to 33 MINUTES, so it cannot be the body of
// an HTTP request the browser waits on: the tab is then hostage to the run,
// and closing or reloading it loses the result of something that costs about a
// dollar. Instead POST starts a job and returns its id, the work continues in
// this process, and the page polls.
//
// Live trace steps are kept in memory rather than written per-step to the DB —
// a run emits a step every few seconds and nothing needs them durable until it
// finishes. On completion the whole trace is flushed to `agent_run_items` (one
// row per step), so it survives, and shows up in /reports/agents alongside the
// cron runs.
//
// LIMITATION: this lives in the Node process, so it assumes a long-running
// server (`npm run dev`, or a container). On a serverless host the work would
// be killed the moment POST responds — that shape needs a queue instead.

export interface TraceStep {
  seq: number
  /** web_search · web_fetch · thinking · turn */
  kind: string
  /** the query, the URL, or the phase name */
  label: string
  ok: boolean
  /** "6 results", "fetched", or an error_code like "unavailable" */
  detail?: string
  /** wall-clock milliseconds this step took, when known */
  ms: number | null
}

export interface PriceCheckJob {
  /** null until the run finishes — the agent_runs row is written at the end. */
  runId: string | null
  watchId: string
  watchLabel: string
  startedAt: number
  finishedAt: number | null
  status: "running" | "success" | "failed"
  steps: TraceStep[]
  error?: string
  valueMidCents?: number
  confidence?: string
}

// Keyed by watchId. Held on globalThis so a dev-server hot reload that
// re-evaluates this module does not orphan a run that is still going.
const REGISTRY = Symbol.for("tentenloupe.priceCheckJobs")
type Registry = Map<string, PriceCheckJob>
const store = globalThis as unknown as { [REGISTRY]?: Registry }
const jobs: Registry = (store[REGISTRY] ??= new Map())

/** How long a finished job stays readable, so the client's last poll sees it. */
const KEEP_FINISHED_MS = 5 * 60 * 1000

export function getJobForWatch(watchId: string): PriceCheckJob | undefined {
  return jobs.get(watchId)
}

export function getRunningJob(watchId: string): PriceCheckJob | undefined {
  const job = jobs.get(watchId)
  return job?.status === "running" ? job : undefined
}

export function registerJob(job: PriceCheckJob): void {
  jobs.set(job.watchId, job)
}

export function finishJob(
  job: PriceCheckJob,
  outcome: Pick<PriceCheckJob, "status" | "error" | "valueMidCents" | "confidence">
): void {
  Object.assign(job, outcome, { finishedAt: Date.now() })
  setTimeout(() => {
    // Only evict this run — a newer one may have taken the slot since.
    if (jobs.get(job.watchId) === job) jobs.delete(job.watchId)
  }, KEEP_FINISHED_MS).unref?.()
}
