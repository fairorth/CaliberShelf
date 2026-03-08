"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { fetchWearHistory, deleteWearLog } from "@/lib/actions/wear-log-actions"
import { toast } from "sonner"
import type { WearLogWithWatch, WatchWithCover } from "@/lib/types/watch"

interface WearHistoryProps {
  watches: WatchWithCover[]
}

const PAGE_SIZE = 20

export function WearHistory({ watches }: WearHistoryProps) {
  const [logs, setLogs] = useState<WearLogWithWatch[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [filterWatchId, setFilterWatchId] = useState("")

  function loadPage(targetPage: number) {
    setPage(targetPage)
    startTransition(async () => {
      const result = await fetchWearHistory(targetPage, PAGE_SIZE)
      setLogs(result.logs)
      setTotalCount(result.totalCount)
      setLoaded(true)
    })
  }

  // Load on first render
  if (!loaded && !isPending) {
    loadPage(1)
  }

  function handleDelete(logId: string) {
    startTransition(async () => {
      const result = await deleteWearLog(logId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Wear log deleted")
        // Reload current page
        const res = await fetchWearHistory(page, PAGE_SIZE)
        setLogs(res.logs)
        setTotalCount(res.totalCount)
      }
    })
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Filter
  const filtered = filterWatchId
    ? logs.filter((l) => l.watch_id === filterWatchId)
    : logs

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <select
          value={filterWatchId}
          onChange={(e) => setFilterWatchId(e.target.value)}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">All watches</option>
          {watches.map((w) => (
            <option key={w.id} value={w.id}>
              {w.brand.name} {w.model}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {totalCount} total {totalCount === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Loading state */}
      {isPending && !loaded && (
        <p className="text-sm text-muted-foreground">Loading history...</p>
      )}

      {/* Empty state */}
      {loaded && logs.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No wear logs yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the &quot;Wore Today&quot; button on a watch or the Calendar tab to start logging.
          </p>
        </Card>
      )}

      {/* Log entries */}
      <div className={`space-y-2 ${isPending ? "opacity-50" : ""}`}>
        {filtered.map((log) => (
          <Card key={log.id} className="flex items-center gap-4 p-3">
            {/* Watch thumbnail */}
            <Link
              href={`/watch/${log.watch_id}`}
              className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border"
            >
              {log.watch.cover_photo_url ? (
                <Image
                  src={log.watch.cover_photo_url}
                  alt={log.watch.model}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">
                  {log.watch.brand.name.charAt(0)}
                </span>
              )}
            </Link>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/watch/${log.watch_id}`}
                className="font-medium hover:underline"
              >
                {log.watch.brand.name} {log.watch.model}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDate(log.worn_date)}
              </p>
              {log.notes && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {log.notes}
                </p>
              )}
            </div>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" />
                }
              >
                🗑️
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this wear log?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove the {formatDate(log.worn_date)} entry for{" "}
                    {log.watch.brand.name} {log.watch.model}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(log.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1 || isPending}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(page + 1)}
            disabled={page >= totalPages || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
