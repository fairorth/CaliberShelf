# 09 — Phase 7: Light Table flair (2a + 2c)

Phase 6 got the structure right. This phase makes it something you want on a
screen all day. Two additions, both layered onto the existing
`src/app/(dashboard)/dashboard/_components/light-table.tsx` — **no rebuild, no
migrations, no new queries.**

Visual spec: `screens/TenTenLoupe Home - Flair Options.dc.html`, options **2a**
and **2c**. Open it in a browser; it uses a real frame lifted from a production
screenshot, so the colour behaviour is honest.

`2b The film edge` is in that file too and is **not in scope** — it warms the
entire ground, which is a design-system decision, not a home-page one.

## The problem being solved

From a production screenshot: a warm, coloured photograph sitting in a cold grey
void. Four specific defects, all addressed here.

| # | Defect | Fix |
|---|---|---|
| F1 | `object-contain` letterboxing leaves dead `--surface-photo` bands around every frame | 2a: bloom field derived from the frame itself |
| F2 | Nothing moves, so a rotation display reads as a static page | 2a: slow drift + cross-fade on advance |
| F3 | The contact-sheet grid empties out whenever a watch has one frame | 2a: unshot angle slots complete the grid as a shot list |
| F4 | Nulls read as failures (`not yet worn`, `0 / 5 angles`), and the page title is set larger than the watch's own name | 2a: invitation copy, and the watch becomes the headline |
| F5 | One layout is trying to be both a working screen and an ambient screen | 2c: glance mode |

---

## Part 1 — 2a: Developed in colour

### 1.1 The bloom field

Inside the frame container (currently `relative aspect-[3/2] w-full
overflow-hidden rounded-lg bg-surface-photo`), behind the sharp `<Image>`, add
two decorative layers:

1. **Bloom** — the same frame, `object-cover`, filling the container, with
   `filter: blur(34px) saturate(1.5)` and `opacity: 0.85`.
2. **Scrim** — `radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.10),
   rgba(0,0,0,0.52))`, so the sharp frame always sits on a darker field than its
   own bloom and the caption stays legible.

Both `aria-hidden` and `pointer-events-none`. The sharp frame keeps
`object-contain` — **F1 is fixed by filling the letterbox, never by cropping the
photograph.** That prohibition is the whole reason Phase 6 exists.

Two engineering notes that matter:

- **Render the bloom from `frame.thumbUrl`, not `frame.url`.** A 34px blur
  destroys all detail, so the full-resolution image buys nothing and costs a
  large-surface GPU filter. Keep `priority` on the sharp frame only — the bloom
  must never compete for LCP.
- Do not put `will-change: filter` on it. A permanently promoted, blurred,
  animating layer is exactly what makes a page like this heat a laptop up over
  an eight-hour day.

**The guardrail.** The derived colour may touch the bloom field and nothing
else — never text, never a border, never a control, never an accent. Brass
remains the only accent colour in the app. Sampling a dominant colour out of the
image to tint UI would re-introduce precisely the accent creep the FIXES rounds
cleaned up. There is no colour extraction in this phase: the bloom *is* the
image, so no palette is computed and no token is added.

### 1.2 Drift and cross-fade

**Drift.** The sharp frame animates `scale(1) → scale(1.07)` with a ~1% pan,
across the full dwell, restarting per watch:

```tsx
style={{ animationDuration: `${dwellSeconds}s` }}
key={frame.url}   // restarts the drift when the frame changes
```

This is the one place a CSS animation is allowed alongside the JS timer, and the
reason is worth stating so it does not look like a violation of Phase 6 §2.3:
the drift is decorative and idempotent — if it drifts slightly out of step with
the dwell, nothing is wrong and nothing lies. **The ring and the advance stay on
the single `TICK_MS` interval**, because the ring is a readout of real elapsed
time and must not be able to disagree with when the frame actually changes.

**Cross-fade.** On advance, fade the new frame in over ~600ms (`opacity 0 → 1`,
keyed on `frame.url`). Do not double-buffer both frames — a single fade-in over
the bloom is enough, and the bloom's own transition covers the change.

Under `prefers-reduced-motion`: no drift, no cross-fade, no bloom drift. The
bloom field itself **stays** — it is colour, not motion.

### 1.3 The watch becomes the headline

Right now `h1 "On the table"` is `font-display text-lg` (26px) and the watch's
name is `font-display text-md` (19px) — the page furniture is bigger than the
subject. Invert it:

- Keep `h1 "On the table"` at `text-lg`, where it is.
- Move the watch identity to the **top of the right column** as an editorial
  block: eyebrow `NOW ON THE TABLE` (mono 2xs, brass), brand at `text-xl`
  (38px), model beneath at `text-md` in display regular, then the existing mono
  spec line.
- The left column's info block keeps the facts, not the name.

Use existing scale steps only — `text-xl` is the top of the six-step scale. No
new sizes.

### 1.4 Nulls become invitations (F4)

Same data, different copy. Owned watches only — wish-list wording is unchanged.

| Field | Now | Becomes |
|---|---|---|
| Acquired | `15 Aug 2024` | `15 Aug 2024 · a year ago` |
| Worn, count 0 | `not yet worn` | `never — give it a day` (brass) |
| Worn, count > 0 | `12 times` | unchanged |
| Coverage, 0 shot | `0 / 5 angles` | `1 OF 5 SHOT` on the rail + the shot-list cells below |

The relative age reuses the existing `now`-after-mount pattern so SSR and
hydration agree; `wornLabel()` already does the day math — extend it for months
and years rather than writing a second formatter.

Only the zero case turns brass. A watch worn twelve times is not a call to
action.

### 1.5 The grid always completes (F3)

The contact-sheet grid currently renders `frames.map(...)`, so a one-frame watch
leaves a two-thirds-empty column. Append one inert cell per **unshot angle
class**, derived from the five 00041 classes minus the angles present on this
watch:

- Shot frames first (unchanged: `object-cover` thumbnails, hover/focus raises
  them, `Enter` opens the Photo Lab).
- Then a dashed-border cell per missing angle with a `plus` glyph and the angle
  name beneath in mono 2xs — `FLAT · HERO · PROFILE · CASEBACK · MACRO`.
- Under the grid, one muted line: *"Four angles still to shoot — the empty cells
  are the shot list, not a hole in the layout."* (count computed, singular
  handled).

Placeholders link to `/photo-lab/session?watch={id}&angle={angle}`, so an empty
cell is a way to start the shot rather than a dead tile. Keep them **out of the
roving-tabindex frame list** — they are not frames, they must not be reachable by
the frame arrow keys, and they must not be raisable into the main view. A
separate tab stop each is correct.

Untagged frames still get no stamp. The five classes remain the only vocabulary.

### 1.6 Dwell for an all-day screen

Add `90` and `120` to `HERO_DWELL_OPTIONS` in `src/lib/preferences.ts`. At 30s
this reads as a slideshow; at two minutes it reads as a gallery.
`DEFAULT_HERO_DWELL_SECONDS` stays 30 — do not change what existing installs
already resolved to.

---

## Part 2 — 2c: Glance mode

The direct answer to "I intend to leave this up all day". After a period with no
input, the chrome leaves and the photograph takes the screen.

### 2.1 Behaviour

- **Enter:** 60s (default) with no user input, and the tab is visible.
- **Exit:** any `pointermove`, `pointerdown`, `keydown`, `wheel`, or `touchstart`
  on the document; also `Escape` explicitly, and `visibilitychange` to hidden
  cancels the pending timer.
- The rotation **keeps running** in glance mode. That is the entire point.

### 2.2 Presentation

A `fixed inset-0 z-50` layer covering the rail and header — the frame needs the
whole viewport, and an overlay is far simpler and more reversible than
negotiating with the shell layout. Fade in over ~500ms.

Contents, and nothing else:

- The bloom field (same construction as 1.1, blur pushed to ~46px), plus a
  slightly stronger radial scrim.
- The sharp frame, `object-contain`, inset from the edges with room for the
  caption bar, still drifting.
- A bottom bar over a `linear-gradient(180deg, transparent, rgba(0,0,0,0.45))`:
  brand at `text-xl` in `--card` white, then one mono line —
  `NJ0180-80X · MIYOTA 8213 · 40MM TITANIUM`.
- Bottom-right: the `NN / NN` counter and the brass ring, still sweeping the
  real dwell.
- Top-left: the mark outline + `LOUPE` at 50% opacity. This is the one screen a
  visitor sees from across the room; it may as well be signed.
- Top-right: a `MOVE TO RETURN` pill, so the state never looks like a freeze.

No controls, no thumbnails, no stats, no rotation menu. All type over the
photograph carries a scrim or a text shadow — the frame underneath can be any
brightness.

### 2.3 The bug to avoid

`paused = hovered || menuOpen`. If the pointer happens to be resting over the
stage when glance mode engages, `hovered` stays true and **the rotation pauses
forever** — the ambient screen would sit on one watch all day and look broken.

While glance mode is active, ignore `hovered`:

```tsx
const paused = (hovered && !glance) || menuOpen
```

Also: the idle timer must be reset only by real input events. Do not reset it
from the rotation's own state changes, or it will never fire.

### 2.4 Preferences

Two new keys in `src/lib/preferences.ts`, same read-after-mount pattern:

```ts
/** Home light table: drop into glance mode when idle. */
export const HOME_GLANCE_ENABLED_KEY = "home-glance-enabled"   // default true
/** Seconds of no input before glance mode engages. */
export const HOME_GLANCE_DELAY_KEY = "home-glance-delay"       // default 60
```

Surface both in Config beside the dwell control: a toggle and a fixed option
list (30 · 60 · 120 · 300 · never). Under `prefers-reduced-motion`, glance mode
still engages and still fades — only the drift is suppressed.

---

## Part 3 — Build order

1. `preferences.ts`: the two glance keys, the extra dwell options.
2. Extract the bloom + sharp frame into one small `FrameField` component inside
   `light-table.tsx` (props: `frame`, `dwellSeconds`, `reducedMotion`,
   `variant: "stage" | "glance"`). Both the stage and the overlay render it, so
   the bloom exists in exactly one place.
3. 2a on the stage: bloom, drift, cross-fade.
4. The editorial title block and the null copy (1.3, 1.4).
5. The completing grid (1.5).
6. Glance mode: idle hook, overlay, the `paused` fix, Config controls.
7. Copy sweep — one line in `light-table.tsx` references
   `09-capture-data`; renumber that reference to `10-capture-data`, since this
   doc takes 09.

## Part 4 — Exit checklist

- [ ] The sharp frame is still `object-contain` everywhere; no crop, no focal
      point, no zoom. A portrait, a square and a landscape frame all sit
      uncropped on a coloured field.
- [ ] No colour is extracted and no token is added; brass is still the only
      accent. The bloom touches no text, border, or control.
- [ ] The bloom renders from `thumbUrl`; `priority` is on the sharp frame only;
      no `will-change` on the blurred layer.
- [ ] The ring and the advance remain on the single `TICK_MS` interval, and the
      ring still reads true after the tab has been in the background.
- [ ] `prefers-reduced-motion`: no drift, no cross-fade, no bloom drift — but
      the bloom field is still there.
- [ ] The watch's brand is the largest type on the screen.
- [ ] A one-frame watch shows a full grid: one thumbnail plus four labelled
      shot-list cells, and the count line agrees.
- [ ] Placeholder cells are not reachable by the frame arrow keys and cannot be
      raised into the main view.
- [ ] `never — give it a day` appears only when `wearCount === 0` on an owned
      watch; wish-list copy is unchanged.
- [ ] Glance mode engages after the configured idle, exits on any input and on
      Escape, keeps rotating, and does **not** stall when the pointer is resting
      on the stage.
- [ ] Glance mode never engages on a hidden tab.
- [ ] All type over a photograph has a scrim or shadow; nothing relies on the
      image being dark.
- [ ] Verified in light mode at lg / md / below md, and left running for an hour
      to confirm the ring, the advance and the memory footprint all hold.
