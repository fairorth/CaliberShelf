import Link from "next/link"
import type { Metadata } from "next"
import { getDisplayCasesWithWatches } from "@/lib/queries/display-cases"
import { getWatches } from "@/lib/queries/watches"
import { DisplayCaseShowcase } from "@/components/display-case-showcase"
import { CollectionTable } from "@/components/collection-table"
import { GalleryToggle } from "@/components/gallery-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Gallery | CaliberShelf",
}

export default async function GalleryPage() {
  const [cases, watches] = await Promise.all([
    getDisplayCasesWithWatches(),
    getWatches(),
  ])

  const hasCases = cases.length > 0
  const hasWatches = watches.length > 0

  // Empty state — no cases and no watches
  if (!hasCases && !hasWatches) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl">🗄️</span>
            <h3 className="mt-4 text-lg font-semibold">
              Welcome to CaliberShelf
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Create a display case first, then add watches to start building
              your collection.
            </p>
            <Button className="mt-6" render={<Link href="/config" />}>
              Create Your First Case
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const caseView = (
    <div className="space-y-6">
      {cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl">🗄️</span>
            <h3 className="mt-3 text-base font-semibold">No display cases yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a case in Config to showcase your watches.
            </p>
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/config" />}>
              Go to Config
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((displayCase) => (
            <DisplayCaseShowcase key={displayCase.id} displayCase={displayCase} />
          ))}
        </div>
      )}
    </div>
  )

  const collectionView = <CollectionTable watches={watches} />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
      <GalleryToggle caseView={caseView} collectionView={collectionView} />
    </div>
  )
}
