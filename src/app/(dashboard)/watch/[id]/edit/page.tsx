import { notFound } from "next/navigation"
import Link from "next/link"
import { getWatchById } from "@/lib/queries/watches"
import { WatchForm } from "@/components/watch-form"
import { updateWatch } from "@/lib/actions/watch-actions"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return {
    title: `Edit ${watch.brand} ${watch.model} | CaliberShelf`,
  }
}

export default async function EditWatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)

  if (!watch) {
    notFound()
  }

  // Bind the watchId to the update action
  const boundUpdateWatch = updateWatch.bind(null, watch.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href={`/watch/${watch.id}`} />}>
          &larr; Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {watch.brand} {watch.model}
        </h1>
      </div>

      <WatchForm
        action={boundUpdateWatch}
        watch={watch}
        submitLabel="Save Changes"
      />
    </div>
  )
}
