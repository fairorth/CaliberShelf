// One-sweep brand enrichment agent: finds each brand's official web-store URL
// (and classifies brand_type) via Claude web search, then deterministically
// verifies whether the store exposes a Shopify products.json feed (which is
// what scripts/deal-check.mjs needs).
//
// Human-in-the-loop by design: only fills NULL columns — anything you set by
// hand in Config -> Brands is never overwritten. Review the summary output and
// correct low-confidence rows manually.
//
// Usage:
//   node scripts/find-store-urls.mjs             # sweep brands missing store_url
//   node scripts/find-store-urls.mjs --dry-run   # research, print, no writes
//   node scripts/find-store-urls.mjs --limit 3   # only the first N brands
//   node scripts/find-store-urls.mjs --brand <name-substring>
//
// Required in .env.local (never committed):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   ANTHROPIC_API_KEY

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

loadEnvConfig(process.cwd())

// Same model/cost posture as price-check.mjs: this is an easy batch task, so
// the cheaper Sonnet tier is the deliberate choice (~$0.02-0.05 per brand).
const MODEL = "claude-sonnet-5"
const PRICE_PER_MTOK = { input: 3, output: 15 }
const MAX_USES = 3 // web searches per brand

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity
const ONLY_BRAND = args.includes("--brand")
  ? args[args.indexOf("--brand") + 1]?.toLowerCase()
  : null

// ── Env checks (values are never printed) ────────────────────────
const missing = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
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
const anthropic = new Anthropic()

// ── Output contract ──────────────────────────────────────────────
const resultSchema = z.object({
  store_url: z.string().nullable(),
  brand_type: z.enum(["major", "micro", "indie"]).nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string(),
})

const SYSTEM_PROMPT = `You are a research assistant for a personal watch-collection app.
Given a watch brand, find its OFFICIAL web store and classify the brand.

Rules:
- "store_url" must be the brand's own official site where they sell watches
  (e.g. https://traskawatch.com), with https, no path, no trailing slash.
  NEVER return a retailer, marketplace, or gray-market site. If the brand has
  no official store or you cannot verify it, return null.
- "brand_type" classification:
  - "major": large established manufacturer with wide retail distribution
    (Seiko, Omega, Citizen, Tissot, Hamilton...)
  - "micro": small independent brand selling direct-to-consumer in production
    runs (Traska, Nodus, Lorier, Baltic...)
  - "indie": independent watchmaker / small atelier producing in very low
    volumes, often to order (Sartory Billard, F.P. Journe tier ateliers...)
- "confidence": how sure you are the URL is the official store.
- "notes": one short sentence (e.g. "sells via authorized dealers only").

Your FINAL message must be RAW JSON ONLY — no markdown fences, no prose:
{"store_url": "https://..." | null, "brand_type": "major" | "micro" | "indie" | null, "confidence": "high" | "medium" | "low", "notes": "<one sentence>"}`

// ── Agent call ───────────────────────────────────────────────────
const usageTotal = { input: 0, output: 0, searches: 0 }

async function researchBrand(brand) {
  const prompt = `Watch brand: ${brand.name}${
    brand.country_of_origin ? `\nCountry: ${brand.country_of_origin}` : ""
  }\n\nFind the official store URL and classify the brand. Reply with the JSON object only.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    tools: [
      { type: "web_search_20260209", name: "web_search", max_uses: MAX_USES },
    ],
    messages: [{ role: "user", content: prompt }],
  })

  usageTotal.input +=
    response.usage.input_tokens +
    (response.usage.cache_creation_input_tokens ?? 0) +
    (response.usage.cache_read_input_tokens ?? 0)
  usageTotal.output += response.usage.output_tokens
  usageTotal.searches += response.usage.server_tool_use?.web_search_requests ?? 0

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  const parsed = resultSchema.safeParse(JSON.parse(jsonMatch[0]))
  return parsed.success ? parsed.data : null
}

// ── Deterministic Shopify verification ───────────────────────────
async function verifyStore(url) {
  try {
    const res = await fetch(`${url}/products.json?limit=1`, {
      headers: { "User-Agent": "CaliberShelf deal-check (personal collection app)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { reachable: true, shopify: false }
    const body = await res.json().catch(() => null)
    return { reachable: true, shopify: Array.isArray(body?.products) }
  } catch {
    return { reachable: false, shopify: false }
  }
}

const normalizeUrl = (u) => u.trim().replace(/\/+$/, "")

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, country_of_origin, brand_type, store_url")
    .order("name")
  if (error) {
    console.error("Failed to fetch brands:", error.message)
    process.exit(1)
  }

  // Wish-list brands first — they're the ones the deal scanner needs.
  const { data: wishWatches } = await supabase
    .from("watches")
    .select("brand_id")
    .eq("is_wishlist", true)
  const wishBrandIds = new Set((wishWatches ?? []).map((w) => w.brand_id))

  let targets = brands
    .filter((b) => !b.store_url || !b.brand_type)
    .filter((b) => !ONLY_BRAND || b.name.toLowerCase().includes(ONLY_BRAND))
    .sort(
      (a, b) =>
        Number(wishBrandIds.has(b.id)) - Number(wishBrandIds.has(a.id)) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, LIMIT)

  console.log(
    `${brands.length} brands total; sweeping ${targets.length} missing store_url and/or brand_type` +
      `${DRY_RUN ? " (dry run)" : ""}\n`
  )

  const review = []
  for (const brand of targets) {
    let result
    try {
      result = await researchBrand(brand)
    } catch (err) {
      console.error(`  ! ${brand.name}: agent error — ${err.message}`)
      continue
    }
    if (!result) {
      console.log(`  ?? ${brand.name}: no parseable result`)
      review.push({ name: brand.name, reason: "no result" })
      continue
    }

    let url = result.store_url ? normalizeUrl(result.store_url) : null
    let shopifyNote = ""
    if (url) {
      const check = await verifyStore(url)
      shopifyNote = check.shopify
        ? "shopify ✓"
        : check.reachable
          ? "not shopify"
          : "UNREACHABLE"
      if (!check.reachable) review.push({ name: brand.name, reason: `URL unreachable: ${url}` })
    } else {
      review.push({ name: brand.name, reason: result.notes || "no store found" })
    }
    if (result.confidence === "low") {
      review.push({ name: brand.name, reason: `low confidence — ${result.notes}` })
    }

    const wish = wishBrandIds.has(brand.id) ? "★" : " "
    console.log(
      `  ${wish} ${brand.name.padEnd(24)} ${(url ?? "—").padEnd(38)} ` +
        `[${shopifyNote.padEnd(11)}] type=${result.brand_type ?? "?"} (${result.confidence})`
    )

    if (!DRY_RUN) {
      const update = {}
      if (url && !brand.store_url) update.store_url = url
      if (result.brand_type && !brand.brand_type) update.brand_type = result.brand_type
      if (Object.keys(update).length > 0) {
        const { error: upError } = await supabase
          .from("brands")
          .update(update)
          .eq("id", brand.id)
        if (upError) console.error(`  ! update failed for ${brand.name}: ${upError.message}`)
      }
    }
  }

  const cost =
    (usageTotal.input * PRICE_PER_MTOK.input) / 1e6 +
    (usageTotal.output * PRICE_PER_MTOK.output) / 1e6
  console.log(
    `\nDone. ${usageTotal.searches} web searches, ` +
      `${usageTotal.input.toLocaleString()} in / ${usageTotal.output.toLocaleString()} out tokens, ` +
      `~$${cost.toFixed(2)} API cost.`
  )
  if (review.length > 0) {
    console.log(`\nNeeds your review in Config → Brands (${review.length}):`)
    for (const r of review) console.log(`  - ${r.name}: ${r.reason}`)
  }
}

main().catch((err) => {
  console.error("find-store-urls failed:", err)
  process.exit(1)
})
