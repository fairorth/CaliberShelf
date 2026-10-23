import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPill } from "@/components/ui/status-pill"
import { getRatingsReport } from "@/lib/queries/ratings"
import type { RankRow, RaterView as RaterInfo, SessionView } from "@/lib/queries/ratings"
import { getTierBands } from "@/lib/queries/tier-config"
import { getWatches } from "@/lib/queries/watches"
import { SEGMENT_SCHEMES, segmentSchemeLabels, tierLabelForKey } from "@/lib/rating-segments"
import type { SegmentScheme } from "@/lib/rating-segments"
import type { TierBand } from "@/lib/tiers"
import type { WatchWithCover } from "@/lib/types/watch"
import { cn } from "@/lib/utils"
import { RemoveRatingButton } from "./_components/remove-rating-button"

export const metadata: Metadata = {
  title: "Ratings | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/**
 * Ratings — Rate My Watches results (00057). "Everyone" is the consensus:
 * every rater's latest picks per segment, re-fitted together. Pick a rater
 * for their own rankings, Best in Show and agreement with the owner. The
 * rater and the segment scheme (Type / Tier / Type + Tier) live in the URL
 * (?rater=, ?scheme=) so a view is linkable.
 *
 * The game names tiers neutrally ("Tier 2") so friends never see a price;
 * this report is the owner's, so it adds the real tier label beside it.
 */
export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ rater?: string; scheme?: string }>
}) {
  const { rater: raterParam, scheme: schemeParam } = await searchParams
  const [report, watches, bands] = await Promise.all([getRatingsReport(), getWatches(), getTierBands()])
  const byId = new Map(watches.map((w) => [w.id, w]))
  const selected = report.raters.find((r) => r.id === raterParam) ?? null
  const owner = report.raters.find((r) => r.isOwner) ?? null
  const scheme: SegmentScheme = (SEGMENT_SCHEMES as readonly string[]).includes(schemeParam ?? "")
    ? (schemeParam as SegmentScheme)
    : "type"
  const hrefFor = (raterId: string | null, sc: SegmentScheme) => {
    const q = new URLSearchParams()
    if (raterId) q.set("rater", raterId)
    if (sc !== "type") q.set("scheme", sc)
    const qs = q.toString()
    return qs ? `/reports/ratings?${qs}` : "/reports/ratings"
  }
  const consensus = report.consensus.filter((c) => c.scheme === scheme)

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
        <div className="space-y-3">
          <nav aria-label="Rater" className="flex flex-wrap gap-2">
            <RaterLink href={hrefFor(null, scheme)} active={!selected}>
              Everyone
            </RaterLink>
            {report.raters.map((r) => (
              <RaterLink key={r.id} href={hrefFor(r.id, scheme)} active={selected?.id === r.id}>
                {r.name}
                {r.isOwner ? " (you)" : ""}
              </RaterLink>
            ))}
          </nav>
          <nav aria-label="Segments by" className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Segments by</span>
            {SEGMENT_SCHEMES.map((sc) => (
              <RaterLink key={sc} href={hrefFor(selected?.id ?? null, sc)} active={scheme === sc}>
                {segmentSchemeLabels[sc]}
              </RaterLink>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            Score: the model&rsquo;s strength, 1500 = an average watch in the segment. Beside it, the chance it
            beats the watch below in a pick &mdash; <span className="text-foreground">clear</span> when that gap is
            bigger than the model&rsquo;s uncertainty, <span className="text-foreground">close</span> when more picks
            could swap them.
          </p>
        </div>
      )}

      {!selected ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {consensus.map((c) => (
            <Card key={c.segmentKey}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-2">
                  <SegmentTitle name={c.segmentName} segmentKey={c.segmentKey} bands={bands} />
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
          {consensus.length === 0 && report.raters.length > 0 && (
            <p className="text-sm text-muted-foreground">No {segmentSchemeLabels[scheme]} segments completed yet.</p>
          )}
        </div>
      ) : (
        <RaterView
          rater={selected}
          sessions={report.sessions.filter((s) => s.raterId === selected.id && s.scheme === scheme)}
          totalSegments={report.sessions.filter((s) => s.raterId === selected.id && s.kind === "segment").length}
          byId={byId}
          bands={bands}
          ownerName={owner?.name ?? "the owner"}
          everyoneHref={hrefFor(null, scheme)}
        />
      )}
    </div>
  )
}

function RaterView({
  rater,
  sessions,
  totalSegments,
  byId,
  bands,
  ownerName,
  everyoneHref,
}: {
  rater: RaterInfo
  sessions: SessionView[]
  /** Across every scheme — what removing the player takes with them. */
  totalSegments: number
  byId: Map<string, WatchWithCover>
  bands: TierBand[]
  ownerName: string
  everyoneHref: string
}) {
  const isOwner = rater.isOwner
  const final = sessions.find((s) => s.kind === "final")
  const segments = sessions.filter((s) => s.kind === "segment").sort((a, b) => a.segmentName.localeCompare(b.segmentName))
  const champion = final ? byId.get(final.ranking[0]?.watchId ?? "") : undefined
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RemoveRatingButton
          target="rater"
          id={rater.id}
          label={`Remove ${rater.name}`}
          title={`Remove ${rater.name}?`}
          description={
            `Deletes ${rater.name} and every rating they made` +
            (totalSegments > 0 ? ` (${totalSegments} segment${totalSegments === 1 ? "" : "s"}, every scheme)` : "") +
            ". The consensus is re-fitted without them." +
            (isOwner
              ? ` ${rater.name} is the owner — "you agree with …" has no yardstick until someone plays as the owner again.`
              : "") +
            " This can't be undone."
          }
          afterHref={everyoneHref}
        />
      </div>
      {champion && final && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Trophy className="h-6 w-6 shrink-0 text-brass" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Best in Show</p>
              <p className="truncate text-sm text-foreground">{label(champion)}</p>
            </div>
            <span className="ml-auto flex items-center gap-2">
              {final.agreementWithOwner !== null && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(final.agreementWithOwner * 100)}% with {ownerName}
                </span>
              )}
              <RemoveRatingButton
                target="session"
                id={final.id}
                title={`Remove ${rater.name}'s Best in Show?`}
                description={removeSessionText(final, rater.name)}
              />
            </span>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {segments.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between gap-2">
                <SegmentTitle name={s.segmentName} segmentKey={s.segmentKey} bands={bands} />
                <span className="flex items-center gap-2">
                  {s.agreementWithOwner !== null && !isOwner && (
                    <StatusPill tone="outline" title={`Share of pairs ordered the same as ${ownerName}`}>
                      {Math.round(s.agreementWithOwner * 100)}% with {ownerName}
                    </StatusPill>
                  )}
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {new Date(s.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <RemoveRatingButton
                    target="session"
                    id={s.id}
                    title={`Remove ${rater.name}'s ${s.segmentName} result?`}
                    description={removeSessionText(s, rater.name)}
                  />
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

/** What removing one result does — including what takes its place. */
function removeSessionText(s: SessionView, raterName: string): string {
  const played = new Date(s.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const after =
    s.earlierPlays > 0
      ? ` ${raterName}'s previous play of it takes its place.`
      : ` ${raterName} will have no result for it until they play it again.`
  return `Deletes the ${s.pickCount} picks from ${played}.${after} Their other results are kept. This can't be undone.`
}

/** The segment's game name, plus (tier segments) the owner's real tier label. */
function SegmentTitle({ name, segmentKey, bands }: { name: string; segmentKey: string; bands: TierBand[] }) {
  const tier = segmentKey.includes("tier:") ? tierLabelForKey(segmentKey, bands) : null
  return (
    <span className="min-w-0">
      <span className="font-display text-md">{name}</span>
      {tier && <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">{tier}</span>}
    </span>
  )
}

function RankList({ ranking, byId }: { ranking: RankRow[]; byId: Map<string, WatchWithCover> }) {
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
            <span className="ml-auto flex shrink-0 items-baseline gap-3 font-mono text-xs tabular-nums text-muted-foreground">
              <span title="Score: 1500 is an average watch in this segment">{Math.round(r.score)}</span>
              <span className="w-20 text-right" title={r.vsNext ? `Chance it beats #${r.rank + 1} in a pick` : undefined}>
                {r.vsNext ? `${Math.round(r.vsNext.winChance * 100)}% · ${r.vsNext.clear ? "clear" : "close"}` : ""}
              </span>
            </span>
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
