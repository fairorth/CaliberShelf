// Shared agent-run recorder. Every batch agent calls startRun() at the top and
// finishRun() at the end so the Agent Execution Review report (/reports/agents)
// has duration, cost, and item counts for each invocation. See migration 00028.
//
// DESIGN RULE: logging must never break the agent. Every DB call here is
// wrapped — if the agent_runs table doesn't exist yet (migration not applied),
// or a write fails, we warn and carry on. The agent's real work is unaffected.
//
// Cron scripts run under the service role (RLS bypassed) and log as "system"
// runs (user_id null); the SELECT policy still shows those to the owner.
// Set AGENT_RUN_TRIGGER=cron (or manual-dispatch) in CI to label the trigger.
// Set AGENT_RUN_DISABLED=1 to skip run logging entirely.

/** Convert a USD amount to integer microdollars (usd * 1_000_000). */
export function usdToMicros(usd) {
  return Number.isFinite(usd) ? Math.round(usd * 1_000_000) : 0
}

const DISABLED = process.env.AGENT_RUN_DISABLED === "1"

/**
 * Insert a "running" agent_runs row and return a handle to finish later.
 * Always returns a handle; on failure the handle is inert and finishRun no-ops.
 */
export async function startRun(supabase, { agent, trigger, model = null, dryRun = false, userId = null }) {
  const run = {
    supabase,
    id: null,
    startedAtMs: Date.now(),
    agent,
    userId,
  }
  if (DISABLED) return run
  try {
    const { data, error } = await supabase
      .from("agent_runs")
      .insert({
        user_id: userId,
        agent,
        trigger: trigger ?? process.env.AGENT_RUN_TRIGGER ?? "manual-cli",
        status: "running",
        model,
        dry_run: dryRun,
        started_at: new Date(run.startedAtMs).toISOString(),
      })
      .select("id")
      .single()
    if (error) throw error
    run.id = data.id
  } catch (err) {
    console.warn(`  (agent-run logging unavailable: ${err.message ?? err})`)
  }
  return run
}

/**
 * Finalize a run: update counts/tokens/cost/status and (optionally) write the
 * per-item audit trail. `items` entries: { entityType, entityId, label, action,
 * field, detail, confidence, costUsdMicros, sources }.
 */
export async function finishRun(run, result = {}) {
  if (!run || DISABLED) return
  const {
    status = "success",
    itemsProcessed = 0,
    itemsUpdated = 0,
    itemsSkipped = 0,
    itemsFailed = 0,
    inputTokens = 0,
    outputTokens = 0,
    webSearches = 0,
    costUsdMicros = 0,
    notes = null,
    items = [],
  } = result

  if (!run.id) return // startRun failed — nothing to update

  const finishedAtMs = Date.now()
  try {
    const { error } = await run.supabase
      .from("agent_runs")
      .update({
        status,
        finished_at: new Date(finishedAtMs).toISOString(),
        duration_ms: finishedAtMs - run.startedAtMs,
        items_processed: itemsProcessed,
        items_updated: itemsUpdated,
        items_skipped: itemsSkipped,
        items_failed: itemsFailed,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        web_searches: webSearches,
        cost_usd_micros: costUsdMicros,
        notes,
      })
      .eq("id", run.id)
    if (error) throw error
  } catch (err) {
    console.warn(`  (agent-run finalize failed: ${err.message ?? err})`)
  }

  if (Array.isArray(items) && items.length > 0) {
    try {
      const rows = items.map((it) => ({
        run_id: run.id,
        user_id: run.userId,
        entity_type: it.entityType ?? null,
        entity_id: it.entityId ?? null,
        label: it.label ?? "(unnamed)",
        action: it.action ?? "updated",
        field: it.field ?? null,
        detail: it.detail ?? null,
        confidence: it.confidence ?? null,
        cost_usd_micros: it.costUsdMicros ?? null,
        sources: it.sources ?? null,
      }))
      // Batch to keep payloads reasonable.
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await run.supabase
          .from("agent_run_items")
          .insert(rows.slice(i, i + 500))
        if (error) throw error
      }
    } catch (err) {
      console.warn(`  (agent-run items log failed: ${err.message ?? err})`)
    }
  }
}
