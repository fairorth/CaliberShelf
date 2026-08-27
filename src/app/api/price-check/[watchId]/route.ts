import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import {
  MODEL,
  PROFILES,
  WATCH_SELECT,
  researchWatch,
  researchCostUsd,
  valuationInsertRow,
} from "../../../../../scripts/lib/price-research.mjs"

// The in-app "Check price now" run (V10 redesign): a QUICK market snapshot —
// 3 searches / 1 fetch / low effort, targeting well under two minutes — run
// SYNCHRONOUSLY in this request. The old background-job-and-poll design
// (registry in price-check-jobs.ts, since deleted) existed because the button
// ran the full batch-depth research (7-30+ min); it also silently died on
// serverless, where the instance freezes once the POST returns. A quick
// profile fits inside one request, so the whole registry/poll apparatus is
// gone. Deep research remains the monthly CLI run (and the overnight queue,
// rollout #2).
//
// Same research engine as the CLI — scripts/lib/price-research.mjs is the
// single implementation of the prompt, budgets, and output contract.

// The request IS the run now. QUICK_CAP_MS aborts the research; maxDuration
// gives the route headroom to abort gracefully and still log the failure.
export const maxDuration = 180
const QUICK_CAP_MS = 150 * 1000

/** One run per watch per hour (§3.3) — a re-run inside the window can only
 *  burn money to restate the same thin market. */
const RATE_LIMIT_MS = 60 * 60 * 1000

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

interface TraceStep {
  seq: number
  kind: string
  label: string
  ok: boolean
  detail?: string
  ms: number | null
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
  const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY
  const controller = new AbortController()
  const capTimer = setTimeout(() => controller.abort(), QUICK_CAP_MS)

  const startedAt = Date.now()
  const steps: TraceStep[] = []
  let status: "success" | "failed" = "failed"
  let error: string | undefined
  let valueMidCents: number | undefined
  let confidence: string | undefined
  let usage = { input: 0, output: 0, searches: 0 }

  try {
    const result = await researchWatch(anthropic, watch, {
      mode: "quick",
      // The .mjs module is untyped, so its callback signature is `object`.
      onStep: (step: object) => {
        steps.push(step as TraceStep)
      },
      signal: controller.signal,
    })
    usage = result.usage
    const valuation = result.valuation

    const { error: insertError } = await supabase
      .from("watch_valuations")
      .insert(valuationInsertRow(watch, valuation, { runMode: "quick" }))
    if (insertError) {
      throw new Error(`The estimate could not be saved: ${insertError.message}`)
    }

    status = "success"
    valueMidCents = Math.round(valuation.market_value_mid_usd * 100)
    confidence = valuation.confidence
  } catch (err) {
    if (controller.signal.aborted) {
      error = `Gave up after ${Math.round(QUICK_CAP_MS / 1000)} seconds — try again, or wait for a deep run.`
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
  // failure must not change what the user sees happened. The agent_runs row
  // is written once, at the end — 00028 has no UPDATE policy, so an
  // insert-running-then-update shape would silently strand every run.
  try {
    const { data: runRow } = await supabase
      .from("agent_runs")
      .insert({
        user_id: user.id,
        agent: "price-check",
        trigger: "ui",
        status,
        started_at: new Date(startedAt).toISOString(),
        finished_at: new Date(finishedAt).toISOString(),
        duration_ms: finishedAt - startedAt,
        model: MODEL,
        items_processed: 1,
        items_updated: status === "success" ? 1 : 0,
        items_failed: status === "success" ? 0 : 1,
        input_tokens: usage.input,
        output_tokens: usage.output,
        web_searches: usage.searches,
        cost_usd_micros: Math.round(costUsd * 1_000_000),
        notes: error ? `${watchLabel} — ${error}` : `${watchLabel} (quick)`,
      })
      .select("id")
      .single()

    if (runRow && steps.length > 0) {
      await supabase.from("agent_run_items").insert(
        steps.map((step) => ({
          run_id: runRow.id,
          user_id: user.id,
          entity_type: "watch",
          entity_id: watchId,
          label: step.label.slice(0, 500),
          // The report colours 'updated' brass and 'failed' destructive and
          // falls through to neutral otherwise, so these read correctly there.
          action: step.ok ? "updated" : "failed",
          field: step.kind,
          detail: step.detail ?? null,
          duration_ms: step.ms != null ? Math.round(step.ms) : null,
        }))
      )
    }
  } catch {
    // logging is optional; ignore failures
  }

  if (status === "failed") {
    return NextResponse.json(
      { status, error: error ?? "The price check failed.", elapsedMs: finishedAt - startedAt },
      { status: 502 }
    )
  }
  return NextResponse.json({
    status,
    elapsedMs: finishedAt - startedAt,
    valueMidCents,
    confidence,
    costUsd: Math.round(costUsd * 100) / 100,
    searches: usage.searches,
    profile: PROFILES.quick,
  })
}
