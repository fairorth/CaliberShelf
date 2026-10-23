import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { AppState } from "react-native"
import type {
  AdmiredCreate,
  AdmiredPhotoKind,
  AdmiredPhotoMove,
  AdmiredPhotoResponse,
  AdmiredPhotoUpload,
  VendorCreate,
  VendorFields,
} from "@/lib/validations/admired"
import { API_BASE } from "./config"
import { accessToken } from "./supabase"

/**
 * The Admired OFFLINE QUEUE. A show floor has bad signal and a watch you'll
 * never see again can't be reshot, so nothing captured in Show mode is sent
 * straight to the network: it is written to the phone first, then sent in
 * order whenever there's a connection, and only removed once the server has
 * confirmed it. Every create / photo carries a client-generated id, and the
 * server treats a repeat as done (lib/admired-store.ts), so a retry after a
 * half-finished upload is always safe.
 *
 * Since 00060 the queue also carries VENDORS (a create, booth / name frames,
 * renames) and the review screen's edits — moving a frame, deleting one or a
 * whole vendor — so reviewing and fixing work with no signal too. Order is
 * the guarantee: a vendor's create always goes before its watches and frames.
 *
 * Storage: the queue index under one key, each frame's JPEG (base64) under
 * its own key — so the index stays small and a frame's bytes are freed the
 * moment it uploads.
 */

const INDEX_KEY = "tenten.admiredQueue.v1"
const dataKey = (photoId: string) => `tenten.admiredQueue.data.${photoId}`

type QueueItem =
  | { type: "create"; body: AdmiredCreate }
  | { type: "photo"; admiredId: string; photoId: string; kind: AdmiredPhotoKind; order: number }
  | { type: "vendor"; body: VendorCreate }
  | { type: "vendorPhoto"; vendorId: string; photoId: string; kind: AdmiredPhotoKind; order: number }
  | { type: "vendorPatch"; vendorId: string; body: VendorFields }
  | { type: "move"; photoId: string; body: AdmiredPhotoMove }
  | { type: "deletePhoto"; photoId: string }
  | { type: "deleteVendor"; vendorId: string }

const isFrame = (i: QueueItem): i is Extract<QueueItem, { photoId: string; order: number }> =>
  i.type === "photo" || i.type === "vendorPhoto"

/** What a vendor's Name frame said, once read on the server. */
export interface VendorNameResult {
  vendorId: string
  name: string | null
  legible: boolean
  filled: boolean
  error?: string
}

export interface PlacardResult {
  admiredId: string
  maker: string | null
  model: string | null
  price_text: string | null
  legible: boolean
  error?: string
}

export interface QueueStatus {
  /** Frames not yet on the server. */
  pendingFrames: number
  sending: boolean
  online: boolean
  /** Last failure that will be retried (network, server down). */
  lastError: string | null
}

type Listener = () => void

let items: QueueItem[] = []
let loaded = false
let sending = false
let online = true
let lastError: string | null = null
const uploaded = new Set<string>() // photo ids confirmed this session
const placards = new Map<string, PlacardResult>() // admiredId → latest read
const vendorNames = new Map<string, VendorNameResult>() // vendorId → latest read
const vendorNameListeners = new Set<(r: VendorNameResult) => void>()
const listeners = new Set<Listener>()
let retryTimer: ReturnType<typeof setTimeout> | null = null
/** The photo being uploaded right now, and frames undone mid-upload. */
let inFlight: string | null = null
let inFlightItem: QueueItem | null = null
const cancelled = new Set<string>()

function emit() {
  for (const l of listeners) l()
}

export function subscribe(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getStatus(): QueueStatus {
  return {
    pendingFrames: items.filter(isFrame).length,
    sending,
    online,
    lastError,
  }
}

export function isUploaded(photoId: string): boolean {
  return uploaded.has(photoId)
}
/** The frame is still on the phone, waiting to be sent. */
export function isQueued(photoId: string): boolean {
  return items.some((i) => isFrame(i) && i.photoId === photoId)
}
export function isCancelled(photoId: string): boolean {
  return cancelled.has(photoId)
}
export function placardFor(admiredId: string): PlacardResult | undefined {
  return placards.get(admiredId)
}
export function vendorNameFor(vendorId: string): VendorNameResult | undefined {
  return vendorNames.get(vendorId)
}
/** A rename of this vendor is still waiting to be sent — the phone's name is the newer. */
export function isRenameQueued(vendorId: string): boolean {
  return items.some((i) => i.type === "vendorPatch" && i.vendorId === vendorId && i.body.name !== undefined)
}
/** Deletes still waiting to be sent — the server still has these; review hides them. */
export function queuedDeletes(): { photos: Set<string>; vendors: Set<string> } {
  const photos = new Set<string>()
  const vendors = new Set<string>()
  for (const i of items) {
    if (i.type === "deletePhoto") photos.add(i.photoId)
    else if (i.type === "deleteVendor") vendors.add(i.vendorId)
  }
  return { photos, vendors }
}
/** Anything at all is still waiting to be sent. */
export function isIdle(): boolean {
  return items.length === 0 && !sending
}
/** A Name frame for this vendor is still waiting to be sent (and read). */
export function isNameQueued(vendorId: string): boolean {
  return items.some((i) => i.type === "vendorPhoto" && i.vendorId === vendorId && i.kind === "name")
}
/** Told whenever a Name frame has been read — the show session keeps the name. */
export function onVendorName(l: (r: VendorNameResult) => void): () => void {
  vendorNameListeners.add(l)
  return () => vendorNameListeners.delete(l)
}
/** A queued frame's bytes, as a data URI — the review screen's fallback when
 *  the phone's own copy of the file has been cleared from its cache. */
export async function queuedImageUri(photoId: string): Promise<string | null> {
  const b64 = await AsyncStorage.getItem(dataKey(photoId)).catch(() => null)
  return b64 ? `data:image/jpeg;base64,${b64}` : null
}

async function load() {
  if (loaded) return
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY)
    items = raw ? (JSON.parse(raw) as QueueItem[]) : []
  } catch {
    items = []
  }
  loaded = true
}

async function persist() {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items))
}

/** Start an admired watch. Queued, never sent directly. */
export async function enqueueCreate(body: AdmiredCreate): Promise<void> {
  await load()
  items.push({ type: "create", body })
  await persist()
  emit()
  void flush()
}

async function push(item: QueueItem): Promise<void> {
  await load()
  items.push(item)
  await persist()
  emit()
  void flush()
}

/** Start a vendor. Queued, never sent directly. */
export function enqueueVendor(body: VendorCreate): Promise<void> {
  return push({ type: "vendor", body })
}

/** Rename a vendor (or change its notes). */
export function enqueueVendorPatch(vendorId: string, body: VendorFields): Promise<void> {
  return push({ type: "vendorPatch", vendorId, body })
}

/**
 * Queue one frame — a watch's (`admiredId`) or a vendor's (`vendorId`). Its
 * bytes are saved BEFORE it joins the queue.
 */
export async function enqueuePhoto(args: {
  admiredId?: string
  vendorId?: string
  photoId: string
  kind: AdmiredPhotoKind
  order: number
  base64: string
}): Promise<void> {
  await load()
  await AsyncStorage.setItem(dataKey(args.photoId), args.base64)
  await push(
    args.vendorId
      ? { type: "vendorPhoto", vendorId: args.vendorId, photoId: args.photoId, kind: args.kind, order: args.order }
      : { type: "photo", admiredId: args.admiredId!, photoId: args.photoId, kind: args.kind, order: args.order }
  )
}

/**
 * Move a frame to another watch, or change what it is. Still queued → the
 * queued upload is simply re-aimed. Already sent → a move is queued (it can
 * wait for signal like everything else). Mid-upload → the move is queued
 * behind it, which runs once it has landed.
 */
export async function moveFrame(photoId: string, body: AdmiredPhotoMove): Promise<void> {
  await load()
  const queued = items.find((i): i is Extract<QueueItem, { photoId: string; order: number }> => isFrame(i) && i.photoId === photoId)
  if (queued && inFlight !== photoId) {
    const replacement: QueueItem = body.vendor_id
      ? { type: "vendorPhoto", vendorId: body.vendor_id, photoId, kind: body.kind, order: queued.order }
      : { type: "photo", admiredId: body.admired_id!, photoId, kind: body.kind, order: queued.order }
    items = items.map((i) => (i === queued ? replacement : i))
    await persist()
    emit()
    return
  }
  await push({ type: "move", photoId, body })
}

/**
 * Undo a frame. Still queued → simply dropped (it never leaves the phone).
 * Already uploaded → a delete is queued, so it works with no signal.
 */
export async function removeFrame(photoId: string): Promise<void> {
  await load()
  if (inFlight === photoId) {
    // Mid-upload: let it land, then delete it (see flush).
    cancelled.add(photoId)
    emit()
    return
  }
  if (isQueued(photoId)) {
    // Its moves go with it: there is nothing left to move.
    items = items.filter((i) => !("photoId" in i && i.photoId === photoId))
    await persist()
    await AsyncStorage.removeItem(dataKey(photoId))
    emit()
    return
  }
  await push({ type: "deletePhoto", photoId })
}

/**
 * Delete a vendor with its watches and frames. Never sent yet → everything
 * queued for it is dropped on the phone. Otherwise a delete is queued; what
 * is still queued for it is dropped first, since the server delete takes it
 * all anyway.
 */
export async function removeVendor(vendorId: string, watchIds: string[], photoIds: string[]): Promise<void> {
  await load()
  const watches = new Set(watchIds)
  const photos = new Set(photoIds)
  const create = items.find((i) => i.type === "vendor" && i.body.id === vendorId)
  // Its create still waiting (and not the request going out right now) means
  // the server has never heard of it — dropping the queue is the whole delete.
  const neverSent = !!create && create !== inFlightItem
  const mine = (i: QueueItem) =>
    (i.type === "vendor" && i.body.id === vendorId) ||
    ((i.type === "vendorPhoto" || i.type === "vendorPatch") && i.vendorId === vendorId) ||
    (i.type === "create" && watches.has(i.body.id)) ||
    (i.type === "photo" && watches.has(i.admiredId)) ||
    ("photoId" in i && photos.has(i.photoId))
  const dropped = items.filter((i) => mine(i) && i !== inFlightItem)
  items = items.filter((i) => !dropped.includes(i))
  for (const i of dropped) if (isFrame(i)) await AsyncStorage.removeItem(dataKey(i.photoId))
  if (!neverSent) items.push({ type: "deleteVendor", vendorId })
  await persist()
  emit()
  void flush()
}

/** Delete a frame that has reached the server. */
async function deleteOnServer(photoId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admired/photos/${photoId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  })
  if (!res.ok && res.status !== 404) throw new Error(await readError(res))
  uploaded.delete(photoId)
  emit()
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken()
  if (!token) throw new AuthError()
  return { Authorization: `Bearer ${token}` }
}

class AuthError extends Error {
  constructor() {
    super("Signed out — sign in again to send Admired frames.")
  }
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? `Request failed (${res.status}).`
}

/** Send everything queued, in order. Stops at the first network failure. */
export async function flush(): Promise<void> {
  await load()
  if (sending || items.length === 0) return
  sending = true
  emit()
  try {
    while (items.length > 0) {
      const item = items[0]
      inFlight = isFrame(item) ? item.photoId : null
      inFlightItem = item
      try {
        await send(item)
        if (isFrame(item) && cancelled.has(item.photoId)) {
          // Undone while it was uploading: it has landed, so delete it there.
          cancelled.delete(item.photoId)
          await deleteOnServer(item.photoId).catch(() => {})
        }
      } catch (e) {
        if (e instanceof RejectedError) {
          // The server refused this item for good (bad data). Drop it rather
          // than block the queue forever — but say so.
          lastError = e.message
        } else {
          // Network down, server unreachable, signed out: keep it, retry later.
          lastError = (e as Error).message
          scheduleRetry()
          return
        }
      }
      // Remove exactly the item just handled (an undo may have edited the list).
      items = items.filter((i) => i !== item)
      if (isFrame(item)) await AsyncStorage.removeItem(dataKey(item.photoId))
      await persist()
      lastError = null
      emit()
    }
  } finally {
    inFlight = null
    inFlightItem = null
    sending = false
    emit()
  }
}

/** The server refused the item itself; retrying won't help. */
class RejectedError extends Error {}

/**
 * Only an explicit "this data is invalid" (422) or "too large" (413) is
 * permanent. EVERYTHING else is retried — 404 (route not deployed yet, or
 * the watch's create not landed), 500 (database not migrated, storage down),
 * 401 (signed out), no network. Dropping a frame of a watch you'll never see
 * again is the one outcome this queue exists to prevent.
 */
function isPermanent(status: number): boolean {
  return status === 422 || status === 413
}

/** One JSON request; a 404 counts as done when `goneIsDone` (deleting what is already gone). */
async function request(method: string, path: string, body?: unknown, goneIsDone = false): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(await authHeaders()), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.ok || (goneIsDone && res.status === 404)) return res
  if (isPermanent(res.status)) throw new RejectedError(await readError(res))
  throw new Error(await readError(res))
}

async function send(item: QueueItem): Promise<void> {
  switch (item.type) {
    case "create":
      await request("POST", "/api/admired", item.body)
      return
    case "vendor":
      await request("POST", "/api/admired/vendors", item.body)
      return
    case "vendorPatch":
      await request("PATCH", `/api/admired/vendors/${item.vendorId}`, item.body)
      return
    case "move": {
      const res = await request("PATCH", `/api/admired/photos/${item.photoId}`, item.body, true)
      // A frame turned into a Name frame was read on the way.
      const json = (await res.json().catch(() => null)) as Pick<AdmiredPhotoResponse, "vendorName" | "vendorNameError"> | null
      if (json && item.body.vendor_id && (json.vendorName || json.vendorNameError)) {
        recordVendorName(item.body.vendor_id, json)
      }
      return
    }
    case "deletePhoto":
      await request("DELETE", `/api/admired/photos/${item.photoId}`, undefined, true)
      uploaded.delete(item.photoId)
      return
    case "deleteVendor":
      await request("DELETE", `/api/admired/vendors/${item.vendorId}`, undefined, true)
      return
  }

  const base64 = await AsyncStorage.getItem(dataKey(item.photoId))
  if (!base64) return // bytes already gone — nothing to send
  const body: AdmiredPhotoUpload = {
    id: item.photoId,
    kind: item.kind,
    image_base64: base64,
    media_type: "image/jpeg",
    display_order: item.order,
  }
  const res = await request(
    "POST",
    item.type === "vendorPhoto" ? `/api/admired/vendors/${item.vendorId}/photos` : `/api/admired/${item.admiredId}/photos`,
    body
  )
  const json = (await res.json()) as AdmiredPhotoResponse
  uploaded.add(item.photoId)
  if (item.type === "vendorPhoto") {
    if (item.kind === "name") recordVendorName(item.vendorId, json)
    return
  }
  if (item.kind === "placard") {
    placards.set(item.admiredId, {
      admiredId: item.admiredId,
      maker: json.placard?.read.maker ?? null,
      model: json.placard?.read.model ?? null,
      price_text: json.placard?.read.price_text ?? null,
      legible: json.placard?.read.legible ?? false,
      error: json.placardError,
    })
  }
}

function recordVendorName(
  vendorId: string,
  json: Pick<AdmiredPhotoResponse, "vendorName" | "vendorNameError">
): void {
  const r: VendorNameResult = {
    vendorId,
    name: json.vendorName?.read.name ?? null,
    legible: json.vendorName?.read.legible ?? false,
    filled: json.vendorName?.filled ?? false,
    error: json.vendorNameError,
  }
  vendorNames.set(vendorId, r)
  for (const l of vendorNameListeners) l(r)
}

function scheduleRetry() {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    void flush()
  }, 20_000)
}

// Wake the queue whenever the signal comes back or the app returns.
NetInfo.addEventListener((state) => {
  const next = state.isConnected !== false && state.isInternetReachable !== false
  if (next !== online) {
    online = next
    emit()
  }
  if (online) void flush()
})
AppState.addEventListener("change", (s) => {
  if (s === "active") void flush()
})
// Anything left from a previous session goes out on launch.
void load().then(() => {
  emit()
  void flush()
})

/** RFC 4122 v4 id for client-generated rows (no crypto module needed). */
export function newId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}
