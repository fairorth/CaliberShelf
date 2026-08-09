"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { setGuideEntryStatus } from "@/lib/actions/guide-actions"
import { toast } from "sonner"
import type { GuideEntryStoredStatus } from "@/lib/types/guide"

/** Toggle an unlinked entry between candidate ("hunting") and passed. */
export function EntryStatusButton({
  entryId,
  status,
}: {
  entryId: string
  status: GuideEntryStoredStatus
}) {
  const [isPending, startTransition] = useTransition()
  const next: GuideEntryStoredStatus = status === "candidate" ? "passed" : "candidate"

  function toggle() {
    startTransition(async () => {
      const result = await setGuideEntryStatus(entryId, next)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={isPending}
      className="h-7 px-2 text-xs text-muted-foreground"
    >
      {isPending ? "…" : status === "candidate" ? "Mark passed" : "Reinstate"}
    </Button>
  )
}
