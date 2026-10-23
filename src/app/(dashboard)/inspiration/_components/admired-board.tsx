"use client"

import { ImageIcon, Pencil, Signpost } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusPill } from "@/components/ui/status-pill"
import { deleteAdmired, updateAdmired } from "@/lib/actions/admired-actions"
import type { AdmiredBoardView, AdmiredVendorView, AdmiredWatchView } from "@/lib/queries/admired"
import { ADMIRED_TAGS, admiredPhotoKindLabels, admiredTagLabels } from "@/lib/validations/admired"
import type { AdmiredTag } from "@/lib/validations/admired"
import { cn } from "@/lib/utils"
import { AdmiredPhotoViewer } from "./admired-photo-viewer"
import { AdmiredVendorDialog } from "./admired-vendor-dialog"
import { DeleteVendorButton } from "./delete-vendor-button"

/**
 * Admired — watches seen in the metal and admired, not to be owned (00056).
 * Captured on the iPhone in Show mode, booth by booth (00060): grouped here by
 * event, then by vendor in visit order, for the Monday-morning tidy-up —
 * name the booths, correct what the readers filled, add notes, tag why a
 * watch caught the eye.
 */
export function AdmiredBoard({ board }: { board: AdmiredBoardView }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [vendorOpen, setVendorOpen] = useState<{ id: string; photoId: string | null } | null>(null)

  const allWatches = useMemo(
    () => board.events.flatMap((e) => [...e.vendors.flatMap((v) => v.watches), ...e.unlinked]),
    [board]
  )
  const allVendors = useMemo(() => board.events.flatMap((e) => e.vendors), [board])
  const open = allWatches.find((w) => w.id === openId) ?? null
  const openVendor = allVendors.find((v) => v.id === vendorOpen?.id) ?? null

  if (board.events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-foreground">Nothing admired yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          On the iPhone, turn on Show mode in More, then shoot each booth and the watches that catch your eye —
          they land here, grouped by event and vendor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {board.events.map((event) => (
        <section key={event.key} className="space-y-6">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-md font-semibold tracking-tight">{event.label}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {event.vendors.length > 0 &&
                `${event.vendors.length} ${event.vendors.length === 1 ? "vendor" : "vendors"} · `}
              {event.watch_count} {event.watch_count === 1 ? "watch" : "watches"}
            </span>
          </div>

          {event.vendors.map((vendor) => (
            <VendorSection
              key={vendor.id}
              vendor={vendor}
              onOpenWatch={setOpenId}
              onOpenVendor={(photoId) => setVendorOpen({ id: vendor.id, photoId })}
            />
          ))}

          {event.unlinked.length > 0 && (
            <div className={cn("space-y-3", event.vendors.length > 0 && "border-t border-border pt-4")}>
              {/* Only worth a heading when there are vendors to be distinct from. */}
              {event.vendors.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground">Not linked to a vendor</h3>
              )}
              <WatchGrid watches={event.unlinked} onOpen={setOpenId} />
            </div>
          )}
        </section>
      ))}

      <AdmiredDialog watch={open} onClose={() => setOpenId(null)} />
      <AdmiredVendorDialog
        vendor={openVendor}
        photoId={vendorOpen?.photoId}
        onClose={() => setVendorOpen(null)}
      />
    </div>
  )
}

function VendorSection({
  vendor,
  onOpenWatch,
  onOpenVendor,
}: {
  vendor: AdmiredVendorView
  onOpenWatch: (id: string) => void
  onOpenVendor: (photoId: string | null) => void
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn("text-sm font-medium", vendor.name ? "text-foreground" : "text-muted-foreground")}>
            {vendor.display_name}
          </h3>
          {/* Where the name came from — only when it could be wrong (read off their sign by the model). */}
          {vendor.name_source === "read" && <p className="text-xs text-muted-foreground">Read from their sign</p>}
          {vendor.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{vendor.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenVendor(null)}
            aria-label={`Edit ${vendor.display_name}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <DeleteVendorButton vendor={vendor} />
        </div>
      </div>

      {vendor.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {vendor.photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenVendor(p.id)}
              aria-label={`${admiredPhotoKindLabels[p.kind]} photo`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-photo transition-colors duration-150 hover:border-foreground/20"
            >
              {p.thumb_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
              {p.kind === "name" && (
                <span className="absolute inset-x-0 bottom-0 flex justify-center bg-background/80 py-0.5">
                  <Signpost className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {vendor.watches.length > 0 ? (
        <WatchGrid watches={vendor.watches} vendorName={vendor.name} onOpen={onOpenWatch} />
      ) : (
        <p className="text-xs text-muted-foreground">No watches shot at this booth.</p>
      )}
    </div>
  )
}

function WatchGrid({
  watches,
  vendorName,
  onOpen,
}: {
  watches: AdmiredWatchView[]
  /** Set (even to null) when the grid sits under a vendor heading. */
  vendorName?: string | null
  onOpen: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {watches.map((w) => (
        <AdmiredCard key={w.id} watch={w} vendorName={vendorName} onOpen={() => onOpen(w.id)} />
      ))}
    </div>
  )
}

/**
 * The card's maker line. Under a vendor heading an empty maker — or one that
 * just repeats the vendor's name — is left off: the heading already says it.
 */
function makerLine(watch: AdmiredWatchView, vendorName: string | null | undefined): string | null {
  const maker = watch.maker?.trim()
  if (vendorName === undefined) return maker || "Unknown maker"
  if (!maker) return null
  if (vendorName && maker.toLocaleLowerCase() === vendorName.trim().toLocaleLowerCase()) return null
  return maker
}

function AdmiredCard({
  watch,
  vendorName,
  onOpen,
}: {
  watch: AdmiredWatchView
  vendorName?: string | null
  onOpen: () => void
}) {
  const cover = watch.photos.find((p) => p.kind === "watch") ?? watch.photos[0]
  const placards = watch.photos.filter((p) => p.kind === "placard").length
  const maker = makerLine(watch, vendorName)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-colors duration-150 hover:border-foreground/20"
    >
      <div className="relative aspect-square w-full bg-surface-photo">
        {cover?.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-1 px-3 py-2.5">
        {maker && <p className="truncate text-xs text-muted-foreground">{maker}</p>}
        <p className="truncate text-sm text-foreground">{watch.model || "Untitled"}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {watch.price_text && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{watch.price_text}</span>
          )}
          {placards > 0 && (
            <StatusPill tone="outline" title={watch.placard_read_at ? "Placard read" : "Placard not read yet"}>
              Placard
            </StatusPill>
          )}
          {watch.tags.map((t) => (
            <StatusPill key={t}>{admiredTagLabels[t]}</StatusPill>
          ))}
        </div>
      </div>
    </button>
  )
}

function AdmiredDialog({ watch, onClose }: { watch: AdmiredWatchView | null; onClose: () => void }) {
  return (
    <Dialog open={watch != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        {/* Keyed so each watch gets a fresh form. */}
        {watch && <AdmiredEditor key={watch.id} watch={watch} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function AdmiredEditor({ watch, onClose }: { watch: AdmiredWatchView; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [maker, setMaker] = useState(watch.maker ?? "")
  const [model, setModel] = useState(watch.model ?? "")
  const [reference, setReference] = useState(watch.reference ?? "")
  const [price, setPrice] = useState(watch.price_text ?? "")
  const [event, setEvent] = useState(watch.event ?? "")
  const [seenOn, setSeenOn] = useState(watch.seen_on)
  const [notes, setNotes] = useState(watch.notes ?? "")
  const [tags, setTags] = useState<AdmiredTag[]>(watch.tags)

  function save() {
    startTransition(async () => {
      const result = await updateAdmired(watch.id, {
        maker,
        model,
        reference,
        price_text: price,
        event,
        seen_on: seenOn,
        notes,
        tags,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success("Saved")
        onClose()
      }
    })
  }

  function remove() {
    if (!confirm("Delete this admired watch and all of its photos?")) return
    startTransition(async () => {
      const result = await deleteAdmired(watch.id)
      if (result.error) toast.error(result.error)
      else onClose()
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <DialogTitle className="font-display text-md">
          {[watch.maker, watch.model].filter(Boolean).join(" · ") || "Admired watch"}
        </DialogTitle>
        <DialogDescription className="text-xs">
          {watch.placard_read_at
            ? "Filled from the placard where it was empty — anything you type here wins."
            : "No placard read for this one — fill it in from the photos."}
        </DialogDescription>
      </div>

      {/* Photos: the large view, then the strip (watch shots, then placards). */}
      <AdmiredPhotoViewer photos={watch.photos} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="adm-maker" label="Maker">
          <Input id="adm-maker" value={maker} onChange={(e) => setMaker(e.target.value)} maxLength={120} />
        </Field>
        <Field id="adm-model" label="Model">
          <Input id="adm-model" value={model} onChange={(e) => setModel(e.target.value)} maxLength={200} />
        </Field>
        <Field id="adm-ref" label="Reference">
          <Input id="adm-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} />
        </Field>
        <Field id="adm-price" label="Price (as shown)">
          <Input id="adm-price" value={price} onChange={(e) => setPrice(e.target.value)} maxLength={80} />
        </Field>
        <Field id="adm-event" label="Event">
          <Input id="adm-event" value={event} onChange={(e) => setEvent(e.target.value)} maxLength={120} />
        </Field>
        <Field id="adm-seen" label="Seen on">
          <Input id="adm-seen" type="date" value={seenOn} onChange={(e) => setSeenOn(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <Label>Why it caught my eye</Label>
        <div className="flex flex-wrap gap-2">
          {ADMIRED_TAGS.map((t) => {
            const on = tags.includes(t)
            return (
              <Button
                key={t}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={on}
                onClick={() => setTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                className={cn(on && "border-brass bg-brass/15 text-brass hover:bg-brass/20")}
              >
                {admiredTagLabels[t]}
              </Button>
            )
          })}
        </div>
      </div>

      <Field id="adm-notes" label="Notes">
        <Textarea
          id="adm-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What struck you, who you spoke to, movement, edition…"
        />
      </Field>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button variant="destructive" onClick={remove} disabled={isPending}>
          Delete
        </Button>
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending} className="bg-brass text-brass-foreground hover:bg-brass/90">
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
