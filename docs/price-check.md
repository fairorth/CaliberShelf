# Price Check — the Market Valuation Agent

CaliberShelf's valuation system researches the current secondary-market value
of selected watches using a Claude AI agent with live web search, stores each
estimate with its full evidence trail, and surfaces the results throughout the
app. It runs automatically once a month via GitHub Actions and can be run
manually at any time. (Built 2026-07-15.)

> Engineers: [price-check.mjs.md](price-check.mjs.md) is a line-by-line
> walkthrough of the agent's source code and the patterns it demonstrates.

## How it works

```
watches.price_check_enabled = true          <- you opt watches in (needs a ref #)
        |
scripts/price-check.mjs                     <- the agent (Claude API + web search)
        |
watch_valuations table                      <- one row per watch per run
        |
Watch page panel · Collection totals · Watch Valuations report
```

Per watch, the agent (model `claude-sonnet-5`) searches and fetches watch-market
sites (eBay sold listings, WatchCharts, Chrono24, auction results, forums —
Japanese sources for JDM independents), prefers **sold** prices over asking,
and returns a strict JSON estimate that is Zod-validated before insert:
low/mid/high value, confidence (high/medium/low), the itemized datapoints it
observed, source URLs, its variant assumption, method notes, and caveats.

## Opting a watch in

On the watch's edit page, tick **"Perform price checking"**. The checkbox is
disabled until the watch has a **reference number** — the agent needs it to
identify the exact variant (metal/dial/size can swing value by thousands).
A database CHECK constraint enforces the same rule.

Tracked watches show a green **$$** in the collection (table, mobile cards,
and gallery). The collection Filters dialog has a **Price Tracking** filter
(All Watches / Tracked Only / Not Tracked); in *Tracked Only* mode the header
adds the total current value and percent gain/loss next to the cost total.

## Running it

### Manually, from the command line

Requires three keys in `.env.local` (never committed):
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard →
Settings → API), `ANTHROPIC_API_KEY` (console.anthropic.com).

```bash
npm run price-check                        # all flagged watches
npm run price-check -- --dry-run           # research + print, no DB write
npm run price-check -- --limit 3           # first N (highest purchase price first)
npm run price-check -- --watch <uuid>      # one watch (uuid is in the edit-page URL)
npm run price-check -- --max-uses 12       # deeper research (default 6 searches + 6 fetches)
```

Flags combine — e.g. a full-depth re-check of one watch:
`npm run price-check -- --watch <uuid> --max-uses 12`

### Manually, from GitHub

**Actions tab → "Monthly price check" → Run workflow.** Optional inputs:
`limit` (max watches) and `max_uses` (research depth). Leave blank for
defaults.

### Automatically

The workflow ([.github/workflows/price-check.yml](../.github/workflows/price-check.yml))
runs on the **1st of every month at 14:00 UTC**. It needs two repository
secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret | Source |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (service_role) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

The Supabase URL is public (it ships in the client bundle) and is set inline
in the workflow.

## Reading the results

- **Watch page → Market Valuation panel**: latest estimate, range, confidence,
  gain/loss vs purchase, expandable *Evidence & sources*, and run history.
- **Reports → Watch Valuations**: runs grouped by date; click a date to see
  every watch valued that day with full evidence and links to each watch.
- **Supabase `watch_valuations` table**: the raw rows, including `datapoints`
  (JSONB) and `sources` for programmatic use.

Expect run-to-run variance: two same-day runs can differ by 10–15% on
thin-market watches. The range and confidence fields exist for exactly this
reason — trend over months is the signal, a single run is a sample.

## Cost management

Observed costs (2026-07): a single watch at the default 6/6 depth on Sonnet 5
uses ~200–400k tokens ≈ **$0.60–1.20**; a 32-watch monthly run ≈ **$25–40**.
Cost levers, in order of impact:

1. **Which watches are flagged** — the `$$` list *is* the budget.
2. **`--max-uses`** — 6 (default) vs 12 roughly doubles tokens; identical mid
   estimates in testing, but more datapoints and higher confidence.
3. **Model** — `MODEL` constant in [scripts/price-check.mjs](../scripts/price-check.mjs).
   `claude-sonnet-5` (current) is ~60% cheaper than `claude-opus-4-8`.
4. **Anthropic spend limit** — console.anthropic.com → Billing → Limits
   (set to $100/month).

Audit trails: per-watch token counts print in every run log
(`[N tokens]` — searchable in the Actions log viewer), exact dollar spend at
console.anthropic.com → Usage, and GitHub runner minutes under the run's
Usage link.

## Customizing the sources (and the prompt)

The watch-market sites the agent consults are configured in **plain English,
not code** — the `Method:` section of `SYSTEM_PROMPT` in
[scripts/price-check.mjs](../scripts/price-check.mjs). There are no per-site
parsers or scrapers: the agent has two generic tools (web search + web fetch)
and reads whatever pages come back the way a human would. Consequences:

- **Adding a site** = adding its name to a sentence. **Removing one** =
  deleting the mention — or better, saying *why* ("ignore X — mostly replica
  listings"), which generalizes to similar sites.
- The list is **guidance, not a boundary**. The agent routinely uses sources
  it finds on its own (EveryWatch, Grailzee, WatchRecon all appeared in runs
  without being named). Site redesigns break nothing.
- If you ever need hard enforcement rather than guidance, the web search tool
  accepts `allowed_domains` / `blocked_domains` parameters where the tools are
  declared in the script — currently unused by design, since the agent's
  freedom to find unanticipated sources is a feature.

### Prompt-engineering tips for this agent

1. **Teach judgment, not just names.** "Check Chrono24" is weak; "Chrono24
   asking prices skew 10–20% high — discount and label them 'asking'" is
   strong. Every source mention ideally carries a how-to-weigh-it clause.
2. **Give reasons, not bare rules.** "eBay best-offer solds display the LIST
   price, not the accepted amount — treat as upper bounds" works better than
   "distrust eBay", because the model can apply the reasoning to new cases.
3. **State goals and constraints, not step-by-step procedures.** Modern models
   do worse when over-scripted. Say what a good valuation looks like (recent,
   sold-biased, variant-exact, outliers excluded) and let the agent decide the
   search order.
4. **Prefer positive instructions.** "Prioritize sold prices" beats a list of
   don'ts. Keep the one hard negative that matters: *never fabricate data
   points* — honest low confidence is the correct failure mode.
5. **Change one thing at a time and benchmark.** Re-run a watch you know well
   (`npm run price-check -- --dry-run --watch <uuid>`) before and after the
   edit. Watch `n_datapoints` and `confidence` as quality signals, not just
   the mid value (which varies ±10% run to run anyway).
6. **Domain-specific guidance goes in the prompt too.** Adding vintage pieces?
   Tell the agent condition, originality, and service history dominate value.
   More Japanese independents? Name the domestic marketplaces and the JPY
   conversion rule (already present).
7. **⚠️ Don't touch the JSON block casually.** The output-format section of
   the system prompt is a three-way contract with the Zod schema in the script
   and the `watch_valuations` columns. Adding or renaming a field means
   updating all three (prompt → schema → migration + insert). Site and method
   edits are safe; contract edits are code changes.

## Database objects

| Object | Migration | Purpose |
|---|---|---|
| `watches.price_check_enabled` | [00021](../supabase/migrations/00021_add_price_check_enabled.sql) | Opt-in flag + CHECK requiring reference_number |
| `watch_valuations` | [00022](../supabase/migrations/00022_create_watch_valuations.sql) | Valuation time series (BIGINT cents, RLS owner-only) |

## Troubleshooting

- **"Missing env vars"** — the script names exactly which keys `.env.local`
  lacks; it never prints values.
- **"Could not find the column … in the schema cache"** — run
  `NOTIFY pgrst, 'reload schema';` in the Supabase SQL Editor after migrations.
- **Checkbox greyed out** — the watch has no reference number; add one first.
- **A watch was skipped in a run** — check its `price_check_enabled` flag;
  `--limit N` also cuts the list after the N highest-priced watches.
- **Low confidence / few datapoints** — thin market or rare variant. Re-run
  that watch with `--max-uses 12` for a higher-evidence estimate.

## Roadmap

- Trend chart in the Market Valuation panel (needs ≥2 monthly runs)
- Tiered cadence (e.g. monthly above $3k, quarterly below) if costs creep
- `app_settings` table so max_uses/cadence become editable in the app UI
- Wish-list deal scanner (eBay Browse API + agent judgment) on this skeleton
