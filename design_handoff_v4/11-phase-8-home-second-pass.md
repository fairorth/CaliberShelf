# 11 — Phase 8: Home page, second pass

Phase 6 built the Light Table; Phase 7 added the colour bloom and glance mode.
This phase is the review pass after living with it: a layout reorganization, two
real defects, a new nav surface, one retired skeuomorph, and a clock.

Visual spec: `screens/TenTenLoupe Home - Redesign.dc.html`. It is drawn in the
real 1120px shell using **the user's own photographs**, cropped from production
screenshots — so the bloom, the strip and the display case can all be judged
against real material rather than placeholder tone. Sections `3a` (home), `3b`
(Boxes flyout), `3c` (display case).

Numbered 11 because `10-capture-data` is already referenced from
`light-table.tsx`.

No migrations. No new tables or columns anywhere in this phase.

---

## Part 1 — The layout: one spine, not two columns

**The defect.** The stage is currently two independent columns (frame + info on
the left, contact sheet + stats on the right). Two columns of unequal height can
only agree at the top, so the left column ends early and leaves a large hole —
and on a watch with one frame, the right column is nearly empty while the left
is dense. No amount of padding fixes this; the structure is wrong.

Compounding it: a one-frame watch renders that frame **twice at once** — big, and
as the only thumbnail.

**The fix.** One centred spine, stacked in reading order. Everything is full
content width; nothing sits beside anything else except the small control row.

```
                                        [ROTATION: All Watches ▾]
                                                107 IN ROTATION

┌──────────────────────────────────────────────────────────────┐
│                    THE FRAME  (~470px tall)                  │
└──────────────────────────────────────────────────────────────┘

NOW ON THE TABLE
Vario Futurist                    ⊙ 10/107  ‹ Previous  Next ›  Open watch ↗
AUTOMATIC · MIYOTA 9039 · 39MM · BOX4

THE STRIP ─────────────────────────────────────────────────────
▓ sprockets ▓ [frame][+ FLAT][+ HERO][+ PROFILE][+ CASEBACK][+ MACRO] ▓
Five angles still to shoot — the empty frames are the shot list.

ACQUIRED          WORN            COVERAGE           STORED IN
12 May 2026       never           0 of 5 angles      Box4
3 months ago      give it a day   1 frame kept       Divers & Tools
```

Specific changes:

- **Delete the `On the table` page heading.** The phrase survives as the
  `NOW ON THE TABLE` eyebrow under the frame, where it labels the actual watch
  instead of the page. The top row then holds only the rotation control.
- The rotation control moves to the **top right**, with the count line beneath
  it, right-aligned. The set name is not repeated in that line — the control
  already says it.
- **The strip is the only place thumbnails exist.** The duplicate-image problem
  goes away by construction.
- The facts become **four labelled columns of equal width** — ACQUIRED, WORN,
  COVERAGE, STORED IN — each with a mono value and a muted second line. The
  current three-column row is too narrow for the Phase 7 invitation copy, which
  wraps mid-phrase (`12 May 2026 · 3` / `months ago`).

### 1.1 The strip

Replaces the square contact-sheet grid. Film vocabulary, deliberately scoped:

- A dark base (`oklch(0.28 0.010 245)`) with sprocket edges top and bottom —
  `repeating-linear-gradient` in the **page background colour**, so the holes
  read as punched through.
- Frames are **3:2 landscape**, `object-cover`, in a row, with the shot label in
  mono 2xs directly beneath each one, inside the strip.
- The active frame carries a brass outline, inset (`outline-offset: -2px`) so it
  reads as a selected frame rather than a floating card.
- Horizontal scroll when the frames exceed the row; edge fade, no arrows.

**Scope discipline:** the film vocabulary applies *only inside the strip*. The
page ground stays slate. This is what earns the photo-lab feeling without the
whole-app rewarming that the rejected `2b The film edge` would have forced.

### 1.2 Fixed strip order

Currently: hero angle first, then `sort_order` — so an untagged frame can lead,
and position means nothing from watch to watch.

Change to a **fixed rack with photographs first**. Sort in three bands:

```
1. filled angle slots, in rack order   FLAT · HERO · PROFILE · CASEBACK · MACRO
2. untagged frames, in sort_order      (no placeholder ever, for untagged)
3. empty shot-list cells, in rack order
```

So a watch with HERO and MACRO shot plus one untagged frame reads
`HERO · MACRO · untagged · +FLAT · +PROFILE · +CASEBACK`, and a watch whose only
photograph is untagged leads with that photograph, not with five plus-signs.
A watch with all five shot plus three extras shows eight frames and no empty
cells.

The honest tradeoff: strict rack order would make position mean the same thing
on every watch, which is what the first draft of this section specified. But it
puts empty cells before photographs on a sparsely shot watch — which is what
shipped, and it reads as a to-do list with a photo attached. On a showcase,
photographs outrank positional consistency. Rack order still governs *within*
each band, so the ordering is never arbitrary.

The rotation lands on the **hero** frame when one exists; otherwise the first
frame in band 1, then band 2.

**Frame preference.** When a watch has several frames, prefer the **widest** —
aspect ratio closest to or above the stage's, per Part 2.1. A reclining
three-quarter shot fills the stage; a square dial-on shot cannot. Hero angle
breaks ties.

---

## Part 2 — The frame box, and the bloom

### 2.1 Stop forcing a fixed aspect (defect)

The stage is a fixed 3:2 box with the photograph `object-contain` inside it, so
every frame that is not 3:2 pays the difference in bloom. A real 0.81:1 portrait
frame gets 54% of the width and the bloom takes the other 46% — the loudest
thing on the page is a blur, and the watch is the middle third. The
widest-frame preference in §1.2 helps when a watch has options; it cannot help a
watch that owns exactly one photograph.

**Fix: fix the height, let the width follow the photograph.**

- Stage height stays 470px. Width = `470 × aspect`, **capped at the content
  width** — so a 3:2 or wider frame still fills the page edge to edge and the
  current best case is unchanged.
- Aspect comes from the **stored image dimensions**, so the box is correct on
  first paint with no layout shift. If dimensions are not stored for a photo,
  fall back to the content-width 3:2 box and keep `object-contain`.
- The bloom becomes a soft radial spill extending ~40px past the photo's edges
  at low opacity (~0.55), rather than a field the photo floats in. Same colour,
  same job, roughly a tenth of the area.
- Add a soft drop shadow under the photo (`0 8px 28px -6px rgba(0,0,0,0.28)`) so
  it reads as a print lying on a lit surface.

The photograph stays `object-contain` even though the box now matches its
aspect. The box being right must never become a licence to crop.

See section `4a` of the mock for the side-by-side.

### 2.2 The bloom scrim is inverted on light frames (defect)

§2.1 largely retires this: with no large dark field left to correct, the fix
below drops from necessary to a small opacity adjustment. Implement §2.1 first,
then judge how much of this is still needed.


Phase 7 §1.1 specified a fixed `rgba(0,0,0,0.52)` radial scrim over the bloom.
That was designed against a watch shot on a dark desk. **Most watch photography
is shot on white or neutral seamless** — which blurs to grey, then gets darkened
to charcoal by the fixed scrim. The result is a heavy dark vignette around a
bright photograph: the room darkens the photo instead of the photo lighting the
room. It reads as a hole punched in the page.

**Fix: derive the scrim strength from the frame's own mean luminance.**

- Compute a single mean-luminance value per frame — **one number, not a
  palette.** This does not violate the Phase 7 no-colour-extraction guardrail:
  no hue is sampled, nothing is tinted, brass remains the only accent.
- Map it to scrim opacity, roughly: bright frame (`L > 0.75`) → `0.02–0.13`;
  mid → `0.25`; dark frame (`L < 0.35`) → `0.52`, the current value.
- Cheapest honest implementation: compute it **once at upload/scoring time** and
  store it alongside the existing image score, so the client never decodes
  pixels. If the scoring pipeline can't carry it yet, a client-side 8×8 canvas
  sample of the thumbnail is acceptable as an interim — but never on the
  full-resolution image.

Also from Phase 7, still binding and worth re-checking in the build: the bloom
renders from `thumbUrl`, `priority` stays on the sharp frame only, and there is
no `will-change` on the blurred layer.

**Non-code note for the user's first Photo Lab session:** no frames have been
shot yet through EOS Utility, so there is a one-time opportunity to fix this at
the source — one house background and one light setup, used consistently. The
adaptive scrim copes with variety; a consistent house style makes the bloom
*predictable*, which is what makes an all-day screen feel composed.

---

## Part 3 — The rotation queue cap is truncating the collection (defect)

Phase 6 §1 capped each rotation queue at 60 watches, for query weight. With 107
photographed watches, **47 never appear on the home page** — silently. And the
capped number is what the counter shows, so the header's `107 with frames` and
the counter's `/ 60` contradict each other and neither explains the other.

- **Remove the cap.** Every eligible watch enters the queue.
- The counter reads `10 / 107`.
- The line under the rotation control reads `107 IN ROTATION` — the number that
  matches the counter, and nothing else.

At a 90s dwell, 107 watches is a ~2.7-hour cycle. That is a feature: it gives
the screen depth instead of a loop you memorise. If query weight is a real
concern, select only the columns the stage needs rather than reintroducing a cap.

---

## Part 4 — Vocabulary: stop broadcasting the audit trail

The stage currently shows `1 KEPT · 0 OF 5 SHOT` and
`70 KEPT THIS MONTH · 0 AWAITING REVIEW`. *Kept* is the Photo Lab's
cull-or-keep verb — these describe **decisions the user made**, not watches they
own. On a showcase they read as an audit trail.

- **Remove both from the home page.** The strip header becomes `THE STRIP` and a
  hairline, nothing more.
- Nothing is lost: the strip communicates frame count by being a strip, and the
  line beneath it already says what is missing
  (*"Five angles still to shoot…"*).
- The verb goes too, not just the counters: the COVERAGE column reads
  `1 frame` / `3 frames`, never `1 frame kept`. Nothing on the home page should
  describe a decision the user made about a photograph.
- `70 kept this month` and `awaiting review` belong on the **Photo Lab**, where
  they are actionable. Likewise `14 watches have no photographs` — a to-do
  belongs where you act on it, ideally as a link into a shot queue.

### 4.1 `UNTAGGED` appears three times; make it one

Balloon over the photograph, strip header, and strip cell label. Keep **only the
strip cell label**, muted white — not brass, which made an absence look like an
achievement.

The governing rule (already written in Phase 6, broken somewhere in the build):
**the angle stamp appears only when there is an angle.** A white pill reading
`UNTAGGED` is the loudest available way to announce that there is nothing to
report. Restore the original behaviour — stamp for `HERO`, `MACRO`, etc.;
nothing at all for untagged.

---

## Part 5 — Type: the brand was shouting

`Vario` at 38px/600 against `Futurist` at 19px/400 is a 2:1 size jump *plus* a
weight jump — the brand overwhelms the model, which is the more identifying half.

- Brand: 38px, **weight 400** (was 600).
- Model: **26px** (was 19px), weight 400.

Size alone now carries the hierarchy, which reads like a gallery label rather
than a headline. The watch is still the largest type on the page — the page
heading is gone.

---

## Part 6 — Header: search, and a clock

### 6.1 Search, restored — and promoted to a jump

`nav-header.tsx` deliberately hides the search field on `/dashboard`. Remove that
condition: reaching a watch currently requires a trip to the collection page,
which is also (separately) loading slowly.

But **do not simply restore the old filter box.** A field that navigates to
`/collection?q=…` still pays the slow-page cost — it would be a faster route to
the same wait. Build it as a **jump**:

- 300px field in the header, left-aligned: `Jump to a watch or brand…`, with a
  `/` keyboard-shortcut hint.
- Typing opens a result list in place — watches, then brands, then boxes.
- `Enter` navigates straight to `/watch/[id]`. The collection page is never
  loaded.
- Reuse the existing search query; this is a presentation change plus a shortcut,
  not a new search backend.

### 6.2 A clock

A timekeeping application whose home screen does not tell the time. Add it,
right-aligned before the Add Watch button:

```
TUE 18 AUG   10:10 :34 PM
```

- Date in mono 2xs muted; `10:10` in mono sm at `--foreground`; **seconds
  dropped to 2xs muted**, the way a watch puts running seconds on a subsidiary
  register. The tick is visible without competing with the photograph.
- `font-variant-numeric: tabular-nums` so nothing shifts as digits change.
- One 1s interval, cleared on unmount. Render nothing until after mount (no
  SSR/hydration mismatch on time).

This is the only motion on the page that is **information rather than
decoration** — which is precisely the kind of movement a watch person reads as
alive rather than busy.

**Glance mode promotes it.** In glance mode the time is set large beside the
watch's name in the bottom bar. A screen seen from across a room that shows a
beautiful watch *and* tells you it is 4:15 is useful; one that shows only the
watch is a screensaver.

**Optional, one line, no UI:** nearly every product shot poses the hands at
10:10 — where the brand mark's hands also sit. Once a day the header agrees with
the entire library. A brief acknowledgement at that moment
(`TEN PAST TEN — the whole collection agrees`) is an earned delight. Ship it or
don't; do not build a setting for it.

---

## Part 7 — Boxes, promoted to the nav

Boxes already exist properly in the data (`src/lib/boxes.ts`): `Box1…BoxN`,
count configurable (default 10, max 50), optional per-box descriptions, and
`boxLabel()` formatting `Box3 — Luxury Tier`. A watch's `box` column stores only
the numbered label. They were merely buried in a collection filter and a Config
tab.

Add **Boxes** to the `COLLECTION` nav group, between `Collection` and `Brands`,
icon `package`, with a submenu indicator. The flyout (see `3b`):

```
┌ Display Case ────────────── EVERY BOX, LAID OUT
├──────────────────────────
│ BOXES
│ Box1   Luxury Tier              14
│ Box2   Daily Rotation           22
│ Box3   Fun AliExpress Finds     31
│ …                                 (all configured boxes)
├──────────────────────────
└ Configure boxes →
```

- Counts are live, right-aligned mono, and count **unsold** watches.
- Descriptions come from `boxLabel()`; a box with no description shows the label
  alone.
- A box row navigates to the collection filtered to that box — reusing the
  existing box filter, so no new query.
- Boxes with zero watches still list, muted, at `0`. The list is the user's
  storage map; a missing box is more confusing than an empty one.
- Keyboard-navigable; not hover-only.

---

## Part 8 — The display case, restyled

The current Display Box is a brown wood-grain cabinet with glossy yellow
buttons: the one surface in TenTenLoupe that reads as a 1990s skeuomorph, with
off-palette yellows, brown-on-brown contrast, and the photographs squeezed into
small marketplace-listing cards — directly against the thesis of the last three
phases.

Rebuild it as `3c`:

- One **soft inset tray per box** on `--surface-rail`, `inset 0 1px 3px
  rgba(0,0,0,0.06)`, standard 14px radius. That single shadow is all the
  physicality there is.
- A box header per group: brass mono label, the description in muted sm, a
  hairline fading from brass to `--border`, and the count right-aligned.
- Watches as clean square `object-cover` tiles — the photographs supply all the
  richness.
- Name in sm/medium, spec line in mono 2xs.
- **`Wear now` as a ghost button** that only turns brass on hover. Eleven
  simultaneous brass buttons shout; one on hover does not.
- A filter row at the top: All boxes · Box4 · Box5 …
- Fix the alignment bug visible in production: cards without a box line render
  their button at a different height. Use a consistent grid row structure so
  every button aligns regardless of title wrap or missing metadata.

**This deliberately retires a documented exception.** `00-design-system.md`
§Materials (and `DECISIONS.md`) exempt `display-box-home.tsx` from the
no-material-gradients rule. That exception is withdrawn for this component —
update both documents in the same commit, so the design system and the code do
not disagree.

The `home-stage.tsx` toggle keeps both modes; rename the right-hand label from
`Display Box` to `Display Case` to match the nav.

---

## Part 9 — Glance mode is not discoverable

Reported as a bug: *"sometimes we see a watch full screen and zoomed in… as soon
as I move the pointer it reverts."* That is glance mode working exactly as
designed. It is wired correctly, with a Config toggle and delay list.

It reads as a malfunction because the two timers are unrelated in scale: at a
15s dwell and a 60s glance delay, the watch changes four times and *then* the
screen transforms. Three fixes:

1. **Raise `DEFAULT_HERO_DWELL_SECONDS` to 90.** At 15s an all-day screen is a
   slideshow; at 90s the dwell and the glance delay read as one rhythm. (Phase 7
   added the 90 and 120 options; the default was left at 30.)
2. **Verify the `MOVE TO RETURN` pill actually renders.** The user did not
   mention seeing it, and without it glance mode is indistinguishable from a
   freeze. If it is missing or too subtle, make it unmissable.
3. **First-run explanation.** The first three times glance mode engages, show a
   brief line — *"Glance mode — move the mouse to return. Configurable in
   Config."* Count in `localStorage`; never show it again after that.

---

## Part 10 — Four bugs from production

| Bug | Fix |
|---|---|
| Shot-list label renders `HERO %` | Stray character in the label string |
| Caliber line renders `MIYOTA MIYOTA 9039` | Brand is being concatenated into a caliber that already contains it — de-duplicate in `metaLine()` |
| `12 May 2026 · 3` / `months ago` wraps mid-phrase | Fixed by the four-column facts band (Part 1) |
| `1 KEPT · 0 OF 5 SHOT` beside a visible thumbnail | Removed entirely (Part 4) |

---

## Part 11 — Build order

1. Part 10's four bugs (small, independent, immediately visible).
2. Part 3: remove the queue cap; reconcile the counter and the count line.
3. Part 1: the spine reorganization — heading out, control top-right, four-column
   facts. Layout only, no strip yet.
4. Part 1.1 + 1.2: the strip, with the fixed five-slot order.
5. Part 4 + 4.1 + Part 5: vocabulary removals, single `UNTAGGED`, type changes.
6. Part 2: the luminance-derived scrim (with the score-time computation if the
   pipeline can carry it; interim canvas sample if not).
7. Part 6: header search-as-jump, then the clock.
8. Part 7: Boxes nav flyout.
9. Part 8: display case restyle + the two design-system document updates.
10. Part 9: dwell default, glance pill, first-run line.

## Part 12 — Exit checklist

- [ ] No two-column stage remains; nothing on the home page has a large empty
      region on a watch with one frame.
- [ ] A one-frame watch shows that frame exactly **once**.
- [ ] The strip puts photographs before empty cells: filled angle slots in rack
      order, then untagged frames, then empty shot-list cells in rack order. A
      watch whose only photograph is untagged leads with that photograph.
- [ ] The film vocabulary appears only inside the strip; the page ground is
      unchanged slate.
- [ ] The stage width follows each photograph's aspect, capped at content width;
      a portrait frame is compact and centred, a wide frame fills the page. No
      layout shift on load.
- [ ] The sharp frame is `object-contain` everywhere, including inside the
      aspect-matched box.
- [ ] A white-background frame shows a soft, light spill — not a dark vignette.
      Verify against a bright frame *and* a dark frame.
- [ ] No hue is extracted anywhere; brass is still the only accent.
- [ ] The counter and the rotation count agree, and every photographed watch can
      appear.
- [ ] The words `kept`, `awaiting review` and `audit`-flavoured counts do not
      appear on the home page.
- [ ] `UNTAGGED` appears at most once per screen, in the strip, muted.
- [ ] The angle stamp appears only for tagged frames.
- [ ] The watch brand is 38px/400 and the model 26px/400; the watch is the
      largest type on the page.
- [ ] Header search is present on `/dashboard`, `/` focuses it, and Enter on a
      watch result goes straight to `/watch/[id]` without loading `/collection`.
- [ ] The clock ticks, uses tabular numerals, does not shift layout, renders only
      after mount, and its interval is cleared on unmount.
- [ ] Glance mode shows the time large, still rotates, and does not stall when
      the pointer rests on the stage.
- [ ] Boxes flyout lists every configured box with live counts, including empty
      ones, and is keyboard-reachable.
- [ ] No wood, gloss, or off-palette yellow anywhere in the display case; every
      `Wear now` button aligns across a row.
- [ ] `00-design-system.md` and `DECISIONS.md` no longer exempt
      `display-box-home.tsx` from the materials rule.
- [ ] `prefers-reduced-motion`: no drift, no cross-fade; bloom and clock remain.
- [ ] Verified in light mode at lg / md / below md, and left running an hour.
