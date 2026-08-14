import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
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

// A web-search agent call takes ~40s and can stretch further; the default
// serverless timeout would kill it mid-search.
export const maxDuration = 180

/** One run per watch per hour (§3.3) — a re-run inside the window can only
 *  burn money to restate the same thin market. */
const RATE_LIMIT_MS = 60 * 60 * 1000

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ watchId: string }> }
) {
  const startedAt = Date.now()
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
  const watch = watchRow as unknown as {
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
  } | null
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

  const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

  try {
    const { valuation, usage } = await researchWatch(anthropic, watch)

    const { error: insertError } = await supabase
      .from("watch_valuations")
      .insert(valuationInsertRow(watch, valuation))
    if (insertError) {
      return NextResponse.json(
        { error: `The estimate could not be saved: ${insertError.message}` },
        { status: 500 }
      )
    }

    const costUsd = researchCostUsd(usage)

    // Best-effort agent-run log (same convention as the spec-fetch route) —
    // never blocks the response.
    try {
      await supabase.from("agent_runs").insert({
        user_id: user.id,
        agent: "price-check",
        trigger: "ui",
        status: "success",
        started_at: new Date(startedAt).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        model: MODEL,
        items_processed: 1,
        items_updated: 1,
        input_tokens: usage.input,
        output_tokens: usage.output,
        web_searches: usage.searches,
        cost_usd_micros: Math.round(costUsd * 1_000_000),
        notes: `${watch.brand?.name ?? ""} ${watch.model}`.trim(),
      })
    } catch {
      // logging is optional; ignore failures
    }

    return NextResponse.json({
      ok: true,
      value_mid_cents: Math.round(valuation.market_value_mid_usd * 100),
      confidence: valuation.confidence,
    })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Anthropic rate limit hit — try again in a minute." },
        { status: 429 }
      )
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The price check failed.",
      },
      { status: 502 }
    )
  }
}
