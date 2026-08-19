import type { Metadata } from "next"
import { getLightTableSets } from "@/lib/queries/light-table"
import { LightTable } from "./_components/light-table"

export const metadata: Metadata = {
  title: "Home | TenTenLoupe",
}

export default async function HomePage() {
  // The home page IS the Light Table. The Display Case that used to share it
  // behind a toggle is gone: a box is now just a rotation set in the ROTATION
  // menu, or a filtered view of the collection, so there is nothing a separate
  // case screen showed that those two do not.
  const sets = await getLightTableSets()

  // Per-request seed for the rotation's initial shuffle. This Server Component
  // renders once per request and is never re-rendered on the client, so a
  // random value here is stable for the lifetime of the tree.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-8">
      <LightTable sets={sets} seed={seed} />
    </div>
  )
}
