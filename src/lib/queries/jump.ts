import { createClient } from "@/lib/supabase/server"
import { getBoxSummaries, type BoxSummary } from "./boxes"

// The header's jump index (Phase 8 §6.1).
//
// Reaching a watch used to mean a trip to /collection, which is separately
// slow — so a header field that navigated to `/collection?q=…` would only have
// been a faster route to the same wait. The whole index is therefore handed to
// the client once, and Enter on a watch goes straight to /watch/[id]: no
// round trip to search, and the collection page is never loaded.
//
// Deliberately narrow: the five text columns the collection's own search
// already matches on, and no photographs. This is the same query the
// collection filters on, not a new search backend.

export interface JumpWatch {
  id: string
  brandName: string
  model: string
  nickname: string | null
  referenceNumber: string | null
  box: string | null
  /** Sold watches stay searchable — they stay in counts, search and reports. */
  isSold: boolean
}

export interface JumpBrand {
  id: string
  name: string
  /** Watches on this brand, sold included — this is a catalogue count. */
  count: number
}

export interface JumpIndex {
  watches: JumpWatch[]
  brands: JumpBrand[]
  boxes: BoxSummary[]
}

interface RawJumpWatch {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  box: string | null
  sale_status: string
  brand: { id: string; name: string } | null
}

export async function getJumpIndex(): Promise<JumpIndex> {
  const supabase = await createClient()
  const [watchesRes, boxes] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, model, nickname, reference_number, box, sale_status, brand:brands(id, name)"
      )
      .order("model", { ascending: true }),
    getBoxSummaries(),
  ])

  const raw = (watchesRes.data ?? []) as unknown as RawJumpWatch[]

  const watches: JumpWatch[] = raw.map((w) => ({
    id: w.id,
    brandName: w.brand?.name ?? "",
    model: w.model,
    nickname: w.nickname,
    referenceNumber: w.reference_number,
    box: w.box,
    isSold: w.sale_status === "sold",
  }))

  // Brands come from the watches themselves rather than a second query: a
  // brand with no watches is not a useful jump target.
  const brandMap = new Map<string, JumpBrand>()
  for (const w of raw) {
    if (!w.brand) continue
    const hit = brandMap.get(w.brand.id)
    if (hit) hit.count += 1
    else brandMap.set(w.brand.id, { id: w.brand.id, name: w.brand.name, count: 1 })
  }
  const brands = [...brandMap.values()].sort((a, b) => a.name.localeCompare(b.name))

  return { watches, brands, boxes }
}
