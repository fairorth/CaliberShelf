import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import type { PhoneWatch } from "./watches"

/**
 * The Collection tab's sort — a few options on purpose (Marc: "by date added
 * or by price to start"). Remembered per device. Default: newest added first,
 * so the watch you just added is at the top.
 */
export const COLLECTION_SORTS = [
  { key: "added-desc", label: "Newest added" },
  { key: "added-asc", label: "Oldest added" },
  { key: "price-desc", label: "Price ↓" },
  { key: "price-asc", label: "Price ↑" },
] as const

export type CollectionSort = (typeof COLLECTION_SORTS)[number]["key"]
export const DEFAULT_COLLECTION_SORT: CollectionSort = "added-desc"

const KEY = "tenten.collectionSort"

/** Sort a copy. Watches without a price always go last, in either direction. */
export function sortWatches(list: PhoneWatch[], sort: CollectionSort): PhoneWatch[] {
  const out = [...list]
  switch (sort) {
    case "added-desc":
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case "added-asc":
      return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case "price-desc":
    case "price-asc": {
      const dir = sort === "price-desc" ? -1 : 1
      return out.sort((a, b) => {
        if (a.purchasePriceCents == null && b.purchasePriceCents == null) return 0
        if (a.purchasePriceCents == null) return 1
        if (b.purchasePriceCents == null) return -1
        return dir * (a.purchasePriceCents - b.purchasePriceCents)
      })
    }
  }
}

export function useCollectionSort() {
  const [sort, setSort] = useState<CollectionSort>(DEFAULT_COLLECTION_SORT)
  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v && COLLECTION_SORTS.some((s) => s.key === v)) setSort(v as CollectionSort)
      })
      .catch(() => {})
  }, [])
  const choose = useCallback((next: CollectionSort) => {
    setSort(next)
    void AsyncStorage.setItem(KEY, next).catch(() => {})
  }, [])
  return { sort, choose }
}
