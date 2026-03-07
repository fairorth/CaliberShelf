import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { CollectionTable } from "@/components/collection-table"

export const metadata: Metadata = {
  title: "Collection | CaliberShelf",
}

export default async function CollectionPage() {
  const watches = await getWatches()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
      <CollectionTable watches={watches} />
    </div>
  )
}
