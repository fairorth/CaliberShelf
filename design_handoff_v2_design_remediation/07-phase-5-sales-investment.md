# 07 — Phase 5: Watches as Investments (price tracking + sales)

Turns TenTenLoupe from an acquisition log into a two-sided ledger: what a watch
cost, what it is worth, what it sold for, and what you actually netted.

Scope was set by the Aug 2026 decision form. Decisions locked:

| Question | Decision |
|---|---|
| Lifecycle | Linear, one status per watch: `owned → candidate → listed → sold` |
| Sold watches | Stay in the collection, dimmed, with a SOLD marker |
| Cost basis | Purchase price **+ acquisition costs** (shipping, tax, duty) captured at buy time |
| Sale ledger | venue fee, processing fee, shipping + insurance, buyer name/handle, payment method, tracking number |
| Valuation upgrades | per-watch trend chart, portfolio value-over-time chart, in-app "check now" |
| Reports | Realized Gains, Annual Summary |
| Nav | new top-level **Market** section |
| Manual values | allowed, logged alongside agent rows and marked as yours (never overrides portfolio totals) |
| Venues at launch | r/WatchExchange, RedBar Austin (Slack) — everything else is `other` |

Explicitly **out of scope** (record them in the roadmap, do not build): value-move
alerts, tiered check cadence, CAGR/annualized return, venue performance report,
auto-suggested candidates, consignment, trades/gifts as exits, multi-currency FX,
relisting history beyond one active listing per watch.

---

## Part 1 — Review of the valuation system as built

### 1a. The agent

`scripts/price-check.mjs`, model `claude-sonnet-5`, two generic tools (web search +
web fetch) and no per-site parsers. Per watch it researches sold-biased comparables,
returns strict JSON (low/mid/high, confidence, datapoints, sources, assumed variant,
method notes, caveats), Zod-validates, inserts one `watch_valuations` row, and appends
to `agent_runs` / `agent_run_items`.

Triggers today:
- **Cron** — `.github/workflows/price-check.yml`, 1st of the month at 14:00 UTC.
- **Actions tab** — `workflow_dispatch` with `limit` / `max_uses`.
- **CLI** — `npm run price-check` with `--dry-run`, `--limit`, `--watch`, `--max-uses`.
- **In the app** — none. This is gap **V6**.

Sources are configured in plain English inside `SYSTEM_PROMPT` (`Method:` section),
which is the right design and should not be turned into code.

### 1b. Storage and display

`watch_valuations` (00022) is a proper time series — owner-scoped RLS, BIGINT cents,
`(watch_id, valued_at DESC)` index, evidence in JSONB. The schema is ahead of the UI:
nothing in the app reads it as a series.

| Surface | Shows | Gap |
|---|---|---|
| Watch page → Market Valuation panel | latest mid, range, confidence, ± vs purchase, evidence disclosure, history as a flat `<ul>` | no chart (**V1**), gain vs purchase price only (**V2**), emerald/rose literals (**V3**), empty state tells you to run npm (**V9**) |
| Collection header | total current value + % gain, **only** in `priceTracking === "tracked"` filter mode | portfolio value is a side effect of a filter, not a place (**V4**) |
| Reports → Watch Valuations | runs grouped by date, drill-down to per-watch evidence | run-centric; no per-watch or portfolio trend (**V1**), no staleness (**V5**) |

### 1c. The opt-in flag

`watches.price_check_enabled` (00021) with a CHECK constraint requiring
`reference_number`, mirrored in Zod, surfaced as a checkbox on the edit form (disabled
without a ref) and as a `$$` marker plus a three-way Price Tracking filter in the
collection. The mechanism is sound and stays. Two gaps: the flag lives buried in a long
form (**V8**), and there is no per-watch **target ask**, so the system can never tell
you the market has crossed your number (**V10**).

### Findings to close in this phase

| # | Finding | Fix |
|---|---|---|
| V1 | Time series rendered as a flat list | Sparkline/trend chart per watch; portfolio chart on Market |
| V2 | Gain computed against purchase price alone | Cost basis = purchase + acquisition costs, used everywhere |
| V3 | `text-emerald-600` / `text-rose-600` literals in `valuation-panel.tsx` | `--chart-2` / `--destructive` tokens (design-system §1) |
| V4 | No portfolio view | `/market` landing owns portfolio value + pipeline |
| V5 | No staleness signal | "as of" + amber `Stale` pill when latest valuation > 90 days |
| V6 | No in-app run | `POST /api/price-check/[watchId]`, button in the panel |
| V7 | Agent is the only writer of value | Manual valuation entry, `source = 'manual'` |
| V8 | Tracking flag buried, no ask price | Tracking + target ask move into a **Market** card on the edit form |
| V9 | Empty states instruct terminal commands | Replace with the in-app action; no `npm run …` in any UI copy |
| V10 | No target ask | `watches.target_ask_cents`, compared to latest mid/high |

---

## Part 2 — Data model

Five migrations. Money is BIGINT cents throughout; every new table is owner-scoped RLS
(`auth.uid() = user_id`) matching `watch_valuations`.

### 00043 — cost basis, lifecycle, ask

```sql
CREATE TYPE public.sale_status AS ENUM ('owned','candidate','listed','sold');

ALTER TABLE public.watches
  ADD COLUMN sale_status public.sale_status NOT NULL DEFAULT 'owned',
  ADD COLUMN candidate_since DATE,
  ADD COLUMN candidate_note TEXT,               -- why it's on the block (≤200 chars)
  ADD COLUMN target_ask_cents BIGINT,
  -- acquisition costs, captured at buy time (decision: cost basis includes these)
  ADD COLUMN acq_shipping_cents BIGINT,
  ADD COLUMN acq_tax_cents BIGINT,
  ADD COLUMN acq_duty_cents BIGINT,
  ADD COLUMN cost_basis_cents BIGINT
    GENERATED ALWAYS AS (
      COALESCE(purchase_price_cents,0) + COALESCE(acq_shipping_cents,0)
      + COALESCE(acq_tax_cents,0) + COALESCE(acq_duty_cents,0)
    ) STORED;
```

`cost_basis_cents` is generated, so no query ever re-derives it and no screen can
disagree with another. Where `purchase_price_cents` is null the basis is 0 and the UI
must show `—` for gain, never `+100%`.

Status transitions are enforced in the server action, not the DB (the app owns the
lifecycle; a CHECK here would block backfills):

```
owned     → candidate | listed
candidate → listed | owned            (owned = "changed my mind")
listed    → sold | candidate | owned  (back = withdrawn, listing row closed)
sold      → owned                      admin-only undo, deletes the sale row
```

### 00044 — listings

```sql
CREATE TYPE public.sale_venue AS ENUM
  ('watchexchange','redbar_austin','ebay','chrono24','forum','local','other');

CREATE TABLE public.watch_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue public.sale_venue NOT NULL,
  venue_other TEXT,                     -- required when venue = 'other'
  listing_url TEXT,
  listed_at DATE NOT NULL,
  ask_price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','sold','withdrawn')),
  closed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The linear model: at most one open listing per watch.
CREATE UNIQUE INDEX watch_listings_one_active
  ON public.watch_listings (watch_id) WHERE status = 'active';
```

The table exists even under the linear decision because it is where **days on market**
and price-drop history live. Relisting later needs no migration — only the UI to show
more than the newest row.

### 00045 — sales

```sql
CREATE TABLE public.watch_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL UNIQUE REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.watch_listings(id) ON DELETE SET NULL,

  sold_at DATE NOT NULL,
  sale_price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  venue public.sale_venue NOT NULL,      -- denormalized: sales outlive listings
  venue_other TEXT,

  buyer_name TEXT,                       -- "Dan K." or "u/handle"
  buyer_handle TEXT,
  payment_method TEXT,                   -- PayPal G&S, Zelle, cash, wire…
  tracking_number TEXT,

  venue_fee_cents BIGINT NOT NULL DEFAULT 0,
  processing_fee_cents BIGINT NOT NULL DEFAULT 0,
  shipping_cost_cents BIGINT NOT NULL DEFAULT 0,
  insurance_cents BIGINT NOT NULL DEFAULT 0,

  net_proceeds_cents BIGINT
    GENERATED ALWAYS AS (
      sale_price_cents - venue_fee_cents - processing_fee_cents
      - shipping_cost_cents - insurance_cents
    ) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`UNIQUE (watch_id)` is the linear decision made physical. **Realized gain** is
`net_proceeds_cents − watches.cost_basis_cents`, computed in
`src/lib/queries/sales.ts` and nowhere else.

### 00046 — manual valuations

```sql
ALTER TABLE public.watch_valuations
  ADD COLUMN source TEXT NOT NULL DEFAULT 'agent'
    CHECK (source IN ('agent','manual')),
  ADD COLUMN entered_note TEXT;          -- "saw one sell at RedBar for 4.2"
```

Rules: manual rows require `value_mid_cents`, `confidence`, and `entered_note`;
`agent_model` stays null; `datapoints`/`sources` may be null. **Portfolio totals and
the trend chart's primary series use agent rows only** — manual rows plot as hollow
markers on the same axis (decision: alongside, not overriding).

### 00047 — sale-status backfill

No-op for existing rows (`DEFAULT 'owned'` covers them), but ship the migration with
the acquisition-cost note: existing watches keep `cost_basis = purchase_price` until
you fill the three new fields. There is no data to invent.

---

## Part 3 — Screens

Mockups: `screens/TenTenLoupe Sales Screens.dc.html` (1440, dark; verify light).

### 3.1 Nav — the Market section

Insert a new group and re-home two items. `Deals` is market-side and moves in;
the imagery tools get their own honest group.

```
COLLECTION   Collection · Brands · Straps
ANALYSIS     Wear Log · Reports · Guides
MARKET       Market · Sold Archive · Deals          ← new group
IMAGERY      Photo Lab · Inspiration · Batch Import
SYSTEM       Config · About
```

Icons (lucide): Market `TrendingUp`, Sold Archive `Archive`, Deals keeps
`BadgeDollarSign`.

### 3.2 `/market` — the landing

Four blocks, top to bottom:

1. **Portfolio strip** — four values in mono tabular: `COST BASIS`,
   `CURRENT VALUE` (sum of latest agent mid for tracked, unsold watches),
   `UNREALIZED` (± and %), `REALIZED` (lifetime net gain from sales). Numbers are
   `--foreground`; only the two deltas take `--chart-2` / `--destructive`.
2. **Portfolio value over time** — line chart, one point per valuation run date,
   cost-basis as a flat reference line beneath. `--primary` (data blue) for value,
   `--border` dashed for basis. Needs ≥2 runs; below that show the strip only and a
   one-line "second run on Sep 1 draws this chart".
3. **Pipeline** — three columns of cards: **Candidates**, **Listed**,
   **Recently sold** (last 90 days). Each card: thumbnail, brand + model, and the one
   number that matters per column (target ask / ask + days on market / net proceeds ±).
   Listed cards show a `DAY 14` mono chip; over 45 days it turns amber.
4. **Attention** — inline list, no card: listings older than 45 days, tracked watches
   with a valuation over 90 days old, sold watches missing fee data.

### 3.3 Watch page — the Market panel

Replaces `valuation-panel.tsx`. One card, `TrendingUp` icon, four zones:

- **Header row** — latest mid in mono 19px, range, confidence pill, and (new) a
  `Stale` amber pill when `valued_at` is > 90 days old.
- **Trend** — 220px-tall line chart of `value_mid_cents` by `valued_at` with a shaded
  low/high band, the cost-basis reference line, and the target ask as a dashed brass
  line. Manual rows render as hollow circles with the note in the tooltip. Under two
  data points, this zone is replaced by the current single-value display.
- **Actions** — `Check price now` (brass, primary), `Log a value` (ghost, opens the
  manual-entry dialog), `Evidence & sources` (disclosure, unchanged).
- **Basis + status** — cost basis broken out (`purchase 3,200 · shipping 40 · tax 264`),
  ± vs basis, and the lifecycle control: `Mark as sale candidate` → `List for sale…` →
  `Record sale…`, one button reflecting the current status, plus a quiet revert link.

`Check price now` posts to `/api/price-check/[watchId]`, which reuses the script's
research function, logs to `agent_runs` with `trigger = 'ui'`, streams a pending state
into the button (spinner + "researching, ~40s"), and revalidates the panel. Rate-limit
one run per watch per hour; disable with a tooltip when `price_check_enabled` is false.

### 3.4 List for sale — dialog

Fields: venue (segmented: r/WatchExchange · RedBar Austin · eBay · Chrono24 · Forum ·
Local · Other), listing URL, listed date (defaults today), ask price. The ask field
shows helper text comparing it to the latest estimate — "latest mid $4,150 · your ask
is 8% above" — computed live. Saving writes a `watch_listings` row, sets
`sale_status = 'listed'`, and copies the ask into `target_ask_cents` if that is empty.

### 3.5 Record sale — dialog

Two columns. Left: sold date, sale price, buyer name, buyer handle, payment method,
tracking number, notes. Right: a **net proceeds ledger** that recomputes as you type —

```
Sale price            4,150.00
Venue fee              −  0.00
Processing (G&S)       −129.15
Shipping               − 28.40
Insurance              − 12.00
─────────────────────────────
Net proceeds          3,980.45
Cost basis            3,504.00
Realized gain         + 476.45   (+13.6%)
```

The gain line is the only colored number in the dialog. Saving writes `watch_sales`,
closes the listing (`status = 'sold'`, `closed_at`), sets `sale_status = 'sold'`, and
clears `price_check_enabled` so the agent stops spending money on a watch you no longer
own. Confirm that side effect in the dialog footer as plain text, not a checkbox.

### 3.6 Collection — sold treatment

Per the decision, sold watches **stay in the collection**:

- Row/tile at 55% opacity, thumbnail desaturated (`filter: grayscale(0.7)`), a mono
  `SOLD` pill in `--muted-foreground` next to the model.
- The price cell shows net proceeds, not purchase price, with the ± beneath.
- Sold rows are excluded from: current-value totals, coverage matrix targets, wear
  suggestions, and price-check runs. They are included in: counts labelled
  "42 watches · 5 sold", search, and all reports.
- New filter in the Filters dialog — **Sale status**: All · Owned only · Candidates ·
  Listed · Sold. Default `Owned only` for the gallery, `All` for the table.
- Sorting by `sale_status` groups sold to the bottom regardless of the active sort.

The watch page for a sold watch is fully intact and read-only for spec fields;
photos, guides and history stay. A brass-free `SOLD 12 Aug 2026 · +476` banner sits
above the hero, linking to the sale record.

### 3.7 `/market/sold` — the archive

A single dense table, one row per sale, sorted newest first: thumbnail, brand + model,
held (days between purchase and sale), venue, sale price, fees total, net proceeds,
realized gain ±. Footer row totals every money column. This is the screen you export
when someone asks what you have sold; it does double duty as the source table for the
Annual Summary.

---

## Part 4 — Reports

Two new cards under **Analysis** on `/reports`, both with a live value line.

### 4.1 Realized Gains — `/reports/realized-gains`

Per-sale P&L, grouped by year, newest first. Columns: sold date, watch, cost basis,
sale price, fees, net proceeds, realized gain (± and %), hold period. Group headers
carry the year subtotal; a top strip carries lifetime totals — sales count, gross,
total fees, net, realized gain, and win rate (`n gains / n sales`). Fees get their own
column because on r/WatchExchange the G&S fee is the difference between a good sale and
a flat one. Row click → the watch page.

### 4.2 Annual Summary — `/reports/annual-summary?year=2026`

The records/tax view. Year selector (segmented, years derived from data). Four sections:

1. **Acquisitions** — watches bought this year, purchase price + acquisition costs,
   total invested.
2. **Sales** — each sale with net proceeds and realized gain; total realized.
3. **Position** — end-of-year cost basis, current value, unrealized gain, count owned.
4. **Fees paid** — by venue, so the year's cost of doing business is one number.

Print-clean: it must survive the browser print dialog on one or two Letter pages —
no card chrome in print, table borders only. Add a "Copy as CSV" button per section;
that is what actually gets used at tax time.

### 4.3 Existing reports to update

- **Collection Summary** — total value becomes cost basis + current value + unrealized;
  counts split owned/sold.
- **Watch Valuations** — add a staleness column and exclude sold watches from new runs.
- **Reports index** — Realized Gains live line: `LIFETIME +$1,240 · 5 SALES`.

---

## Part 5 — Build order and exit checks

1. **00043–00047** + types in `src/lib/types/watch.ts` (`SaleStatus`, `SaleVenue`,
   `WatchListing`, `WatchSale`, `ValuationSource`) + Zod in
   `src/lib/validations/sale.ts`.
2. **Queries** — `src/lib/queries/sales.ts` (pipeline, sold archive, realized gains,
   annual summary) and `portfolio.ts` (basis/value/unrealized series). Every gain
   number comes from these two files.
3. **Actions** — `src/lib/actions/sales.ts`: `markCandidate`, `listForSale`,
   `withdrawListing`, `recordSale`, `undoSale`, `logManualValuation`. Each enforces
   the transition table and revalidates the watch, market and collection paths.
4. **Watch page Market panel** (3.3) + the two dialogs (3.4, 3.5) + edit-form Market
   card (V8, V10).
5. **`/api/price-check/[watchId]`** (V6) — extract the per-watch research call out of
   `price-check.mjs` into `scripts/lib/price-research.mjs` so the route and the CLI
   share one implementation. No duplicated prompt.
6. **`/market` landing** (3.2) and **`/market/sold`** (3.7), nav group (3.1).
7. **Collection sold treatment + Sale status filter** (3.6).
8. **Reports** (4.1, 4.2) and the three updates (4.3).

### Exit checklist

- [ ] Cost basis appears identically on the watch page, market strip, sold archive and
      both reports — one query helper, no re-derivation.
- [ ] A watch with no purchase price shows `—` for every gain figure, never 0 or ∞.
- [ ] `sale_status = 'sold'` removes the watch from price-check runs and from
      current-value totals, and keeps it in search and reports.
- [ ] No `npm run …` copy anywhere in the UI (V9).
- [ ] Gain/loss uses `--chart-2` / `--destructive`; every other number is
      `--foreground` mono tabular (V3, design-system §1).
- [ ] Trend and portfolio charts degrade honestly below two data points.
- [ ] Manual valuations are visibly distinguished and excluded from portfolio totals.
- [ ] Annual Summary prints on Letter without card chrome.
- [ ] Every new screen verified in light mode (DECISIONS §1).
- [ ] Recording a sale is reversible; undo restores status and deletes the sale row.

### Roadmap parked here

Value-move alerts · tiered check cadence · CAGR and hold-period-vs-return scatter ·
venue performance · auto-suggested candidates from value/basis ratio · relisting and
price-drop history · trades and gifts as non-cash exits · consignment · multi-currency.
