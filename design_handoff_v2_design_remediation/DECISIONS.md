# Decisions — already made, do not re-open

Every place the review or the phase docs said "ask the user" or "propose before building"
has been decided. Implement these as stated.

---

## 1. Light mode is supported (affects C2, and every sweep in `00-design-system.md` §4)

**Decision: keep light mode.** Both themes are first-class.

Therefore:
- Every hardcoded surface literal becomes a token. Known offenders:
  `FIELD = "bg-[#1b212a] border-white/12 …"` and `[color-scheme:dark]` on date inputs
  (`watch-form.tsx`); `bg-white/[0.04]` (nav pill container), `bg-white/[0.06]` (gallery
  type chip), `bg-white/[0.02]` / `bg-white/[0.03]` (add-flow dropzone and file row); the
  gallery tile background `radial-gradient(circle at 50% 38%, #222a33, #12161c 80%)`; the
  table's zebra `oklch()` literals. Map to `--input`, `--card`, `--muted`, `--secondary`,
  `--accent`, `--border`.
- Keep the theme toggle and `next-themes`. Keep `defaultTheme="dark"`.
- **Verify every screen in light mode** before closing C2 and before each phase's exit
  checklist. Light mode is part of "done", not a follow-up.
- The light palette in `:root` stays as authored (Slate & Ice). `--brass` in light mode is
  `oklch(0.52 0.07 75)` — darker for contrast — and that is correct; do not unify it with
  the dark value.
- Exception, unchanged: the physical-object components (`watch-hero.tsx`,
  `display-box-home.tsx`, `watch-dial.tsx`) keep their literal steel/brass/felt gradients
  in both themes. They model objects, not chrome.

## 2. The watch form keeps a manual Save button (affects C1)

**Decision: no autosave.** Keep the sticky bar with an explicit Save.

Therefore, implement C1 as:
- `beforeunload` guard while dirty.
- **Two-way dirty tracking** — snapshot initial values, compare on change, so reverting an
  edit returns the bar to "All changes saved" and Save disables again.
- Re-snapshot to the saved values after a successful submit, without a remount.
- **Build the in-app navigation guard**, don't skip it: an `UnsavedChangesProvider` in
  `(dashboard)/layout.tsx` that `watch-form` registers with while dirty, consulted by
  `nav-header` (and the new nav rail from A2) before `router.push`. Reuse the existing
  "Unsaved changes / Stay / Discard & Return" `AlertDialog` copy.
- Save stays disabled when the form is clean. That is intended, and safe once dirty is
  two-way.

## 3. Filter persistence (affects B2)

**Decision: do not persist filters across sessions.** Persist view mode, tile size and
sort (preferences); reset filters on mount. Ship the active-filter chip row with
`Clear all` as specified. No "filters restored" notice is needed, because filters no
longer restore.

> **Superseded 2026-08-12 (round 1 review).** "Reset on mount" was implemented
> literally, and a client-side navigation remounts — so leaving the collection to look
> at a watch silently emptied the filters, which reads as a bug rather than a policy.
> The filter set now lives in the query string: it survives navigation within a session,
> is linkable, and is restored by Back, while a bare `/collection` still opens unfiltered
> — which is what "do not persist across sessions" was actually protecting. View mode,
> tile size and sort remain localStorage preferences, unchanged.

## 4. The three new screens are specified, not proposed (affects A1, A2, D1, D3)

**Decision: build to `04-screen-specs.md` and the accompanying mockups directly.** No
proposal step, no plan review. The specs cover the watch view page, the navigation rail at
three breakpoints, and the Photo Lab's Coverage and Review views. The Photo Lab **Session**
view is not mocked — build it in the same shell and idiom as Coverage and Review, per the
description in `03-phase-3-photo-lab.md`.

Refinements will come after the user sees the built screens. Prefer matching the spec over
improving on it; where the spec is silent, follow the nearest precedent in the mockups.

## 5. Quick Capture's route (affects A3, D3)

**Decision: promote it, don't delete it.** `/capture` becomes the Photo Lab's session
capture entry point (watch-first, filmstrip feedback per D3) and appears in the nav under
Photo Lab — not as a top-level item and not as an orphaned URL.

## 6. Status field modelling (affects C3)

**Decision: single Status segmented control** — Owned / Coming soon / Wish list. Keep
`is_coming_soon` and `is_wishlist` as columns; the control guarantees they are never both
true, and the Zod schema enforces it. Price-check stays a separate checkbox with its
"requires a reference number" gate.

## 7. Column visibility default (affects B5)

**Decision: default eight columns** — Photo, Brand, Model, Category, Ref #, Movement Type,
Box, Worn. Nickname, Caliber and Price are opt-in via a `Columns` dropdown persisted to
localStorage. (Price also remains gated by the existing Config → Settings "show cost"
preference.)

## 8. Row interaction: two cells belong to the filter (narrows B5)

**Decision (2026-08-12, round 1 review): the Brand and Category cells filter the
collection; the rest of the row opens the watch.** B5's "one row, one destination" shipped
with filtering demoted to a 16px funnel that only appeared on hover, beside a value that
navigated — so the obvious click did the opposite of what the icon advertised. The whole
cell is now the filter control (a real `<button>`, keyboard-reachable, with a hover tint
marking the hit area); the funnel remains as the affordance. Clicking a value *replaces*
that filter rather than adding to it, and composes with whatever else is active.

Brand — locked 2026-08-12 
Name: TenTenLoupe. Domain tentenloupe.com registered. Replaces CaliberShelf across product, service and repo-facing copy. 10:10 is the canonical watch
display time; a loupe is native to both horology and photography, which is what makes the second half carry the photography side of the system.
Wordmark: lockup 3A. Ten + brass colon + Ten in Fraunces 600, hairline rule beneath, LOUPE in JetBrains Mono 500 at 0.46em tracking, brass, centred. The
colon is the ONLY brass in the wordmark. Horizontal lockup (mark left, type right) is primary; the stacked variant is for card, watermark and print.
Mark: six-blade iris, standard contrast. Brass barrel ring, conic blade facets alternating rgba(201,162,94,0.72) / rgba(201,162,94,0.28) from
30deg, hexagonal aperture opening (polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)) cut to surface colour. Inside: double index at 12,
single indices at 3/6/9, hour hand to 10, longer minute hand to 2, brass pinion.
Small-size rule. Below ~26px the dial indices do not resolve — the small mark keeps blades, hands and pinion only. Above 26px, indices are present.
Single-colour variant. Solid brass blades (#c9a25e / #8a6a2f) for foil, emboss and laser engraving. Do not use the standard two-tone conic for one-colour
reproduction.
Source of truth: screens/TenTenLoupe Wordmarks.dc.html (turn 3).