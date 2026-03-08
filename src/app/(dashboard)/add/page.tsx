import type { Metadata } from "next"
import { getBrands } from "@/lib/queries/brands"
import { getCategories } from "@/lib/queries/categories"
import { AddWatchFlow } from "./_components/add-watch-flow"

export const metadata: Metadata = {
  title: "Add Watch | CaliberShelf",
}

export default async function AddWatchPage() {
  const [brands, categories] = await Promise.all([
    getBrands(),
    getCategories(),
  ])

  return (
    <div className="mx-auto max-w-lg">
      <AddWatchFlow
        brands={brands}
        categories={categories}
      />
    </div>
  )
}
