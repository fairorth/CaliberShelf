import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getCategories } from "@/lib/queries/categories"
import { CollectionView } from "./_components/collection-view"

export const metadata: Metadata = {
  title: "Collection | CaliberShelf",
}

export default async function CollectionPage() {
  const [watches, categories] = await Promise.all([getWatches(), getCategories()])

  // The CollectionView reads ?category from the URL itself via
  // useSearchParams, so the dropdown stays in sync on soft navigations.
  return <CollectionView watches={watches} categories={categories} />
}
