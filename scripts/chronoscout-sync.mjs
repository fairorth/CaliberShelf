// ChronoScout catalog mirror sync (deterministic — read from ChronoScout's
// public catalog API, write to our Supabase mirror tables).
//
// The public API (https://chronoscout.co/public-api/v1.0/reference/) is a
// read-only SPEC CATALOG: brands + watch models with dimensions. No pricing,
// availability, reference numbers, or alerts. This script pulls it and upserts
// into chronoscout_brands / chronoscout_watches; the app reads those tables,
// never the API at runtime. See docs/agents.md and migration 00027.
//
// Rate limit: 60 burst, ~1 req/sec. A full pull is ~11 requests (332 brands on
// 1 page, ~9-10 pages of watches at 1000/page), so it stays well under the cap.
//
// Incremental: brands carry modified_at, watches do not, so after the first
// full pull we pass `modified_since` (from the last run's server generated_at,
// minus a slack window) to both endpoints and trust the server-side filter.
//
// Usage:
//   node scripts/chronoscout-sync.mjs                 # incremental (or full if never synced)
//   node scripts/chronoscout-sync.mjs --full          # force a full re-pull
//   node scripts/chronoscout-sync.mjs --dry-run       # fetch + report, no DB writes
//   node scripts/chronoscout-sync.mjs --brands-only
//   node scripts/chronoscout-sync.mjs --watches-only
//   node scripts/chronoscout-sync.mjs --limit N       # cap pages per resource (testing)
//
// Required in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   CHRONOSCOUT_API_KEY

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import crypto from "node:crypto"
import { startRun, finishRun } from "./lib/agent-run.mjs"

loadEnvConfig(process.cwd())

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
validateArgs(args, {
  "--dry-run": false,
  "--full": false,
  "--brands-only": false,
  "--watches-only": false,
  "--limit": true,
})
const DRY_RUN = args.includes("--dry-run")
const FORCE_FULL = args.includes("--full")
const BRANDS_ONLY = args.includes("--brands-only")
const WATCHES_ONLY = args.includes("--watches-only")
const PAGE_LIMIT = args.includes("--limit")
  ? Math.max(1, parseInt(args[args.indexOf("--limit") + 1], 10) || 1)
  : Infinity

// Reject anything unrecognized — a mistyped flag must never silently run.
function validateArgs(argv, known) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a in known) {
      if (known[a]) i++
      continue
    }
    console.error(
      `Unknown argument: "${a}" — did you mean "--${a.replace(/^-+/, "")}"?\n` +
        `Valid flags: ${Object.keys(known).join(", ")}`
    )
    process.exit(1)
  }
}

// ── Config ───────────────────────────────────────────────────────
const BASE = "https://chronoscout.co/public-api/v1.0"
const THROTTLE_MS = 1100 // ~1 req/sec, under the 60-burst / 1-per-sec cap
const MAX_RETRIES = 4 // for 429 / transient network errors
const UPSERT_BATCH = 500
const SINCE_SLACK_MS = 6 * 60 * 60 * 1000 // re-pull a 6h overlap; upserts are idempotent

// ── Env checks (values are never printed) ────────────────────────
const missing = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CHRONOSCOUT_API_KEY",
].filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
// Trim defensively — a stray space or newline pasted into a CI secret is a
// common cause of a 403. The local .env loader strips these, so a bad paste
// only bites in GitHub Actions (local 200, CI 403).
const API_KEY = (process.env.CHRONOSCOUT_API_KEY ?? "").trim()

// Preflight: log a NON-reversible fingerprint of the key (never the key itself)
// so a failing run's log reveals whether CI received the expected value.
{
  const rawKey = process.env.CHRONOSCOUT_API_KEY ?? ""
  const fp = crypto.createHash("sha256").update(API_KEY).digest("hex").slice(0, 8)
  const trimNote =
    rawKey.length !== API_KEY.length
      ? ` (trimmed ${rawKey.length - API_KEY.length} surrounding whitespace/newline char(s))`
      : ""
  console.log(`  key check: length=${API_KEY.length}${trimNote}, fingerprint=${fp}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── ChronoScout HTTP client ──────────────────────────────────────
let requestCount = 0
let lastLicense = null

// GET one page; retries on 429 (honoring Retry-After) and transient errors.
async function apiGet(path, params = {}) {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    requestCount++
    let res
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "User-Agent": "CaliberShelf chronoscout-sync (personal collection app)",
          Accept: "application/json",
        },
      })
    } catch (err) {
      if (attempt === MAX_RETRIES) throw new Error(`network error: ${err.message}`)
      await sleep(THROTTLE_MS * (attempt + 1))
      continue
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "", 10)
      const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : THROTTLE_MS * (attempt + 2)
      console.warn(`  429 rate-limited — waiting ${Math.round(waitMs / 1000)}s...`)
      await sleep(waitMs)
      continue
    }
    if (res.status === 401 || res.status === 403) {
      const errBody = await res.text().catch(() => "")
      const server = res.headers.get("server") || "?"
      const cfRay = res.headers.get("cf-ray") || ""
      const looksCloudflare =
        /cloudflare/i.test(server) ||
        !!cfRay ||
        /attention required|you have been blocked|cf-error|__cf_/i.test(errBody)
      console.error(
        `  ${res.status} from ${path} — server=${server}${cfRay ? ` cf-ray=${cfRay}` : ""}`
      )
      console.error(`  body (first 300 chars): ${errBody.slice(0, 300).replace(/\s+/g, " ").trim()}`)
      if (res.status === 403 && looksCloudflare) {
        throw new Error(
          `HTTP 403 blocked by Cloudflare (WAF/IP), not an auth failure — ` +
            `this runner's IP is likely blocked. Key fingerprint already verified.`
        )
      }
      throw new Error(`HTTP ${res.status} — check CHRONOSCOUT_API_KEY / access grant`)
    }
    if (!res.ok) {
      if (attempt === MAX_RETRIES) throw new Error(`HTTP ${res.status} for ${path}`)
      await sleep(THROTTLE_MS * (attempt + 1))
      continue
    }

    const body = await res.json()
    if (body?.meta?.license) lastLicense = body.meta.license
    return body
  }
  throw new Error(`exhausted retries for ${path}`)
}

// Walk every page of a resource, throttling between requests.
// Returns { resources, generatedAt } where generatedAt is the server time of
// the first page (used as the next incremental `modified_since`).
async function fetchAllPages(path, extraParams = {}) {
  const all = []
  let generatedAt = null
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= PAGE_LIMIT) {
    if (page > 1) await sleep(THROTTLE_MS)
    const body = await apiGet(path, { ...extraParams, page })
    const meta = body?.meta ?? {}
    if (page === 1) {
      generatedAt = meta.generated_at ?? null
      totalPages = Number.isFinite(meta.total_pages) ? meta.total_pages : 1
      const scope = PAGE_LIMIT < totalPages ? ` (capped at ${PAGE_LIMIT})` : ""
      console.log(
        `  ${path}: ${meta.total ?? "?"} total across ${totalPages} page(s)${scope}`
      )
    }
    const batch = Array.isArray(body?.resources) ? body.resources : []
    all.push(...batch)
    if (batch.length === 0) break
    page++
  }
  return { resources: all, generatedAt }
}

// ── Mapping: API shape → mirror rows ─────────────────────────────
const toCents = (n) => (Number.isFinite(n) ? Math.round(n * 100) : null)
const enUrl = (u) => (u && typeof u === "object" ? u.en ?? u.de ?? null : u ?? null)

function mapBrand(b, seenAt) {
  const specs = b.specs ?? {}
  const range = Array.isArray(specs.price_range_usd) ? specs.price_range_usd : []
  return {
    id: b.id,
    short_id: b.short_id ?? null,
    name: b.name,
    slug: b.slug ?? null,
    domain: b.domain ?? null,
    chronoscout_url: enUrl(b.chronoscout_url),
    logo_src: b.logo_src ?? null,
    case_sizes_mm: Array.isArray(specs.case_sizes_mm) ? specs.case_sizes_mm : null,
    movement_names: Array.isArray(specs.movement_names) ? specs.movement_names : null,
    movement_types: Array.isArray(specs.movement_types) ? specs.movement_types : null,
    styles: Array.isArray(specs.styles) ? specs.styles : null,
    price_min_cents: toCents(range[0]),
    price_max_cents: toCents(range[1]),
    specs: Object.keys(specs).length ? specs : null,
    most_recent_watch_added_at: b.most_recent_watch_added_at ?? null,
    source_created_at: b.created_at ?? null,
    source_modified_at: b.modified_at ?? null,
    raw: b,
    last_seen_at: seenAt,
  }
}

function mapWatch(w, seenAt) {
  const d = w.data ?? {}
  return {
    id: w.id,
    name: w.name,
    brand_id: w.brand?.id ?? null,
    brand_name: w.brand?.name ?? null,
    chronoscout_url: enUrl(w.chronoscout_url),
    image_src: w.image_src ?? null,
    diameter_mm: d.diameterMm ?? null,
    between_lugs_mm: d.betweenLugsMm ?? null,
    lug_to_lug_mm: d.lugToLugMm ?? null,
    thickness_mm: d.thicknessMm ?? null,
    weight_g: d.weightG ?? null,
    type: w.type ?? null,
    raw: w,
    last_seen_at: seenAt,
  }
}

// ── Upsert helper ────────────────────────────────────────────────
async function upsertBatched(table, rows) {
  if (DRY_RUN || rows.length === 0) return
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const chunk = rows.slice(i, i + UPSERT_BATCH)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: "id" })
    if (error) throw new Error(`upsert into ${table} failed: ${error.message}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const startedAt = new Date()
  const seenAt = startedAt.toISOString()
  const run = await startRun(supabase, {
    agent: "chronoscout-sync",
    trigger: process.env.AGENT_RUN_TRIGGER,
    dryRun: DRY_RUN,
  })

  // Read prior sync state to decide incremental vs full.
  let state = null
  {
    const { data } = await supabase
      .from("chronoscout_sync_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
    state = data ?? null
  }

  const sinceFrom = (ts) =>
    ts ? new Date(new Date(ts).getTime() - SINCE_SLACK_MS).toISOString() : null

  const brandsSince = FORCE_FULL ? null : sinceFrom(state?.last_brands_sync_at)
  const watchesSince = FORCE_FULL ? null : sinceFrom(state?.last_watches_sync_at)

  console.log(
    `ChronoScout sync — ${DRY_RUN ? "DRY RUN" : "live"}${FORCE_FULL ? " (forced full)" : ""}`
  )
  if (!FORCE_FULL && (brandsSince || watchesSince)) {
    console.log(`  incremental: brands since ${brandsSince ?? "n/a"}, watches since ${watchesSince ?? "n/a"}`)
  } else {
    console.log("  full pull (no prior sync state)")
  }
  console.log("")

  const result = {
    brands: { fetched: 0, generatedAt: null },
    watches: { fetched: 0, generatedAt: null },
  }

  // ── Brands ──
  if (!WATCHES_ONLY) {
    console.log("Brands:")
    const { resources, generatedAt } = await fetchAllPages("/brands", {
      modified_since: brandsSince ?? undefined,
    })
    const rows = resources.map((b) => mapBrand(b, seenAt))
    await upsertBatched("chronoscout_brands", rows)
    result.brands = { fetched: rows.length, generatedAt }
    console.log(`  ${DRY_RUN ? "would upsert" : "upserted"} ${rows.length} brand(s)`)
    if (rows[0]) console.log(`  e.g. ${rows[0].name} (${rows[0].slug ?? "no-slug"})`)
  }

  // ── Watches ──
  if (!BRANDS_ONLY) {
    if (!WATCHES_ONLY) await sleep(THROTTLE_MS)
    console.log("Watches:")
    const { resources, generatedAt } = await fetchAllPages("/watches", {
      modified_since: watchesSince ?? undefined,
    })
    const rows = resources.map((w) => mapWatch(w, seenAt))
    await upsertBatched("chronoscout_watches", rows)
    result.watches = { fetched: rows.length, generatedAt }
    console.log(`  ${DRY_RUN ? "would upsert" : "upserted"} ${rows.length} watch(es)`)
    if (rows[0]) console.log(`  e.g. ${rows[0].name}`)
  }

  // ── Persist sync state ──
  if (!DRY_RUN) {
    const patch = { id: 1, license: lastLicense, updated_at: seenAt }
    if (!WATCHES_ONLY) {
      patch.last_brands_sync_at = result.brands.generatedAt ?? seenAt
      patch.brands_count = await countRows("chronoscout_brands")
    }
    if (!BRANDS_ONLY) {
      patch.last_watches_sync_at = result.watches.generatedAt ?? seenAt
      patch.watches_count = await countRows("chronoscout_watches")
    }
    patch.last_run_notes =
      `synced ${result.brands.fetched} brands, ${result.watches.fetched} watches` +
      ` in ${requestCount} request(s)`
    const { error } = await supabase
      .from("chronoscout_sync_state")
      .upsert(patch, { onConflict: "id" })
    if (error) console.error(`  ! sync_state upsert failed: ${error.message}`)
  }

  const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1)
  console.log(
    `\nDone${DRY_RUN ? " (dry run — nothing written)" : ""}: ` +
      `${result.brands.fetched} brands, ${result.watches.fetched} watches, ` +
      `${requestCount} request(s), ${elapsed}s`
  )
  if (lastLicense) {
    console.log(
      `License seen: ${lastLicense.type}/${lastLicense.terms_type ?? ""} ${lastLicense.version_number ?? ""}`.trim()
    )
  }

  const totalItems = result.brands.fetched + result.watches.fetched
  await finishRun(run, {
    status: "success",
    itemsProcessed: totalItems,
    itemsUpdated: DRY_RUN ? 0 : totalItems,
    notes: `${result.brands.fetched} brands, ${result.watches.fetched} watches in ${requestCount} request(s)`,
  })
}

async function countRows(table) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true })
  return count ?? null
}

main().catch((err) => {
  console.error("chronoscout-sync failed:", err.message ?? err)
  process.exit(1)
})
