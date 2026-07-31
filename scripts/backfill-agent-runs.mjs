// One-time backfill for the Agent Execution Review report: synthesize historic
// agent_runs (+ items) from data the agents already persisted, so the report is
// populated before any newly-instrumented run happens.
//
// Sources:
//   - watch_valuations  -> one 'price-check' run per calendar day, one item per
//                          valuation (cost/tokens unknown historically -> 0).
//   - chronoscout_sync_state -> one 'chronoscout-sync' run for the last sync.
//
// Idempotent-ish: refuses to run if backfill rows already exist unless --force.
//
// Usage:
//   node scripts/backfill-agent-runs.mjs [--dry-run] [--force]
//
// Required in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const FORCE = args.includes("--force")
for (const a of args) {
  if (a !== "--dry-run" && a !== "--force") {
    console.error(`Unknown argument: "${a}". Valid: --dry-run, --force`)
    process.exit(1)
  }
}

const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
  (k) => !process.env[k]
)
if (missing.length > 0) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const runDate = (iso) => new Date(iso).toISOString().slice(0, 10)

async function main() {
  // Guard against double-backfill.
  const { count: existing } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("trigger", "backfill")
  if (existing && existing > 0 && !FORCE) {
    console.error(
      `${existing} backfill run(s) already exist. Re-run with --force to add anyway.`
    )
    process.exit(1)
  }

  // ── Valuations → price-check runs ──
  const { data: valuations, error: vErr } = await supabase
    .from("watch_valuations")
    .select(
      "id, user_id, watch_id, valued_at, value_mid_cents, confidence, agent_model, n_datapoints, sources, watches(model, brands(name))"
    )
    .order("valued_at", { ascending: true })
  if (vErr) {
    console.error("Failed to read watch_valuations:", vErr.message)
    process.exit(1)
  }

  const byDate = new Map()
  for (const v of valuations ?? []) {
    const d = runDate(v.valued_at)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d).push(v)
  }

  let runsCreated = 0
  let itemsCreated = 0

  for (const [date, rows] of byDate) {
    const first = rows[0]
    const times = rows.map((r) => new Date(r.valued_at).getTime())
    const startedAt = new Date(Math.min(...times)).toISOString()
    const finishedAt = new Date(Math.max(...times)).toISOString()
    const model = first.agent_model ?? "claude-sonnet-5"

    console.log(`price-check ${date}: ${rows.length} valuation(s)`)
    if (DRY_RUN) {
      runsCreated++
      itemsCreated += rows.length
      continue
    }

    const { data: run, error: rErr } = await supabase
      .from("agent_runs")
      .insert({
        user_id: first.user_id ?? null,
        agent: "price-check",
        trigger: "backfill",
        status: "success",
        started_at: startedAt,
        finished_at: finishedAt,
        model,
        items_processed: rows.length,
        items_updated: rows.length,
        notes: `Backfilled from ${rows.length} watch_valuations rows (cost/tokens unknown)`,
      })
      .select("id")
      .single()
    if (rErr) {
      console.error(`  ! run insert failed: ${rErr.message}`)
      continue
    }
    runsCreated++

    const items = rows.map((r) => ({
      run_id: run.id,
      user_id: r.user_id ?? null,
      entity_type: "watch",
      entity_id: r.watch_id,
      label: `${r.watches?.brands?.name ?? ""} ${r.watches?.model ?? "watch"}`.trim(),
      action: "updated",
      field: "valuation",
      detail: `$${(r.value_mid_cents / 100).toLocaleString()} (${r.confidence}, ${r.n_datapoints ?? "?"} datapoints)`,
      confidence: r.confidence,
      sources: r.sources ?? null,
    }))
    for (let i = 0; i < items.length; i += 500) {
      const { error: iErr } = await supabase
        .from("agent_run_items")
        .insert(items.slice(i, i + 500))
      if (iErr) console.error(`  ! items insert failed: ${iErr.message}`)
      else itemsCreated += Math.min(500, items.length - i)
    }
  }

  // ── ChronoScout sync state → one run ──
  const { data: sync } = await supabase
    .from("chronoscout_sync_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle()
  if (sync) {
    const when = sync.last_watches_sync_at ?? sync.updated_at ?? new Date().toISOString()
    const total = (sync.brands_count ?? 0) + (sync.watches_count ?? 0)
    console.log(`chronoscout-sync: ${total} catalog rows (from sync_state)`)
    if (!DRY_RUN) {
      const { error: cErr } = await supabase.from("agent_runs").insert({
        user_id: null,
        agent: "chronoscout-sync",
        trigger: "backfill",
        status: "success",
        started_at: when,
        finished_at: when,
        items_processed: total,
        items_updated: total,
        notes: sync.last_run_notes ?? "Backfilled from chronoscout_sync_state",
      })
      if (cErr) console.error(`  ! chronoscout run insert failed: ${cErr.message}`)
      else runsCreated++
    } else {
      runsCreated++
    }
  }

  console.log(
    `\nDone${DRY_RUN ? " (dry run — nothing written)" : ""}: ${runsCreated} run(s), ${itemsCreated} item(s).`
  )
}

main().catch((err) => {
  console.error("backfill-agent-runs failed:", err)
  process.exit(1)
})
