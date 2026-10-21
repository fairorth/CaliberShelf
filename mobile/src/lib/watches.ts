import { supabase } from "./supabase"

/** What the camera trial needs to show and pick a watch. */
export interface PhoneWatch {
  id: string
  brand: string
  model: string
  nickname: string | null
  reference: string | null
  status: "owned" | "coming" | "wish" | "sold"
  /** Signed URL of the cover's ~600px thumbnail, or null. */
  thumbUrl: string | null
  /** When it was added to TenTenLoupe (ISO timestamp) — not when it was bought. */
  createdAt: string
  purchasePriceCents: number | null
  /** Its category — Rate My Watches' segment. */
  categoryId: string | null
  categoryName: string | null
  /** How much the owner loves it (Max..None), for the "agree with Marc" fallback. */
  attachment: "max" | "high" | "medium" | "low" | "none" | null
}

type Row = {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  is_wishlist: boolean
  is_coming_soon: boolean
  sale_status: string
  created_at: string
  purchase_price_cents: number | null
  attachment: PhoneWatch["attachment"]
  categories: { id: string; name: string } | null
  brands: { name: string } | null
  watch_photos: Array<{ thumb_path: string | null; is_cover: boolean }> | null
}

const BUCKET = "watch-photos"
const SIGNED_URL_SECONDS = 3600

/**
 * Every watch the owner has, straight from Supabase as the user (RLS), with a
 * signed URL for each cover thumbnail. Sold watches come last.
 */
export async function fetchWatches(): Promise<PhoneWatch[]> {
  const { data, error } = await supabase
    .from("watches")
    .select(
      "id, model, nickname, reference_number, is_wishlist, is_coming_soon, sale_status, created_at, purchase_price_cents, attachment, categories(id, name), brands(name), watch_photos(thumb_path, is_cover)"
    )
  if (error) throw new Error(error.message)
  // Nested joins infer loosely — cast to the real shape (same as the web).
  const rows = (data ?? []) as unknown as Row[]

  const thumbByWatch = new Map<string, string>()
  for (const r of rows) {
    const cover = r.watch_photos?.find((p) => p.is_cover) ?? r.watch_photos?.[0]
    if (cover?.thumb_path) thumbByWatch.set(r.id, cover.thumb_path)
  }
  const paths = [...new Set(thumbByWatch.values())]
  const urlByPath = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl)
    }
  }

  const watches: PhoneWatch[] = rows.map((r) => {
    const thumb = thumbByWatch.get(r.id)
    return {
      id: r.id,
      brand: r.brands?.name ?? "",
      model: r.model,
      nickname: r.nickname,
      reference: r.reference_number,
      status: r.is_wishlist
        ? "wish"
        : r.is_coming_soon
          ? "coming"
          : r.sale_status === "sold"
            ? "sold"
            : "owned",
      thumbUrl: thumb ? (urlByPath.get(thumb) ?? null) : null,
      createdAt: r.created_at,
      purchasePriceCents: r.purchase_price_cents,
      categoryId: r.categories?.id ?? null,
      categoryName: r.categories?.name ?? null,
      attachment: r.attachment,
    }
  })
  const rank = { owned: 0, coming: 1, wish: 2, sold: 3 } as const
  return watches.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      a.brand.localeCompare(b.brand) ||
      a.model.localeCompare(b.model)
  )
}
