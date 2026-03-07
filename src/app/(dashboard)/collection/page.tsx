import Link from "next/link"
import { getWatches } from "@/lib/queries/watches"
import { WatchGrid } from "@/components/watch-grid"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Collection | CaliberShelf",
}

export default async function CollectionPage() {
  const watches = await getWatches()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
          <p className="text-sm text-muted-foreground">
            {watches.length} {watches.length === 1 ? "watch" : "watches"} in your collection
          </p>
        </div>
        <Button render={<Link href="/collection/new" />}>
          Add Watch
        </Button>
      </div>

      <WatchGrid watches={watches} />
    </div>
  )
}
