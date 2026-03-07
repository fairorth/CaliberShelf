import Link from "next/link"
import { WatchForm } from "@/components/watch-form"
import { createWatch } from "@/lib/actions/watch-actions"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getDisplayCases } from "@/lib/queries/display-cases"
import { getWatches } from "@/lib/queries/watches"
import { Button } from "@/components/ui/button"
import type { WatchWithCover } from "@/lib/types/watch"

export const metadata = {
  title: "Add Watch | CaliberShelf",
}

export default async function NewWatchPage() {
  const [brands, movements, cases, allWatches] = await Promise.all([
    getBrands(),
    getMovements(),
    getDisplayCases(),
    getWatches(),
  ])

  // Build case -> watches map for slot picker
  const caseWatches = new Map<string, WatchWithCover[]>()
  for (const w of allWatches) {
    const existing = caseWatches.get(w.case_id) ?? []
    existing.push(w)
    caseWatches.set(w.case_id, existing)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/collection" />}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add a Watch</h1>
      </div>

      <WatchForm
        action={createWatch}
        submitLabel="Add Watch"
        brands={brands}
        movements={movements}
        cases={cases}
        caseWatches={caseWatches}
      />
    </div>
  )
}
