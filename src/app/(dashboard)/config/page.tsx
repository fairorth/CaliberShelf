import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getCategories } from "@/lib/queries/categories"
import { getLabels } from "@/lib/queries/labels"
import { getWatches } from "@/lib/queries/watches"
import { BrandsTab } from "./_components/brands-tab"
import { MovementsTab } from "./_components/movements-tab"
import { CategoriesTab } from "./_components/categories-tab"
import { LabelsTab } from "./_components/labels-tab"
import { SettingsTab } from "./_components/settings-tab"

export const metadata: Metadata = {
  title: "Config | CaliberShelf",
}

export default async function ConfigPage() {
  const [brands, movements, categories, labels, watches] = await Promise.all([
    getBrands(),
    getMovements(),
    getCategories(),
    getLabels(),
    getWatches(),
  ])

  // Count watches per brand
  const watchCountByBrand = new Map<string, number>()
  for (const w of watches) {
    watchCountByBrand.set(w.brand_id, (watchCountByBrand.get(w.brand_id) ?? 0) + 1)
  }

  // Count watches per category
  const watchCountByCategory = new Map<string, number>()
  for (const w of watches) {
    watchCountByCategory.set(w.category_id, (watchCountByCategory.get(w.category_id) ?? 0) + 1)
  }

  // Movements referenced by at least one watch (drives the "used only" filter)
  const usedMovementIds = [
    ...new Set(watches.map((w) => w.movement_id).filter((id): id is string => id !== null)),
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-medium tracking-tight">Configuration</h1>

      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
          <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="labels">Labels ({labels.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="mt-4">
          <BrandsTab brands={brands} watchCountByBrand={watchCountByBrand} />
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <MovementsTab movements={movements} usedMovementIds={usedMovementIds} />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab categories={categories} watchCountByCategory={watchCountByCategory} />
        </TabsContent>

        <TabsContent value="labels" className="mt-4">
          <LabelsTab labels={labels} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
