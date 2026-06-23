import Link from "next/link"
import { WatchForm } from "@/components/watch-form"
import { createWatch } from "@/lib/actions/watch-actions"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getCategories } from "@/lib/queries/categories"
import { getLabels } from "@/lib/queries/labels"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Add Watch | CaliberShelf",
}

export default async function NewWatchPage() {
  const [brands, movements, categories, labels] = await Promise.all([
    getBrands(),
    getMovements(),
    getCategories(),
    getLabels(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          &larr; Gallery
        </Button>
        <h1 className="text-lg font-bold tracking-tight">Add a Watch</h1>
      </div>

      <WatchForm
        action={createWatch}
        submitLabel="Add Watch"
        brands={brands}
        movements={movements}
        categories={categories}
        labels={labels}
      />
    </div>
  )
}
