import Link from "next/link"
import type { Metadata } from "next"
import { getDisplayCasesWithWatches } from "@/lib/queries/display-cases"
import { getBrands } from "@/lib/queries/brands"
import { DisplayCaseCard } from "@/components/display-case-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard | CaliberShelf",
}

export default async function DashboardPage() {
  const [cases, brands] = await Promise.all([
    getDisplayCasesWithWatches(),
    getBrands(),
  ])

  const totalWatches = cases.reduce((sum, c) => sum + c.watches.length, 0)

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
            <p className="text-3xl font-bold">{totalWatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Display Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{cases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{brands.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Display cases grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Display Cases</h2>
          <Button variant="outline" size="sm" render={<Link href="/config" />}>
            Manage Cases
          </Button>
        </div>

        {cases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl">🗄️</span>
              <h3 className="mt-4 text-lg font-semibold">
                Create Your First Display Case
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Display cases hold your watches. Create one to start organizing your
                collection.
              </p>
              <Button className="mt-4" render={<Link href="/config" />}>
                Go to Config
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((displayCase) => (
              <DisplayCaseCard key={displayCase.id} displayCase={displayCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
