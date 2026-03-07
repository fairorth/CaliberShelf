import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getDisplayCases } from "@/lib/queries/display-cases"
import { getWatches } from "@/lib/queries/watches"
import { BrandsTab } from "./_components/brands-tab"
import { MovementsTab } from "./_components/movements-tab"
import { CasesTab } from "./_components/cases-tab"

export const metadata: Metadata = {
  title: "Config | CaliberShelf",
}

export default async function ConfigPage() {
  const [brands, movements, cases, watches] = await Promise.all([
    getBrands(),
    getMovements(),
    getDisplayCases(),
    getWatches(),
  ])

  // Count watches per brand
  const watchCountByBrand = new Map<string, number>()
  for (const w of watches) {
    watchCountByBrand.set(w.brand_id, (watchCountByBrand.get(w.brand_id) ?? 0) + 1)
  }

  // Count watches per case
  const watchCountByCase = new Map<string, number>()
  for (const w of watches) {
    watchCountByCase.set(w.case_id, (watchCountByCase.get(w.case_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>

      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
          <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
          <TabsTrigger value="cases">Cases ({cases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="mt-4">
          <BrandsTab brands={brands} watchCountByBrand={watchCountByBrand} />
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <MovementsTab movements={movements} />
        </TabsContent>

        <TabsContent value="cases" className="mt-4">
          <CasesTab cases={cases} watchCountByCase={watchCountByCase} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
