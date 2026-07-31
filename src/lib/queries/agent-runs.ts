import { createClient } from "@/lib/supabase/server"
import type { AgentRun, AgentRunItem } from "@/lib/types/watch"

/**
 * All agent runs, newest first. RLS restricts to the owner's rows plus system
 * (null-user) rows. The dataset stays small for a personal collection, so the
 * report groups/rolls up in JS (same approach as the valuations report).
 * Returns [] if the table doesn't exist yet (migration 00028 not applied).
 */
export async function getAgentRuns(): Promise<AgentRun[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("Failed to fetch agent runs:", error.message)
    return []
  }
  return (data ?? []) as AgentRun[]
}

/** A single run with its per-item audit trail, or null if not found. */
export async function getAgentRunWithItems(
  id: string
): Promise<{ run: AgentRun; items: AgentRunItem[] } | null> {
  const supabase = await createClient()
  const { data: run, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error || !run) return null

  const { data: items } = await supabase
    .from("agent_run_items")
    .select("*")
    .eq("run_id", id)
    .order("created_at", { ascending: true })

  return { run: run as AgentRun, items: (items ?? []) as AgentRunItem[] }
}

// ── Pure derivations (no I/O) ────────────────────────────────────

export interface AgentRollup {
  agent: string
  runs: number
  lastRun: AgentRun | null
  itemsUpdated: number
  totalCostMicros: number
  avgDurationMs: number | null
  deterministic: boolean // never spent money
}

/** One summary row per agent, sorted by most recent activity. */
export function rollupByAgent(runs: AgentRun[]): AgentRollup[] {
  const byAgent = new Map<string, AgentRun[]>()
  for (const r of runs) {
    if (!byAgent.has(r.agent)) byAgent.set(r.agent, [])
    byAgent.get(r.agent)!.push(r)
  }
  const rollups: AgentRollup[] = []
  for (const [agent, list] of byAgent) {
    const durations = list
      .map((r) => r.duration_ms)
      .filter((d): d is number => d != null)
    const totalCostMicros = list.reduce((s, r) => s + (r.cost_usd_micros ?? 0), 0)
    rollups.push({
      agent,
      runs: list.length,
      lastRun: list[0] ?? null, // list inherits newest-first order
      itemsUpdated: list.reduce((s, r) => s + (r.items_updated ?? 0), 0),
      totalCostMicros,
      avgDurationMs: durations.length
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null,
      deterministic: totalCostMicros === 0,
    })
  }
  return rollups.sort((a, b) => {
    const at = a.lastRun ? Date.parse(a.lastRun.started_at) : 0
    const bt = b.lastRun ? Date.parse(b.lastRun.started_at) : 0
    return bt - at
  })
}

export interface AgentKpis {
  costMicros30d: number
  costMicrosAll: number
  runs30d: number
  itemsUpdated30d: number
}

/** Headline numbers. `nowMs` is passed in so the caller controls "now". */
export function computeKpis(runs: AgentRun[], nowMs: number): AgentKpis {
  const cutoff = nowMs - 30 * 24 * 60 * 60 * 1000
  let costMicros30d = 0
  let costMicrosAll = 0
  let runs30d = 0
  let itemsUpdated30d = 0
  for (const r of runs) {
    costMicrosAll += r.cost_usd_micros ?? 0
    if (Date.parse(r.started_at) >= cutoff) {
      costMicros30d += r.cost_usd_micros ?? 0
      runs30d++
      itemsUpdated30d += r.items_updated ?? 0
    }
  }
  return { costMicros30d, costMicrosAll, runs30d, itemsUpdated30d }
}

/**
 * Everything the Agent Execution Review page needs, with "now" resolved here in
 * a plain module (Date.now() isn't allowed inside a Server Component render).
 */
export async function getAgentReview(): Promise<{
  runs: AgentRun[]
  kpis: AgentKpis
  rollups: AgentRollup[]
}> {
  const runs = await getAgentRuns()
  const nowMs = Date.now()
  return { runs, kpis: computeKpis(runs, nowMs), rollups: rollupByAgent(runs) }
}

/** Format integer microdollars as a $ string. */
export function formatUsdMicros(micros: number | null | undefined): string {
  const usd = (micros ?? 0) / 1_000_000
  if (usd === 0) return "$0"
  if (usd < 0.01) return "<$0.01"
  if (usd < 100) return `$${usd.toFixed(2)}`
  return `$${Math.round(usd).toLocaleString()}`
}
