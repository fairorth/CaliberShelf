"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeft, Package, Search, Tag, Watch } from "lucide-react"
import { useUnsavedChanges } from "@/components/unsaved-changes-provider"
import { cn } from "@/lib/utils"
import type { JumpIndex } from "@/lib/queries/jump"

/** How many of each kind survive into the list — enough to choose from, few
 *  enough that the panel never becomes a page of its own. */
const MAX_WATCHES = 7
const MAX_BRANDS = 3
const MAX_BOXES = 3

type JumpKind = "watch" | "brand" | "box" | "search"

interface JumpResult {
  kind: JumpKind
  id: string
  title: string
  detail: string
  href: string
  /** Rendered dimmer — a sold watch, or a box holding nothing. */
  muted: boolean
  /** Relevance against the whole query; higher wins. */
  score: number
  /** What Enter will do, shown on the highlighted row so it never surprises. */
  enterHint: string
}

const KIND_ICON = { watch: Watch, brand: Tag, box: Package, search: Search } as const
const KIND_LABEL = {
  watch: "WATCHES",
  brand: "BRANDS",
  box: "BOXES",
  // The handoff row stands alone under its own rule, with no heading.
  search: "",
} as const

/**
 * Relevance, not just membership.
 *
 * The reported bug: typing a brand name and pressing Enter landed on an
 * arbitrary watch of that brand. The matching was never wrong — the ORDER was.
 * Results were grouped by type with watches always first, and Enter takes the
 * highlighted row, which was always row 0.
 *
 * So every candidate is scored against the whole query, and the best score
 * wins outright. An exact "Rado" beats a watch merely containing "rado";
 * "rado world" stops matching the brand at all and the watch wins on its own
 * merits. Returns 0 for "no match".
 */
function scoreLabel(label: string, query: string): number {
  const hay = label.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 0
  if (hay === q) return 100
  if (hay.startsWith(q)) return 80
  // A later word starting with the query: "Seiko" in "Grand Seiko".
  if (hay.split(/[\s\-/]+/).some((w) => w.startsWith(q))) return 60
  if (hay.includes(q)) return 40
  return 0
}

/**
 * Free-text match, identical in shape to the collection's own `matchesQuery`:
 * whitespace-separated terms are AND-ed, all must appear somewhere in the
 * row's text. Reusing the rule matters — a jump that found different things
 * than the collection's search box would be a second, disagreeing search.
 */
function matchesAllTerms(haystack: string, terms: string[]): boolean {
  const hay = haystack.toLowerCase()
  return terms.every((t) => hay.includes(t))
}

/**
 * A row's final score: how well the QUERY matches its primary label, with a
 * floor for rows that qualified only through a secondary field (a reference
 * number, a box, a nickname). Those are real matches and must still be
 * findable — they just must not outrank a name.
 */
function rowScore(label: string, query: string): number {
  return scoreLabel(label, query) || 20
}

/**
 * The header's jump (Phase 8 §6.1). A field, a result list in place, and Enter
 * straight to `/watch/[id]` — the collection page is never loaded, which is
 * the entire point while that page is slow.
 */
export function JumpSearch({
  index,
  className,
}: {
  index: JumpIndex
  className?: string
}) {
  const router = useRouter()
  const { interceptNavigation } = useUnsavedChanges()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const results = useMemo<JumpResult[]>(() => {
    const raw = query.trim()
    const terms = raw.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return []

    const watches: JumpResult[] = index.watches
      .filter((w) =>
        matchesAllTerms(
          [w.brandName, w.model, w.nickname ?? "", w.referenceNumber ?? "", w.box ?? ""].join(" "),
          terms
        )
      )
      .map((w) => {
        const title = `${w.brandName} ${w.model}`.trim()
        return {
          kind: "watch" as const,
          id: w.id,
          title,
          detail: [w.nickname, w.referenceNumber, w.box].filter(Boolean).join(" · "),
          href: `/watch/${w.id}`,
          // Sold watches stay findable but read as history, the way they do
          // everywhere else in the app.
          muted: w.isSold,
          score: rowScore(title, raw),
          enterHint: "open watch",
        }
      })
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, MAX_WATCHES)

    const brands: JumpResult[] = index.brands
      .filter((b) => matchesAllTerms(b.name, terms))
      .map((b) => ({
        kind: "brand" as const,
        id: b.id,
        title: b.name,
        detail: `${b.count} ${b.count === 1 ? "watch" : "watches"}`,
        href: `/collection?brand=${encodeURIComponent(b.id)}`,
        muted: false,
        score: rowScore(b.name, raw),
        enterHint: "filter collection",
      }))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, MAX_BRANDS)

    const boxes: JumpResult[] = index.boxes
      .filter((b) => matchesAllTerms(`${b.label} ${b.description ?? ""}`, terms))
      .map((b) => ({
        kind: "box" as const,
        id: b.label,
        title: b.label,
        detail: [b.description, `${b.count} ${b.count === 1 ? "watch" : "watches"}`]
          .filter(Boolean)
          .join(" · "),
        href: `/collection?box=${encodeURIComponent(b.label)}`,
        muted: b.count === 0,
        // The description is as much this row's name as the label is —
        // "chinese" should find Box3 when that is what it is called.
        score: Math.max(rowScore(b.label, raw), scoreLabel(b.description ?? "", raw)),
        enterHint: "filter collection",
      }))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, MAX_BOXES)

    // Groups keep their headings, but their ORDER is earned: whichever group
    // holds the single best match leads, so the highlighted first row is
    // always the best answer to what was typed. That is the whole fix — an
    // exact brand name now outranks a watch that merely contains it.
    const groups = [watches, brands, boxes]
      .filter((g) => g.length > 0)
      .sort((a, b) => b[0].score - a[0].score)

    // Always last, always present: the way out to a SET rather than a thing.
    // This is the bridge between the two search bars — when what you want is
    // "all the divers", not one watch, this hands off to the collection's
    // filter, which is the bar that answers that question.
    const handoff: JumpResult = {
      kind: "search",
      id: "search",
      title: `Search the collection for “${raw}”`,
      detail: "",
      href: `/collection?q=${encodeURIComponent(raw)}`,
      muted: false,
      score: -1,
      enterHint: "search collection",
    }

    return [...groups.flat(), handoff]
  }, [query, index])

  // `/` focuses the field from anywhere — except while the user is already
  // typing into something, where a slash is a slash.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement
      const tag = el?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement | null)?.isContentEditable
      ) {
        return
      }
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // A click anywhere else dismisses the panel.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  function go(result: JumpResult | undefined) {
    if (!result) return
    if (!interceptNavigation(result.href)) router.push(result.href)
    setQuery("")
    setOpen(false)
    inputRef.current?.blur()
  }

  const showPanel = open && query.trim().length > 0
  const activeIdx = Math.min(active, Math.max(0, results.length - 1))

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="flex h-[34px] items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:border-brass/60">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && results.length > 0 ? `${listId}-${activeIdx}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((i) => Math.min(results.length - 1, i + 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (e.key === "Enter") {
              e.preventDefault()
              go(results[activeIdx])
            } else if (e.key === "Escape") {
              if (query) setQuery("")
              else inputRef.current?.blur()
              setOpen(false)
            }
          }}
          placeholder="Jump to a watch or brand…"
          aria-label="Jump to a watch, brand or box"
          className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        {/* The shortcut hint doubles as the affordance that there IS one. */}
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-px font-mono text-2xs text-muted-foreground sm:block">
          /
        </kbd>
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Jump results"
          className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[380px] w-[340px] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.26)]"
        >
          {results.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            results.map((r, i) => {
              const Icon = KIND_ICON[r.kind]
              const isFirstOfKind = i === 0 || results[i - 1].kind !== r.kind
              const heading = KIND_LABEL[r.kind]
              return (
                <div key={`${r.kind}-${r.id}`}>
                  {isFirstOfKind && heading && (
                    <div className="px-2.5 pb-1 pt-2 font-mono text-2xs tracking-[0.14em] text-muted-foreground">
                      {heading}
                    </div>
                  )}
                  {/* The handoff row gets a rule instead of a heading — it is
                      not another kind of result, it is the way out. */}
                  {r.kind === "search" && (
                    <div aria-hidden className="my-1.5 h-px bg-border" />
                  )}
                  <button
                    type="button"
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      i === activeIdx && "bg-brass/12"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        i === activeIdx ? "text-brass" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm",
                          r.muted ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {r.title}
                      </span>
                      {r.detail && (
                        <span className="block truncate font-mono text-2xs text-muted-foreground">
                          {r.detail}
                        </span>
                      )}
                    </span>
                    {/* What Enter will do, on the row Enter will act on. The
                        old panel gave no clue, so pressing Enter on a brand
                        name silently opened a watch instead. */}
                    {i === activeIdx && (
                      <span className="ml-1 hidden shrink-0 items-center gap-1 font-mono text-2xs text-brass sm:flex">
                        <CornerDownLeft className="size-3" aria-hidden="true" />
                        {r.enterHint}
                      </span>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
