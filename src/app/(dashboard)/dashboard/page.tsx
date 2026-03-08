import type { Metadata } from "next"
import { getCategoriesWithWatches } from "@/lib/queries/categories"
import { WatchDial } from "@/components/watch-dial"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const categories = await getCategoriesWithWatches()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center py-4">
      <WatchDial categories={categories} />
    </div>
  )
}
