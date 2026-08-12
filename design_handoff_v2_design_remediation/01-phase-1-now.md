# 01 — Phase 1: defects (a weekend)

Five findings. No restructuring, no new routes, no design-system dependency. Each is
independently shippable and independently revertible. Do these first — two of them are
real data-loss / usability failures, not polish.

---

## C1 — Unsaved work escapes every exit but one  ·  CRITICAL

**Files:** `src/components/watch-form.tsx`

**Current behaviour:** `isDirty` is set by `onInput`/`onChange` on the form and guards
exactly one door — the form's own `Return` button, which opens an
"Unsaved changes" `AlertDialog`. The nav header links, the hamburger menu, the logo,
browser back and a page reload all leave silently. There is no `beforeunload` handler.
Separately, `markDirty()` only ever sets `true`: typing a character and deleting it
leaves "Unsaved changes" glowing permanently, which trains the user to ignore the
indicator the guard depends on.

**Implement:**

1. Add a `beforeunload` guard while dirty:
   ```tsx
   useEffect(() => {
     if (!isDirty) return
     const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
     window.addEventListener("beforeunload", onBeforeUnload)
     return () => window.removeEventListener("beforeunload", onBeforeUnload)
   }, [isDirty])
   ```
2. Make dirty two-way. Snapshot the form's initial values on mount
   (`new FormData(formRef.current)` serialised, or an explicit initial-values object
   built from `watch`), and on each change compare current vs snapshot to set
   `isDirty` accordingly. Clear the snapshot to the saved values after a successful
   submit so the bar returns to "All changes saved" without a remount.
3. **Build the in-app navigation guard.** Next's App Router has no route-change guard,
   so: keep the existing dialog for `Return`, and add an `UnsavedChangesProvider` in
   `(dashboard)/layout.tsx` that `watch-form` registers with while dirty, consulted by
   `nav-header` (and the nav rail from A2) before `router.push`. Reuse the existing
   "Unsaved changes / Stay / Discard & Return" dialog copy.

**No autosave** — decided (`DECISIONS.md` §2). The sticky bar keeps an explicit Save, and
Save stays disabled when the form is clean, which is safe once dirty is two-way.

**Acceptance:** With an edit in progress, a browser reload, a nav click and the `Return`
button all warn. Typing then undoing a character returns the bar to "All changes saved".

---

## F1 — Pinch-zoom is disabled on the phone  ·  HIGH

**Files:** `src/app/layout.tsx`, `src/app/(dashboard)/watch/[id]/_components/photo-lightbox.tsx`

**Current:** the root viewport sets `maximumScale: 1`, blocking pinch-zoom app-wide —
on a photography PWA, and a WCAG 1.4.4 failure.

**Implement:**
1. Delete `maximumScale: 1` from the `viewport` export. Keep `width: "device-width"`,
   `initialScale: 1`, `viewportFit: "cover"`.
2. Verify the PWA still behaves on iOS standalone (`use-standalone.ts` consumers,
   `ios-install-prompt.tsx`) — the safe-area padding in `(dashboard)/layout.tsx` is
   unaffected by zoom.
3. In the lightbox, add double-tap / double-click to toggle 100% zoom, and allow pinch
   inside it. If the lightbox uses a fixed overlay that swallows gestures, set
   `touch-action: pinch-zoom` on the image container.

**Acceptance:** Pinch-zoom works on every screen on iOS and Android. The lightbox
reaches 1:1 pixels on a phone.

---

## B2 — Filters persist invisibly  ·  CRITICAL

**Files:** `src/app/(dashboard)/collection/_components/collection-view.tsx`,
`collection-filters.tsx`

**Current:** filters and sort are written to `localStorage` (`collection-filters`,
`collection-sort`) and restored on mount, but nothing on the page shows what is active —
only the dialog knows. The status/wish-list toggles also change the denominator, so a
filtered view can look like the whole collection. The single hint is `12 of 34`, easily
read as pagination.

**Implement:**

1. **Active-filter chip row** directly under the toolbar, rendered only when at least
   one filter is non-default. One chip per active filter with its value and an `×`
   (lucide `X`) that clears just that filter, plus a trailing `Clear all`. Cover every
   field in `CollectionFilters`: status toggles, wishlist source, brand, movement,
   caliber type, case material, box, complications (one chip each), labels (one chip
   each), categories, price tracking, tier keys. Chips use `--radius-pill`, 13px, the
   muted surface — not brass (they are state, not action).
2. Move the URL-driven category filter into the same chip row so there is one place
   filters live, and drop the separate category `Select` from the toolbar.
3. **Do not persist filters across sessions** (decided — `DECISIONS.md` §3). Persist view
   mode, tile size and sort; reset filters on mount. No "filters restored" notice is
   needed, because filters no longer restore.
4. Reword the count so it can't read as pagination: `Showing 12 of 34 watches`, with
   the cost/value figures split out per B1 (Phase 2) or, for now, kept as-is.

**Acceptance:** With any filter set, the page states which. Reloading with filters
active never shows a bare count with no explanation. `Clear all` returns to the full
collection in one click.

---

## B4 — Zebra striping in the accent hue  ·  HIGH

**Files:** `src/components/collection-table.tsx`

**Current:** rows alternate `oklch(0.78 0.012 245 / 0.05)` with
`oklch(0.6 0.11 233 / 0.12)` — the second is the `--primary` hue family, so half the
table reads as selected/flagged. There is also no row hover state, in an eleven-column
table that demands horizontal tracking.

**Implement:**
1. Remove the blue band. Either a single neutral stripe at ~3–4% white on even rows, or
   no stripe at all plus a `border-b border-border/60` hairline per row. Prefer the
   hairline — it survives the light-mode decision and reads more instrument-like.
2. Add a real hover: row background lift (`hover:bg-accent/40`) plus a 2px brass left
   edge via an inset box-shadow or a `::before`, so the eye can hold the row.
3. Add a genuine selected state (brass 2px left edge + slightly stronger background),
   distinct from hover — this becomes the hook for bulk actions later.

**Acceptance:** No tinted rows at rest. Pointing at a row gives unambiguous feedback.
Hover and selected are visually distinguishable.

---

## D2 — The photo panel fights the photographer  ·  HIGH

**Files:** `src/app/(dashboard)/watch/[id]/_components/photo-gallery.tsx`,
`photo-lightbox.tsx`

**Current, four separate problems:**
- The lightbox opens on `onDoubleClick` — undiscoverable, unreliable on touch, and the
  visible `ZoomButton` exists only in the single-photo branch.
- Actions live in a select-then-act footer that announces state as "Selected: Photo 3".
- The hero tile is `index === 0`, **not** the cover, so the chosen cover can sit as a
  small badged tile while another photo occupies the 2×2 slot.
- Every image is `object-cover` in a square, cropping frames composed with margin.
- No reordering, no captions, no angle labels.

**Implement:**
1. **Single click opens the lightbox.** Remove `onDoubleClick` entirely.
2. **Do the work in the lightbox**, where the pixels are big enough to judge:
   `←`/`→` between frames, `C` set as cover, `X` delete (with the existing
   `AlertDialog`), `Esc` close. Show the shortcuts once as a quiet legend line.
3. **Hero = cover.** Sort/render so the `is_cover` photo occupies the 2×2 slot; drop the
   index-0 rule and the select-then-act footer along with the "Selected: Photo N" text.
4. **Per-tile hover actions** (set cover / delete) as small icon buttons, replacing the
   footer.
5. **`object-contain` on a neutral field** for the hero tile and the lightbox
   (see design-system §8). Small tiles may stay `object-cover`.
6. Optional in this phase, required by Phase 3: drag-reorder (`sort_order` column) and
   an angle tag per photo (`flat` · `hero` · `profile` · `caseback` · `macro`).
   If the DB change is deferred, leave a TODO referencing D1/Phase 3 so the Photo Lab
   picks it up.

**Acceptance:** One click reaches a large photo. Cover and hero are the same photo,
always. Setting a cover and deleting a frame are both possible without leaving the
lightbox. No square crop on any surface where the photo is the subject.

---

## Phase 1 exit checklist

- [ ] `npm run lint && npm run typecheck && npm run build` clean
- [ ] `package.json` version bumped per commit
- [ ] Reload with an in-progress edit → warned (C1)
- [ ] Pinch-zoom works on a phone (F1)
- [ ] Active filters visible and clearable (B2)
- [ ] No blue rows; hover works (B4)
- [ ] One click → lightbox; cover is the hero (D2)
