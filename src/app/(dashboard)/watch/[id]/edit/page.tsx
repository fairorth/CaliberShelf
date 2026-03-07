import { notFound } from "next/navigation"
import Link from "next/link"
import { getWatchById, getWatches } from "@/lib/queries/watches"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getDisplayCases } from "@/lib/queries/display-cases"
import { WatchForm } from "@/components/watch-form"
import { updateWatch } from "@/lib/actions/watch-actions"
import { Button } from "@/components/ui/button"
import type { WatchWithCover } from "@/lib/types/watch"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return {
    title: `Edit ${watch.brand.name} ${watch.model} | CaliberShelf`,
  }
}

export default async function EditWatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [watch, brands, movements, cases, allWatches] = await Promise.all([
    getWatchById(id),
    getBrands(),
    getMovements(),
    getDisplayCases(),
    getWatches(),
  ])

  if (!watch) {
    notFound()
  }

  // Build case -> watches map for slot picker
  const caseWatches = new Map<string, WatchWithCover[]>()
  for (const w of allWatches) {
    const existing = caseWatches.get(w.case_id) ?? []
    existing.push(w)
    caseWatches.set(w.case_id, existing)
  }

  // Bind the watchId to the update action
  const boundUpdateWatch = updateWatch.bind(null, watch.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href={`/watch/${watch.id}`} />}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {watch.brand.name} {watch.model}
        </h1>
      </div>

      <WatchForm
        action={boundUpdateWatch}
        watch={watch}
        submitLabel="Save Changes"
        brands={brands}
        movements={movements}
        cases={cases}
        caseWatches={caseWatches}
      />
    </div>
  )
}
