// Market-valuation agent for CaliberShelf (Phase 4).
//
// For every watch with price_check_enabled = true, runs a Claude agent with
// web search + web fetch to research the current secondary-market value, then
// inserts a row into watch_valuations. Designed to run headless on a schedule.
//
// Usage:
//   node scripts/price-check.mjs             # research + insert
//   node scripts/price-check.mjs --dry-run   # research, print, no insert
//   node scripts/price-check.mjs --limit 2   # only the first N watches
//   node scripts/price-check.mjs --watch <uuid>  # a single watch
//
// Required in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL     (already present)
//   SUPABASE_SERVICE_ROLE_KEY    (Supabase dashboard -> Settings -> API)
//   ANTHROPIC_API_KEY            (console.anthropic.com)

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

loadEnvConfig(process.cwd())

const MODEL = "claude-opus-4-8"
const MAX_TOKENS = 32000

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity
const ONLY_WATCH = args.includes("--watch")
  ? args[args.indexOf("--watch") + 1]
  : null

// ── Env checks (values are never printed) ────────────────────────
const missing = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
].filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

// ── Output contract for the agent ────────────────────────────────
const valuationSchema = z.object({
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

const SYSTEM_PROMPT = `You are a watch market analyst producing structured valuations for a collection-tracking database.

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

function watchPrompt(watch) {
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

// ── Agent loop ───────────────────────────────────────────────────
async function researchWatch(watch) {
  const messages = [{ role: "user", content: watchPrompt(watch) }]
  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: 12 },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 12 },
  ]

  let response
  let continuations = 0
  const usage = { input: 0, output: 0 }

  // Server tools run in a server-side loop; resume on pause_turn.
  for (;;) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })
    response = await stream.finalMessage()
    usage.input += response.usage.input_tokens
    usage.output += response.usage.output_tokens

    if (response.stop_reason !== "pause_turn") break
    if (++continuations > 5) {
      throw new Error("Exceeded max pause_turn continuations")
    }
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

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  let query = supabase
    .from("watches")
    .select(
      "id, user_id, model, reference_number, nickname, purchase_price_cents, brand:brands(name), movement:movements(caliber_name, manufacturer)"
    )
    .eq("price_check_enabled", true)
    .order("purchase_price_cents", { ascending: false, nullsFirst: false })
  if (ONLY_WATCH) query = query.eq("id", ONLY_WATCH)

  const { data: watches, error } = await query
  if (error) {
    console.error(`Failed to fetch watches: ${error.message}`)
    process.exit(1)
  }
  if (!watches || watches.length === 0) {
    console.log("No watches have price_check_enabled = true. Nothing to do.")
    return
  }

  const queue = watches.slice(0, LIMIT)
  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Valuing ${queue.length} watch(es) with ${MODEL}...\n`
  )

  let ok = 0
  let failed = 0
  for (const watch of queue) {
    const label = `${watch.brand?.name ?? "?"} ${watch.model}`
    process.stdout.write(`→ ${label} ... `)
    try {
      const { valuation: v, usage } = await researchWatch(watch)

      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from("watch_valuations")
          .insert({
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
          })
        if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)
      }

      ok++
      console.log(
        `$${v.market_value_mid_usd.toLocaleString()} (range $${v.market_value_low_usd.toLocaleString()}–$${v.market_value_high_usd.toLocaleString()}, ${v.confidence} confidence, ${v.n_datapoints} datapoints) [${usage.input + usage.output} tokens]`
      )
      if (DRY_RUN) console.log(JSON.stringify(v, null, 2))
    } catch (err) {
      failed++
      console.log(`FAILED: ${err.message}`)
    }
  }

  console.log(
    `\nDone. ${ok} valued, ${failed} failed${DRY_RUN ? " (dry run — nothing written)" : ""}.`
  )
  if (failed > 0) process.exitCode = 1
}

main()
