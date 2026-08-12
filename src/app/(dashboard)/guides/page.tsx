import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGuides } from "@/lib/queries/guides"

export const metadata: Metadata = {
  title: "Collection Guides | CaliberShelf",
}

export const dynamic = "force-dynamic"

export default async function GuidesPage() {
  const guides = await getGuides()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Collection Guides
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Master collection guides — the strategic tier of wanting. Each guide is a
          narrative of chapters a collection should cover; every acquisition must earn
          its place.
        </p>
      </div>

      {guides.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No guides yet. Guides are seeded from your Master Collection Guide
            documents (see <span className="font-mono text-xs">docs/Watch guides/</span>).
          </CardContent>
        </Card>
      ) : (
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          {guides.map((g) => {
            const pct = g.entry_count > 0 ? Math.round((g.owned_count / g.entry_count) * 100) : 0
            return (
              <Link key={g.id} href={`/guides/${g.id}`} className="group block">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between gap-2 text-sm">
                      {g.name}
                      {g.version && (
                        <span className="font-mono text-2xs font-normal text-muted-foreground">
                          v{g.version}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {g.thesis && (
                      <p className="text-sm italic text-muted-foreground">{g.thesis}</p>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {g.owned_count} of {g.entry_count} chapters owned
                        </span>
                        <span className="font-mono tabular-nums text-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
