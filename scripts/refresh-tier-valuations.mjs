// Static valuations for every untracked watch (v1.10.2, migration 00053).
//
// The valuation agent only prices watches you have switched price tracking on
// for, which left most of the collection with no value at all. Every other
// watch gets one here: its purchase price times the "Value %" of the price
// tier it falls in (Config -> Tiers). No model, no network, $0 — this is
// arithmetic, not research, and the row it writes says so
// (source='tier', run_mode='static', confidence='low').
//
// The same work is available in-app: Config -> Tiers -> "Update static
// valuations", and saving the tiers screen re-derives them automatically. This
// script is the machine-side equivalent — for a backfill, an import, or a
// bulk purchase-price edit done in SQL.
//
// Usage:
//   node scripts/refresh-tier-valuations.mjs --dry-run   # print, write nothing
//   node scripts/refresh-tier-valuations.mjs             # write
//   node scripts/refresh-tier-valuations.mjs --limit 5   # first N watches
//
// Required in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// DUPLICATION WARNING: the band/percentage math below mirrors
// src/lib/tiers.ts (configToBands, tierIndexFor, tierValuation, and the
// eligibility rule in src/lib/actions/tier-valuations.ts). A .mjs script
// cannot import the TS module; the two must be changed together — the same
// standing arrangement watchFolderName() has with sync-watch-folders.mjs.

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
validateArgs(args, { "--dry-run": false, "--limit": true })
const DRY_RUN = args.includes("--dry-run")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity

function validateArgs(argv, known) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a in known) {
      if (known[a]) i++
      continue
    }
    console.error(
      `Unknown argument: "${a}"\nValid flags: ${Object.keys(known).join(", ")}`
    )
    process.exit(1)
  }
}

// ── Env ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  )
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Tier math (mirror of src/lib/tiers.ts) ───────────────────────
const DEFAULT_TIER_CONFIG = [
  { label: "Tier 1", max: 200, valuationPct: 50 },
  { label: "Tier 2", max: 600, valuationPct: 60 },
  { label: "Tier 3", max: 1400, valuationPct: 70 },
  { label: "Tier 4", max: 3500, valuationPct: 75 },
  { label: "Tier 5", max: 7500, valuationPct: 80 },
  { label: "Tier 6", max: null, valuationPct: 85 },
]

function defaultValuationPct(index, count) {
  if (count <= 1) return 85
  return Math.round(50 + (85 - 50) * (index / (count - 1)))
}

function configToBands(config) {
  const bands = []
  let lo = 0
  config.forEach((row, i) => {
    const isLast = i === config.length - 1
    const hi = isLast || row.max == null ? Infinity : row.max
    bands.push({
      lo,
      hi,
      label: (row.label || "").trim() || `Tier ${i + 1}`,
      valuationPct:
        typeof row.valuationPct === "number" && Number.isFinite(row.valuationPct)
          ? row.valuationPct
          : defaultValuationPct(i, config.length),
    })
    lo = Number.isFinite(hi) ? hi : lo
  })
  return bands
}

function bandsForProfile(tierConfig) {
  if (!Array.isArray(tierConfig) || tierConfig.length === 0) {
    return configToBands(DEFAULT_TIER_CONFIG)
  }
  const rows = tierConfig.map((r, i) => ({
    label: typeof r?.label === "string" ? r.label : "",
    max: typeof r?.max === "number" && r.max > 0 ? r.max : null,
    valuationPct:
      typeof r?.valuationPct === "number" && Number.isFinite(r.valuationPct)
        ? r.valuationPct
        : defaultValuationPct(i, tierConfig.length),
  }))
  rows[rows.length - 1] = { ...rows[rows.length - 1], max: null }
  return configToBands(rows)
}

function tierValuation(purchasePriceCents, bands) {
  if (purchasePriceCents == null) return null
  const dollars = purchasePriceCents / 100
  let band = bands[bands.length - 1]
  for (const b of bands) {
    if (dollars < b.hi) {
      band = b
      break
    }
  }
  if (!(band.valuationPct > 0)) return null
  return { cents: Math.round((purchasePriceCents * band.valuationPct) / 100), band }
}

/** Mirror of tierRowFor() in src/lib/actions/tier-valuations.ts. The test is
 *  "has no researched value", NOT "not price-tracked": switching research on
 *  must not blank a watch's value while it waits for the first run. */
function eligible(w, hasResearch) {
  return !w.is_wishlist && w.sale_status !== "sold" && !hasResearch.has(w.id)
}

const money = (cents) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`

// ── Run ──────────────────────────────────────────────────────────
const { data: profiles, error: profileError } = await supabase
  .from("profiles")
  .select("id, tier_config")
if (profileError) {
  console.error("Failed to read profiles:", profileError.message)
  process.exit(1)
}

const { data: watches, error: watchError } = await supabase
  .from("watches")
  .select(
    "id, user_id, model, purchase_price_cents, purchase_currency, price_check_enabled, sale_status, is_wishlist, brand:brands(name)"
  )
if (watchError) {
  console.error("Failed to read watches:", watchError.message)
  process.exit(1)
}

const { data: agentRows, error: agentError } = await supabase
  .from("watch_valuations")
  .select("watch_id")
  .eq("source", "agent")
if (agentError) {
  console.error("Failed to read valuations:", agentError.message)
  process.exit(1)
}
const hasResearch = new Set(agentRows.map((r) => r.watch_id))

const bandsByUser = new Map(
  (profiles ?? []).map((p) => [p.id, bandsForProfile(p.tier_config)])
)

const valuedAt = new Date().toISOString()
const rows = []
let skipped = 0
let notEligible = 0

for (const w of watches ?? []) {
  if (!eligible(w, hasResearch)) {
    notEligible++
    continue
  }
  const bands = bandsByUser.get(w.user_id) ?? configToBands(DEFAULT_TIER_CONFIG)
  const derived = tierValuation(w.purchase_price_cents, bands)
  if (!derived) {
    skipped++
    continue
  }
  rows.push({
    row: {
      watch_id: w.id,
      user_id: w.user_id,
      valued_at: valuedAt,
      value_low_cents: null,
      value_mid_cents: derived.cents,
      value_high_cents: null,
      currency: w.purchase_currency || "USD",
      confidence: "low",
      n_datapoints: null,
      assumed_variant: null,
      datapoints: null,
      sources: null,
      method_notes: `${derived.band.valuationPct}% of the purchase price (${derived.band.label}). Static estimate — no market research. Turn on price tracking for a researched value.`,
      caveats: null,
      agent_model: null,
      source: "tier",
      entered_note: null,
      run_mode: "static",
    },
    name: `${w.brand?.name ?? ""} ${w.model}`.trim(),
    paid: w.purchase_price_cents,
    pct: derived.band.valuationPct,
    tier: derived.band.label,
  })
}

const selected = rows.slice(0, Number.isFinite(LIMIT) ? LIMIT : rows.length)

console.log(
  `\n${watches?.length ?? 0} watches · ${notEligible} researched/sold/wish-list · ` +
    `${skipped} with no purchase price · ${rows.length} to value` +
    (selected.length !== rows.length ? ` (writing ${selected.length}, --limit)` : "")
)
for (const r of selected) {
  console.log(
    `  ${r.name.padEnd(38).slice(0, 38)} ${money(r.paid).padStart(10)} ` +
      `x ${String(r.pct).padStart(3)}%  ->  ${money(r.row.value_mid_cents).padStart(10)}  ${r.tier}`
  )
}
const total = selected.reduce((sum, r) => sum + r.row.value_mid_cents, 0)
const paid = selected.reduce((sum, r) => sum + (r.paid ?? 0), 0)
console.log(
  `\n  Paid ${money(paid)} · static value ${money(total)} ` +
    `(${paid > 0 ? Math.round((total / paid) * 100) : 0}% of cost)`
)

if (DRY_RUN) {
  console.log("\nDry run — nothing written.\n")
  process.exit(0)
}

// Replace, never append: a tier row is derived, so there is exactly one per
// watch and no history (unique partial index in 00053).
const userIds = [...new Set(selected.map((r) => r.row.user_id))]
for (const userId of userIds) {
  const { error } = await supabase
    .from("watch_valuations")
    .delete()
    .eq("user_id", userId)
    .eq("source", "tier")
  if (error) {
    console.error("Failed to clear old tier valuations:", error.message)
    process.exit(1)
  }
}

const { error: insertError } = await supabase
  .from("watch_valuations")
  .insert(selected.map((r) => r.row))
if (insertError) {
  console.error("Failed to write tier valuations:", insertError.message)
  process.exit(1)
}

console.log(`\nWrote ${selected.length} static valuations. Cost: $0.00\n`)
