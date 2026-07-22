# CaliberShelf — Wish List

A running list of design/feature ideas to mull over and prioritize. Not committed work — a menu. Grouped by theme, with a rough impact-vs-effort read and why each fits a *watch* app specifically.

Legend — **Impact**: ★ (nice) → ★★★ (signature). **Effort**: ◷ (small) → ◷◷◷ (large).

---

## 1. Lean into the dial as the app's soul
The Home dial is CaliberShelf's signature. Make it a daily ritual, not just decoration.

- **Watch of the Day + one-tap "Wore this today"** — the "now showing" watch becomes a daily prompt; a single tap on the dial logs a wear to the wear-log without leaving Home.
  - Impact ★★★ · Effort ◷◷ · Ties to: Home dial, wear-log.
- **Lume mode** — tap-and-hold the dial: the scene dims and the indices/hands glow like real lume. Pure horology delight; no functional cost.
  - Impact ★★ · Effort ◷ · Ties to: Home dial.
- **Dial reflects reality** — once real `cover_photo_url` photos + the dial-framing tool are in use, the Home ring shows actual watch photography instead of placeholders.
  - Impact ★★ · Effort ◷ (already enabled by the framing editor).

## 2. Collector intelligence layer (the data is already captured)
Turn stored fields into insight — this is what separates a watch app from generic CRUD.

- **Cost-per-wear** — on each Detail page: `purchase_price ÷ wear count`. The stat collectors obsess over; reframes a grail vs. a safe queen. Gate behind Config → `showCost`.
  - Impact ★★★ · Effort ◷ · Ties to: Detail, wear-log, showCost.
- **Wear heatmap** — a GitHub-style contribution calendar from the wear-log: streaks, "most neglected" (not worn in 90+ days), rotation balance, gentle nudges to wear the forgotten ones.
  - Impact ★★★ · Effort ◷◷ · Ties to: wear-log (calendar).
- **Timegrapher trends** — surface a small sparkline of measured accuracy (s/day) on the Detail spec card so accuracy history lives with the watch.
  - Impact ★★ · Effort ◷◷ · Ties to: timegrapher screen, Detail.
- **Service reminders** — flag watches due for service based on purchase/service date + movement type/age.
  - Impact ★★ · Effort ◷◷ · Ties to: Detail, notifications.

## 3. Genuinely useful collector features
- **Insurance / valuation export** — one click → a clean PDF schedule (photo, brand/model, reference, serial, value, purchase date) for the whole collection or a selection. Collectors *need* this; no consumer app does it well. Plays perfectly to the desktop workflow.
  - Impact ★★★ · Effort ◷◷ · Ties to: Collection, showCost, photos.
- **Compare view** — select 2–3 watches and see specs side-by-side (diameter, lug-to-lug, thickness, water resistance, movement). Invaluable when deciding what to buy or sell.
  - Impact ★★★ · Effort ◷◷ · Ties to: Collection, Detail specs.
- **Wearability strip** — on Detail, a small dimensional silhouette (diameter + lug-to-lug + thickness) so you can eyeball fit at a glance. Size is the #1 buying question.
  - Impact ★★ · Effort ◷ · Ties to: Detail specs.

## 4. Polish that compounds
- **Saved / smart views in Collection** — e.g. "wearable today," "quartz only," "38mm and under," "haven't worn in 90 days." Built on the filters you already have.
  - Impact ★★ · Effort ◷◷ · Ties to: Collection filters.
- **Keyboard-first add/edit on desktop** — Tab/Enter flow, paste-to-fill reference numbers, quick-save shortcuts. Matches the primary (desktop) workflow.
  - Impact ★★ · Effort ◷ · Ties to: Add, Edit.
- **Empty states with personality** — replace blank cards/sections with intentional, on-brand prompts (e.g. an empty dial inviting the first watch).
  - Impact ★ · Effort ◷ · Ties to: everywhere.

---

## Suggested first prototypes (highest impact-to-effort)
1. **Detail, enriched** — cost-per-wear + timegrapher sparkline + wearability strip on one page.
2. **Insurance PDF export** — selection → print-ready valuation schedule.
3. **Wear heatmap** — contribution-style wear calendar with streaks + neglected list.

> When ready, pick any of these and I'll mock them up in the CaliberShelf brass system so you can feel them before committing.
