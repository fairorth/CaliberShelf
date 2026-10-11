# TenTenLoupe on the phone — assessment and redesign

Status: audit 2026-10-11 (at v1.11.1). **The bug list in §2.1 (B1–B6) was
fixed in v1.11.2.** The `/m` web route in §4 was NOT chosen — Marc picked a
native Expo app instead; see `docs/iphone-app.md` (§19 for the plan). §2–§3
remain the reasoning behind what the phone does.

## 1. What the "mobile app" is today

There is no mobile app as such. There is the desktop web app, made to shrink to
a phone, plus a PWA manifest so it can be added to the Home Screen. Specifically:

- `src/app/manifest.ts` — standalone, portrait, `start_url: /dashboard`.
- `public/sw.js` exists, but `ServiceWorkerRegistrar` **unregisters** every
  worker (the old worker dropped POST bodies on iOS). No offline anything.
- Below `md` the rail becomes a hamburger drawer holding all 17 nav items in
  five groups. There is no bottom tab bar.
- One phone-first screen was built: **Quick Capture** (`capture/_components/
  quick-capture.tsx`, watch-first shutter + filmstrip + undo). **It is orphaned**:
  `/capture` now `redirect("/add")`s, so no route renders it, while
  `docs/photo-lab-app.md` §4.4 still describes it as live.

Every phone use case therefore runs through a screen designed for a 1440px
monitor, a keyboard and a mouse.

## 2. Assessment

### 2.1 Bugs that bite on the phone specifically

| # | Problem | Where |
|---|---|---|
| B1 | **"Today" is computed in UTC everywhere in wear logging.** In a US evening "Wore Today" logs *tomorrow*, the Log Wear dialog defaults to tomorrow, and the streak/calendar "today" is off. Evening is exactly when you log from the phone. | `wear-log-actions.ts:101` (server `quickWear`), `add-wear-dialog.tsx:74`, `wear-calendar.tsx:83`, `queries/wear-logs.ts:251`, `queries/keep.ts:57`, `timegrapher-panel.tsx:88` |
| B2 | **Inputs under 16px make iOS zoom on focus**, and the page stays zoomed. Every edit-form field (`FIELD` = 13px), `SearchInput`, and every native `<select>` (wear dialog, wear history, collection filters, Sort box). | `watch-form.tsx:110`, `search-input.tsx:83`, `collection-filters.tsx:335` |
| B3 | Edit form's sticky save bar holds ~420px of non-wrapping content in 358px, and sits under the home indicator (no safe-area padding). Same missing inset on the lightbox, glance overlay and nav drawer. | `watch-form.tsx:1484-1554`, `photo-lightbox.tsx:145`, `nav-header.tsx` drawer |
| B4 | Manifest splash is dark `#0f1318` but the app is light-only → dark flash on every launch. No `themeColor` in the viewport export. | `src/app/manifest.ts:11-12` |
| B5 | Wear-history watch filter only filters the 20 rows already loaded. | `wear-history.tsx:83-85` |
| B6 | Quick Capture orphaned (above). | `capture/page.tsx` |

### 2.2 What it lacks as a phone experience

- **Touch targets.** Default buttons are 32px, `sm` 28px, `xs` 24px; Keep/Maybe/Sell
  in Sort are 28×50px; feel pickers 28px. Apple's floor is 44px. Only the Rate
  screen (40px) comes close.
- **Hover-only and tooltip-only information.** Tile markers (`opacity-0
  group-hover`), photo delete/cover controls, timegrapher delete, replaceability
  meanings, calendar avatar names and the sentimental badge are all invisible on
  touch.
- **No gestures at all.** No swipe in the lightbox, on the dashboard stage, in
  Rate or in Head-to-head. Keyboard legends (`←`/`→`, "Esc", "move the mouse")
  still render on the phone.
- **Picking a watch is the hard part, and it is a text dropdown.** Log Wear
  offers a native `<select>` of ~170 "Brand Model" strings; its "quick select"
  row is just the first six watches in whatever order the query returns. The
  thing you have in front of you is a *watch*, not its name.
- **No identification from a photo.** No route sends an image to a model; spec
  autofill is text + web search only, and it lives only in the full edit form,
  i.e. *after* the watch has been saved. Adding a watch on the phone means
  typing Brand and Model by hand.
- **The collection on the phone** is an unpaged, unvirtualized card list of every
  row with every image; no sort control; Columns/CSV buttons that do nothing to
  the cards; filters in a centered modal of zooming selects.
- **The watch page on the phone** is the desktop page stacked: ~40 facts and four
  control panels in one column, a fixed 460px portrait box that letterboxes
  landscape photos, and the sale controls at the bottom.
- **Head-to-head stacks** the two contenders vertically (`md:grid-cols-2`), so
  the second watch is below the fold — you cannot compare what you cannot see
  together.
- **The home screen is the wrong home.** `start_url` lands on the Light Table, an
  ambient rotating showcase with a 60s-idle glance mode. Beautiful on a desk
  monitor; on the phone it is a screen to get past.
- **No offline tolerance.** Opened with no signal (safe room, basement, a watch
  show hall) the PWA shows a Safari error page; a wear tapped with no signal is
  lost.

What already works: the `/add` flow (7 fields, `h-11 text-base`, camera via
`PhotoDrop capture="environment"`, client downscale) is genuinely phone-shaped,
and the base `Input`/`Textarea` avoid the zoom. Rate is close.

## 3. What the phone is for

The web app has ~45 screens. The test for each: *will Marc do this standing up,
with a watch in one hand and the phone in the other, in under 30 seconds?*

| Job | When it happens | Frequency | Phone? |
|---|---|---|---|
| **Log today's wear + how it felt** | Morning when strapping on, evening when taking off | Daily | **Core.** Feeds The Edit's wear signals, which only ramp in with consistent logging. |
| **"Which one is this?" — find a watch by pointing the camera at it** | At the safe/box, mid-rotation, for wear or rating | Daily | **Core.** The enabling feature for the other two. |
| **Add a watch from the camera** | Unboxing a delivery, at an AD, show or auction preview (wish list) | Weekly | **Core.** Camera is the input; typing is the enemy. |
| **Quick judgement: attachment / keep-maybe-sell** | Holding the watch is the best moment to rate it — that is the whole premise of The Edit | Bursts during the halving | **Core.** |
| **Look a watch up** — where is it stored, what strap, last worn, what I paid / what it is worth | At the box; at a dealer or GTG ("do I already own the blue one?") | Weekly | **Core, read-only.** |
| Shoot extra photos of an owned watch | Natural-light snapshot, a new strap | Occasional | Yes — Quick Capture, restored. |
| Swap the strap | At the box | Occasional | Yes — one picker. |
| Check deals / the wish list | Idle moments | Occasional | Read-only, under More. |
| Read a guide | Couch | Occasional | Read-only link to the existing page. |
| Reports, Market, The Edit ranking, To Sell, Sold archive, valuations, Watch Values | Desk, with a spreadsheet mindset | — | **No.** Analysis wants width. |
| Record/edit a sale, list for sale, price check, config, tiers, boxes, brands, movements, labels CRUD, batch import, full spec edit, timegrapher entry | Desk | — | **No.** (Escape hatch: "Open full site".) |
| Photo Lab coverage / session / review | The PhotoLab workstation, by definition | — | **No** (Review/Accept physically needs the capture machine). |

So the phone app is **five things**: *Wear, Identify, Add, Rate, Look up* — and
Identify is the shared front door to the other four.

## 4. Redesign

### 4.1 Architecture: a separate phone surface, not more breakpoints

Recommendation: a new route group **`src/app/(phone)/m/…`** with its own layout,
reusing the existing queries, server actions, Zod schemas and design tokens.
`manifest.start_url` becomes `/m`. Desktop pages stay exactly as they are and
remain reachable from the phone via **More → Open full site**.

Why not keep retrofitting the responsive pages: every desktop screen is
information-dense on purpose (the Watch Values table, the 35-control edit form).
Making each one *also* a good phone screen doubles the design constraints on
every future feature, and the audit shows that approach has produced a phone
experience that is merely "not broken". A separate surface lets the phone omit
things deliberately — which is the point of this exercise — and keeps
"Say each fact once per screen" achievable on a 390px screen.

Cost of the choice: two UIs over the same data. That is acceptable because the
phone surface is small (five jobs, ~7 screens) and all *logic* — gain math
(`queries/gain.ts`), current value (`valuation.ts`), The Edit ranking, sale
transitions — stays single-sourced. The phone never re-derives anything.

Routing: a phone visiting `/dashboard` (old bookmarks) gets a one-line banner
"Use the phone app →"; no automatic UA redirect (it would trap the "Open full
site" escape hatch).

### 4.2 Shell

- **Bottom tab bar**, 5 slots, 56px + `env(safe-area-inset-bottom)`:
  **Today · Collection · [ ◉ camera ] · Rate · More**. The centre is a raised
  brass shutter button — the Identify/Add front door.
- Slim top bar: page title (26px, per the type scale) + one contextual action.
- Phone-wide rules (enforced in the phone layout's components, not per page):
  44px minimum targets; all fields ≥16px; no hover-only or `title`-only
  information; safe-area padding on every fixed layer; no keyboard hints;
  `prefers-reduced-motion` honoured as on desktop.

### 4.3 The camera button — Identify (new capability)

One tap opens the camera (`<input capture="environment">`; no custom camera UI
needed). The photo goes to a new route `POST /api/identify`:

1. Client downscales to ~1024px (existing `downscaleImage`).
2. Route sends **the photo + a compact text roster of the user's watches**
   (id, brand, model, reference, nickname, dial colour, case material,
   diameter — ~170 rows, ~5k tokens) to a vision-capable Claude model, asking for
   the top 3 roster matches with confidence, *or* "not in collection" plus its
   best guess at brand / model / reference / dial colour.
3. Phone shows a result sheet:
   - **Match** → the watch's cover photo large with two runners-up as thumbnails
     (two blue Speedmasters will happen; a human tap resolves it), and the
     actions **Wore today · Rate · Open · Add photo**.
   - **Not in collection** → "Looks like a *Tudor Black Bay 58, ref 79030B*" →
     **Add to collection** / **Add to wish list**, both pre-filled (§4.5).
4. Logged to `agent_runs` as one row written once at the end (no UPDATE policy —
   see CLAUDE.md), `trigger='ui'`, with cost.

Cost: one image (~1.5k tokens at 1024px) + roster + short JSON out ≈ **$0.02–0.03
per identify on Sonnet**, cheaper with prompt caching on the roster (it changes
rarely). A daily wear + a handful of rates ≈ $1–2/month. Fallback when the model
is unsure or offline: the photo grid picker (below), which is also always one
tap away.

Not proposed: an on-device embedding index of the cover photos. It would be free
per call but needs a model in the browser and breaks on a watch whose cover is a
studio shot and whose wrist reality is not. Revisit only if the API cost or
latency proves annoying.

### 4.4 Today (the home tab, `start_url`)

The daily-use screen.

- **On the wrist** — today's logged watch(es) as a large card with the feel
  picker inline (Loved / Fine / Meh, 44px). Empty state: a single prompt,
  "What are you wearing?" with the camera button and **Recent** strip.
- **Pick without the camera**: a photo grid ordered by *recency of wear*, then
  frequently worn, then everything else, with search. Never a text `<select>`.
- Yesterday/earlier: a 7-day strip; tap a day to log or fix it (the commonest
  correction is "I forgot yesterday").
- Gentle nudges, at most one at a time: "Never worn: Omega 3888 — wear it this
  week?" (from `neverWorn`) or "3 wears without a feel".
- Writes: `quickWear` / `createWearLog`, `setWearFeel`, `deleteWearLog`.
- **Requires B1 fixed** — the date must be the *device's* local date, sent from
  the client, not derived on the server.

### 4.5 Add (from the camera)

Camera → Identify → **"Not in collection"** → a single short form, pre-filled:

- Photo (already taken — it becomes the cover via `createWatchWithPhoto`).
- Brand / Model / Reference — pre-filled from the vision guess, reference marked
  ⚠ unverified exactly as spec-fetch does today.
- Ownership: Owned · Coming soon · Wish list (one segmented control).
- Category, purchase price (`inputMode="decimal"`), Box.
- Save. Then, in the background, offer "Fill specs ✨" — the existing spec-fetch
  route, which only fills empty fields.

Everything else (measurements, complications, movement, labels) stays on the
desktop edit form. The phone add should take under a minute.

The duplicate guard falls out for free: Identify ran against the roster first,
so "you already own this" appears *before* the add form, not after.

### 4.6 Rate (the Edit, phone edition)

Three modes behind one tab, all writing through `setKeepFields` / `recordFaceoff`:

- **Rate deck** — the existing Rate session as full-bleed cards. Attachment as
  five 44px stops; **swipe right = Keep, left = Sell, up = Maybe** for
  `keep_decision`. Replaceability shown as words, not a tooltip. Same "no prices
  on screen" rule as desktop. Props frozen at mount, as now.
- **Rate this one** — entered from Identify: the same card for the watch in your
  hand. This is the most valuable rating moment and today it doesn't exist.
- **Head-to-head** — two contenders **side by side** (two ~180px squares on one
  screen), tap to pick, "Can't choose" as a real 44px button.

The Edit's ranking, the sliders and To Sell stay on desktop — the phone feeds
the algorithm; it doesn't run the meeting.

### 4.7 Collection (lite) and the watch card

- **List**: search (16px, sticky), chip row: *Owned · Coming · Wish* (same
  default as desktop: wish list hidden until asked), *Category*, *Box*,
  *Keep decision*. Sort: Recently worn · Brand · Least worn. Cards with the
  ~192px `cover_thumb_url`. Paged/virtualized. Filters in the URL, same param
  names as `/collection`, so a link works on both.
- **Watch card** (`/m/watch/[id]`) — one screen, top to bottom:
  1. Photos: swipeable carousel, `object-contain`, natural aspect (no fixed
     460px box), pinch to zoom.
  2. Brand · model · reference, then **one** status line: owned/coming/wish ·
     Box · strap.
  3. Actions row: **Wore today · Rate · Add photo · Strap**.
  4. Wear: last worn, count, feel tally.
  5. Money, one line: paid and current value with `<GainValue>`; hidden behind
     a tap if the show-cost preference is off. (Answering "what's it worth?"
     at a dealer is a genuine phone question; the full Valuation panel is not.)
  6. "More details on the full site →".
- **Add photo** = Quick Capture restored, entered from the card (watch already
  chosen). Fixes B6.
- **Strap** = a sheet listing straps that fit (`width_mm` = `strap_width_mm`
  first), calling `setWatchStrap`.

### 4.8 More

Wish list deals (read) · Guides (links to the existing pages) · Box lookup
(`/reports/box` content, phone layout) · Open full site · Sign out · version.

### 4.9 Offline tolerance (small, not "offline-first")

Re-introduce a service worker that **never touches non-GET requests** (the
original bug) and caches only the phone shell and thumbnails. Wears and ratings
tapped with no signal go into an IndexedDB outbox and replay on reconnect; the
UI shows "1 waiting to sync". Identify and Add simply say "needs a connection".

## 5. Plan

| Phase | Scope | Size |
|---|---|---|
| **M0 — fix what's broken (do regardless)** | B1 local-date wear logging; B2 ≥16px fields on touch; B3 safe-area insets + save-bar wrap; B4 light manifest + `themeColor`; B5 history filter; B6 re-mount Quick Capture. One patch release, benefits the existing responsive pages immediately. | Small |
| **M1 — phone shell + Today + Collection lite + watch card** | `(phone)/m` layout, bottom tabs, `start_url: /m`, photo-grid watch picker, Today, list, card, strap sheet, Add photo. No AI yet. | Medium |
| **M2 — Identify + camera Add** | `/api/identify` (vision, roster prompt, agent_runs logging, cost printout in docs/agents.md), result sheet, pre-filled add, background spec fill. | Medium |
| **M3 — Rate on the phone** | Swipe deck, "rate this one", side-by-side head-to-head. | Small–medium |
| **M4 — offline outbox** | Safe service worker, IndexedDB queue for wear/rate writes. | Small |

M1 is useful on its own (the photo-grid picker alone fixes daily wear logging);
M2 is the step that makes the phone feel like its own app.

## 6. Decisions needed from Marc

1. **Separate `/m` surface vs. keep making desktop pages responsive** —
   recommended: separate (§4.1).
2. **Identify via Claude vision at ~$0.02–0.03 per photo** — acceptable?
3. **Money on the phone** — show paid/value on the watch card (one line), or
   keep the phone price-free like the Rate screen?
4. **Home tab** — Today (recommended) or keep the Light Table as the launch
   screen?
