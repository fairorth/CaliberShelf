import type { Metadata } from "next"
import { getDisplayCasesWithWatches } from "@/lib/queries/display-cases"
import { WatchDial } from "@/components/watch-dial"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const cases = await getDisplayCasesWithWatches()
  const totalWatches = cases.reduce((sum, c) => sum + c.watches.length, 0)

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center py-4">
      <WatchDial cases={cases} totalWatches={totalWatches} />
    </div>
  )
}
