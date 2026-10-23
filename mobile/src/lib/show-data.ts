import type { AdmiredPhotoKind } from "@/lib/validations/admired"
import * as admiredQueue from "./admired-queue"
import { supabase } from "./supabase"
import type { LocalVendor, LocalWatch, VendorRef } from "./show-session"

/**
 * Show mode's REVIEW data: the event's vendors as the server has them,
 * merged with the phone's own session (show-session.ts). The phone's copy
 * covers what hasn't been sent yet — so review works with no signal — and
 * the server's covers what this phone never captured (or has forgotten).
 * Read straight from Supabase as the owner (RLS).
 */

export interface ReviewPhoto {
  photoId: string
  kind: AdmiredPhotoKind
  /** The watch it belongs to; null for booth / name frames. */
  watchId: string | null
  /** For the grid: the server thumbnail, else the phone's copy. */
  thumbUri: string | null
  /** The full frame: the phone's copy, else signed on demand from `storagePath`. */
  localUri: string | null
  storagePath: string | null
  /** Still on the phone, waiting to be sent. */
  pending: boolean
  /** The dial read soft at the shutter (phone-captured frames only). */
  soft: boolean
  sortKey: string
}

export interface ReviewWatch {
  id: string
  number: number
  /** From an old placard read, if any — shown beside "Watch N". */
  label: string | null
}

export interface ReviewVendor extends VendorRef {
  /** Visit order within the event, 1-based — "Vendor 3" until it has a name. */
  number: number
  /** A Name frame is on its way to be read. */
  namePending: boolean
  reviewWatches: ReviewWatch[]
  photos: ReviewPhoto[]
  pendingCount: number
}

type PhotoRow = {
  id: string
  kind: AdmiredPhotoKind
  storage_path: string
  thumb_path: string | null
  display_order: number
  created_at: string
}
type VendorRow = {
  id: string
  event: string | null
  name: string | null
  seen_on: string
  created_at: string
  admired_photos: PhotoRow[] | null
  admired_watches: Array<{
    id: string
    created_at: string
    maker: string | null
    model: string | null
    admired_photos: PhotoRow[] | null
  }> | null
}

const BUCKET = "watch-photos"

/** The event's vendors from the server, with thumbnail URLs signed. Throws when offline. */
async function fetchServerVendors(event: string): Promise<VendorRow[]> {
  const cols = "id, kind, storage_path, thumb_path, display_order, created_at"
  const { data, error } = await supabase
    .from("admired_vendors")
    .select(
      `id, event, name, seen_on, created_at, admired_photos(${cols}), admired_watches(id, created_at, maker, model, admired_photos(${cols}))`
    )
    .eq("event", event)
    .order("created_at")
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as VendorRow[]
}

async function signThumbs(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (paths.length === 0) return out
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl)
  return out
}

/**
 * The full frame, for checking sharpness: the ORIGINAL upload (2000px), not
 * a transformed copy — the whole point of the review is pinching in to see
 * whether the dial is sharp, and a resized copy would hide exactly that.
 */
export async function fullFrameUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

/**
 * Merge the server's vendors with the phone's. `server` null = offline: the
 * phone's session alone.
 */
export function mergeVendors(event: string, local: LocalVendor[], server: VendorRow[] | null, thumbs: Map<string, string>): ReviewVendor[] {
  const byId = new Map<string, ReviewVendor>()
  const deleting = admiredQueue.queuedDeletes()

  for (const s of server ?? []) {
    if (deleting.vendors.has(s.id)) continue
    const watches: LocalWatch[] = (s.admired_watches ?? [])
      .map((w) => ({ id: w.id, createdAt: w.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const photos: ReviewPhoto[] = [
      ...(s.admired_photos ?? []).map((p) => serverPhoto(p, null, thumbs)),
      ...(s.admired_watches ?? []).flatMap((w) => (w.admired_photos ?? []).map((p) => serverPhoto(p, w.id, thumbs))),
    ].filter((p) => !deleting.photos.has(p.photoId))
    byId.set(s.id, {
      id: s.id,
      event: s.event ?? event,
      seenOn: s.seen_on,
      createdAt: s.created_at,
      name: s.name,
      watches,
      number: 0,
      namePending: false,
      reviewWatches: (s.admired_watches ?? []).map((w) => ({
        id: w.id,
        number: 0,
        label: [w.maker, w.model].filter(Boolean).join(" ") || null,
      })),
      photos,
      pendingCount: 0,
    })
  }

  for (const l of local) {
    const existing = byId.get(l.id)
    const known = new Set(existing?.photos.map((p) => p.photoId) ?? [])
    const localPhotos: ReviewPhoto[] = l.frames.map((f) => ({
      photoId: f.photoId,
      kind: f.kind,
      watchId: f.watchId,
      thumbUri: f.uri,
      localUri: f.uri,
      storagePath: null,
      pending: admiredQueue.isQueued(f.photoId),
      soft: f.soft,
      sortKey: f.shotAt,
    }))
    if (!existing) {
      byId.set(l.id, {
        ...l,
        number: 0,
        namePending: false,
        reviewWatches: l.watches.map((w) => ({ id: w.id, number: 0, label: null })),
        photos: localPhotos,
        pendingCount: 0,
      })
      continue
    }
    // On both: the server's frames, with the phone's copy (faster, and it
    // knows the soft flag) where the phone still has one. The phone's frames
    // the server hasn't got yet join them; its kind / watch win, since a
    // move made on the phone may still be queued.
    const phone = new Map(localPhotos.map((p) => [p.photoId, p]))
    existing.photos = [
      ...existing.photos.map((p) => {
        const mine = phone.get(p.photoId)
        return mine ? { ...p, kind: mine.kind, watchId: mine.watchId, localUri: mine.localUri, soft: mine.soft } : p
      }),
      ...localPhotos.filter((p) => !known.has(p.photoId)),
    ]
    for (const w of l.watches) {
      if (!existing.watches.some((x) => x.id === w.id)) {
        existing.watches.push(w)
        existing.reviewWatches.push({ id: w.id, number: 0, label: null })
      }
    }
    // A rename still on its way is newer than what the server says.
    existing.name = admiredQueue.isRenameQueued(l.id) ? l.name : (existing.name ?? l.name)
  }

  const vendors = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  vendors.forEach((v, i) => {
    v.number = i + 1
    v.namePending = !v.name && admiredQueue.isNameQueued(v.id)
    v.watches.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const order = new Map(v.watches.map((w, j) => [w.id, j + 1]))
    v.reviewWatches = v.reviewWatches
      .map((w) => ({ ...w, number: order.get(w.id) ?? 0 }))
      .sort((a, b) => a.number - b.number)
    v.photos.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    v.pendingCount = v.photos.filter((p) => p.pending).length
  })
  return vendors
}

function serverPhoto(p: PhotoRow, watchId: string | null, thumbs: Map<string, string>): ReviewPhoto {
  return {
    photoId: p.id,
    kind: p.kind,
    watchId,
    thumbUri: thumbs.get(p.thumb_path ?? p.storage_path) ?? null,
    localUri: null,
    storagePath: p.storage_path,
    pending: false,
    soft: false,
    sortKey: p.created_at,
  }
}

/** What the server had at the last fetch — merged with the phone's session on every change. */
export interface ServerSnapshot {
  rows: VendorRow[]
  thumbs: Map<string, string>
}

/**
 * The event's vendors from the server, thumbnails signed. Null when it can't
 * be reached (no signal, or migration 00060 not applied yet) — review then
 * shows the phone's own session alone.
 */
export async function fetchServerSnapshot(event: string): Promise<ServerSnapshot | null> {
  try {
    const rows = await fetchServerVendors(event)
    const paths = rows
      .flatMap((s) => [...(s.admired_photos ?? []), ...(s.admired_watches ?? []).flatMap((w) => w.admired_photos ?? [])])
      .map((p) => p.thumb_path ?? p.storage_path)
    return { rows, thumbs: await signThumbs(paths) }
  } catch {
    return null
  }
}

/** The vendor's photos in sections: the booth (booth + name frames), then each watch. */
export function vendorSections(v: ReviewVendor): Array<{ key: string; title: string; photos: ReviewPhoto[] }> {
  const booth = v.photos.filter((p) => !p.watchId)
  const sections = booth.length ? [{ key: "booth", title: "Booth", photos: booth }] : []
  for (const w of v.reviewWatches) {
    const photos = v.photos.filter((p) => p.watchId === w.id)
    if (photos.length === 0) continue
    sections.push({ key: w.id, title: w.label ? `Watch ${w.number} · ${w.label}` : `Watch ${w.number}`, photos })
  }
  return sections
}

/** "Kudoke", or "Vendor 3" until it has a name. */
export function vendorTitle(v: { name: string | null; number: number }): string {
  return v.name || `Vendor ${v.number}`
}
