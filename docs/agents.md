# TenTenLoupe Agent Fleet

Reference for every automated agent/script in the app: what it does, how it
runs, what it costs, and the safety rules around it. For the line-by-line
engineering walkthrough of the valuation agent (the template the others
follow), see [price-check.mjs.md](price-check.mjs.md).

> **Cost accounting notes**
> - Script cost printouts use **list pricing** (Sonnet 5 at $3/$15 per MTok).
>   Through 2026-08-31 Sonnet 5 bills at introductory $2/$10, so actual spend
>   runs ~⅓ below the printed estimate.
> - A **$100/month spend limit** is set in the Anthropic Console as a backstop.
> - Every batch script supports `--dry-run` and rejects unrecognized arguments
>   (a mistyped `dry-run` once executed a live run — since v1.2.36 that
>   hard-fails with a did-you-mean).

## The fleet at a glance

| Agent | Kind | Trigger | Model | Observed cost | Recurring? |
|---|---|---|---|---|---|
| Valuation (`price-check.mjs`) | LLM + web search/fetch | Monthly cron (1st, 14:00 UTC) + manual | Sonnet 5, 6+6 uses | ~$1–1.5/watch (~340k tokens, ~9 min each) | Yes — monthly, flagged watches only |
| Spec autofill (`/api/spec-fetch`) | LLM + web search/fetch | ✨ button on watch form | Sonnet 5, 4+4 uses | ~$0.05–0.15/click (shown in UI) | Per click |
| Store-URL / brand-type sweep (`find-store-urls.mjs`) | LLM + web search | Manual script | Sonnet 5, 3 uses | $0.14/brand ($10.22 for all 73) | One-time; re-runs touch only NULL columns |
| Reference sweep (`find-references.mjs`) | LLM + web search | Manual script | Sonnet 5, 4 uses | **$0.44/watch** ($2.20 for 5) | One-time-ish; ~77 watches remain ≈ $30–35 |
| Deal check (`deal-check.mjs`) | Deterministic (no LLM) | Daily cron (13:00 UTC) + manual | — | **$0** | Yes — daily, free |
| ChronoScout sync (`chronoscout-sync.mjs`) | Deterministic API mirror (no LLM) | Manual, run locally (`npm run chronoscout-sync`) | — | **$0** | Manual/local — GitHub Actions blocked by Cloudflare |
| Photo score (`photo-score.mjs`) | CV triage + shot-card grading | Manual, run locally (`npm run photo-score`) | Haiku 4.5 (cards); `--no-ai` = free | ~$0.0015/frame graded (~7k tokens per 5 frames) | Manual/local — needs the `\WatchImages` capture folders |

The dominant cost driver everywhere is **web searches**: each search feeds
~16k tokens of results into the model, so cost scales almost linearly with
the per-item search cap (`MAX_USES`), not with the number of output fields.

## Run logging & the Agent Execution Review report

Every agent above records each invocation to the `agent_runs` table (migration
00028) — duration, cost (integer microdollars), item counts, tokens/searches,
and a per-item audit trail in `agent_run_items`. Scripts log via the shared
`scripts/lib/agent-run.mjs` helper; the spec-fetch route inserts directly. This
is **best-effort**: logging is fully wrapped so a logging failure (e.g. the
table not yet migrated) never breaks an agent's real work. Set
`AGENT_RUN_TRIGGER=cron` in CI so scheduled runs are labelled, or
`AGENT_RUN_DISABLED=1` to skip logging.

The data surfaces in the **Agent Execution Review** report (`/reports/agents`):
a spend/runs/items KPI row, a per-agent rollup, run history, and a drill-down to
each run's audit trail. `npm run backfill-agent-runs` seeds it from historical
`watch_valuations` runs and the latest ChronoScout sync. Costs are microdollars
because per-item agent costs are fractions of a cent.

---

## 1. Valuation agent — `npm run price-check`

Researches the secondary-market value of every watch with
`price_check_enabled = true` (checkbox on the watch form, requires a
reference number) and inserts a row into `watch_valuations`.

- **Initiate:** runs itself on the 1st of each month via GitHub Actions
  (`price-check.yml`); manual via Actions "Run workflow" (with `limit` /
  `max_uses` inputs) or locally `npm run price-check -- [--dry-run] [--limit N]
  [--watch <uuid>] [--max-uses N]`.
- **Cost:** ~$1–1.5 per watch at 6+6 uses. Currently ~6 flagged watches →
  **roughly $6–9/month**. Cost scales with how many watches you flag.
- **Surfaces:** Market Valuation panel on the watch page, Watch Valuations
  report, `$$` indicators in the collection.
- **Warnings:** run-to-run variance is real (same-day estimates can differ by
  a few percent); Sonnet at 6 uses yields fewer datapoints/lower confidence
  than Opus at 12 — the number is usually similar, the evidence is thinner.
  Full operator guide: [price-check.md](price-check.md).

## 2. Spec autofill agent — ✨ button on the watch form

Single-shot agent: given brand + model (+ reference), finds the official
product page and returns schema-guaranteed spec JSON (structured outputs).
Fills **only empty fields**, highlights what it touched, shows sources +
exact cost in the result panel. Also proposes a **reference number** for an
empty field — always flagged `reference_unverified` (amber badge, "Mark
verified" to clear; a manual edit also clears it).

- **Initiate:** ✨ Auto-fill specs button, watch edit or add form. Needs
  `ANTHROPIC_API_KEY` in the server env (local `.env.local` + Vercel).
- **Cost:** ~$0.05–0.15 per click on Sonnet 5 (exact figure shown after each
  run). `MODEL` constant at the top of `src/app/api/spec-fetch/route.ts` —
  switched from Opus 4.8 on 2026-07-21 (Sonnet is ~40% cheaper at list,
  ~60% under intro pricing); flip back to `claude-opus-4-8` if exact-variant
  disambiguation noticeably suffers.
- **Warnings:** never overwrites your data; on the edit page existing DB
  values are untouched even if the agent disagrees with them.

## 3. Brand enrichment sweep — `npm run find-store-urls`

Fills `brands.store_url` + `brands.brand_type` (major/micro/indie) via web
search, then deterministically verifies whether the store exposes a Shopify
`products.json` feed (what the deal scanner needs). **Fills only NULL
columns** — manual edits are never overwritten.

- **Initiate:** `npm run find-store-urls -- [--dry-run] [--limit N]
  [--brand <substring>]`. Wish-list brands are swept first.
- **Cost:** $0.14/brand observed. The full-fleet sweep is done ($10.22,
  2026-07-19); future runs only cost for newly added brands.
- **Warnings:** sites that bot-block (Cartier, Christopher Ward) show
  "UNREACHABLE" — the stored URL is usually still correct. Low-confidence
  rows are listed at the end for manual review on the Brands page (top-level
  since v1.7.3; formerly Config → Brands).

## 4. Reference sweep — `npm run find-references`

For every watch with **no** reference number, web-searches the
manufacturer's reference for the exact variant (using dial color, diameter,
material, caliber as disambiguators). Writes the reference **plus
`reference_unverified = true`** — every agent-supplied reference must be
human-verified (watch form badge or the "Verify reference" chip in the
Attention Needed report) before downstream agents should trust it.

- **Initiate:** `npm run find-references -- [--dry-run] [--limit N]
  [--watch <uuid>] [--majors-only] [--value-limit N]`. **Always dry-run a
  small `--limit` batch first.** Targets are processed highest-value first;
  `--majors-only` restricts to `brand_type = major`; `--value-limit 3000`
  restricts to watches whose purchase/estimated price is ≥ $3,000 (watches
  with no price recorded are skipped when this flag is set).
- **Cost:** **$0.44/watch observed** — the most expensive per-item agent
  (variant-pinning burns all 4 searches). ~77 watches still lack refs →
  a blind full sweep ≈ **$30–35 list price**. Prefer batches of 10–20,
  majors first.
- **Warnings:** the agent is deliberately prompted to return **null rather
  than guess** — a wrong reference poisons valuations and deal matching.
  Expect nulls for microbrands that don't use references (Vario, Blutezeit);
  those will be re-searched (and re-billed) on every sweep, so hand-resolve
  them instead of re-running. Null reasons have caught real data errors
  (a lug-to-lug entered as case diameter) — read them.

## 5. Deal check — `npm run deal-check` (free)

Deterministic, no LLM: for each wish-list watch whose brand has a
`store_url`, fetches the public Shopify `products.json`, matches the product
by title, and upserts availability + retail price into `wishlist_deals`.
Surfaced on the `/deals` page ("Available now!" badges, retail vs estimated
cost).

- **Initiate:** daily GitHub Actions cron (`deal-check.yml`, 13:00 UTC),
  manual dispatch, or `npm run deal-check -- [--dry-run] [--watch <uuid>]`.
- **Cost:** $0 — this is the proof that not every automation needs a model.
  This page is the decision dashboard; live restock urgency (email/SMS) is
  ChronoScout's *consumer* product, not something its API exposes.
- **Phase B (planned):** gray-market agent for majors (Chrono24/eBay/
  WatchRecon) filling the reserved `best_used_*` columns — will be an LLM
  agent with real per-run cost; not yet built. **Note:** the ChronoScout
  public API (now integrated — see §6) is a *spec catalog only* (no pricing,
  availability, or reference numbers), so it does **not** fill `best_used_*`
  or power restock alerts. Phase B still needs the gray-market LLM agent.

---

## 6. ChronoScout catalog sync — `npm run chronoscout-sync` (free)

Deterministic, no LLM: mirrors ChronoScout's read-only public catalog API
(v1.0) into the local `chronoscout_brands` / `chronoscout_watches` tables so
the app can offer canonical brand/model/spec lookups without calling the API
at runtime. The API is a **spec catalog** — brands (slug, domain, logo,
case-size/movement/style specs, `price_range_usd`) and watch models
(dimensions: diameter, between-lugs, lug-to-lug, thickness, weight). It has
**no pricing per watch, no availability, no reference numbers, no alerts**.

- **Initiate:** run LOCALLY — `npm run chronoscout-sync -- [--dry-run] [--full]
  [--brands-only] [--watches-only] [--limit N]`, or double-click
  `scripts\chronoscout-sync.cmd`. NOT via GitHub Actions: ChronoScout is behind
  Cloudflare, which blocks Actions runner IPs with a "Just a moment..." challenge
  (HTTP 403). The `chronoscout-sync.yml` schedule was removed for this reason;
  the local machine's IP is not blocked.
- **Cost:** $0 — a full pull is ~11 requests (332 brands on 1 page, ~10 pages
  of ~9.3k watches at 1000/page). Rate limit is 60 burst / ~1 req/sec; the
  script throttles to ~1.1s between requests and honors `429`/`Retry-After`.
- **Incremental:** brands carry `modified_at`; watches do not, so after the
  first full pull the script passes `modified_since` (last run's server
  `generated_at`, minus a 6h slack) to both endpoints and trusts the
  server-side filter. State lives in `chronoscout_sync_state` (one row).
- **Auth & licensing:** `CHRONOSCOUT_API_KEY` (Bearer). Responses carry a
  `meta.license` block — this key returns signed `api-terms-of-access` v1.0
  (recorded each run in `chronoscout_sync_state.license`). Terms: display the
  data only within the app, attribution ("Data provided by Chronoscout")
  where practicable, and purge the mirror on access revocation (a single
  `TRUNCATE`). Keep the mirror tables authenticated-read only (no anon).
- **Surfaces:** "🔍 Find in catalog" picker in the watch form's Specifications
  card (`catalog-combobox.tsx` → `searchCatalogWatches` server action) — search
  the mirror, pick a model, and it prefills the five ChronoScout dimensions
  (diameter, lug width, lug-to-lug, thickness, weight) into empty fields only,
  reusing the ✨ fill-empty + highlight path. Free/deterministic; ✨ remains the
  fallback for everything ChronoScout lacks (movement, material, reference).
  Shows "Data provided by Chronoscout" attribution. **Planned next:** brand
  enrichment (domain → `store_url` candidate, logo, price band).

## 7. Photo score — `npm run photo-score`

The photo-scoring agent ([photo-scoring-agent.md](photo-scoring-agent.md)),
Phases 1–2, over each watch's capture folder under the `\WatchImages` parent.

**Layer 1 — CV triage (free, always runs).** Collapses focus-stack bracket
runs to their in-camera composite (30 CR3s → 1 unit, detected via EXIF
timestamp bursts), computes dial-ROI sharpness (Laplacian variance on a
center crop), brightness, glare fraction, and a 64-bit perceptual hash,
clusters near-duplicates (union-find, Hamming ≤ 10).

**Layer 2, Track A — shot cards (Haiku).** Each CV survivor (best-of-dup-group;
stack sources never reach the model) is matched against the `SHOT_CARDS`
constant (overhead_dial, caseback, crown_side, lug_low) and graded
**pass/fail with a named defect** — objective checks, no aesthetic scores.
Output per watch: a **coverage matrix** (each card → sharpest passing keeper)
and a **reshoot list** for cards with no passer. Non-matching frames route to
`shot_card = 'creative'` for the Phase 3 rubric.

Everything upserts to `watch_image_scores` (00040, keyed by content hash —
re-runs only bill/score new frames unless `--force`), and each watch folder
gets a self-contained `_photo-report.html` (coverage matrix on top, cull
suggestions, dup groups, collapsed stack sequences; thumbnails in a
regenerable `_previews/` subfolder, click-through to originals).

- **Initiate:** run LOCALLY — `npm run photo-score -- [--dry-run] [--no-ai]
  [--limit N] [--watch <uuid>] [--force] [--model <id>] [--dir <path>]`, or
  double-click `scripts\photo-score.cmd`. Parent folder: `--dir` >
  `WATCH_IMAGES_DIR` > `profiles.watch_images_path` (Config → Settings).
- **CR3 handling:** sharp can't decode CR3; the script extracts the embedded
  full-resolution JPG (`JpgFromRaw`, verified full-res on the R10 — a
  `PreviewImage` fallback and a resolution warning guard the assumption) via
  `exiftool-vendored`.
- **Cost:** `--no-ai` is $0. Card grading ≈ **$0.0015/frame** on Haiku 4.5
  (~1.4k tokens per frame at ≤1024px, list pricing); a typical session's
  survivors are pennies. Dry-run still calls the model (like price-check) —
  it just writes nothing.
- **Safety:** suggestions only — nothing is ever deleted or uploaded. Stack
  *sources* are never scored or cull-suggested (deliberately soft); sharpness
  comparisons are per-watch relative, so a moody session isn't condemned
  globally. Specular highlights on case edges are treated as technique;
  only dial-obscuring blowouts count as defects.

## Lowering costs: options and trade-offs

| Option | Saves | Trade-off |
|---|---|---|
| **Scope the sweeps** (batches, majors-first, skip no-ref microbrands) | Biggest lever, often 50%+ of a sweep | None on quality — just narrower coverage per run |
| **Lower `MAX_USES`** (e.g. find-references 4→2) | ~Linear: ≈½ the cost | More nulls / lower confidence on ambiguous variants; easy items unaffected. Two-pass pattern works well: cheap pass first, re-run only the failures with a higher cap |
| **Batch API** for big sweeps | Flat **50%** off tokens | Results are asynchronous (usually <1h, up to 24h): no live progress, script becomes submit-then-collect. Best for one-time sweeps, wrong for the interactive button |
| **Spec autofill on Sonnet** (done 2026-07-21) | ~40–60% cheaper per click than Opus | Slightly weaker exact-variant disambiguation; revert the `MODEL` constant if quality suffers |
| **Reduce valuation cadence/coverage** | Proportional | Fewer datapoints in the value-trend history you're building |
| Prompt caching | — | Not applicable here: each item is a separate small-prefix request below the cacheable minimum |
| Haiku tier | — | Not recommended: research quality drops sharply and the newest web-tool variants aren't supported |

**Standing safety practices:** `--dry-run` with a small `--limit` before any
paid sweep; scripts print token/search/cost totals at the end; unknown CLI
args hard-fail; Console spend limit $100/mo; every agent write is either
gated to empty/NULL fields or flagged for human verification.
