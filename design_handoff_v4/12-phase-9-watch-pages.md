# 12 — Phase 9: Watch view & edit pages

The review pass on `/watch/[id]` and `/watch/[id]/edit`, plus the retirement of
the dial-framing editor — the last structural piece of the Living Dial still in
the app.

Both pages are otherwise in good shape: the Phase 5 Market panel, the lifecycle
control and the cost-basis breakout all work as specced. Everything below is
correction and coherence, not redesign.

No migrations. Two columns stop being *written* (Part 1) but are **not dropped**
in this phase.

---

## Part 1 — Retire the dial-framing editor

`dial-framing-editor.tsx` and `watches.dial_focal_x/y` + `dial_zoom` exist to aim
a photograph at the centre of a circular home-page dial. That home page is gone.

Phase 6 §3 said keep the tool, retitled to *Thumbnail framing*, because
`gallery-grid.tsx` still consumed the values for square collection tiles. **That
call is reversed.** The reasoning that undid it:

- Its only remaining job is small square tiles, where a centre crop of a composed
  photograph is nearly always fine.
- It is a **per-watch manual setting** — 121 watches of crosshair-nudging for
  tiles the user glances past. Reported as hard to use and unsatisfying.
- Its own preview is still a **circle**, sitting beside copy that says "square
  collection tile". Nobody has maintained it since the rebrand.
- It contradicts the thesis of Phase 8: *the frame fits the photograph*. A manual
  crop tool bends the photograph to fit the frame.
- It is the largest single block in the longest form in the app.

### 1.1 Replace cropping with selection

The real failure case is genuine — a wrist shot with the watch off in a corner
centre-crops to a forearm. The fix is not a crosshair; it is the same rule
Phase 8 §1.2 adopted for the stage, mirrored:

> **For square tiles, use the frame whose aspect is nearest 1:1, then
> centre-crop.** Hero angle breaks ties.

No per-watch input, and it improves on its own as proper angles get shot. Applies
to `gallery-grid.tsx` tiles and the Phase 8 display-case tiles.

When a specific watch still crops badly, the escape hatch is *choose a different
frame for the tile* — which the Photo Lab already does when picking a hero
angle. One concept, two uses, no new UI.

The unrescuable case — a watch whose only photograph is an off-centre wrist shot
— is correctly handled by the home page's shot list nagging for a flat or hero
frame. Do not build a crop tool for it.

### 1.2 How to remove it

- Delete `dial-framing-editor.tsx` and its section from the edit form.
- Stop **writing** `dial_focal_x`, `dial_focal_y`, `dial_zoom`. Leave the columns
  in place and leave existing values untouched.
- **Do not drop the columns in this phase.** If the automatic rule disappoints in
  practice, the data must still be there. Drop them a phase later, after living
  with it.
- Remove the `focal 39%, 64%` / `Zoom 1.35×` readouts with the component (debug
  output that reached production).
- If those columns ever do survive long-term, rename them — `dial_*` is
  vestigial vocabulary for a concept that no longer exists. Not this phase; no
  churn for its own sake.

The photo column of the edit form then becomes **preview + dropzone**, which is
all it needs to be.

---

## Part 2 — Watch view page

### 2.1 `Miyota Miyota 90S5` (bug)

The edit page supplies the root cause: its movement card correctly shows the
caliber `Miyota 90S5` with `Manufacturer Miyota` as a **separate** field. The
view page concatenates manufacturer + caliber where the caliber string already
contains the manufacturer.

Fix in the shared formatter: prepend the manufacturer only when the caliber does
not already begin with it (case-insensitive, trimmed). This is the same
`metaLine()` defect reported on the home page — fix once, in one place.

### 2.2 The hero photo has dead grey bands (defect)

Same defect Phase 8 §2.1 fixes on the home stage, and worse here: there is no
bloom at all, just flat `--surface-photo` grey either side of a portrait frame.

Apply the Phase 8 rule — **fixed height, width follows the photograph's stored
aspect, capped at the column width.** A soft bloom spill is optional here (the
view page is a working surface, not an ambient one); the non-negotiable part is
that the box stops being a fixed aspect the photograph has to sit inside.

`object-contain` still. Always.

### 2.3 Zero is stated three times, three ways

On one screen: header `Worn 0 times`, WEAR card `0 wears`, and beneath it
`Not yet worn · log the first wear`.

Say it **once**, in the Phase 8 invitation voice: `never · give it a day`. The
WEAR card is the right home for it; the header keeps the `Wore Today` action
without a count beneath it.

### 2.4 Empty states must act, not describe

The Market panel reads *"Not tracked. Turn on price checking on the edit form to
start the monthly estimate"* beside a **disabled** `Check price now` button. That
is the shape Phase 5 finding V9 removed — prose telling you where to go instead
of a control that takes you there.

- Replace with an enabled **`Turn on price tracking →`** that navigates to the
  edit form's Market card (deep-link to the section).
- Same for the Timegrapher card's `No runs yet · record one on the edit page` →
  make `Record a run →` the control.
- Rule for this phase: **no empty state names another page in prose.** If the
  action lives elsewhere, the empty state is a link to it.

### 2.5 Coherence with the home page

- **Two photo vocabularies.** Home shows a 3:2 film strip with angle labels; this
  page shows square tiles plus `+ ADD`. Same watch, same data, different
  language. Carry the strip over — the film base, 3:2 frames, angle label beneath
  each, the same filled-before-empty ordering from Phase 8 §1.2. The `+ ADD`
  affordance becomes the shot-list cells, which are more useful because they name
  what is missing.
- **The `COVER` badge is pre-Phase-6 vocabulary.** The concept is the hero
  *angle*. Show the angle name, or nothing.
- **Brand weight.** `San Martin` is bold here; Phase 8 §5 took the brand to
  weight 400 so size alone carries hierarchy. Match it.
- **`SN0144` renders twice** in the header — as the model and again as the
  reference pill. Suppress the pill when model and reference are equal.

### 2.6 The `Status` / `Lifecycle` naming collision

The edit page's `Status` (Owned / Coming soon / Wish list) and the view page's
`Lifecycle` (Owned → Candidate → Listed → Sold) are two different axes both
called status, and both contain a value called "Owned".

Rename the ownership-tier control **`Ownership`** everywhere it appears (edit
form, collection filters, any report label). `Lifecycle` keeps its name — it is
the Phase 5 sale status and the term is already in that spec.

### 2.7 Layout and polish

- **`purchase 317`** under COST BASIS: lowercase, no currency symbol, directly
  beneath `$317.00`. Hide the breakdown entirely unless at least one acquisition
  cost is non-zero. When shown, format it as money: `Purchase $317.00 ·
  Shipping $40.00`.
- **WEAR and TIMEGRAPHER** occupy two of three columns beneath a full-width
  Market panel, leaving a third of the row empty. Either span them across the
  full measure at 1/2 each, or fill the third slot with something real — do not
  leave a hole.
- **Brass on units.** `39 **mm**`, `100 **m**` puts the accent on the least
  meaningful token in the row. Units are muted; brass marks meaning, never
  decoration.
- **Specs row rhythm.** Most rows are one label/value pair, but Diameter/Height
  and Lug width/Water res. pair two per row. Pick one rhythm for the card.

---

## Part 3 — Watch edit page

### 3.1 `Wore Today` does not belong here (hazard)

Logging a wear is a mutation on a different record, inside a form with unsaved
changes and manual save. Clicking it while dirty raises a question with no good
answer: does the edit save, get discarded, or half-persist?

**Remove `Wore Today` and the `Worn 0 times` count from the edit header.** Both
already live on the view page, which is where an action that isn't editing
belongs.

### 3.2 `Auto-fill specs` / `Find in catalog` need a stated overwrite rule (hazard)

Two similar buttons with unclear division of labour, and neither says what
happens to fields already filled. If auto-fill clobbers a diameter the user
measured by hand, they will never press it again.

- Decide and **state** the behaviour: fill blanks only, or preview-then-apply
  showing what will change. Preview is better; blanks-only is acceptable.
- Distinguish the outcomes in the labels — `Look up reference` vs
  `Fill from AI`, not two vague verbs.
- Never overwrite a non-empty field without showing it first.

### 3.3 Split `Identity & Ownership`

The view page splits Specifications and Ownership into separate cards; the edit
page merges identity and money into one. The same data has two shapes depending
on which page you are on.

Split into two cards matching the view page:

- **Identity** — brand, model, nickname, category, reference number, serial
- **Ownership** — purchase date, purchase price, acquisition costs, box,
  ownership tier, notes

### 3.4 Settle the grid

The `Identity & Ownership` card changes rhythm five times top to bottom —
3-column, full-width, 2-column, 3-column, single, segmented, textarea. It reads
as accretion.

- Settle on **2-column**, with deliberate full-width exceptions (notes, the
  acquisition-cost row).
- **`Category` renders about a fifth the width of its row-mates.** A
  `fit-content` select beside a full-width text input in the same row looks
  broken. All controls in a grid row share the cell width.
- **Field width should hint at expected length.** `Serial Number` spans the full
  ~970px for a short alphanumeric code — which invites a paragraph — while
  `Purchase Price` gets half a row for eight characters. Swap the emphasis.

### 3.5 Collapse acquisition costs when zero

Three fields reading `0.00` on every one of 121 watches is a lot of nothing to
scroll past. Render a `+ Add acquisition costs` disclosure, expanded
automatically when any value is non-zero. Keeps the Phase 5 cost-basis feature
without taxing every edit.

### 3.6 Section navigation

Identity, Ownership, Market, Specifications, Movement, Case, Dial, Timegrapher,
Photos — this is the longest form in the app and the user will move through it
often. Add sticky section headers or a jump list in the left column. The
card-per-section structure already implies it; nothing new needs inventing.

### 3.7 Inputs look disabled

Filled inputs render with a grey fill and mono text, which reads read-only —
while `Target ask`, being empty, has a white fill and looks like the only
editable field on the page. That is exactly backwards.

Use the design-system input treatment: `--card` background with a `--border`
hairline, for filled and empty alike. Reserve the grey fill for genuinely
disabled controls.

### 3.8 Two smaller items

- **`Serial Number`'s placeholder is doing help-text duty.** *"Private — only
  visible to you"* vanishes the moment you type, which is precisely when the
  reassurance matters. Make it a persistent help line under the field.
- **`Delete` sits adjacent to `Return` and `Save`.** Separate the destructive
  action — far left in the bar, or behind a menu. Also rename `Return` to
  something that says where it goes (`Back to watch`).

### 3.9 Copy

- `Perform price checking` → **`Track market value`**.
- The `Cover` badge is **blue** on this page and brass-grey on the view page.
  Blue is the accent creep the FIXES rounds removed — this is a regression, not
  a preference. Brass or neutral, and identical on both pages.

---

## Part 4 — Build order

1. Part 2.1 — the `metaLine()` manufacturer fix (one formatter, both pages).
2. Part 1 — retire the framing editor; add the nearest-1:1 tile rule.
3. Part 2.7 + 3.9 — the small copy, colour and formatting corrections.
4. Part 2.3 + 2.4 — single wear phrasing; empty states become links.
5. Part 2.2 — aspect-fit hero photo.
6. Part 2.5 — the film strip on the view page; retire the `COVER` badge.
7. Part 2.6 — the `Ownership` rename, everywhere it appears.
8. Part 3.1 + 3.2 — remove `Wore Today`; the auto-fill overwrite rule.
9. Part 3.3 + 3.4 + 3.5 — card split, grid settle, cost disclosure.
10. Part 3.6 + 3.7 + 3.8 — section nav, input treatment, save bar.

## Part 5 — Exit checklist

- [ ] No string in the app reads `Miyota Miyota` (or any doubled manufacturer);
      verified on both the view page and the home stage.
- [ ] `dial-framing-editor.tsx` is gone; no `focal`/`Zoom` readout remains in any
      UI; `dial_focal_*` and `dial_zoom` are no longer written; **the columns
      still exist and existing values are untouched.**
- [ ] Square tiles pick the nearest-1:1 frame; a watch whose only frame is a
      portrait wrist shot is no worse than before.
- [ ] The hero photo box follows each photograph's aspect; `object-contain`
      everywhere; no flat grey bands.
- [ ] The wear-zero fact appears **once** per screen, in the invitation voice.
- [ ] No empty state names another page in prose; each is a link to the action.
- [ ] The view page's photo row is the same film-strip vocabulary as home, with
      the same filled-before-empty order.
- [ ] `COVER` does not appear; angle names or nothing.
- [ ] Brand is weight 400 on the view page, matching home.
- [ ] The reference pill is suppressed when it duplicates the model.
- [ ] Nothing labelled `Status` refers to the ownership tier; the term is
      `Ownership` in the form, the collection filters and any report label.
- [ ] The cost-basis breakdown is hidden when every acquisition cost is zero, and
      formatted as money when shown.
- [ ] No row of cards leaves an empty column.
- [ ] Units are muted; brass marks meaning only.
- [ ] `Wore Today` and the wear count do not appear on the edit page.
- [ ] Auto-fill never overwrites a non-empty field without showing it first, and
      the two lookup buttons name their outcomes.
- [ ] Identity and Ownership are separate cards on both view and edit.
- [ ] Every control in a grid row shares its cell width; no `fit-content` select
      beside a full-width input.
- [ ] Acquisition costs are collapsed when zero, auto-expanded when not.
- [ ] Filled and empty inputs share one treatment; grey fill means disabled.
- [ ] `Delete` is visually separated from `Save`; the back button says where it
      goes.
- [ ] The `Cover` badge is the same non-blue colour on both pages.
- [ ] Verified in light mode at lg / md / below md.
