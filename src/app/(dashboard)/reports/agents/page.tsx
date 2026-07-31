import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAgentReview, formatUsdMicros } from "@/lib/queries/agent-runs"
import type { AgentRun } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Agent Execution Review | CaliberShelf",
}

// Reflect new runs immediately.
export const dynamic = "force-dynamic"

const AGENT_META: Record<string, { label: string; icon: string }> = {
  "price-check": { label: "Market Valuation", icon: "💰" },
  "deal-check": { label: "Deal Scanner", icon: "🏷️" },
  "find-references": { label: "Reference Sweep", icon: "🔎" },
  "find-store-urls": { label: "Brand Enrichment", icon: "🌐" },
  "chronoscout-sync": { label: "ChronoScout Sync", icon: "📚" },
  "spec-fetch": { label: "Spec Autofill", icon: "✨" },
}
const agentLabel = (a: string) => AGENT_META[a]?.label ?? a
const agentIcon = (a: string) => AGENT_META[a]?.icon ?? "🤖"

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.round(s - m * 60)}s`
}

function StatusBadge({ status, dryRun }: { status: AgentRun["status"]; dryRun: boolean }) {
  const color =
    status === "success"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "partial"
        ? "bg-amber-500/15 text-amber-400"
        : status === "failed"
          ? "bg-rose-500/15 text-rose-400"
          : "bg-foreground/10 text-muted-foreground"
  return (
    <span className="flex items-center gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
        {status}
      </span>
      {dryRun && (
        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-400">
          dry run
        </span>
      )}
    </span>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-5">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground/70">{hint}</div>}
      </CardContent>
    </Card>
  )
}

export default async function AgentReviewPage() {
  const { runs, kpis, rollups } = await getAgentReview()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-medium tracking-tight">
          Agent Execution Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every automated agent run — duration, cost, and what changed. Open a run for its full audit trail.
        </p>
      </div>

      {runs.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No agent runs recorded yet. Apply migration{" "}
            <code className="font-mono text-[12px]">00028_create_agent_runs.sql</code>, then
            run an agent (or{" "}
            <code className="font-mono text-[12px]">npm run backfill-agent-runs</code> to import
            past valuation runs).
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Agent spend · last 30 days" value={formatUsdMicros(kpis.costMicros30d)} />
            <Kpi label="Agent spend · all time" value={formatUsdMicros(kpis.costMicrosAll)} />
            <Kpi label="Runs · last 30 days" value={kpis.runs30d.toLocaleString()} />
            <Kpi label="Items updated · last 30 days" value={kpis.itemsUpdated30d.toLocaleString()} />
          </div>

          {/* Per-agent rollup */}
          <Card className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
            <CardHeader className="bg-brass/5">
              <CardTitle className="font-display text-[19px] font-semibold">By agent</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="divide-y divide-border/50">
                {rollups.map((r) => (
                  <div
                    key={r.agent}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-sm"
                  >
                    <span className="flex min-w-[180px] items-center gap-2 font-medium">
                      <span>{agentIcon(r.agent)}</span>
                      {agentLabel(r.agent)}
                    </span>
                    <span className="text-muted-foreground">
                      {r.runs} run{r.runs === 1 ? "" : "s"}
                    </span>
                    <span className="text-muted-foreground">
                      {r.itemsUpdated.toLocaleString()} updated
                    </span>
                    <span className="font-mono text-brass">
                      {r.deterministic ? "free" : formatUsdMicros(r.totalCostMicros)}
                    </span>
                    <span className="text-muted-foreground">avg {fmtDuration(r.avgDurationMs)}</span>
                    {r.lastRun && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        last {fmtDateTime(r.lastRun.started_at)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Run history */}
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent runs</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="divide-y divide-border/50">
                {runs.map((run) => (
                  <Link
                    key={run.id}
                    href={`/reports/agents/${run.id}`}
                    className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-sm hover:bg-accent/40"
                  >
                    <span className="flex min-w-[170px] items-center gap-2 font-medium group-hover:text-primary">
                      <span>{agentIcon(run.agent)}</span>
                      {agentLabel(run.agent)}
                    </span>
                    <StatusBadge status={run.status} dryRun={run.dry_run} />
                    <span className="text-muted-foreground">
                      {run.items_updated}/{run.items_processed} updated
                      {run.items_failed > 0 && (
                        <span className="text-rose-400"> · {run.items_failed} failed</span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-brass">
                      {run.cost_usd_micros > 0 ? formatUsdMicros(run.cost_usd_micros) : "free"}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtDuration(run.duration_ms)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {fmtDateTime(run.started_at)}
                      <span className="ml-2 opacity-60">{run.trigger}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
