import Link from "next/link"
import { notFound } from "next/navigation"
import { getGuideById } from "@/lib/queries/guides"
import { guideEntryStatus } from "@/lib/types/guide"
import type { GuideEntryWithWatch, GuideEntryDisplayStatus } from "@/lib/types/guide"
import { formatCurrency } from "@/lib/utils"
import { CollapsibleReportGroup } from "@/components/collapsible-report-group"
import { WishlistBadge } from "@/components/wishlist-badge"
import { ComingSoonBadge } from "@/components/coming-soon-badge"
import { GuideSpine } from "../_components/guide-spine"
import { EntryStatusButton } from "../_components/entry-status-button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getGuideById(id)
  if (!result) return { title: "Guide Not Found | CaliberShelf" }
  return { title: `${result.guide.name} Guide | CaliberShelf` }
}

export const dynamic = "force-dynamic"

function band(e: GuideEntryWithWatch): string {
  if (e.target_low_cents == null || e.target_high_cents == null) return "—"
  if (e.target_low_cents === e.target_high_cents)
    return formatCurrency(e.target_low_cents, "USD", true)
  return `${formatCurrency(e.target_low_cents, "USD", true)}–${formatCurrency(e.target_high_cents, "USD", true)}`
}

function StatusBadge({ status }: { status: GuideEntryDisplayStatus }) {
  switch (status) {
    case "owned":
      return (
        <span className="inline-flex items-center rounded-full bg-chart-2/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-chart-2 ring-1 ring-chart-2/30">
          Owned
        </span>
      )
    case "coming_soon":
      return <ComingSoonBadge />
    case "wishlist":
      return <WishlistBadge />
    case "passed":
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground/60">
          Passed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Hunting
        </span>
      )
  }
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getGuideById(id)
  if (!result) notFound()
  const { guide, entries } = result

  const withStatus = entries.map((e) => ({ e, status: guideEntryStatus(e) }))
  const ownedCount = withStatus.filter((x) => x.status === "owned").length
  const pct = entries.length > 0 ? Math.round((ownedCount / entries.length) * 100) : 0

  // The guide's "high-value gaps": top unowned, unpassed entries by priority.
  const topGaps = withStatus
    .filter((x) => x.status !== "owned" && x.status !== "coming_soon" && x.status !== "passed")
    .sort((a, b) => (b.e.priority ?? 0) - (a.e.priority ?? 0))
    .slice(0, 5)

  // Chapter grouping preserves entry order.
  const chapters = new Map<string, typeof withStatus>()
  for (const x of withStatus) {
    const key = x.e.chapter ?? "Chapters"
    const list = chapters.get(key) ?? []
    list.push(x)
    chapters.set(key, list)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/guides"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Guides
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {guide.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            Master Collection Guide{guide.version ? ` · v${guide.version}` : ""}
          </span>
        </h1>
        {guide.thesis && (
          <p className="mt-1 max-w-2xl text-sm italic text-muted-foreground">{guide.thesis}</p>
        )}
        <p className="mt-2 text-sm">
          <span className="font-mono tabular-nums text-foreground">{ownedCount}</span> of{" "}
          <span className="font-mono">{entries.length}</span> chapters owned ·{" "}
          <span className="font-mono tabular-nums text-foreground">{pct}%</span> complete
        </p>
      </div>

      {/* The Collection Spine */}
      <GuideSpine entries={entries} />

      {/* High-value gaps */}
      {topGaps.length > 0 && (
        <div className="max-w-2xl rounded-2xl border border-border bg-card px-4 py-3">
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            High-value gaps to fill first
          </h2>
          <ol className="space-y-1 text-sm">
            {topGaps.map(({ e }, i) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="mr-1.5 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{e.title}</span>
                  {e.reference_number && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {e.reference_number}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-xs">
                  <span className="text-foreground">{e.priority ?? "—"}/10</span>
                  <span className="ml-2 text-muted-foreground">{band(e)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Chapters */}
      <div className="space-y-4">
        {[...chapters.entries()].map(([chapter, list]) => (
          <CollapsibleReportGroup
            key={chapter}
            title={chapter}
            summary={
              <>
                {list.filter((x) => x.status === "owned").length} of {list.length} owned
              </>
            }
          >
            <ul className="divide-y divide-border/50">
              {list.map(({ e, status }) => (
                <li
                  key={e.id}
                  className={`px-6 py-3 ${status === "passed" ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                          #{String(e.position).padStart(2, "0")}
                        </span>
                        <span className="font-medium">{e.title}</span>
                        {e.reference_number && (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {e.reference_number}
                          </span>
                        )}
                        {e.dates_text && (
                          <span className="ml-2 text-xs text-muted-foreground">{e.dates_text}</span>
                        )}
                      </p>
                      {e.historical_role && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{e.historical_role}</p>
                      )}
                      {e.recommended_variant && status !== "owned" && (
                        <p className="mt-0.5 text-2xs italic text-muted-foreground/80">
                          {e.recommended_variant}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        {e.priority != null && (
                          <span
                            className={`font-mono text-xs ${(e.priority ?? 0) >= 9 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                            title="Guide priority"
                          >
                            {e.priority}/10
                          </span>
                        )}
                        <StatusBadge status={status} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{band(e)}</span>
                      {e.watch ? (
                        <Link
                          href={`/watch/${e.watch.id}/edit?from=guides`}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          View watch ›
                        </Link>
                      ) : (
                        <EntryStatusButton entryId={e.id} status={e.status} />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CollapsibleReportGroup>
        ))}
      </div>
    </div>
  )
}
