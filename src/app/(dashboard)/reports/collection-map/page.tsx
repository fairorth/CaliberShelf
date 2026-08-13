import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { getWatches } from "@/lib/queries/watches"
import { getTierBands } from "@/lib/queries/tier-config"
import { buildCollectionMap } from "@/lib/collection-map"
import { CollectionMapView } from "./_components/collection-map-view"

export const metadata: Metadata = {
  title: "Collection Map | TenTenLoupe",
}

export const dynamic = "force-dynamic"

export default async function CollectionMapPage() {
  const [watches, tierBands] = await Promise.all([getWatches(), getTierBands()])
  // The map analyzes what you OWN — wish-list watches are aspiration, not
  // collection composition (they feed the taste engine later, not the gaps here).
  const owned = watches.filter((w) => !w.is_wishlist)
  const map = buildCollectionMap(owned, tierBands)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">Collection Map</h1>
      </div>

      {owned.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No owned watches yet — add some to see how your collection is distributed.
          </CardContent>
        </Card>
      ) : (
        <CollectionMapView map={map} />
      )}
    </div>
  )
}
