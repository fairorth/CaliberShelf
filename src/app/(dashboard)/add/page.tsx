import type { Metadata } from "next"
import { getBrands } from "@/lib/queries/brands"
import { getDisplayCases } from "@/lib/queries/display-cases"
import { getWatches } from "@/lib/queries/watches"
import { AddWatchFlow } from "./_components/add-watch-flow"
import type { WatchWithCover } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Add Watch | CaliberShelf",
}

export default async function AddWatchPage() {
  const [brands, cases, allWatches] = await Promise.all([
    getBrands(),
    getDisplayCases(),
    getWatches(),
  ])

  // Build case -> watches map for slot picker
  const caseWatchesEntries: [string, WatchWithCover[]][] = []
  for (const w of allWatches) {
    const existing = caseWatchesEntries.find(([id]) => id === w.case_id)
    if (existing) {
      existing[1].push(w)
    } else {
      caseWatchesEntries.push([w.case_id, [w]])
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <AddWatchFlow
        brands={brands}
        cases={cases}
        caseWatchesEntries={caseWatchesEntries}
      />
    </div>
  )
}
