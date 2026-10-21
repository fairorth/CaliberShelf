import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPill } from "@/components/ui/status-pill"
import { getRatingsReport } from "@/lib/queries/ratings"
import type { SessionView } from "@/lib/queries/ratings"
import { getWatches } from "@/lib/queries/watches"
import type { WatchWithCover } from "@/lib/types/watch"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Ratings | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/**
 * Ratings — Rate My Watches results (00057). "Everyone" is the consensus:
 * every rater's latest picks per segment, re-fitted together. Pick a rater
 * for their own rankings, Best in Show and agreement with the owner. The
 * rater lives in the URL (?rater=) so a view is linkable.
 */
export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ rater?: string }> }) {
  const { rater: raterParam } = await searchParams
  const [report, watches] = await Promise.all([getRatingsReport(), getWatches()])
  const byId = new Map(watches.map((w) => [w.id, w]))
  const selected = report.raters.find((r) => r.id === raterParam) ?? null
  const owner = report.raters.find((r) => r.isOwner) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Ratings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rate My Watches, from the iPhone: friends tap their favourite of two watches, one segment at a time.
          {report.raters.length === 0 && " Nobody has played yet — start a game from the phone's Rate tab."}
        </p>
      </div>

      {report.raters.length > 0 && (
        <nav aria-label="Rater" className="flex flex-wrap gap-2">
          <RaterLink href="/reports/ratings" active={!selected}>
            Everyone
          </RaterLink>
          {report.raters.map((r) => (
            <RaterLink key={r.id} href={`/reports/ratings?rater=${r.id}`} active={selected?.id === r.id}>
              {r.name}
              {r.isOwner ? " (you)" : ""}
            </RaterLink>
          ))}
        </nav>
      )}

      {!selected ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {report.consensus.map((c) => (
            <Card key={c.key}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-md">{c.segmentName}</span>
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {c.raterCount} {c.raterCount === 1 ? "rater" : "raters"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.divisive && byId.get(c.divisive.watchId) && (
                  <p className="text-xs text-muted-foreground">
                    Most divisive: <span className="text-foreground">{label(byId.get(c.divisive.watchId)!)}</span>
                  </p>
                )}
                <RankList ranking={c.ranking} byId={byId} />
              </CardContent>
            </Card>
          ))}
          {report.consensus.length === 0 && report.raters.length > 0 && (
            <p className="text-sm text-muted-foreground">No segments completed yet.</p>
          )}
        </div>
      ) : (
        <RaterView
          sessions={report.sessions.filter((s) => s.raterId === selected.id)}
          byId={byId}
          ownerName={owner?.name ?? "the owner"}
          isOwner={selected.isOwner}
        />
      )}
    </div>
  )
}

function RaterView({
  sessions,
  byId,
  ownerName,
  isOwner,
}: {
  sessions: SessionView[]
  byId: Map<string, WatchWithCover>
  ownerName: string
  isOwner: boolean
}) {
  const final = sessions.find((s) => s.kind === "final")
  const segments = sessions.filter((s) => s.kind === "segment").sort((a, b) => a.segmentName.localeCompare(b.segmentName))
  const champion = final ? byId.get(final.ranking[0]?.watchId ?? "") : undefined
  return (
    <div className="space-y-4">
      {champion && final && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Trophy className="h-6 w-6 shrink-0 text-brass" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Best in Show</p>
              <p className="truncate text-sm text-foreground">{label(champion)}</p>
            </div>
            {final.agreementWithOwner !== null && (
              <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                {Math.round(final.agreementWithOwner * 100)}% with {ownerName}
              </span>
            )}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {segments.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between gap-2">
                <span className="font-display text-md">{s.segmentName}</span>
                <span className="flex items-center gap-2">
                  {s.agreementWithOwner !== null && !isOwner && (
                    <StatusPill tone="outline" title={`Share of pairs ordered the same as ${ownerName}`}>
                      {Math.round(s.agreementWithOwner * 100)}% with {ownerName}
                    </StatusPill>
                  )}
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {new Date(s.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankList ranking={s.ranking} byId={byId} />
            </CardContent>
          </Card>
        ))}
      </div>
      {segments.length === 0 && <p className="text-sm text-muted-foreground">No completed segments for this rater.</p>}
    </div>
  )
}

function RankList({
  ranking,
  byId,
}: {
  ranking: Array<{ watchId: string; rank: number }>
  byId: Map<string, WatchWithCover>
}) {
  return (
    <ol className="divide-y divide-border">
      {ranking.map((r) => {
        const w = byId.get(r.watchId)
        return (
          <li key={r.watchId} className="flex items-center gap-3 py-1.5">
            <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{r.rank}</span>
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-photo">
              {w?.cover_thumb_url && (
                <Image src={w.cover_thumb_url} alt="" fill sizes="40px" className="object-cover" unoptimized />
              )}
            </span>
            {w ? (
              <Link href={`/watch/${w.id}`} className="min-w-0 truncate text-sm hover:text-brass">
                {label(w)}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">A watch no longer in the collection</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function RaterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm ring-1 transition-colors duration-150",
        active ? "bg-brass/14 font-medium text-brass ring-brass/45" : "text-muted-foreground ring-border hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

function label(w: WatchWithCover): string {
  return `${w.brand.name} ${w.model}`
}
