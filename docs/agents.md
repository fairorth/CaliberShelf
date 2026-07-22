# CaliberShelf Agent Fleet

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

The dominant cost driver everywhere is **web searches**: each search feeds
~16k tokens of results into the model, so cost scales almost linearly with
the per-item search cap (`MAX_USES`), not with the number of output fields.

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
  rows are listed at the end for manual review in Config → Brands.

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
  Restock urgency is ChronoScout's job (email/SMS alerts); this page is the
  decision dashboard.
- **Phase B (planned):** gray-market agent for majors (Chrono24/eBay/
  WatchRecon) filling the reserved `best_used_*` columns — will be an LLM
  agent with real per-run cost; not yet built. ChronoScout API integration
  pending (request submitted; awaiting reply).

---

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
