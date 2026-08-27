// The per-watch market-research call shared by the CLI agent
// (scripts/price-check.mjs) and the in-app route
// (src/app/api/price-check/[watchId]/route.ts) — ONE implementation of the
// prompt, the output contract, and the agent loop (Phase 5, V6). Keep this
// module free of CLI concerns (no arg parsing, no env checks, no printing).
//
// ⚠️ The JSON block in SYSTEM_PROMPT, the Zod schema below, and the
// watch_valuations columns are a three-way contract — change all or none
// (docs/price-check.md §customizing).

import { z } from "zod"

export const MODEL = "claude-sonnet-5"
export const MAX_TOKENS = 32000
// For run cost accounting (list pricing; web-search server tool billed per use).
export const PRICE_PER_MTOK = { input: 3, output: 15 }
export const PRICE_PER_SEARCH = 0.01
// Per-watch cap on web searches and fetches — the main cost lever.
//
// These are enforced by the API, which REJECTS a call past the cap with
// `max_uses_exceeded`. A traced run at 6/6 showed the model spending its
// budget, then issuing nine more searches and getting refused every time,
// thinking between each one: 13 of 22 tool calls rejected, 19 thinking blocks,
// 2m38s wall clock. Capping tools without telling the model about the cap does
// not save money — it buys a flailing loop whose thinking tokens cost more
// than the searches would have.
//
// So the caps are stated in the prompt (see SYSTEM_PROMPT) and set with a
// little headroom. Searches bill at a cent each; the tokens do not.
export const DEFAULT_MAX_SEARCHES = 10
export const DEFAULT_MAX_FETCHES = 8
/** @deprecated kept so existing callers passing `maxUses` still work. */
export const DEFAULT_MAX_USES = DEFAULT_MAX_SEARCHES

// ── Output contract for the agent ────────────────────────────────
export const valuationSchema = z.object({
  assumed_variant: z.string(),
  market_value_low_usd: z.number(),
  market_value_mid_usd: z.number(),
  market_value_high_usd: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  n_datapoints: z.number(),
  datapoints: z.array(
    z.object({
      price_usd: z.number(),
      source: z.string(),
      type: z.enum(["sold", "asking"]),
      date: z.string(),
      note: z.string(),
    })
  ),
  sources: z.array(z.string()),
  method_notes: z.string(),
  caveats: z.string(),
})

// Sources are configured in plain English here — guidance, not a boundary
// (docs/price-check.md). Site and method edits are safe; the JSON block is not.
export function buildSystemPrompt({
  maxSearches = DEFAULT_MAX_SEARCHES,
  maxFetches = DEFAULT_MAX_FETCHES,
} = {}) {
  return `You are a watch market analyst producing structured valuations for a collection-tracking database.

Your research budget for this task is ${maxSearches} web searches and ${maxFetches} web fetches. These are hard limits enforced by the tools: once spent, every further call is REJECTED and tells you nothing. Plan for them, and when the budget is gone, STOP researching and answer with what you have — a low-confidence estimate from four data points is a useful answer; another rejected search is not.

web_fetch can only open a URL that already appeared in a search result. Never construct or guess a URL — searching for the page is the way to reach it.

Method:
1. Use web search and web fetch extensively. Prioritize SOLD/completed prices (eBay sold listings, auction results from Grailzee/Bezel/Phillips/Loupe This) over asking prices. Chrono24 and dealer asking prices skew 10-20% high — usable, but discount accordingly and label them "asking".
2. Also check WatchCharts, The 1916 Company, WatchUSeek sales corner, and r/Watchexchange for recent transactions. For Japanese independents, include Yahoo! Auctions Japan and Mercari Japan (convert JPY at the current rate and note it).
3. Collect 4-8 recent (ideally last 6 months) data points where the market allows.
4. Exclude obvious outliers (damage, franken/replica risk, wrong variant). eBay best-offer "sold" prices display the LIST price, not the accepted amount — treat them as upper bounds.
5. If data is thin, report low confidence and a wide range. NEVER fabricate data points.

Your FINAL message must be RAW JSON ONLY — no markdown fences, no prose before or after — matching exactly:
{
  "assumed_variant": "<metal/dial/ref you assumed, or 'exact reference given'>",
  "market_value_low_usd": <number>,
  "market_value_mid_usd": <number>,
  "market_value_high_usd": <number>,
  "confidence": "high" | "medium" | "low",
  "n_datapoints": <number of real price observations used>,
  "datapoints": [{"price_usd": <number>, "source": "<site>", "type": "sold" | "asking", "date": "<approx date or 'unknown'>", "note": "<condition/variant note>"}],
  "sources": ["<url>", ...],
  "method_notes": "<1-3 sentences: how you derived low/mid/high>",
  "caveats": "<1-3 sentences: variant ambiguity, thin data, market trend>"
}
Numbers are whole USD. "market_value_mid_usd" = realistic private-sale value (what it would actually sell for), not dealer retail.`
}

/** The default-budget prompt, kept as a constant for callers that want it. */
export const SYSTEM_PROMPT = buildSystemPrompt()

/** The per-watch user prompt. `watch` needs model/reference_number/nickname/
 *  purchase_price_cents and joined brand/movement rows (see WATCH_SELECT). */
export function watchPrompt(watch) {
  const paid =
    watch.purchase_price_cents != null
      ? `$${(watch.purchase_price_cents / 100).toFixed(0)}`
      : "unknown"
  return `Today's date: ${new Date().toISOString().slice(0, 10)}.
Research the CURRENT secondary/pre-owned market value in USD of this watch:

Brand: ${watch.brand?.name ?? "unknown"}
Model: ${watch.model}
Reference number: ${watch.reference_number || "not recorded — infer the variant and state your assumption"}
${watch.nickname ? `Nickname: ${watch.nickname}\n` : ""}${watch.movement ? `Movement: ${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}\n` : ""}Owner's purchase price: ${paid} (context only — do not anchor your estimate to it)

Research thoroughly, then reply with the JSON object only.`
}

/** The columns every caller should select for a research-ready watch row. */
export const WATCH_SELECT =
  "id, user_id, model, reference_number, nickname, purchase_price_cents, brand:brands(name), movement:movements(caliber_name, manufacturer)"

/**
 * Pull the outcome of a server-tool result block into a flat, loggable shape.
 * Search results arrive as an array of hits; fetches as one document. Either
 * can instead be an `*_tool_result_error` object carrying an `error_code` —
 * that is the case worth seeing in a trace, because a blocked or timed-out
 * fetch costs wall-clock time and returns nothing.
 */
function resultOutcome(block) {
  const content = block.content
  if (!content) return { ok: false, detail: "empty result" }
  if (!Array.isArray(content)) {
    if (typeof content.type === "string" && content.type.endsWith("_error")) {
      return { ok: false, detail: content.error_code ?? "error" }
    }
    return { ok: true, detail: "fetched" }
  }
  if (content.length === 0) return { ok: true, detail: "0 results" }
  return { ok: true, detail: `${content.length} result${content.length === 1 ? "" : "s"}` }
}

/**
 * Research one watch with web search + fetch and return the Zod-validated
 * valuation plus token/search usage.
 *
 * `onStep` receives one object per traceable event —
 * `{ seq, kind, label, ok, detail, ms }` — as it happens. It exists because a
 * run can take tens of minutes and, without it, there is no way to tell a slow
 * fetch from a long think from a continuation loop. It must never throw; the
 * caller's failures are swallowed rather than killing the research.
 *
 * @param {import("@anthropic-ai/sdk").default} anthropic
 * @param {object} watch  row shaped like WATCH_SELECT
 * @param {{ maxUses?: number, onStep?: (step: object) => void, signal?: AbortSignal }} [opts]
 * @returns {Promise<{ valuation: z.infer<typeof valuationSchema>, usage: { input: number, output: number, searches: number } }>}
 */
export async function researchWatch(
  anthropic,
  watch,
  {
    maxUses,
    maxSearches = maxUses ?? DEFAULT_MAX_SEARCHES,
    maxFetches = maxUses ?? DEFAULT_MAX_FETCHES,
    onStep,
    signal,
  } = {}
) {
  const messages = [{ role: "user", content: watchPrompt(watch) }]
  // The numbers in the prompt and the numbers on the tools must be the same
  // numbers, or the advice is worse than none.
  const system = buildSystemPrompt({ maxSearches, maxFetches })
  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: maxSearches },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: maxFetches },
  ]

  let response
  let continuations = 0
  const usage = { input: 0, output: 0, searches: 0 }

  let seq = 0
  let mark = Date.now()
  /** tool_use_id → { kind, label, startedAt } for calls awaiting their result. */
  const pending = new Map()
  const emit = (step) => {
    if (!onStep) return
    try {
      onStep({ seq: ++seq, ...step })
    } catch {
      // a trace consumer must never be able to break the research
    }
  }

  // Server tools run in a server-side loop; resume on pause_turn.
  for (;;) {
    const stream = anthropic.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system,
        tools,
        messages,
      },
      signal ? { signal } : undefined
    )

    // Blocks arrive already finalized here, so a server_tool_use block is the
    // moment the request went out and its matching *_tool_result block is the
    // moment the answer came back. The gap between them is the tool's real
    // latency — the number we could not see before.
    stream.on("contentBlock", (block) => {
      const now = Date.now()
      if (block.type === "thinking" || block.type === "redacted_thinking") {
        emit({ kind: "thinking", label: "Thinking", ok: true, ms: now - mark })
        mark = now
        return
      }
      if (block.type === "server_tool_use") {
        const input = block.input ?? {}
        pending.set(block.id, {
          kind: block.name === "web_fetch" ? "web_fetch" : "web_search",
          label: String(input.query ?? input.url ?? block.name),
          startedAt: now,
        })
        mark = now
        return
      }
      if (block.type === "web_search_tool_result" || block.type === "web_fetch_tool_result") {
        const call = pending.get(block.tool_use_id)
        pending.delete(block.tool_use_id)
        const outcome = resultOutcome(block)
        emit({
          kind: call?.kind ?? (block.type === "web_fetch_tool_result" ? "web_fetch" : "web_search"),
          label: call?.label ?? "(unknown)",
          ok: outcome.ok,
          detail: outcome.detail,
          ms: call ? now - call.startedAt : null,
        })
        mark = now
      }
    })

    response = await stream.finalMessage()
    usage.input += response.usage.input_tokens
    usage.output += response.usage.output_tokens
    usage.searches += response.usage.server_tool_use?.web_search_requests ?? 0

    if (response.stop_reason !== "pause_turn") break
    if (++continuations > 5) {
      throw new Error("Exceeded max pause_turn continuations")
    }
    // Each continuation is a fresh request that replays the whole transcript,
    // so it re-bills every prior token. Worth seeing in the trace.
    emit({
      kind: "turn",
      label: `Continuation ${continuations}`,
      ok: true,
      detail: "server paused the turn",
      ms: Date.now() - mark,
    })
    mark = Date.now()
    messages.push({ role: "assistant", content: response.content })
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Model declined the request (stop_reason: refusal)")
  }

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()

  // The model was told raw-JSON-only, but strip fences defensively.
  const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  const start = jsonText.indexOf("{")
  const end = jsonText.lastIndexOf("}")
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object in response: ${text.slice(0, 200)}`)
  }

  const parsed = valuationSchema.safeParse(
    JSON.parse(jsonText.slice(start, end + 1))
  )
  if (!parsed.success) {
    throw new Error(`Schema validation failed: ${parsed.error.issues[0].message}`)
  }
  return { valuation: parsed.data, usage }
}

const toCents = (usd) => Math.round(usd * 100)

/** The watch_valuations insert payload for a research result — shared so the
 *  CLI and the route can never drift on column mapping. */
export function valuationInsertRow(watch, v) {
  return {
    watch_id: watch.id,
    user_id: watch.user_id,
    value_low_cents: toCents(v.market_value_low_usd),
    value_mid_cents: toCents(v.market_value_mid_usd),
    value_high_cents: toCents(v.market_value_high_usd),
    currency: "USD",
    confidence: v.confidence,
    n_datapoints: v.n_datapoints,
    assumed_variant: v.assumed_variant,
    datapoints: v.datapoints,
    sources: v.sources,
    method_notes: v.method_notes,
    caveats: v.caveats,
    agent_model: MODEL,
  }
}

/** List-price cost of a usage tally ({input, output, searches}). */
export function researchCostUsd(usage) {
  return (
    (usage.input * PRICE_PER_MTOK.input) / 1e6 +
    (usage.output * PRICE_PER_MTOK.output) / 1e6 +
    usage.searches * PRICE_PER_SEARCH
  )
}
