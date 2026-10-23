import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"
import { localDateIso } from "@/lib/dates"
import { isVendorKind } from "@/lib/validations/admired"
import type { AdmiredPhotoKind } from "@/lib/validations/admired"
import * as admiredQueue from "./admired-queue"

/**
 * The SHOW SESSION (00060): what this phone has captured at a show, kept on
 * the phone — vendors in the order visited, each vendor's watches, every
 * frame with the phone's own copy of it. The camera and the review screens
 * read it, so they work on a show floor with no signal; everything here is
 * also sent through the offline queue, which the server mirrors.
 *
 * "Current" is where the next frame goes: a vendor (created on the first
 * frame at a booth, not before — no empty vendors) and, within it, a watch
 * (created on the first Watch frame). Next watch / Next vendor clear them;
 * Shoot more here sets the vendor back.
 *
 * A vendor captured on another phone, or before this session existed, is
 * not here — the review screens merge the server's list in (show-data.ts).
 */

export interface LocalFrame {
  photoId: string
  kind: AdmiredPhotoKind
  /** The admired watch it belongs to; null for booth / name frames. */
  watchId: string | null
  /** The phone's prepared copy (may be cleared by iOS; the queue holds the bytes until sent). */
  uri: string
  /** The dial read soft at the shutter — worth a closer look in review. */
  soft: boolean
  shotAt: string
}

export interface LocalWatch {
  id: string
  createdAt: string
}

export interface LocalVendor {
  id: string
  event: string
  seenOn: string
  createdAt: string
  /** Typed by the owner, or what a Name frame read. */
  name: string | null
  watches: LocalWatch[]
  frames: LocalFrame[]
}

interface SessionState {
  vendors: Record<string, LocalVendor>
  currentVendorId: string | null
  currentWatchId: string | null
}

const KEY = "tenten.showSession.v1"
/** A show is a weekend; a month later its vendors live on the server only. */
const KEEP_DAYS = 30

let state: SessionState = { vendors: {}, currentVendorId: null, currentWatchId: null }
let loaded = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

async function load(): Promise<void> {
  if (loaded) return
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw) state = JSON.parse(raw) as SessionState
    const cutoff = Date.now() - KEEP_DAYS * 86_400_000
    for (const [id, v] of Object.entries(state.vendors)) if (Date.parse(v.createdAt) < cutoff) delete state.vendors[id]
    if (state.currentVendorId && !state.vendors[state.currentVendorId]) {
      state.currentVendorId = null
      state.currentWatchId = null
    }
  } catch {
    // start fresh
  }
  loaded = true
  emit()
}
void load()

function save(next: SessionState): void {
  state = next
  emit()
  void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {})
}

function patchVendor(id: string, change: (v: LocalVendor) => LocalVendor): void {
  const v = state.vendors[id]
  if (!v) return
  save({ ...state, vendors: { ...state.vendors, [id]: change(v) } })
}

// A Name frame read on the server names the vendor here too — unless the
// owner has typed one meanwhile (theirs wins, as on the server).
admiredQueue.onVendorName((r) => {
  if (r.filled && r.name) patchVendor(r.vendorId, (v) => (v.name ? v : { ...v, name: r.name }))
})

export function getSession(): SessionState {
  return state
}

/** Live session — every screen using it updates on each frame. */
export function useShowSession(): SessionState {
  const [s, setS] = useState(state)
  useEffect(() => {
    const l = () => setS(state)
    listeners.add(l)
    l()
    return () => {
      listeners.delete(l)
    }
  }, [])
  return s
}

/** This event's vendors in visit order. */
export function vendorsFor(s: SessionState, event: string): LocalVendor[] {
  return Object.values(s.vendors)
    .filter((v) => v.event === event)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * Shoot one frame into the current vendor — creating the vendor (and, for a
 * Watch frame, the watch) on the way. The frame is on the phone and queued
 * before this returns.
 */
export async function shootFrame(args: {
  event: string
  kind: AdmiredPhotoKind
  uri: string
  base64: string
  soft: boolean
}): Promise<void> {
  await load()
  const now = new Date().toISOString()
  const today = localDateIso()

  let vendorId = state.currentVendorId
  if (!vendorId) {
    vendorId = admiredQueue.newId()
    const vendor: LocalVendor = { id: vendorId, event: args.event, seenOn: today, createdAt: now, name: null, watches: [], frames: [] }
    save({ ...state, vendors: { ...state.vendors, [vendorId]: vendor }, currentVendorId: vendorId, currentWatchId: null })
    await admiredQueue.enqueueVendor({ id: vendorId, event: args.event, seen_on: today })
  }

  let watchId: string | null = null
  if (!isVendorKind(args.kind)) {
    watchId = state.currentWatchId
    if (!watchId) {
      watchId = admiredQueue.newId()
      const id = watchId
      patchVendor(vendorId, (v) => ({ ...v, watches: [...v.watches, { id, createdAt: now }] }))
      save({ ...state, currentWatchId: id })
      await admiredQueue.enqueueCreate({ id, vendor_id: vendorId, event: args.event, seen_on: today })
    }
  }

  const photoId = admiredQueue.newId()
  const vendor = state.vendors[vendorId]
  const order = vendor.frames.filter((f) => f.watchId === watchId).length
  const frame: LocalFrame = { photoId, kind: args.kind, watchId, uri: args.uri, soft: args.soft, shotAt: now }
  patchVendor(vendorId, (v) => ({ ...v, frames: [...v.frames, frame] }))
  await admiredQueue.enqueuePhoto(
    watchId
      ? { admiredId: watchId, photoId, kind: args.kind, order, base64: args.base64 }
      : { vendorId, photoId, kind: args.kind, order, base64: args.base64 }
  )
}

/** The next Watch frame starts a new watch at the same vendor. */
export function nextWatch(): void {
  save({ ...state, currentWatchId: null })
}

/** The next frame starts a new vendor. */
export function nextVendor(): void {
  save({ ...state, currentVendorId: null, currentWatchId: null })
}

/** A vendor as the review screens know it — enough to give it a local record. */
export interface VendorRef {
  id: string
  event: string
  seenOn: string
  createdAt: string
  name: string | null
  /** Its watches as the server has them, so a local record numbers them right. */
  watches: LocalWatch[]
}

/** A vendor only the server knew about gets a local record (no frames: those are the server's). */
function ensureLocal(v: VendorRef): void {
  if (state.vendors[v.id]) return
  save({
    ...state,
    vendors: {
      ...state.vendors,
      [v.id]: { id: v.id, event: v.event, seenOn: v.seenOn, createdAt: v.createdAt, name: v.name, watches: v.watches, frames: [] },
    },
  })
}

/**
 * Shoot more at a vendor — this session's or one only the server knows
 * (captured earlier, or on another phone). Its next Watch frame starts a
 * new watch: going back is usually for something missed.
 */
export function resumeVendor(v: VendorRef): void {
  ensureLocal(v)
  save({ ...state, currentVendorId: v.id, currentWatchId: null })
}

export function renameVendor(vendor: VendorRef, name: string): void {
  const trimmed = name.trim()
  ensureLocal(vendor)
  patchVendor(vendor.id, (v) => ({ ...v, name: trimmed || null }))
  void admiredQueue.enqueueVendorPatch(vendor.id, { name: trimmed || null })
}

export async function removeFrame(vendorId: string, photoId: string): Promise<void> {
  patchVendor(vendorId, (v) => ({ ...v, frames: v.frames.filter((f) => f.photoId !== photoId) }))
  await admiredQueue.removeFrame(photoId)
}

/** Move a frame: to the vendor (Booth / Name), to one of its watches, or to a NEW watch. */
export async function moveFrame(args: {
  vendor: VendorRef
  photoId: string
  to: { kind: "booth" | "name" } | { kind: "watch"; watchId: string | "new" }
}): Promise<void> {
  await load()
  const vendorId = args.vendor.id
  let watchId: string | null = null
  if (args.to.kind === "watch") {
    watchId = args.to.watchId
    if (watchId === "new") {
      ensureLocal(args.vendor)
      const id = admiredQueue.newId()
      watchId = id
      const now = new Date().toISOString()
      patchVendor(vendorId, (v) => ({ ...v, watches: [...v.watches, { id, createdAt: now }] }))
      await admiredQueue.enqueueCreate({ id, vendor_id: vendorId, event: args.vendor.event, seen_on: localDateIso() })
    }
  }
  const kind = args.to.kind
  patchVendor(vendorId, (v) => ({
    ...v,
    frames: v.frames.map((f) => (f.photoId === args.photoId ? { ...f, kind, watchId } : f)),
  }))
  await admiredQueue.moveFrame(args.photoId, watchId ? { kind, admired_id: watchId } : { kind, vendor_id: vendorId })
}

/** Delete a vendor here and on the server — its watches and frames with it. */
export async function removeVendor(id: string, serverWatchIds: string[], serverPhotoIds: string[]): Promise<void> {
  const v = state.vendors[id]
  const watchIds = [...new Set([...(v?.watches.map((w) => w.id) ?? []), ...serverWatchIds])]
  const photoIds = [...new Set([...(v?.frames.map((f) => f.photoId) ?? []), ...serverPhotoIds])]
  const vendors = { ...state.vendors }
  delete vendors[id]
  const current = state.currentVendorId === id
  save({ ...state, vendors, currentVendorId: current ? null : state.currentVendorId, currentWatchId: current ? null : state.currentWatchId })
  await admiredQueue.removeVendor(id, watchIds, photoIds)
}
