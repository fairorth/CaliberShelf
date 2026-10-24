import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Crown, Lock, Swords, Trophy } from "lucide-react"
import { ShowcasePhoto, type ShowcaseWatch } from "./showcase-watch"

export interface CrowdFavourite {
  segmentName: string
  raterCount: number
  watch: ShowcaseWatch
}

/**
 * Rate My Watches, told as a spotlight: the duel drawn with two real
 * photographs from the collection, the three beats of a game, and — once
 * friends have played — the crowd's actual favourites, live from the same
 * consensus the Ratings report fits (queries/ratings.ts). No prices, ever:
 * the game never shows one, so its showcase doesn't either.
 */
export function RateGameSpotlight({
  duel,
  favourites,
  friendCount,
}: {
  duel: [ShowcaseWatch, ShowcaseWatch] | null
  favourites: CrowdFavourite[]
  friendCount: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              The party game
            </p>
            <h3 className="mt-1 font-display text-md font-semibold tracking-tight">Rate My Watches</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Hand your phone to a friend and let them rank your collection, two watches at a time. They tap the
              one they prefer; the app does the statistics. At the end: a podium, how closely they agree with
              you, and the hot take where they disagree most.
            </p>
          </div>

          <ol className="grid gap-2.5 sm:grid-cols-3">
            <Beat
              icon={Swords}
              step="1 · The duel"
              text="Front photo over caseback, swipe for more shots. Tap to pick, or call it Equal, or Skip."
            />
            <Beat
              icon={Trophy}
              step="2 · The reveal"
              text="A podium, the full ranking, “87% — you agree with the owner”, and the hot take."
            />
            <Beat
              icon={Crown}
              step="3 · Best in Show"
              text="Each segment’s top three meet in a final round that crowns one champion."
            />
          </ol>

          <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Smart pairings.</span> A Bradley–Terry model (the statistics
              behind chess and sports rankings) picks every next duel. It settles a ranking in 3–4× fewer taps
              than random pairs.
            </li>
            <li>
              <span className="inline-flex items-center gap-1 text-foreground">
                <Lock className="h-3 w-3" aria-hidden="true" /> Locked for guests.
              </span>{" "}
              Full screen, no swipe-back; only your Face ID lets them out. No prices anywhere, and tiers are named
              “Tier 2”, so even the grouping doesn’t hint at cost.
            </li>
            <li>
              <span className="text-foreground">Fair segments.</span> Dress against dress, sport against sport,
              or by tier. Half-played games resume later, and it all works without signal.
            </li>
          </ul>
        </div>

        {duel && <DuelMock duel={duel} />}
      </div>

      {favourites.length > 0 && (
        <div className="border-t border-border bg-surface-rail px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              The crowd’s favourites · {friendCount} {friendCount === 1 ? "friend has" : "friends have"} played
            </p>
            <Link href="/reports/ratings" className="text-xs font-medium text-brass hover:underline">
              See every ranking →
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {favourites.map((f) => (
              <li key={f.segmentName} className="min-w-0">
                <ShowcasePhoto
                  watch={f.watch}
                  sizes="(min-width: 1024px) 180px, 45vw"
                  className="aspect-square rounded-xl border border-border"
                />
                <p className="mt-1.5 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
                  #1 {f.segmentName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{f.watch.name}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Beat({ icon: Icon, step, text }: { icon: LucideIcon; step: string; text: string }) {
  return (
    <li className="rounded-xl bg-muted/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        {step}
      </p>
      <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">{text}</p>
    </li>
  )
}

/** The duel screen, drawn — two real watches, the question, Equal and Skip. */
function DuelMock({ duel }: { duel: [ShowcaseWatch, ShowcaseWatch] }) {
  return (
    <figure className="mx-auto w-full max-w-[340px] self-center rounded-xl border border-border bg-surface-rail p-3 shadow-sm">
      <p className="text-center font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        Which do you prefer?
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {duel.map((w) => (
          <ShowcasePhoto
            key={w.id}
            watch={w}
            sizes="160px"
            className="aspect-[3/4] rounded-xl border border-border"
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-2" aria-hidden="true">
        <span className="rounded-full px-3 py-1 text-2xs font-medium text-muted-foreground ring-1 ring-border">
          Equal
        </span>
        <span className="rounded-full px-3 py-1 text-2xs font-medium text-muted-foreground ring-1 ring-border">
          Skip
        </span>
      </div>
      <figcaption className="mt-2 text-center text-2xs text-muted-foreground">
        Two of your own watches, as a friend sees them
      </figcaption>
    </figure>
  )
}
