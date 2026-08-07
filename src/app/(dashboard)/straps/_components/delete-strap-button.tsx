"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteStrap } from "@/lib/actions/strap-actions"
import { toast } from "sonner"

export function DeleteStrapButton({ strapId, name }: { strapId: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${name}"? Its photos are removed too. This cannot be undone.`)) return
    // No try/catch here: deleteStrap ends in redirect(), which works by
    // throwing NEXT_REDIRECT — catching it would surface a bogus error.
    startTransition(async () => {
      const result = await deleteStrap(strapId)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting..." : "Delete Strap"}
    </Button>
  )
}
