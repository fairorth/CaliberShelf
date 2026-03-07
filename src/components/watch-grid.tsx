import { WatchCard } from "@/components/watch-card"
import type { WatchWithCover } from "@/lib/types/watch"

interface WatchGridProps {
  watches: WatchWithCover[]
}

export function WatchGrid({ watches }: WatchGridProps) {
  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <span className="text-4xl">⌚</span>
        <h3 className="mt-4 text-lg font-semibold">No watches yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first watch to start building your collection.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {watches.map((watch) => (
        <WatchCard key={watch.id} watch={watch} />
      ))}
    </div>
  )
}
