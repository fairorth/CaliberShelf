"use client"

import { ImageIcon, ScrollText, Trash2 } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusPill } from "@/components/ui/status-pill"
import { deleteAdmired, deleteAdmiredPhoto, updateAdmired } from "@/lib/actions/admired-actions"
import type { AdmiredWatchView } from "@/lib/queries/admired"
import { ADMIRED_TAGS, admiredTagLabels } from "@/lib/validations/admired"
import type { AdmiredTag } from "@/lib/validations/admired"
import { cn } from "@/lib/utils"

/**
 * Admired — watches seen in the metal and admired, not to be owned (00056).
 * Captured on the iPhone in Show mode; grouped here by event for the
 * Monday-morning tidy-up: correct what the placard reader filled, add notes,
 * tag why it caught the eye.
 */
export function AdmiredBoard({ watches }: { watches: AdmiredWatchView[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = watches.find((w) => w.id === openId) ?? null

  const groups = useMemo(() => {
    const m = new Map<string, AdmiredWatchView[]>()
    for (const w of watches) {
      const key = w.event?.trim() || "No event"
      m.set(key, [...(m.get(key) ?? []), w])
    }
    return [...m.entries()]
  }, [watches])

  if (watches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-foreground">Nothing admired yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          On the iPhone, turn on Show mode in More, then shoot watches and their placards — they land here,
          grouped by event.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map(([event, list]) => (
        <section key={event} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-md font-semibold tracking-tight">{event}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {list.length} {list.length === 1 ? "watch" : "watches"}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {list.map((w) => (
              <AdmiredCard key={w.id} watch={w} onOpen={() => setOpenId(w.id)} />
            ))}
          </div>
        </section>
      ))}

      <AdmiredDialog watch={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

function AdmiredCard({ watch, onOpen }: { watch: AdmiredWatchView; onOpen: () => void }) {
  const cover = watch.photos.find((p) => p.kind === "watch") ?? watch.photos[0]
  const placards = watch.photos.filter((p) => p.kind === "placard").length
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
        <p className="truncate text-xs text-muted-foreground">{watch.maker || "Unknown maker"}</p>
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
  const [viewing, setViewing] = useState(watch.photos[0]?.id ?? null)
  const current = watch.photos.find((p) => p.id === viewing) ?? watch.photos[0]

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

  function removePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return
    startTransition(async () => {
      const result = await deleteAdmiredPhoto(photoId)
      if (result.error) toast.error(result.error)
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
      {current?.full_url && (
        <div className="relative overflow-hidden rounded-xl bg-surface-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.full_url} alt="" className="max-h-[50dvh] w-full object-contain" />
        </div>
      )}
      {watch.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {watch.photos.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setViewing(p.id)}
                className={cn(
                  "relative block h-16 w-16 overflow-hidden rounded-lg border",
                  p.id === current?.id ? "border-brass" : "border-border"
                )}
                aria-label={p.kind === "placard" ? "Placard photo" : "Watch photo"}
              >
                {p.thumb_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumb_url} alt="" className="h-full w-full object-cover" />
                )}
                {p.kind === "placard" && (
                  <span className="absolute inset-x-0 bottom-0 flex justify-center bg-background/80 py-0.5">
                    <ScrollText className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {current && (
        <div className="-mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => removePhoto(current.id)} disabled={isPending}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete this photo
          </Button>
        </div>
      )}

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
