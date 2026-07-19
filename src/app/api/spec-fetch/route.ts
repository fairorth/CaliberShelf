import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { createClient } from "@/lib/supabase/server"
import {
  specFetchRequestSchema,
  specFetchResultSchema,
} from "@/lib/validations/spec-fetch"
import type { SpecFetchResponse } from "@/lib/validations/spec-fetch"

// A web-search agent call can take 1-2 minutes; the default serverless
// timeout would kill it mid-search.
export const maxDuration = 180

// Model + cost knobs live here (same convention as scripts/price-check.mjs).
// Opus for extraction quality; switch to claude-sonnet-5 to cut cost ~3x.
const MODEL = "claude-opus-4-8"
const PRICE_PER_MTOK = { input: 5, output: 25 } // USD per million tokens
const PRICE_PER_SEARCH = 0.01 // web search server tool: $10 per 1,000 searches
const MAX_USES = 4 // per tool — bounds both latency and cost

const SYSTEM_PROMPT = `You are a watch-specification researcher for a personal collection app.
Given a brand, model, and optional reference number, find the manufacturer's
official specifications for that exact watch.

Source priority:
1. The brand's own product page (most microbrands run Shopify - the product
   page or its spec table is authoritative).
2. Reputable databases or reviews (WatchBase, Chronoscout, hands-on reviews)
   only to fill gaps.

Rules:
- Match the EXACT variant. If the reference number is given, the specs must be
  for that reference. If you can only find a close variant (different dial
  color, same case), note that in "notes" and lower your confidence.
- Return null for anything you cannot verify. NEVER guess or interpolate.
- Dimensions are millimeters; weight is grams (head or full watch as listed -
  note which in "notes" if stated); water resistance is meters (convert from
  bar/ATM: 1 bar = 10 m).
- "strap_width_mm" means the lug width / distance between lugs.
- "case_height_mm" means the case thickness.
- "suggested_caliber" is the movement name as the manufacturer states it,
  e.g. "Miyota 9039" or "Sellita SW200-1".
- "reference_number": the manufacturer's reference for the EXACT variant
  (dial color, metal, bracelet). If the user already supplied one, echo it
  back unchanged. If multiple variants share the model name and you cannot
  pin the exact one, return null and explain in "notes" — a wrong reference
  is worse than none.
- "complications" uses short names like "Date", "Day", "Chronograph",
  "Moon Phase", "Power Reserve", "GMT".
- "sources" lists the URLs you actually extracted specs from.
- Keep "notes" to one or two short sentences (variant caveats, ambiguities).`

export async function POST(request: Request) {
  // Only signed-in users may spend API tokens
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

  const body = await request.json().catch(() => null)
  const parsed = specFetchRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }
  const { brand, model, reference_number } = parsed.data

  const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

  const query = [
    `Brand: ${brand}`,
    `Model: ${model}`,
    reference_number ? `Reference number: ${reference_number}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const response = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: MAX_USES },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: MAX_USES },
      ],
      output_config: { format: zodOutputFormat(specFetchResultSchema) },
      messages: [{ role: "user", content: query }],
    })

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json(
        { error: "The agent could not produce a spec result for this watch." },
        { status: 502 }
      )
    }

    const searches =
      response.usage.server_tool_use?.web_search_requests ?? 0
    const inputTokens =
      response.usage.input_tokens +
      (response.usage.cache_creation_input_tokens ?? 0) +
      (response.usage.cache_read_input_tokens ?? 0)
    const costUsd =
      (inputTokens * PRICE_PER_MTOK.input) / 1_000_000 +
      (response.usage.output_tokens * PRICE_PER_MTOK.output) / 1_000_000 +
      searches * PRICE_PER_SEARCH

    const payload: SpecFetchResponse = {
      specs: response.parsed_output,
      usage: {
        input_tokens: inputTokens,
        output_tokens: response.usage.output_tokens,
        searches,
        cost_usd: Math.round(costUsd * 100) / 100,
      },
      model: MODEL,
    }
    return NextResponse.json(payload)
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
    throw error
  }
}
