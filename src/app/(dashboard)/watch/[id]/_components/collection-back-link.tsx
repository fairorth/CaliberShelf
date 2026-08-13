"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { COLLECTION_RETURN_KEY } from "@/lib/preferences"

/**
 * "‹ Collection" — returns to the collection *as you left it*, filters and
 * search included, because that is what a breadcrumb is for. The collection
 * view records its query string; this reads it after mount, so the href starts
 * as the bare list and sharpens on hydration rather than the server guessing
 * at a filter it cannot know about.
 *
 * Deliberately not `router.back()`: after save the history is
 * collection → watch → edit → watch, so "back" would return to the edit form.
 */
export function CollectionBackLink() {
  const [href, setHref] = useState("/collection")

  useEffect(() => {
    try {
      const qs = sessionStorage.getItem(COLLECTION_RETURN_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (qs) setHref(`/collection?${qs}`)
    } catch {
      // Storage unavailable (private mode) — the bare collection is fine.
    }
  }, [])

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Collection
    </Link>
  )
}
