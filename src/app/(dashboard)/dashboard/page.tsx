import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | CaliberShelf",
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to CaliberShelf! Your watch collection overview will appear here
        once you start adding watches.
      </p>
    </div>
  )
}
