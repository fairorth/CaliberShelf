// Wish-list deal scanner, Phase A (deterministic — no LLM, no API cost).
//
// For every watch with is_wishlist = true whose brand has a store_url, fetches
// the store's public Shopify /products.json feed, matches the product by
// title, and upserts current availability + retail price into wishlist_deals
// (one row per watch). Brands without a store URL are recorded as "no_store"
// so the /deals page can surface the gap.
//
// Usage:
//   node scripts/deal-check.mjs             # check + upsert
//   node scripts/deal-check.mjs --dry-run   # check, print, no writes
//   node scripts/deal-check.mjs --watch <uuid>  # a single watch
//
// Required in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const ONLY_WATCH = args.includes("--watch")
  ? args[args.indexOf("--watch") + 1]
  : null

// Reject anything unrecognized — a mistyped flag must never silently
// become a live run.
validateArgs(args, { "--dry-run": false, "--watch": true })
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
const MAX_PAGES = 8 // 8 x 250 = 2000 products, plenty for any microbrand
const FETCH_DELAY_MS = 750

// ── Env checks (values are never printed) ────────────────────────
const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
  (k) => !process.env[k]
)
if (missing.length > 0) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Shopify feed ─────────────────────────────────────────────────
// Cache the full product list per store so multiple wish-list watches from
// the same brand cost one crawl.
const storeCache = new Map()

async function fetchStoreProducts(storeUrl) {
  if (storeCache.has(storeUrl)) return storeCache.get(storeUrl)

  const products = []
  let failure = null
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${storeUrl}/products.json?limit=250&page=${page}`
    let res
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "CaliberShelf deal-check (personal collection app)" },
        redirect: "follow",
      })
    } catch (err) {
      failure = `fetch failed: ${err.message}`
      break
    }
    if (!res.ok) {
      // 404/401 on page 1 = not a Shopify store (or feed disabled)
      if (page === 1) failure = `HTTP ${res.status} — not a Shopify products.json feed?`
      break
    }
    let body
    try {
      body = await res.json()
    } catch {
      if (page === 1) failure = "response was not JSON — not a Shopify feed?"
      break
    }
    const batch = body?.products
    if (!Array.isArray(batch) || batch.length === 0) break
    products.push(...batch)
    if (batch.length < 250) break
    await sleep(FETCH_DELAY_MS)
  }

  const result = { products, failure: products.length > 0 ? null : failure }
  storeCache.set(storeUrl, result)
  return result
}

// ── Product matching ─────────────────────────────────────────────
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokens = (s) => normalize(s).split(" ").filter(Boolean)

// Score a product title against the watch's model (and nickname as backup):
// exact substring beats token overlap; ties broken by shorter title (more
// specific match).
function findBestMatch(products, watch) {
  const candidates = [watch.model, watch.nickname].filter(Boolean)
  let best = null

  for (const product of products) {
    const title = normalize(product.title)
    for (const candidate of candidates) {
      const cand = normalize(candidate)
      if (!cand) continue
      let score = 0
      if (title === cand) score = 3
      else if (title.includes(cand)) score = 2
      else {
        const candTokens = tokens(candidate)
        if (candTokens.length > 0) {
          const hit = candTokens.filter((t) => title.includes(t)).length
          const ratio = hit / candTokens.length
          if (ratio >= 0.7) score = 1 + ratio / 10
        }
      }
      if (
        score > 0 &&
        (!best ||
          score > best.score ||
          (score === best.score && product.title.length < best.product.title.length))
      ) {
        best = { product, score }
      }
    }
  }
  return best?.product ?? null
}

// ── Deal evaluation ──────────────────────────────────────────────
function evaluate(product, storeUrl) {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const availableVariants = variants.filter((v) => v.available)
  const priced = (availableVariants.length > 0 ? availableVariants : variants)
    .map((v) => parseFloat(v.price))
    .filter((p) => Number.isFinite(p))
  const minPrice = priced.length > 0 ? Math.min(...priced) : null

  return {
    availability: availableVariants.length > 0 ? "available" : "sold_out",
    retail_price_cents: minPrice != null ? Math.round(minPrice * 100) : null,
    product_url: `${storeUrl}/products/${product.handle}`,
    product_title: product.title,
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  let query = supabase
    .from("watches")
    .select(
      "id, user_id, model, nickname, reference_number, purchase_price_cents, brands(id, name, brand_type, store_url)"
    )
    .eq("is_wishlist", true)
  if (ONLY_WATCH) query = query.eq("id", ONLY_WATCH)

  const { data: watches, error } = await query
  if (error) {
    console.error("Failed to fetch wish-list watches:", error.message)
    process.exit(1)
  }
  if (!watches || watches.length === 0) {
    console.log("No wish-list watches found. Nothing to do.")
    return
  }
  console.log(`Checking ${watches.length} wish-list watch(es)...\n`)

  const summary = { available: 0, sold_out: 0, not_found: 0, no_store: 0 }

  for (const watch of watches) {
    const brand = watch.brands
    const label = `${brand?.name ?? "?"} ${watch.model}`
    let row = {
      user_id: watch.user_id,
      watch_id: watch.id,
      checked_at: new Date().toISOString(),
      source: "shopify",
      availability: "unknown",
      retail_price_cents: null,
      currency: "USD",
      product_url: null,
      product_title: null,
      notes: null,
    }

    if (!brand?.store_url) {
      row.availability = "no_store"
      row.source = "none"
      row.notes = "Brand has no store URL — set one in Config → Brands."
    } else {
      const { products, failure } = await fetchStoreProducts(brand.store_url)
      if (failure) {
        row.availability = "unknown"
        row.notes = `Store feed error: ${failure}`
      } else {
        const product = findBestMatch(products, watch)
        if (!product) {
          row.availability = "not_found"
          row.notes = `No product matched "${watch.model}" among ${products.length} products.`
        } else {
          Object.assign(row, evaluate(product, brand.store_url))
        }
      }
    }

    summary[row.availability] = (summary[row.availability] ?? 0) + 1
    const price =
      row.retail_price_cents != null
        ? ` $${(row.retail_price_cents / 100).toFixed(0)}`
        : ""
    console.log(
      `  ${row.availability.toUpperCase().padEnd(10)} ${label}${price}${row.notes ? ` — ${row.notes}` : ""}`
    )

    if (!DRY_RUN) {
      const { error: upsertError } = await supabase
        .from("wishlist_deals")
        .upsert(row, { onConflict: "watch_id" })
      if (upsertError) {
        console.error(`  ! upsert failed for ${label}: ${upsertError.message}`)
      }
    }
  }

  console.log(
    `\nDone${DRY_RUN ? " (dry run — nothing written)" : ""}: ` +
      Object.entries(summary)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${n} ${k}`)
        .join(", ")
  )
}

main().catch((err) => {
  console.error("deal-check failed:", err)
  process.exit(1)
})
