// Reference-number sweep agent: for every watch missing a reference_number,
// web-searches the manufacturer reference for that exact brand + model and
// writes it WITH reference_unverified = true — a human must confirm each one
// (watch edit page badge, or the Attention Needed report) before downstream
// agents should trust it. Never overwrites an existing reference.
//
// Usage:
//   node scripts/find-references.mjs             # sweep watches missing a ref
//   node scripts/find-references.mjs --dry-run   # research, print, no writes
//   node scripts/find-references.mjs --limit 5   # only the first N watches
//   node scripts/find-references.mjs --watch <uuid>
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

// Same batch-agent cost posture as find-store-urls.mjs / price-check.mjs.
const MODEL = "claude-sonnet-5"
const PRICE_PER_MTOK = { input: 3, output: 15 }
const MAX_USES = 4 // web searches per watch

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity
const ONLY_WATCH = args.includes("--watch")
  ? args[args.indexOf("--watch") + 1]
  : null

// Reject anything unrecognized — a mistyped flag (e.g. "dry-run" without
// dashes) must never silently become a live run.
validateArgs(args, { "--dry-run": false, "--limit": true, "--watch": true })
function validateArgs(argv, known) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a in known) {
      if (known[a]) i++ // skip the flag's value
      continue
    }
    console.error(
      `Unknown argument: "${a}" — did you mean "--${a.replace(/^-+/, "")}"?\n` +
        `Valid flags: ${Object.keys(known).join(", ")}`
    )
    process.exit(1)
  }
}

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
  reference_number: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string(),
})

const SYSTEM_PROMPT = `You are a research assistant for a personal watch-collection app.
Given a watch's brand, model, and any distinguishing details, find the
MANUFACTURER'S reference number for that exact variant.

Rules:
- The reference must come from the brand's official site or a highly reliable
  source (brand product page, manual, authorized dealer listing).
- Match the EXACT variant. Dial color, case size, metal, and bracelet all
  change the reference on most brands. Use every detail provided.
- Format the reference exactly as the manufacturer writes it
  (e.g. "SBGA211", "310.30.42.50.01.001", "L2.628.4.78.3").
- If several variants share the model name and the details given cannot pin
  down ONE reference, return null and say why in "notes". A wrong reference
  is worse than none — it poisons downstream market valuations.
- Some microbrands do not use reference numbers at all; return null and note
  that.

Your FINAL message must be RAW JSON ONLY — no markdown fences, no prose:
{"reference_number": "<ref>" | null, "confidence": "high" | "medium" | "low", "notes": "<one sentence>"}`

// ── Agent call ───────────────────────────────────────────────────
const usageTotal = { input: 0, output: 0, searches: 0 }

function watchPrompt(w) {
  const details = [
    `Brand: ${w.brands?.name ?? "unknown"}`,
    `Model: ${w.model}`,
    w.nickname ? `Nickname: ${w.nickname}` : null,
    w.dial_color ? `Dial color: ${w.dial_color}` : null,
    w.case_diameter_mm ? `Case diameter: ${w.case_diameter_mm}mm` : null,
    w.case_material ? `Case material: ${w.case_material}` : null,
    w.movements?.caliber_name ? `Movement: ${w.movements.caliber_name}` : null,
  ]
    .filter(Boolean)
    .join("\n")
  return `${details}\n\nFind the manufacturer reference number for this exact watch. Reply with the JSON object only.`
}

async function researchWatch(w) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    tools: [
      { type: "web_search_20260209", name: "web_search", max_uses: MAX_USES },
    ],
    messages: [{ role: "user", content: watchPrompt(w) }],
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

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  let query = supabase
    .from("watches")
    .select(
      "id, model, nickname, dial_color, case_diameter_mm, case_material, reference_number, is_wishlist, brands(name), movements(caliber_name)"
    )
    .is("reference_number", null)
    .order("model")
  if (ONLY_WATCH) query = query.eq("id", ONLY_WATCH)

  const { data: watches, error } = await query
  if (error) {
    console.error("Failed to fetch watches:", error.message)
    process.exit(1)
  }

  const targets = (watches ?? []).slice(0, LIMIT)
  if (targets.length === 0) {
    console.log("No watches missing a reference number. Nothing to do.")
    return
  }
  console.log(
    `Sweeping ${targets.length} watch(es) missing a reference number` +
      `${DRY_RUN ? " (dry run)" : ""}\n`
  )

  const review = []
  let found = 0
  for (const w of targets) {
    const label = `${w.brands?.name ?? "?"} ${w.model}`
    let result
    try {
      result = await researchWatch(w)
    } catch (err) {
      console.error(`  ! ${label}: agent error — ${err.message}`)
      continue
    }
    if (!result) {
      console.log(`  ?? ${label}: no parseable result`)
      review.push({ name: label, reason: "no result" })
      continue
    }

    if (result.reference_number) {
      found++
      console.log(
        `  ${result.reference_number.padEnd(22)} ${label} (${result.confidence})`
      )
      if (result.confidence !== "high") {
        review.push({ name: label, reason: `${result.confidence} confidence — ${result.notes}` })
      }
      if (!DRY_RUN) {
        const { error: upError } = await supabase
          .from("watches")
          .update({
            reference_number: result.reference_number,
            reference_unverified: true,
          })
          .eq("id", w.id)
        if (upError) console.error(`  ! update failed for ${label}: ${upError.message}`)
      }
    } else {
      console.log(`  ${"—".padEnd(22)} ${label} — ${result.notes}`)
      review.push({ name: label, reason: result.notes })
    }
  }

  const cost =
    (usageTotal.input * PRICE_PER_MTOK.input) / 1e6 +
    (usageTotal.output * PRICE_PER_MTOK.output) / 1e6
  console.log(
    `\nDone. ${found}/${targets.length} references found (ALL flagged "needs verification"), ` +
      `${usageTotal.searches} web searches, ~$${cost.toFixed(2)} API cost.`
  )
  console.log(
    "Verify each one on the watch edit page or via the Attention Needed report."
  )
  if (review.length > 0) {
    console.log(`\nNeeds closer review (${review.length}):`)
    for (const r of review) console.log(`  - ${r.name}: ${r.reason}`)
  }
}

main().catch((err) => {
  console.error("find-references failed:", err)
  process.exit(1)
})
