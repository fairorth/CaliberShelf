import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type {
  Category,
  CategoryWithWatches,
  Watch,
  WatchWithCover,
  WatchPhoto,
  Brand,
  Movement,
  Label,
} from "@/lib/types/watch"

/**
 * Get all categories for the current user, sorted by display_order.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to fetch categories:", error.message)
    return []
  }

  return (data as Category[]) ?? []
}

/**
 * Get all categories with their watches, cover photos, and labels.
 * Used on the home page (dashboard).
 */
export async function getCategoriesWithWatches(): Promise<CategoryWithWatches[]> {
  const supabase = await createClient()

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (categoriesError || !categories) {
    console.error("Failed to fetch categories:", categoriesError?.message)
    return []
  }

  if (categories.length === 0) return []

  const categoryIds = categories.map((c: Category) => c.id)

  // Fetch all watches in these categories with brand and movement joins
  const { data: watches, error: watchesError } = await supabase
    .from("watches")
    .select("*, brands(*), movements(*)")
    .in("category_id", categoryIds)
    .order("updated_at", { ascending: false })

  if (watchesError) {
    console.error("Failed to fetch watches for categories:", watchesError.message)
    return categories.map((c: Category) => ({ ...c, watches: [] })) as CategoryWithWatches[]
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

  // Fetch labels for all watches
  const labelsByWatch = new Map<string, Label[]>()
  if (watchIds.length > 0) {
    const { data: watchLabels } = await supabase
      .from("watch_labels")
      .select("watch_id, labels(*)")
      .in("watch_id", watchIds)

    if (watchLabels) {
      for (const wl of watchLabels as unknown as Array<{ watch_id: string; labels: Label }>) {
        const existing = labelsByWatch.get(wl.watch_id) ?? []
        existing.push(wl.labels)
        labelsByWatch.set(wl.watch_id, existing)
      }
    }
  }

  // Generate signed URLs for cover photos
  const storagePaths = Array.from(coverMap.values())
  const signedUrlMap = storagePaths.length > 0 ? await getSignedUrls(storagePaths) : new Map()

  // Build watches with cover URLs grouped by category
  const watchesByCategory = new Map<string, WatchWithCover[]>()
  for (const watch of (watches ?? []) as Array<Watch & { brands: Brand; movements: Movement | null }>) {
    const coverPath = coverMap.get(watch.id)
    const coverUrl = coverPath ? signedUrlMap.get(coverPath) ?? null : null
    const watchWithCover: WatchWithCover = {
      ...watch,
      cover_photo_url: coverUrl,
      brand: watch.brands,
      movement: watch.movements,
      labels: labelsByWatch.get(watch.id) ?? [],
    }
    const existing = watchesByCategory.get(watch.category_id) ?? []
    existing.push(watchWithCover)
    watchesByCategory.set(watch.category_id, existing)
  }

  return categories.map((c: Category) => ({
    ...c,
    watches: watchesByCategory.get(c.id) ?? [],
  })) as CategoryWithWatches[]
}

/**
 * Get a single category by ID with its watches, cover photos, and labels.
 */
export async function getCategoryById(
  id: string
): Promise<CategoryWithWatches | null> {
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !category) return null

  // Fetch watches in this category with brand and movement joins
  const { data: watches } = await supabase
    .from("watches")
    .select("*, brands(*), movements(*)")
    .eq("category_id", id)
    .order("updated_at", { ascending: false })

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

  // Fetch labels for all watches
  const labelsByWatch = new Map<string, Label[]>()
  if (watchIds.length > 0) {
    const { data: watchLabels } = await supabase
      .from("watch_labels")
      .select("watch_id, labels(*)")
      .in("watch_id", watchIds)

    if (watchLabels) {
      for (const wl of watchLabels as unknown as Array<{ watch_id: string; labels: Label }>) {
        const existing = labelsByWatch.get(wl.watch_id) ?? []
        existing.push(wl.labels)
        labelsByWatch.set(wl.watch_id, existing)
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
      labels: labelsByWatch.get(watch.id) ?? [],
    }
  })

  return {
    ...(category as Category),
    watches: watchesWithCovers,
  }
}
