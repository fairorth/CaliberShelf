import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type { AdmiredPhotoKind, AdmiredTag } from "@/lib/validations/admired"

export interface AdmiredPhotoView {
  id: string
  kind: AdmiredPhotoKind
  thumb_url: string | null
  full_url: string | null
}

export interface AdmiredWatchView {
  id: string
  /** The booth it was seen at (00060); null before vendors, or for a watch with no maker. */
  vendor_id: string | null
  event: string | null
  maker: string | null
  model: string | null
  reference: string | null
  price_text: string | null
  notes: string | null
  tags: AdmiredTag[]
  seen_on: string
  placard_read_at: string | null
  created_at: string
  /** Watch shots first, placards after, each in shot order. */
  photos: AdmiredPhotoView[]
}

export type VendorNameSource = "read" | "owner" | "backfill"

export interface AdmiredVendorView {
  id: string
  event: string | null
  /** As stored — null when nobody has named it yet. */
  name: string | null
  /** What the board shows: the name, or "Vendor N" (its place in the event's visit order). */
  display_name: string
  name_source: VendorNameSource | null
  notes: string | null
  seen_on: string
  created_at: string
  /** Booth and name frames, in shot order. */
  photos: AdmiredPhotoView[]
  /** The watches seen at this booth, in the order they were shot. */
  watches: AdmiredWatchView[]
}

export interface AdmiredEventView {
  /** Stable key for the section ("" = no event). */
  key: string
  label: string
  /** In visit order (created_at). */
  vendors: AdmiredVendorView[]
  /** Admired watches with no vendor — "Not linked to a vendor". */
  unlinked: AdmiredWatchView[]
  watch_count: number
}

export interface AdmiredBoardView {
  /** Newest seen first. */
  events: AdmiredEventView[]
  /** Every admired watch on the board, linked or not. */
  watch_count: number
  /** Every vendor on the board. */
  vendor_count: number
}

const EMPTY_BOARD: AdmiredBoardView = { events: [], watch_count: 0, vendor_count: 0 }

type PhotoRow = {
  id: string
  kind: AdmiredPhotoKind
  storage_path: string
  thumb_path: string | null
  display_order: number
}

type WatchRow = Omit<AdmiredWatchView, "photos" | "vendor_id"> & {
  vendor_id?: string | null
  admired_photos: PhotoRow[] | null
}

type VendorRow = Omit<AdmiredVendorView, "display_name" | "photos" | "watches">
type VendorPhotoRow = PhotoRow & { vendor_id: string }

const WATCH_COLUMNS =
  "id, event, maker, model, reference, price_text, notes, tags, seen_on, placard_read_at, created_at, admired_photos(id, kind, storage_path, thumb_path, display_order)"

/**
 * The Admired board: events → vendors (booths, in visit order) → watches,
 * plus each event's watches with no vendor. Signed photo URLs throughout.
 *
 * Never throws. Before 00056 there is nothing (empty board); before 00060
 * — or if the vendor half fails for any reason — it falls back to watches
 * grouped by event with no vendors, which is what the board was before.
 */
export async function getAdmiredBoard(): Promise<AdmiredBoardView> {
  const supabase = await createClient()

  // Watches, with vendor_id when the column exists (00060).
  let rows: WatchRow[]
  let vendorsAvailable = true
  const withVendor = await supabase
    .from("admired_watches")
    .select(`vendor_id, ${WATCH_COLUMNS}`)
    .order("seen_on", { ascending: false })
    .order("created_at", { ascending: false })
  if (withVendor.error) {
    vendorsAvailable = false
    const legacy = await supabase
      .from("admired_watches")
      .select(WATCH_COLUMNS)
      .order("seen_on", { ascending: false })
      .order("created_at", { ascending: false })
    if (legacy.error) {
      // Before migration 00056 the table doesn't exist — show an empty board
      // rather than break the Inspiration page.
      console.error("Failed to fetch admired watches:", legacy.error.message)
      return EMPTY_BOARD
    }
    rows = (legacy.data ?? []) as unknown as WatchRow[]
  } else {
    rows = (withVendor.data ?? []) as unknown as WatchRow[]
  }

  // Vendors and their frames. Any failure here degrades to "no vendors".
  let vendorRows: VendorRow[] = []
  let vendorPhotoRows: VendorPhotoRow[] = []
  if (vendorsAvailable) {
    const [vendorsRes, photosRes] = await Promise.all([
      supabase
        .from("admired_vendors")
        .select("id, event, name, name_source, notes, seen_on, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("admired_photos")
        .select("id, kind, storage_path, thumb_path, display_order, vendor_id")
        .not("vendor_id", "is", null),
    ])
    if (vendorsRes.error || photosRes.error) {
      console.error(
        "Failed to fetch admired vendors:",
        vendorsRes.error?.message ?? photosRes.error?.message
      )
      vendorsAvailable = false
    } else {
      vendorRows = (vendorsRes.data ?? []) as unknown as VendorRow[]
      vendorPhotoRows = (photosRes.data ?? []) as unknown as VendorPhotoRow[]
    }
  }

  // Sign every path in one go.
  const paths = new Set<string>()
  const addPaths = (p: PhotoRow) => {
    paths.add(p.storage_path)
    if (p.thumb_path) paths.add(p.thumb_path)
  }
  for (const r of rows) for (const p of r.admired_photos ?? []) addPaths(p)
  for (const p of vendorPhotoRows) addPaths(p)
  const signed = await getSignedUrls([...paths])
  const toView = (p: PhotoRow): AdmiredPhotoView => ({
    id: p.id,
    kind: p.kind,
    thumb_url: signed.get(p.thumb_path ?? p.storage_path) ?? null,
    full_url: signed.get(p.storage_path) ?? null,
  })

  const watches: AdmiredWatchView[] = rows.map(({ admired_photos, vendor_id, ...r }) => ({
    ...r,
    vendor_id: vendorsAvailable ? (vendor_id ?? null) : null,
    tags: r.tags ?? [],
    photos: [...(admired_photos ?? [])]
      .sort((a, b) => (a.kind === b.kind ? a.display_order - b.display_order : a.kind === "watch" ? -1 : 1))
      .map(toView),
  }))

  // Group into events.
  type Bucket = AdmiredEventView & { latestSeen: string; latestCreated: string }
  const buckets = new Map<string, Bucket>()
  const bucketFor = (event: string | null): Bucket => {
    const key = event?.trim() ?? ""
    let b = buckets.get(key)
    if (!b) {
      b = { key, label: key || "No event", vendors: [], unlinked: [], watch_count: 0, latestSeen: "", latestCreated: "" }
      buckets.set(key, b)
    }
    return b
  }
  const touch = (b: Bucket, seenOn: string, createdAt: string) => {
    if (seenOn > b.latestSeen || (seenOn === b.latestSeen && createdAt > b.latestCreated)) {
      b.latestSeen = seenOn
      b.latestCreated = createdAt
    }
  }

  const vendorById = new Map<string, AdmiredVendorView>()
  for (const v of vendorRows) {
    const b = bucketFor(v.event)
    const name = v.name?.trim() || null
    const view: AdmiredVendorView = {
      ...v,
      name,
      display_name: name ?? `Vendor ${b.vendors.length + 1}`,
      photos: [],
      watches: [],
    }
    b.vendors.push(view)
    vendorById.set(v.id, view)
    touch(b, v.seen_on, v.created_at)
  }
  for (const p of [...vendorPhotoRows].sort((a, b) => a.display_order - b.display_order)) {
    vendorById.get(p.vendor_id)?.photos.push(toView(p))
  }

  for (const w of watches) {
    const vendor = w.vendor_id ? vendorById.get(w.vendor_id) : undefined
    if (vendor) {
      vendor.watches.push(w)
      const b = bucketFor(vendor.event)
      b.watch_count++
      touch(b, w.seen_on, w.created_at)
    } else {
      const b = bucketFor(w.event)
      b.unlinked.push(w)
      b.watch_count++
      touch(b, w.seen_on, w.created_at)
    }
  }
  // A booth's watches in the order they were shot.
  for (const v of vendorById.values()) v.watches.sort((a, b) => a.created_at.localeCompare(b.created_at))

  const events = [...buckets.values()]
    .sort((a, b) =>
      a.latestSeen === b.latestSeen
        ? b.latestCreated.localeCompare(a.latestCreated)
        : b.latestSeen.localeCompare(a.latestSeen)
    )
    .map(
      (b): AdmiredEventView => ({
        key: b.key,
        label: b.label,
        vendors: b.vendors,
        unlinked: b.unlinked,
        watch_count: b.watch_count,
      })
    )

  return { events, watch_count: watches.length, vendor_count: vendorById.size }
}
