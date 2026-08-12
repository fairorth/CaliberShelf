import type { Metadata } from "next"
import { getBrands } from "@/lib/queries/brands"
import { getWatches } from "@/lib/queries/watches"
import { BrandsTab } from "./_components/brands-tab"

export const metadata: Metadata = {
  title: "Brands | CaliberShelf",
}

export default async function BrandsPage() {
  const [brands, watches] = await Promise.all([getBrands(), getWatches()])

  const watchCountByBrand = new Map<string, number>()
  for (const w of watches) {
    watchCountByBrand.set(w.brand_id, (watchCountByBrand.get(w.brand_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">Brands</h1>
      <BrandsTab brands={brands} watchCountByBrand={watchCountByBrand} />
    </div>
  )
}
