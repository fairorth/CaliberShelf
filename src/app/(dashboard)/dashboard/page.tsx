import type { Metadata } from "next"
import { getLightTableSets, getLightTableStats } from "@/lib/queries/light-table"
import { getCurrentDisplayBox } from "@/lib/queries/display-box"
import { HomeStage } from "@/components/home-stage"

export const metadata: Metadata = {
  title: "Home | TenTenLoupe",
}

export default async function HomePage() {
  const [sets, stats, displayBox] = await Promise.all([
    getLightTableSets(),
    getLightTableStats(),
    getCurrentDisplayBox(),
  ])

  // Per-request seed for the rotation's initial shuffle (step 5). This Server
  // Component renders once per request and is never re-rendered on the client,
  // so a random value here is stable for the lifetime of the tree.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-8">
      <HomeStage sets={sets} seed={seed} stats={stats} displayBox={displayBox} />
    </div>
  )
}
