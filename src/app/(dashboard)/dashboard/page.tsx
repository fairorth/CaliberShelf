import Link from "next/link"
import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { WatchGrid } from "@/components/watch-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard | CaliberShelf",
}

export default async function DashboardPage() {
  const watches = await getWatches()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Watches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{watches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(watches.map((w) => w.brand)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent watches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Watches</h2>
          <Button variant="outline" size="sm" render={<Link href="/collection" />}>
            View All
          </Button>
        </div>

        {watches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl">⌚</span>
              <h3 className="mt-4 text-lg font-semibold">Start Your Collection</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first watch to start tracking your collection.
              </p>
              <Button className="mt-4" render={<Link href="/collection/new" />}>
                Add Your First Watch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <WatchGrid watches={watches.slice(0, 4)} />
        )}
      </div>
    </div>
  )
}
