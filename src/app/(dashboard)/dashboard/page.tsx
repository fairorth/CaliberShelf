import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getWornThisWeekCount } from "@/lib/queries/wear-logs"
import { WatchHero } from "@/components/watch-hero"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const [watches, wornThisWeek] = await Promise.all([
    getWatches(),
    getWornThisWeekCount(),
  ])
  // Wish-list watches aren't owned — keep them off the hero and out of the stats.
  const owned = watches.filter((w) => !w.is_wishlist)
  // Only watches with a cover photo can be featured in the hero.
  const heroWatches = owned.filter((w) => w.cover_photo_url)

  // Headline stats for the line under the hero.
  const stats = {
    watches: owned.length,
    brands: new Set(owned.map((w) => w.brand_id)).size,
    wornThisWeek,
  }

  // Per-request seed for the hero's initial shuffle. This Server Component
  // renders once per request and is never re-rendered on the client, so a random
  // value here is stable for the lifetime of the tree.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-8">
      <WatchHero watches={heroWatches} seed={seed} stats={stats} />
    </div>
  )
}
