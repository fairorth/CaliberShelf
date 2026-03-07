import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type {
  DisplayCase,
  DisplayCaseWithWatches,
  Watch,
  WatchWithCover,
  WatchPhoto,
  Brand,
  Movement,
} from "@/lib/types/watch"

/**
 * Get all display cases for the current user, sorted by display_order.
 */
export async function getDisplayCases(): Promise<DisplayCase[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("display_cases")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to fetch display cases:", error.message)
    return []
  }

  return (data as DisplayCase[]) ?? []
}

/**
 * Get all display cases with their watches and cover photos.
 * Used on the home page (dashboard).
 */
export async function getDisplayCasesWithWatches(): Promise<DisplayCaseWithWatches[]> {
  const supabase = await createClient()

  // Fetch cases
  const { data: cases, error: casesError } = await supabase
    .from("display_cases")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (casesError || !cases) {
    console.error("Failed to fetch display cases:", casesError?.message)
    return []
  }

  if (cases.length === 0) return []

  const caseIds = cases.map((c: DisplayCase) => c.id)

  // Fetch all watches in these cases with brand and movement joins
  const { data: watches, error: watchesError } = await supabase
    .from("watches")
    .select("*, brands(*), movements(*)")
    .in("case_id", caseIds)
    .order("case_slot", { ascending: true })

  if (watchesError) {
    console.error("Failed to fetch watches for cases:", watchesError.message)
    return cases.map((c: DisplayCase) => ({ ...c, watches: [] })) as DisplayCaseWithWatches[]
  }

  // Fetch cover photos for all watches
  const watchIds = (watches ?? []).map((w: Watch) => w.id)
  const coverMap = new Map<string, string>()

  if (watchIds.length > 0) {
    const { data: coverPhotos } = await supabase
      .from("watch_photos")
      .select("*")
      .in("watch_id", watchIds)
      .eq("is_cover", true)

    if (coverPhotos) {
      for (const photo of coverPhotos as WatchPhoto[]) {
        coverMap.set(photo.watch_id, photo.storage_path)
      }
    }
  }

  // Generate signed URLs for cover photos
  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = storagePaths.length > 0 ? await getSignedUrls(storagePaths) : new Map()

  // Build watches with cover URLs grouped by case
  const watchesByCase = new Map<string, WatchWithCover[]>()
  for (const watch of (watches ?? []) as Array<Watch & { brands: Brand; movements: Movement | null }>) {
    const coverPath = coverMap.get(watch.id)
    const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
    const watchWithCover: WatchWithCover = {
      ...watch,
      cover_photo_url: coverUrl,
      brand: watch.brands,
      movement: watch.movements,
    }
    const existing = watchesByCase.get(watch.case_id) ?? []
    existing.push(watchWithCover)
    watchesByCase.set(watch.case_id, existing)
  }

  return cases.map((c: DisplayCase) => ({
    ...c,
    watches: watchesByCase.get(c.id) ?? [],
  })) as DisplayCaseWithWatches[]
}

/**
 * Get a single display case by ID with its watches.
 */
export async function getDisplayCaseById(
  id: string
): Promise<DisplayCaseWithWatches | null> {
  const supabase = await createClient()

  const { data: displayCase, error } = await supabase
    .from("display_cases")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !displayCase) return null

  // Fetch watches in this case with brand and movement joins
  const { data: watches } = await supabase
    .from("watches")
    .select("*, brands(*), movements(*)")
    .eq("case_id", id)
    .order("case_slot", { ascending: true })

  // Fetch cover photos
  const watchIds = (watches ?? []).map((w: Watch) => w.id)
  const coverMap = new Map<string, string>()

  if (watchIds.length > 0) {
    const { data: coverPhotos } = await supabase
      .from("watch_photos")
      .select("*")
      .in("watch_id", watchIds)
      .eq("is_cover", true)

    if (coverPhotos) {
      for (const photo of coverPhotos as WatchPhoto[]) {
        coverMap.set(photo.watch_id, photo.storage_path)
      }
    }
  }

  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = storagePaths.length > 0 ? await getSignedUrls(storagePaths) : new Map()

  const watchesWithCovers: WatchWithCover[] = ((watches ?? []) as Array<Watch & { brands: Brand; movements: Movement | null }>).map((watch) => {
    const coverPath = coverMap.get(watch.id)
    const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
    return {
      ...watch,
      cover_photo_url: coverUrl,
      brand: watch.brands,
      movement: watch.movements,
    }
  })

  return {
    ...(displayCase as DisplayCase),
    watches: watchesWithCovers,
  }
}

/**
 * Get unoccupied slot numbers for a given case.
 */
export async function getAvailableSlots(caseId: string): Promise<number[]> {
  const supabase = await createClient()

  // Get the case capacity
  const { data: displayCase } = await supabase
    .from("display_cases")
    .select("capacity")
    .eq("id", caseId)
    .single()

  if (!displayCase) return []

  const capacity = parseInt((displayCase as { capacity: string }).capacity, 10)

  // Get occupied slots
  const { data: watches } = await supabase
    .from("watches")
    .select("case_slot")
    .eq("case_id", caseId)

  const occupied = new Set((watches ?? []).map((w: { case_slot: number }) => w.case_slot))

  // Return all unoccupied slots (0-indexed)
  const available: number[] = []
  for (let i = 0; i < capacity; i++) {
    if (!occupied.has(i)) {
      available.push(i)
    }
  }

  return available
}
