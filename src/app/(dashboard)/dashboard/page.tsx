import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { WatchDial } from "@/components/watch-dial"
import { DialActions } from "@/components/dial-actions"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const watches = await getWatches()
  // Only watches with a cover photo can appear on the dial.
  const dialWatches = watches.filter((w) => w.cover_photo_url)

  // Per-request seed for the dial's initial random layout. This Server Component
  // renders once per request and is never re-rendered on the client, so a random
  // value here is stable for the lifetime of the tree.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-8 py-4">
      <WatchDial watches={dialWatches} seed={seed} />
      <DialActions />
    </div>
  )
}
