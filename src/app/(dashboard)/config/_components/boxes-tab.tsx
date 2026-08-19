"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Wand2 } from "lucide-react"
import { toast } from "sonner"
import {
  commitBoxAutoFill,
  planBoxAutoFill,
  saveBoxConfig,
} from "@/lib/actions/box-actions"
import {
  MIN_BOX_COUNT,
  MAX_BOX_COUNT,
  MAX_BOX_DESCRIPTION,
  boxLabel,
  boxOptions,
  type AutoFillMove,
  type AutoFillPlan,
  type BoxConfig,
} from "@/lib/boxes"

export function BoxesTab({ initialConfig }: { initialConfig: BoxConfig }) {
  const [count, setCount] = useState(String(initialConfig.count))
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    initialConfig.descriptions
  )
  const [isSaving, startSaving] = useTransition()

  const parsed = parseInt(count, 10)
  const valid =
    Number.isFinite(parsed) && parsed >= MIN_BOX_COUNT && parsed <= MAX_BOX_COUNT
  const boxes = valid ? boxOptions(parsed) : []

  function setDescription(box: string, value: string) {
    setDescriptions((prev) => ({ ...prev, [box]: value }))
  }

  function save() {
    if (!valid) {
      toast.error(`Enter a whole number between ${MIN_BOX_COUNT} and ${MAX_BOX_COUNT}.`)
      return
    }
    startSaving(async () => {
      const result = await saveBoxConfig(parsed, descriptions)
      if (result.error) toast.error(result.error)
      else toast.success("Boxes saved.")
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Storage Boxes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set how many storage boxes you have, and optionally describe each one
            (&ldquo;Luxury Tier&rdquo;, &ldquo;Fun AliExpress Finds&rdquo;). Watches store
            only the box number, so descriptions can be renamed anytime without
            touching any watch.
          </p>

          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="box-count" className="text-sm font-medium">
                Number of boxes
              </label>
              <Input
                id="box-count"
                type="number"
                inputMode="numeric"
                min={MIN_BOX_COUNT}
                max={MAX_BOX_COUNT}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="h-9 w-28 font-mono"
                aria-label="Number of boxes"
              />
            </div>
            <Button size="sm" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save boxes"}
            </Button>
          </div>

          {boxes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Descriptions (optional, shown next to the box number everywhere)
              </p>
              <div className="max-w-md space-y-2">
                {boxes.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 font-mono text-sm text-muted-foreground">
                      {b}
                    </span>
                    <Input
                      value={descriptions[b] ?? ""}
                      onChange={(e) => setDescription(b, e.target.value)}
                      maxLength={MAX_BOX_DESCRIPTION}
                      placeholder="e.g. Luxury Tier"
                      className="h-8"
                      aria-label={`Description for ${b}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AutoFillPanel boxes={boxes} descriptions={descriptions} />
      <AutoFillList record={initialConfig.lastAutoFill} />
    </div>
  )
}

/**
 * The selection engine, pointed at a real storage box.
 *
 * This is what the weekly "Display Box" became. The special box is gone —
 * boxes are just boxes now — but the algorithm that made it interesting is
 * worth keeping: it balances category, price tier and complication, favours
 * under-worn and newer pieces, keeps 3–4 gym-capable and 1–2 swim-ready
 * watches, caps luxury at two, and refuses to pair two watches of the same
 * brand.
 */
function AutoFillPanel({
  boxes,
  descriptions,
}: {
  boxes: string[]
  descriptions: Record<string, string>
}) {
  const [target, setTarget] = useState("")
  const [plan, setPlan] = useState<AutoFillPlan | null>(null)
  const [isWorking, startWorking] = useTransition()

  function preview() {
    if (!target) {
      toast.error("Choose a box to fill.")
      return
    }
    startWorking(async () => {
      const result = await planBoxAutoFill(target)
      if (result.error) {
        toast.error(result.error)
        setPlan(null)
      } else {
        setPlan(result.plan ?? null)
      }
    })
  }

  function build() {
    if (!plan) return
    const ids = [...plan.incoming, ...plan.staying].map((m) => m.watchId)
    startWorking(async () => {
      const result = await commitBoxAutoFill(plan.box, ids)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `${plan.box} built with ${result.assigned} ${result.assigned === 1 ? "watch" : "watches"}.`
        )
        setPlan(null)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Auto-fill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick a box and let the selection engine choose what goes in it — a
          balanced spread across category, price tier and complication, leaning
          toward watches you have not worn lately, with no two of the same brand.
        </p>
        <p className="text-xs text-muted-foreground">
          Nothing moves until you press <strong>Build this box</strong>. The
          preview shows exactly what would change, and which drawer each arriving
          watch is sitting in right now.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label htmlFor="autofill-box" className="text-sm font-medium">
              Box to fill
            </label>
            <Select
              value={target}
              onValueChange={(v) => {
                if (!v) return
                setTarget(v)
                // A plan belongs to the box it was made for.
                setPlan(null)
              }}
            >
              <SelectTrigger id="autofill-box" className="w-[260px]">
                {/* The label is rendered here rather than through SelectValue:
                    a controlled Select can otherwise show the raw value. */}
                {target ? (
                  boxLabel(target, descriptions)
                ) : (
                  <SelectValue placeholder="Select a box" />
                )}
              </SelectTrigger>
              <SelectContent>
                {boxes.map((b) => (
                  <SelectItem key={b} value={b}>
                    {boxLabel(b, descriptions)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={preview}
            disabled={isWorking || !target}
            className="gap-1.5"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {isWorking && !plan ? "Working…" : plan ? "Try again" : "Preview fill"}
          </Button>
        </div>

        {boxes.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Save a valid box count first.
          </p>
        )}

        {plan && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Proposed {plan.box} —{" "}
                  {plan.incoming.length + plan.staying.length} watches
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.incoming.length} moving in · {plan.staying.length} already
                  there · {plan.outgoing.length} coming out
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlan(null)}
                  disabled={isWorking}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={build} disabled={isWorking}>
                  {isWorking ? "Building…" : "Build this box"}
                </Button>
              </div>
            </div>

            <PlanTable
              heading={`Moving into ${plan.box}`}
              fromLabel="Collect from"
              rows={plan.incoming}
              showReason
            />
            {plan.staying.length > 0 && (
              <PlanTable
                heading="Already there — staying put"
                fromLabel="In"
                rows={plan.staying}
              />
            )}
            {plan.outgoing.length > 0 && (
              <PlanTable
                heading="Coming out — will be unassigned"
                fromLabel="Was in"
                rows={plan.outgoing}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** One section of the preview. `reason` is the engine's own explanation for a
 *  pick — the selection is meant to be transparent, not magic. */
function PlanTable({
  heading,
  fromLabel,
  rows,
  showReason,
}: {
  heading: string
  fromLabel: string
  rows: Array<AutoFillMove & { reason?: string }>
  showReason?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-2xs tracking-[0.14em] text-muted-foreground">
          {heading.toUpperCase()}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border" />
        <span className="font-mono text-2xs tabular-nums text-muted-foreground">
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <li key={r.watchId} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{r.name}</span>
                {showReason && r.reason && (
                  <span className="block truncate text-2xs text-muted-foreground">
                    {r.reason}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-2xs tracking-[0.06em] text-muted-foreground">
                {fromLabel}
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-xs">
                {r.previousBox ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Where the watches came from.
 *
 * The point of this list is physical: once a box has been filled, the watches
 * it now names are still sitting in whatever drawer they were in before. This
 * says which one, so the box can actually be assembled — and it says which
 * watches were displaced, since those now have no box at all.
 */
function AutoFillList({ record }: { record: BoxConfig["lastAutoFill"] }) {
  if (!record) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Auto-fill watch list — {record.box}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The last auto-fill<Stamp iso={record.at} />. These are the watches now
          assigned to {record.box}, and the box each one was in before — go and
          collect them from there.
        </p>

        <MoveTable
          heading={`Now in ${record.box}`}
          emptyNote="Nothing was assigned."
          fromLabel="Collect from"
          moves={record.moves}
        />

        {record.removed.length > 0 && (
          <MoveTable
            heading="Displaced — now unassigned"
            emptyNote=""
            fromLabel="Was in"
            moves={record.removed}
          />
        )}
      </CardContent>
    </Card>
  )
}

function MoveTable({
  heading,
  emptyNote,
  fromLabel,
  moves,
}: {
  heading: string
  emptyNote: string
  fromLabel: string
  moves: AutoFillMove[]
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-2xs tracking-[0.14em] text-muted-foreground">
          {heading.toUpperCase()}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border" />
        <span className="font-mono text-2xs tabular-nums text-muted-foreground">
          {moves.length}
        </span>
      </div>
      {moves.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyNote}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {moves.map((m) => (
            <li key={m.watchId} className="flex items-center gap-3 px-3 py-2">
              <a
                href={`/watch/${m.watchId}`}
                className="min-w-0 flex-1 truncate text-sm hover:text-brass"
              >
                {m.name}
              </a>
              <span className="shrink-0 font-mono text-2xs tracking-[0.06em] text-muted-foreground">
                {fromLabel}
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-xs">
                {m.previousBox ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * ", 18 Aug 2026, 7:42 PM" — rendered only after mount.
 *
 * The formatting is timezone- and locale-dependent, so producing it during SSR
 * would guarantee a hydration mismatch on any reader whose browser disagrees
 * with the server. Same read-after-mount pattern the light table uses for its
 * relative dates.
 */
/** Never subscribes — the value only ever differs between server and client. */
const noopSubscribe = () => () => {}

function Stamp({ iso }: { iso: string }) {
  // `useSyncExternalStore` is the honest way to say "false on the server, true
  // once hydrated": no effect, no setState, and React does the two-pass render
  // for us. The formatting then stays a pure render.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  if (!mounted) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return (
    <>
      ,{" "}
      {d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}
    </>
  )
}
