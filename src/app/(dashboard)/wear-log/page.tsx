import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getWearLogsForMonth } from "@/lib/queries/wear-logs"
import { getWatches } from "@/lib/queries/watches"
import { getCurrentDisplayBox } from "@/lib/queries/display-box"
import { getWearStats } from "@/lib/queries/wear-logs"
import { WearCalendar } from "./_components/wear-calendar"
import { WearHistory } from "./_components/wear-history"
import { WearStatsView } from "./_components/wear-stats"
import { DisplayBoxPanel } from "./_components/display-box-panel"

export const metadata: Metadata = {
  title: "Wear Log | TenTenLoupe",
}

export default async function WearLogPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  const [monthLogs, watches, displayBox] = await Promise.all([
    getWearLogsForMonth(currentYear, currentMonth),
    getWatches(),
    getCurrentDisplayBox(),
  ])

  const stats = await getWearStats(watches)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">Wear Log</h1>

      <DisplayBoxPanel box={displayBox} />

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <WearCalendar
            initialLogs={monthLogs}
            initialYear={currentYear}
            initialMonth={currentMonth}
            watches={watches}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <WearHistory watches={watches} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <WearStatsView stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
