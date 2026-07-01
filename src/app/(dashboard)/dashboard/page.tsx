import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getWornThisWeekCount } from "@/lib/queries/wear-logs"
import { WatchDial } from "@/components/watch-dial"
import { HomeSearch } from "./_components/home-search"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const [watches, wornThisWeek] = await Promise.all([
    getWatches(),
    getWornThisWeekCount(),
  ])
  // Only watches with a cover photo can appear on the dial.
  const dialWatches = watches.filter((w) => w.cover_photo_url)

  // Headline stats for the line under the dial.
  const stats = {
    watches: watches.length,
    brands: new Set(watches.map((w) => w.brand_id)).size,
    wornThisWeek,
  }

  // Per-request seed for the dial's initial random layout. This Server Component
  // renders once per request and is never re-rendered on the client, so a random
  // value here is stable for the lifetime of the tree.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-8 py-8">
      <HomeSearch />
      <WatchDial watches={dialWatches} seed={seed} stats={stats} />
    </div>
  )
}
