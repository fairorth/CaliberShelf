import { getWatches } from "@/lib/queries/watches"
import { QuickCapture } from "./_components/quick-capture"

export const metadata = {
  title: "Quick Capture | CaliberShelf",
}

export default async function CapturePage() {
  const watches = await getWatches()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quick Capture</h1>
        <p className="text-sm text-muted-foreground">
          Take a photo and assign it to a watch in your collection
        </p>
      </div>

      <QuickCapture watches={watches} />
    </div>
  )
}
