import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import {
  finishJob,
  getJobForWatch,
  getRunningJob,
  registerJob,
  type PriceCheckJob,
  type TraceStep,
} from "@/lib/price-check-jobs"
import {
  MODEL,
  WATCH_SELECT,
  researchWatch,
  researchCostUsd,
  valuationInsertRow,
} from "../../../../../scripts/lib/price-research.mjs"

// The in-app "Check price now" run (Phase 5, V6). Same research call as the
// CLI agent — scripts/lib/price-research.mjs is the single implementation of
// the prompt and the output contract. Model + pricing constants live there.
//
// POST starts a background job and returns its run id immediately; GET polls
// it. See src/lib/price-check-jobs.ts for why the run cannot be the body of
// the request.

// POST returns in milliseconds now, so this only guards the validation path.
export const maxDuration = 60

/** One run per watch per hour (§3.3) — a re-run inside the window can only
 *  burn money to restate the same thin market. */
const RATE_LIMIT_MS = 60 * 60 * 1000

/**
 * Wall-clock ceiling on one run. The log had a 33-minute run that finished
 * successfully; nothing in the loop bounded it, because `max_uses` caps how
 * MANY tools are called, not how long each takes. A run past this point has
 * stopped being worth its own latency.
 */
const HARD_CAP_MS = 8 * 60 * 1000

interface ResearchWatch {
  id: string
  user_id: string
  model: string
  reference_number: string | null
  nickname: string | null
  purchase_price_cents: number | null
  brand: { name: string } | null
  movement: { caliber_name: string; manufacturer: string | null } | null
  price_check_enabled: boolean
  sale_status: string
}

/** The public shape of a job — what the polling client renders. */
function jobView(job: PriceCheckJob) {
  return {
    runId: job.runId,
    status: job.status,
    elapsedMs: (job.finishedAt ?? Date.now()) - job.startedAt,
    steps: job.steps,
    error: job.error ?? null,
    valueMidCents: job.valueMidCents ?? null,
    confidence: job.confidence ?? null,
  }
}

/** GET /api/price-check/[watchId] — poll the current or most recent run. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ watchId: string }> }
) {
  const { watchId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const job = getJobForWatch(watchId)
  // A server restart drops the registry. Say so plainly rather than reporting
  // a run that vanished as still running — the client stops polling and
  // reloads, which is the honest outcome.
  if (!job) return NextResponse.json({ status: "unknown" })
  return NextResponse.json(jobView(job))
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ watchId: string }> }
) {
  const { watchId } = await params

  // Only signed-in users may spend API tokens.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    )
  }

  // Pressing the button again while a run is going rejoins it instead of
  // starting a second one. Two concurrent runs on the same watch would cost
  // twice and race each other's insert.
  const running = getRunningJob(watchId)
  if (running) {
    return NextResponse.json({ ...jobView(running), resumed: true })
  }

  const { data: watchRow } = await supabase
    .from("watches")
    .select(`${WATCH_SELECT}, price_check_enabled, sale_status`)
    .eq("id", watchId)
    .eq("user_id", user.id)
    .maybeSingle()
  // Nested joins infer as arrays — cast to the real single-row shape.
  const watch = watchRow as unknown as ResearchWatch | null
  if (!watch) {
    return NextResponse.json({ error: "Watch not found." }, { status: 404 })
  }
  if (watch.sale_status === "sold") {
    return NextResponse.json(
      { error: "This watch is sold — it is no longer price-checked." },
      { status: 400 }
    )
  }
  if (!watch.price_check_enabled) {
    return NextResponse.json(
      { error: "Turn on price checking on the edit form first." },
      { status: 400 }
    )
  }

  // Rate limit: latest agent estimate within the last hour blocks a re-run.
  const { data: latest } = await supabase
    .from("watch_valuations")
    .select("valued_at")
    .eq("watch_id", watchId)
    .eq("source", "agent")
    .order("valued_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latest) {
    const ageMs = Date.now() - Date.parse(latest.valued_at)
    if (ageMs < RATE_LIMIT_MS) {
      const minutes = Math.max(1, Math.round(ageMs / 60_000))
      return NextResponse.json(
        {
          error: `Checked ${minutes} minute${minutes === 1 ? "" : "s"} ago — one run per watch per hour.`,
        },
        { status: 429 }
      )
    }
  }

  const watchLabel = `${watch.brand?.name ?? ""} ${watch.model}`.trim()

  // The agent_runs row is written once, when the run FINISHES.
  //
  // The obvious shape — insert "running" up front, update it at the end —
  // does not work here: migration 00028 gives agent_runs SELECT and INSERT
  // policies but no UPDATE policy, so the finalizing update silently matches
  // zero rows and every run is left looking like it is still going. An
  // in-flight run is visible through the poll endpoint anyway, which is the
  // better place for it, so nothing is lost by writing the row at the end.
  const job: PriceCheckJob = {
    runId: null,
    watchId,
    watchLabel,
    startedAt: Date.now(),
    finishedAt: null,
    status: "running",
    steps: [],
  }
  registerJob(job)

  // Deliberately not awaited: the whole point is that the response returns
  // now and the research continues in this process.
  void research(job, watch, user.id, supabase)

  return NextResponse.json(jobView(job), { status: 202 })
}

/** The background run. Never throws — every exit path finalizes the job. */
async function research(
  job: PriceCheckJob,
  watch: ResearchWatch,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY
  const controller = new AbortController()
  const capTimer = setTimeout(() => controller.abort(), HARD_CAP_MS)

  let status: "success" | "failed" = "failed"
  let error: string | undefined
  let valueMidCents: number | undefined
  let confidence: string | undefined
  let usage = { input: 0, output: 0, searches: 0 }

  try {
    const result = await researchWatch(anthropic, watch, {
      // The .mjs module is untyped, so its callback signature is `object`.
      onStep: (step: object) => {
        job.steps.push(step as TraceStep)
      },
      signal: controller.signal,
    })
    usage = result.usage
    const valuation = result.valuation

    const { error: insertError } = await supabase
      .from("watch_valuations")
      .insert(valuationInsertRow(watch, valuation))
    if (insertError) {
      throw new Error(`The estimate could not be saved: ${insertError.message}`)
    }

    status = "success"
    valueMidCents = Math.round(valuation.market_value_mid_usd * 100)
    confidence = valuation.confidence
  } catch (err) {
    if (controller.signal.aborted) {
      error = `Gave up after ${Math.round(HARD_CAP_MS / 60_000)} minutes — see the run trace for where the time went.`
    } else if (err instanceof Anthropic.RateLimitError) {
      error = "Anthropic rate limit hit — try again in a minute."
    } else if (err instanceof Anthropic.APIError) {
      error = `Claude API error: ${err.message}`
    } else {
      error = err instanceof Error ? err.message : "The price check failed."
    }
  } finally {
    clearTimeout(capTimer)
  }

  const finishedAt = Date.now()
  const costUsd = researchCostUsd(usage)

  // Flush the run and its trace. Best-effort, as everywhere else: a logging
  // failure must not change what the user sees happened.
  try {
    const { data: runRow } = await supabase
      .from("agent_runs")
      .insert({
        user_id: userId,
        agent: "price-check",
        trigger: "ui",
        status,
        started_at: new Date(job.startedAt).toISOString(),
        finished_at: new Date(finishedAt).toISOString(),
        duration_ms: finishedAt - job.startedAt,
        model: MODEL,
        items_processed: 1,
        items_updated: status === "success" ? 1 : 0,
        items_failed: status === "success" ? 0 : 1,
        input_tokens: usage.input,
        output_tokens: usage.output,
        web_searches: usage.searches,
        cost_usd_micros: Math.round(costUsd * 1_000_000),
        notes: error ? `${job.watchLabel} — ${error}` : job.watchLabel,
      })
      .select("id")
      .single()
    job.runId = runRow?.id ?? null

    if (runRow && job.steps.length > 0) {
      await supabase.from("agent_run_items").insert(
        job.steps.map((step) => ({
          run_id: runRow.id,
          user_id: userId,
          entity_type: "watch",
          entity_id: job.watchId,
          label: step.label.slice(0, 500),
          // The report colours 'updated' brass and 'failed' destructive and
          // falls through to neutral otherwise, so these read correctly there.
          action: step.ok ? "updated" : "failed",
          field: step.kind,
          detail: [step.detail, step.ms != null ? `${(step.ms / 1000).toFixed(1)}s` : null]
            .filter(Boolean)
            .join(" · "),
        }))
      )
    }
  } catch {
    // logging is optional; ignore failures
  }

  finishJob(job, { status, error, valueMidCents, confidence })
}
