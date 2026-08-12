# 00 — The design system, written down

Land this **before** any phase. Copy this file into the repo as `docs/design-system.md`,
then add the condensed rules block at the end into the root `CLAUDE.md`.

Everything here is a decision, not a suggestion. Where the current code disagrees, the
code is wrong. Existing values are preserved wherever the review found them sound —
this is codification, not a repaint.

---

## 1. The accent decision (finding E1)

**Today:** `globals.css` annotates `--brass` as "reserved for prices · never an
interactive accent", and then brass drives the Save button, the Add CTA, required
asterisks, card left-borders, card header washes, the "NEW ENTRY" eyebrow, the Living
Dial active pill, the column-resize hover, dropzone iconography and autofill highlight
rings. Steel-blue `--primary` simultaneously drives nav pills, the hero CTA, focus rings
and the photo-selection ring. Two accents at equal weight = no accent.

**Decision: brass is action and brand. Steel-blue is data. Value/price is neutral mono.**

| Role | Token | Dark value | Used for |
|---|---|---|---|
| Action / brand | `--brass` | `#c9a25e` | primary buttons, active nav item, focus ring, selected states, required-field marks, agent-autofill highlight rings |
| Data / informational | `--primary` (rename mentally to "data blue") | `#6ea2dd` | chart series, links in prose, informational chips, valuation evidence, "tracked" indicators |
| Value / price | none — `--foreground` in mono | `#eef1f5` | purchase price, totals, valuations. Numbers earn attention from weight, alignment and `font-mono`, not hue |
| Positive / negative delta | `--chart-2` / `--destructive` | `#5aa37a` / `#c85046` | gain/loss percentages only |

**Consequences to implement:**

- Remove brass from **decoration**: the `CARD` left-border (`border-l-2 border-l-brass/40`)
  and `CARD_HEADER` (`bg-brass/5`) in `watch-form.tsx`, and the same treatment in
  `add-watch-flow.tsx`, become a neutral `border-border` hairline with no header wash.
  Card identity comes from the icon + title, not a colored edge.
- Replace `text-brass` on prices (`collection-table.tsx` price cell, `gallery-grid.tsx`
  price label, `collection-view.tsx` total) with `text-foreground font-mono tabular-nums`.
  Keep `tabular-nums` everywhere a number column exists.
- Nav pills / active rail items move from `bg-primary text-primary-foreground` to
  brass. Focus rings (`--ring`) move to brass.
- The autofill highlight ring stays brass, but the *unverified reference* warning stays
  amber (`amber-500`) — a warning is not an accent, and that distinction is correct today.
- Delete the `--sidebar-*` token block from `globals.css`. It is unused shadcn default
  scaffolding with zero chroma and it will silently mismatch the new nav rail.

**Update the comments in `globals.css`** so the file no longer states the old rule.
The comment lying to the next reader is how E1 happened.

## 2. Type scale (finding E3)

Six steps. No other font sizes in the app. Add to `@theme inline` in `globals.css`:

```css
--text-2xs: 0.6875rem;  /* 11px — eyebrows, table headers, badge text, mono meta */
--text-xs:  0.8125rem;  /* 13px — mono data, secondary metadata, helper text */
--text-sm:  0.9375rem;  /* 15px — body, form labels, table cell text */
--text-md:  1.1875rem;  /* 19px — card titles, section headings */
--text-lg:  1.625rem;   /* 26px — page titles (ALL of them) */
--text-xl:  2.375rem;   /* 38px — the one hero/marketing size */
```

Rules:

- **Every page `h1` is 26px.** Today they range from `text-lg` (Collection, Config,
  Reports) through `text-2xl` (watch) to 34px (Add). One size, `font-display`,
  `font-semibold`, `tracking-tight`.
- **Fraunces (`font-display`) only at ≥19px.** It currently appears at 15.5px in table
  brand cells and 16px in gallery tiles — move those to the sans at 15px medium.
  A display serif in dense data adds noise, and it is the reason the table reads busy.
- **JetBrains Mono locked to 11px and 13px.** Nothing smaller. The current 9.5px and
  10.5px mono chips are below the readability floor and below AA contrast when combined
  with muted color.
- **Minimum text size anywhere: 11px, and 11px only for uppercase mono labels.**
  Body/metadata floor is 13px.
- Delete every arbitrary literal: `text-[9.5px]`, `[10.5px]`, `[11px]`, `[12.5px]`,
  `[13.5px]`, `[14.5px]`, `[15.5px]`, `[19px]`, `[23px]`, `[34px]`.
  `grep -rn "text-\[" src/` finds them all.

## 3. Radii (finding E4)

Three values. Replace the derived `--radius-*` scale:

```css
--radius-control: 0.5rem;   /* 8px  — inputs, buttons, selects, chips, small tiles */
--radius-card:    0.875rem; /* 14px — cards, panels, photo tiles, dialogs */
--radius-pill:    9999px;   /* toggles, badges, status pills */
```

Delete `rounded-[13px]`, `rounded-[11px]`, `rounded-[10px]`, `rounded-[7px]`,
`rounded-[5px]`, and the `rounded-2xl`/`rounded-3xl`/`rounded-4xl` usages.
`grep -rn "rounded-\[" src/` finds them.

Exception: `watch-hero.tsx` and the display-box/dial components model physical objects
(lugs, spring bars, crowns, cushions) — their geometry is illustration, not UI chrome,
and their literal radii stay.

## 4. Surfaces and borders — light mode IS supported (finding C2)

**Decided (see `DECISIONS.md` §1): both themes are first-class.** Every hardcoded surface
literal must therefore become a token. The offenders:
`FIELD = "bg-[#1b212a] border-white/12 …"` and `[color-scheme:dark]` on date inputs
(`watch-form.tsx`), `bg-white/[0.04]` (nav pill container), `bg-white/[0.06]`
(gallery type chip), `bg-white/[0.02]`/`bg-white/[0.03]` (add-flow dropzone and file
row), the tile background `radial-gradient(...#222a33,#12161c)`, and the table's
zebra `oklch(...)` literals. Map them to `--input`, `--card`, `--muted`, `--secondary`,
`--accent`, `--border`.

Keep the theme toggle, keep `next-themes`, keep `defaultTheme="dark"`. **Verify every
screen in light mode** before closing C2 and at every phase exit. `--brass` is
deliberately darker in light mode (`oklch(0.52 0.07 75)`) — leave that difference alone.

**No new hex literals for surfaces, borders, or text.** Tokens only. The physical-object
components (`watch-hero`, `display-box-home`, `watch-dial`) keep their material gradients.

## 5. Text hierarchy (finding E5)

`--muted-foreground` (`#8c95a0`) currently carries nearly all text in tables, tiles and
the hero caption, frequently with an extra `/70` or `/80` opacity on top.

- **One primary value per surface** at full `--foreground`: brand + model in a table row;
  brand in a gallery tile; brand + model in the hero caption.
- **Never stack opacity on `--muted-foreground`.** No `text-muted-foreground/70`.
  If a third level is genuinely needed, add one token (`--subtle-foreground`) and use it.
- Contrast floor: **4.5:1 for anything under 19px** against its actual surface
  (`--card` = `#161b21`, not `--background`). `#8c95a0` on `#161b21` passes; the
  `/70` variants do not.

## 6. Icons (finding E2)

**lucide-react only.** It's already a dependency and already used (`LayoutGrid`,
`Table`, `Moon`, `Sun`, `Plus`, `Maximize2`).

- Nav / inline: 16px. Card headers and section eyebrows: 18px. Stroke default.
- `currentColor` always; `aria-hidden="true"` on every decorative icon.
- Remove all emoji from navigation (`📋🏷️〰️📅📊🧭💰📸📦⚙️ℹ️`), card titles
  (`🏷️⚙️📂`), subsection eyebrows (`⏱️🔩✨`), empty states (`⌚`), Quick Capture's
  shutter (`📷`), success states (`✅`), and the `▣` box / `◷` wear / `$$` price-check
  markers. `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/` finds them.
- **Two deliberate exceptions:** `✨` on the AI spec-autofill button (an established
  convention for AI actions, and the review endorses keeping it), and `⚠` in the
  unverified-reference warning pill.
- Empty states use `CaliberShelfMark` (already a component) or a lucide outline glyph
  at 32px in `--muted-foreground`, never a 5xl emoji.

Suggested nav mapping: Collection `List`, Brands `Tag`, Straps `Minus`/`Link2`,
Wear Log `CalendarDays`, Reports `BarChart3`, Guides `Compass`, Deals `BadgeDollarSign`,
Inspiration `Images`, Photo Lab `Camera`, Batch Import `PackagePlus`, Config `Settings`,
About `Info`.

## 7. Motion

- Transitions: 150ms for color/background, 200ms for transform, `ease-out`. The current
  200–300ms hover scales on tiles are fine; standardise on these two durations.
- **`prefers-reduced-motion: reduce` must disable:** the hero's auto-advance interval,
  the 60s brass ring sweep, the caption cross-fade, and tile hover scale — not just
  `.dial-sunburst` as today (finding D4).
- No animation on data changes in tables or reports.

## 8. Photography display rules (findings B6, D2)

The app is a photography tool; image treatment is a design-system concern.

- **`object-contain` on a neutral field** for any surface where the photo is the subject:
  the watch view page hero, the photo panel, the lightbox, the Photo Lab review view.
  Never crop a frame the user composed with straightening margin.
- **`object-cover` only in dense grids** (collection tiles, table thumbnails, watch
  pickers) — and there, frame with the stored `dial_focal_x/y/zoom`, which currently
  only the home hero uses.
- Collection tiles move from 1:1 to **4:5 portrait**; wrist and hero shots are taller
  than they are wide.
- Photo tiles get no colored ring for selection — brass 2px border, per §1.

---

## Rules block for root `CLAUDE.md`

Paste this into `CLAUDE.md` under a new `## Design System` heading. It is what keeps
future sessions from re-drifting; full detail lives in `docs/design-system.md`.

```markdown
## Design System — see docs/design-system.md
- **Accent:** brass (`--brass`) = action/brand (buttons, active nav, focus, selection).
  Steel-blue (`--primary`) = data only (charts, links, info chips). Prices and totals are
  `--foreground` + `font-mono tabular-nums` — never colored. Brass is NEVER decoration
  (no colored card borders or header washes).
- **Type:** six steps only — 11 / 13 / 15 / 19 / 26 / 38px. Every page `h1` is 26px.
  `font-display` (Fraunces) only at ≥19px. Mono only at 11px and 13px. Never write an
  arbitrary `text-[Npx]`.
- **Radii:** 8px controls · 14px cards · full pills. Nothing else (physical-object
  illustrations in watch-hero/display-box excepted).
- **Color:** tokens only. No hex or `white/[0.0x]` literals for surfaces, borders, fields
  or text. Never stack opacity on `--muted-foreground`.
- **Icons:** lucide-react only, `currentColor`, `aria-hidden`. No emoji in UI — the two
  exceptions are ✨ (AI autofill) and ⚠ (unverified reference).
- **Images:** `object-contain` where the photo is the subject; `object-cover` only in
  dense grids, framed by `dial_focal_x/y/zoom`.
- **Motion:** 150ms color / 200ms transform, ease-out. `prefers-reduced-motion` must stop
  the hero auto-advance, the ring sweep and hover scales.
- **Text hierarchy:** exactly one full-`--foreground` value per surface; everything else
  `--muted-foreground` at 13px+.
```
