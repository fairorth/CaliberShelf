import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { AppState } from "react-native"
import type {
  AdmiredCreate,
  AdmiredPhotoKind,
  AdmiredPhotoResponse,
  AdmiredPhotoUpload,
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
 * Storage: the queue index under one key, each frame's JPEG (base64) under
 * its own key — so the index stays small and a frame's bytes are freed the
 * moment it uploads.
 */

const INDEX_KEY = "tenten.admiredQueue.v1"
const dataKey = (photoId: string) => `tenten.admiredQueue.data.${photoId}`

type QueueItem =
  | { type: "create"; body: AdmiredCreate }
  | { type: "photo"; admiredId: string; photoId: string; kind: AdmiredPhotoKind; order: number }

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
const listeners = new Set<Listener>()
let retryTimer: ReturnType<typeof setTimeout> | null = null
/** The photo being uploaded right now, and frames undone mid-upload. */
let inFlight: string | null = null
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
    pendingFrames: items.filter((i) => i.type === "photo").length,
    sending,
    online,
    lastError,
  }
}

export function isUploaded(photoId: string): boolean {
  return uploaded.has(photoId)
}
export function isQueued(photoId: string): boolean {
  return items.some((i) => i.type === "photo" && i.photoId === photoId)
}
export function isCancelled(photoId: string): boolean {
  return cancelled.has(photoId)
}
export function placardFor(admiredId: string): PlacardResult | undefined {
  return placards.get(admiredId)
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

/** Queue one frame. Its bytes are saved BEFORE it joins the queue. */
export async function enqueuePhoto(args: {
  admiredId: string
  photoId: string
  kind: AdmiredPhotoKind
  order: number
  base64: string
}): Promise<void> {
  await load()
  await AsyncStorage.setItem(dataKey(args.photoId), args.base64)
  items.push({ type: "photo", admiredId: args.admiredId, photoId: args.photoId, kind: args.kind, order: args.order })
  await persist()
  emit()
  void flush()
}

/**
 * Undo a frame. Still queued → simply dropped (it never leaves the phone).
 * Already uploaded → deleted on the server.
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
    items = items.filter((i) => !(i.type === "photo" && i.photoId === photoId))
    await persist()
    await AsyncStorage.removeItem(dataKey(photoId))
    emit()
    return
  }
  await deleteOnServer(photoId)
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
      inFlight = item.type === "photo" ? item.photoId : null
      try {
        await send(item)
        if (item.type === "photo" && cancelled.has(item.photoId)) {
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
      if (item.type === "photo") await AsyncStorage.removeItem(dataKey(item.photoId))
      await persist()
      lastError = null
      emit()
    }
  } finally {
    inFlight = null
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

async function send(item: QueueItem): Promise<void> {
  if (item.type === "create") {
    const res = await fetch(`${API_BASE}/api/admired`, {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(item.body),
    })
    if (res.ok) return
    if (isPermanent(res.status)) throw new RejectedError(await readError(res))
    throw new Error(await readError(res))
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
  const res = await fetch(`${API_BASE}/api/admired/${item.admiredId}/photos`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    if (isPermanent(res.status)) throw new RejectedError(await readError(res))
    throw new Error(await readError(res))
  }
  const json = (await res.json()) as AdmiredPhotoResponse
  uploaded.add(item.photoId)
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
