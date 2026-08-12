import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getStraps } from "@/lib/queries/straps"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import type { StrapWatchRef } from "@/lib/types/strap"

export const metadata: Metadata = {
  title: "Straps | CaliberShelf",
}

export const dynamic = "force-dynamic"

function watchLabel(w: StrapWatchRef): string {
  return `${w.brand_name ?? ""} ${w.nickname || w.model}`.trim()
}

export default async function StrapsPage() {
  const straps = await getStraps()
  const mounted = straps.filter((s) => s.current_watch_id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">Straps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {straps.length} {straps.length === 1 ? "strap" : "straps"}
            {mounted > 0 && <> · {mounted} mounted</>}
          </p>
        </div>
        <Button render={<Link href="/straps/new" />}>+ Add Strap</Button>
      </div>

      {straps.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No straps yet. Add your first strap — including the bracelets and straps
            your watches came on — to start tracking them as assets.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {straps.map((strap) => (
            <Link key={strap.id} href={`/straps/${strap.id}/edit`} className="group block">
              <Card className="h-full overflow-hidden pt-0 transition-colors group-hover:border-primary/50">
                <div className="relative aspect-square w-full bg-muted">
                  {strap.cover_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={strap.cover_photo_url}
                      alt={strapDisplayName(strap, strapMaterialLabels[strap.material])}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl opacity-40">
                      〰️
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 font-mono text-xs font-semibold text-foreground backdrop-blur">
                    {strap.width_mm}mm
                  </span>
                </div>
                <CardContent className="space-y-1.5 px-3 pb-3 pt-2">
                  <p className="truncate text-sm font-medium group-hover:text-primary">
                    {strapDisplayName(strap, strapMaterialLabels[strap.material])}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[strap.manufacturer, strapMaterialLabels[strap.material], strap.color]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {strap.quick_release && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-2xs font-medium text-primary">
                        quick release
                      </span>
                    )}
                    {strap.micro_adjust && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-2xs font-medium text-primary">
                        micro-adjust
                      </span>
                    )}
                  </div>
                  {strap.current_watch && (
                    <p className="truncate text-2xs text-emerald-600 dark:text-emerald-400">
                      On: {watchLabel(strap.current_watch)}
                    </p>
                  )}
                  {strap.source_watch && (
                    <p className="truncate text-2xs text-muted-foreground">
                      Came with {watchLabel(strap.source_watch)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
