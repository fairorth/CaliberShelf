import Link from "next/link"
import { WatchForm } from "@/components/watch-form"
import { createWatch } from "@/lib/actions/watch-actions"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Add Watch | CaliberShelf",
}

export default function NewWatchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/collection" />}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add a Watch</h1>
      </div>

      <WatchForm action={createWatch} submitLabel="Add Watch" />
    </div>
  )
}
