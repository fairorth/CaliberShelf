"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchInput } from "@/components/search-input"

/**
 * Home (dial) search box. Submitting hands the query off to the collection via
 * ?q, where CollectionView reads it and filters the list in place.
 */
export function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function submit() {
    const q = query.trim()
    router.push(q ? `/collection?q=${encodeURIComponent(q)}` : "/collection")
  }

  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      onSubmit={submit}
      placeholder="Search your collection…"
      ariaLabel="Search your collection"
      className="w-full max-w-md"
    />
  )
}
