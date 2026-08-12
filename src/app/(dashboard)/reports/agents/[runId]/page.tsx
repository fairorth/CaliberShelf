import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAgentRunWithItems, formatUsdMicros } from "@/lib/queries/agent-runs"
import type { AgentRunItem } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Agent Run | CaliberShelf",
}

export const dynamic = "force-dynamic"

const AGENT_LABEL: Record<string, string> = {
  "price-check": "Market Valuation",
  "deal-check": "Deal Scanner",
  "find-references": "Reference Sweep",
  "find-store-urls": "Brand Enrichment",
  "chronoscout-sync": "ChronoScout Sync",
  "spec-fetch": "Spec Autofill",
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.round(s - m * 60)}s`
}

function ActionBadge({ action }: { action: AgentRunItem["action"] }) {
  const color =
    action === "updated"
      ? "bg-emerald-500/15 text-emerald-400"
      : action === "flagged"
        ? "bg-amber-500/15 text-amber-400"
        : action === "failed"
          ? "bg-rose-500/15 text-rose-400"
          : "bg-foreground/10 text-muted-foreground"
  return (
    <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${color}`}>
      {action}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-sm tabular-nums">{value}</div>
      <div className="text-2xs uppercase tracking-wide text-muted-foreground/70">{label}</div>
    </div>
  )
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export default async function AgentRunPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params
  const data = await getAgentRunWithItems(runId)
  if (!data) notFound()
  const { run, items } = data

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports/agents"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Agent Execution Review
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {AGENT_LABEL[run.agent] ?? run.agent}
          {run.dry_run && (
            <span className="ml-2 rounded-full bg-sky-500/15 px-2 py-0.5 align-middle text-2xs font-medium text-sky-400">
              dry run
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(run.started_at).toLocaleString("en-US", {
            weekday: "short",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          · {run.trigger} · status {run.status}
          {run.model ? ` · ${run.model}` : ""}
        </p>
      </div>

      {/* Metrics */}
      <Card className="max-w-3xl overflow-hidden rounded-xl">
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <Stat label="Duration" value={fmtDuration(run.duration_ms)} />
          <Stat
            label="Cost"
            value={run.cost_usd_micros > 0 ? formatUsdMicros(run.cost_usd_micros) : "free"}
          />
          <Stat
            label="Items"
            value={`${run.items_updated}/${run.items_processed}`}
          />
          <Stat label="Failed" value={run.items_failed.toLocaleString()} />
          {(run.input_tokens > 0 || run.output_tokens > 0) && (
            <Stat
              label="Tokens (in/out)"
              value={`${run.input_tokens.toLocaleString()} / ${run.output_tokens.toLocaleString()}`}
            />
          )}
          {run.web_searches > 0 && (
            <Stat label="Web searches" value={run.web_searches.toLocaleString()} />
          )}
          {run.items_skipped > 0 && (
            <Stat label="Skipped" value={run.items_skipped.toLocaleString()} />
          )}
        </CardContent>
      </Card>

      {run.notes && <p className="text-sm text-muted-foreground">{run.notes}</p>}

      {/* Audit trail */}
      <Card className="overflow-hidden rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm">
            Audit trail{items.length > 0 ? ` · ${items.length} item${items.length === 1 ? "" : "s"}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {items.length === 0 ? (
            <p className="px-6 pb-5 text-sm text-muted-foreground">
              This run recorded summary counts only (no per-item detail).
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((it) => (
                <div key={it.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-2.5 text-sm">
                  <ActionBadge action={it.action} />
                  {it.entity_type === "watch" && it.entity_id ? (
                    <Link
                      href={`/watch/${it.entity_id}/edit`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {it.label}
                    </Link>
                  ) : (
                    <span className="font-medium">{it.label}</span>
                  )}
                  {it.field && (
                    <span className="font-mono text-xs text-muted-foreground">{it.field}</span>
                  )}
                  {it.detail && <span className="text-muted-foreground">{it.detail}</span>}
                  {it.sources && it.sources.length > 0 && (
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {it.sources.slice(0, 3).map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-primary"
                        >
                          {i > 0 && ", "}
                          {hostname(url)}
                        </a>
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
