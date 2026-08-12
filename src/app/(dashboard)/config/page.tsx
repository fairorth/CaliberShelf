import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMovements } from "@/lib/queries/movements"
import { getCategories } from "@/lib/queries/categories"
import { getLabels } from "@/lib/queries/labels"
import { getWatches } from "@/lib/queries/watches"
import { getTierConfig } from "@/lib/queries/tier-config"
import { getBoxConfig } from "@/lib/queries/box-config"
import { getWatchImagesPath } from "@/lib/queries/app-settings"
import { MovementsTab } from "./_components/movements-tab"
import { CategoriesTab } from "./_components/categories-tab"
import { LabelsTab } from "./_components/labels-tab"
import { TiersTab } from "./_components/tiers-tab"
import { BoxesTab } from "./_components/boxes-tab"
import { SettingsTab } from "./_components/settings-tab"

export const metadata: Metadata = {
  title: "Config | CaliberShelf",
}

// Brands graduated to its own top-level page (/brands) — no longer a tab here.
const TAB_VALUES = ["movements", "categories", "labels", "tiers", "boxes", "settings"]

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Deep-linkable tabs (e.g. /config?tab=movements from the Attention report)
  const { tab } = await searchParams
  const initialTab = tab && TAB_VALUES.includes(tab) ? tab : "movements"

  const [movements, categories, labels, watches, tierConfig, boxConfig, watchImagesPath] = await Promise.all([
    getMovements(),
    getCategories(),
    getLabels(),
    getWatches(),
    getTierConfig(),
    getBoxConfig(),
    getWatchImagesPath(),
  ])

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
      <h1 className="font-display text-lg font-semibold tracking-tight">Configuration</h1>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="movements">Movements ({movements.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="labels">Labels ({labels.length})</TabsTrigger>
          <TabsTrigger value="tiers">Tiers ({tierConfig.length})</TabsTrigger>
          <TabsTrigger value="boxes">Boxes ({boxConfig.count})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="mt-4">
          <MovementsTab movements={movements} usedMovementIds={usedMovementIds} />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab categories={categories} watchCountByCategory={watchCountByCategory} />
        </TabsContent>

        <TabsContent value="labels" className="mt-4">
          <LabelsTab labels={labels} />
        </TabsContent>

        <TabsContent value="tiers" className="mt-4">
          <TiersTab initialConfig={tierConfig} />
        </TabsContent>

        <TabsContent value="boxes" className="mt-4">
          <BoxesTab initialConfig={boxConfig} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab initialWatchImagesPath={watchImagesPath} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
