import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getCategories } from "@/lib/queries/categories"
import { CollectionView } from "./_components/collection-view"

export const metadata: Metadata = {
  title: "Collection | CaliberShelf",
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const [{ category }, watches, categories] = await Promise.all([
    searchParams,
    getWatches(),
    getCategories(),
  ])

  // Only honor the param if it matches an actual category — otherwise fall
  // back to All so a stale/invalid URL doesn't show an empty table.
  const initialCategoryId =
    category && categories.some((c) => c.id === category) ? category : undefined

  return (
    <CollectionView
      watches={watches}
      categories={categories}
      initialCategoryId={initialCategoryId}
    />
  )
}
