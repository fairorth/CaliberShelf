// Market-valuation agent for TenTenLoupe (Phase 4).
//
// For every watch with price_check_enabled = true, runs a Claude agent with
// web search + web fetch to research the current secondary-market value, then
// inserts a row into watch_valuations. Designed to run headless on a schedule.
//
// The per-watch research call itself (model, prompt, output contract, agent
// loop) lives in scripts/lib/price-research.mjs, shared with the in-app
// "Check price now" route — edit sources and method THERE, once.
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
import { startRun, finishRun, usdToMicros } from "./lib/agent-run.mjs"
import {
  MODEL,
  DEFAULT_MAX_USES,
  WATCH_SELECT,
  assessEvidence,
  researchWatch,
  researchCostUsd,
  valuationInsertRow,
} from "./lib/price-research.mjs"

loadEnvConfig(process.cwd())

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity
const ONLY_WATCH = args.includes("--watch")
  ? args[args.indexOf("--watch") + 1]
  : null
const MAX_USES = args.includes("--max-uses")
  ? parseInt(args[args.indexOf("--max-uses") + 1], 10)
  : DEFAULT_MAX_USES

// Reject anything unrecognized — a mistyped flag (e.g. "dry-run" without
// dashes) must never silently become a live run.
validateArgs(args, {
  "--dry-run": false,
  "--limit": true,
  "--watch": true,
  "--max-uses": true,
})
function validateArgs(argv, known) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a in known) {
      if (known[a]) i++
      continue
    }
    console.error(
      `Unknown argument: "${a}" — did you mean "--${a.replace(/^-+/, "")}"?\n` +
        `Valid flags: ${Object.keys(known).join(", ")}`
    )
    process.exit(1)
  }
}

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

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  let query = supabase
    .from("watches")
    .select(WATCH_SELECT)
    .eq("price_check_enabled", true)
    // Sold watches keep the flag cleared by recordSale, but belt-and-braces:
    // the agent must never spend on a watch that is no longer owned.
    .neq("sale_status", "sold")
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

  const run = await startRun(supabase, {
    agent: "price-check",
    trigger: process.env.AGENT_RUN_TRIGGER,
    model: MODEL,
    dryRun: DRY_RUN,
  })
  const runItems = []
  const totals = { input: 0, output: 0, searches: 0 }

  let ok = 0
  let failed = 0
  for (const watch of queue) {
    const label = `${watch.brand?.name ?? "?"} ${watch.model}`
    process.stdout.write(`→ ${label} ... `)
    try {
      const { valuation: v, usage, evidence } = await researchWatch(anthropic, watch, {
        maxUses: MAX_USES,
      })
      totals.input += usage.input
      totals.output += usage.output
      totals.searches += usage.searches

      // Evidence gate (00050): a result with no real observations is
      // discarded — the previous valuation stands and the watch is flagged
      // for review rather than silently repriced from thin air.
      const verdict = assessEvidence(v, evidence)
      if (!verdict.ok) {
        failed++
        console.log(`NO DATA: ${verdict.reason} — existing valuation left unchanged`)
        if (!DRY_RUN) {
          await supabase
            .from("watches")
            .update({ needs_value_review: true })
            .eq("id", watch.id)
        }
        runItems.push({
          entityType: "watch",
          entityId: watch.id,
          label,
          action: "failed",
          field: "valuation",
          detail: `insufficient evidence: ${verdict.reason}`,
        })
        continue
      }

      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from("watch_valuations")
          .insert(valuationInsertRow(watch, v))
        if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)
        await supabase
          .from("watches")
          .update({ needs_value_review: false })
          .eq("id", watch.id)
      }

      ok++
      console.log(
        `$${v.market_value_mid_usd.toLocaleString()} (range $${v.market_value_low_usd.toLocaleString()}–$${v.market_value_high_usd.toLocaleString()}, ${v.confidence} confidence, ${v.n_datapoints} datapoints) [${usage.input + usage.output} tokens]`
      )
      runItems.push({
        entityType: "watch",
        entityId: watch.id,
        label,
        action: "updated",
        field: "valuation",
        detail: `$${v.market_value_mid_usd.toLocaleString()} (${v.confidence}, ${v.n_datapoints} datapoints)`,
        confidence: v.confidence,
        sources: v.sources,
      })
      if (DRY_RUN) console.log(JSON.stringify(v, null, 2))
    } catch (err) {
      failed++
      console.log(`FAILED: ${err.message}`)
      runItems.push({
        entityType: "watch",
        entityId: watch.id,
        label,
        action: "failed",
        field: "valuation",
        detail: err.message,
      })
    }
  }

  console.log(
    `\nDone. ${ok} valued, ${failed} failed${DRY_RUN ? " (dry run — nothing written)" : ""}.`
  )

  await finishRun(run, {
    status: failed > 0 ? (ok > 0 ? "partial" : "failed") : "success",
    itemsProcessed: queue.length,
    itemsUpdated: DRY_RUN ? 0 : ok,
    itemsFailed: failed,
    inputTokens: totals.input,
    outputTokens: totals.output,
    webSearches: totals.searches,
    costUsdMicros: usdToMicros(researchCostUsd(totals)),
    notes: `${ok} valued, ${failed} failed`,
    items: runItems,
  })

  if (failed > 0) process.exitCode = 1
}

main()
