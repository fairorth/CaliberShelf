// Applies the approved corrections from the Swiss Artisans adversarial review
// (docs/Watch Guides/Swiss Artisans Review 2026-08.md) to guide_entries.
//
// Scope = items 1-3 approved by the user on 2026-08-13:
//   A. Band changes (target_low_cents / target_high_cents) - 15 entries
//   B. Priority re-base (median 5) - 17 target entries
//   C. Factual corrections (caliber / dates_text / recommended_variant)
//   D. Channel+condition assumption and as-of date appended to notes (§3.2)
//
// NOT in scope: the cut list / Canon appendix / additions (§8, §6.3) - those are
// a document revision (v1.1) still under discussion, not a data update.
//
// $0, deterministic, no AI. Idempotent: re-running sets the same values and
// rewrites the review note rather than appending a second copy.

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

const KNOWN_FLAGS = new Set(["--dry-run", "--help"])
const args = process.argv.slice(2)
const unknown = args.filter((a) => !KNOWN_FLAGS.has(a))
if (unknown.length) {
  console.error(`Unknown flag(s): ${unknown.join(", ")}`)
  console.error(`Known flags: ${[...KNOWN_FLAGS].join(", ")}`)
  process.exit(1)
}
if (args.includes("--help")) {
  console.log("Usage: node scripts/apply-swiss-review-2026-08.mjs [--dry-run]")
  process.exit(0)
}
const DRY_RUN = args.includes("--dry-run")

const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
  (k) => !process.env[k]
)
if (missing.length) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const AS_OF = "2026-08-13"
const REVIEW_TAG = "[Review 2026-08]"
const REVIEW_DOC = "docs/Watch Guides/Swiss Artisans Review 2026-08.md"

// position -> patch. band = [lowUSD, highUSD] or null to leave unchanged.
// channel = the §3.2 channel/condition assumption recorded in notes.
const PATCHES = [
  {
    pos: 1,
    band: [12000, 18000],
    priority: 4,
    channel:
      "18k yellow gold 4240, sound original two-tone dial, auction channel incl. premium. Pink gold / moonphase runs 25-30% higher; VC-serviced dealer stock asks ~$25k. No lot found anywhere cited an Extract from the Archives.",
  },
  {
    pos: 2,
    band: [4000, 6500],
    priority: 8,
    dates_text: "1951-1957",
    variant_add:
      "Band is for a STEEL E501 - the $2,500-4,500 level buys gold-plated / LeCoultre-signed examples, which are a different watch. Auction floor ~$4,000; Western dealer $6,000-7,000.",
    channel:
      "Steel E501, honest original dial, working back-set. Auction floor ~$4,000, Western dealer $6,000-7,000.",
  },
  {
    pos: 3,
    band: [3000, 4250],
    priority: 7,
    caliber: "825 - automatic alarm (bumper)",
    dates_text: "1960-c.1974",
    channel:
      "Steel, serviced, correct Gay Freres bracelet, dealer channel. AUCTION CHANNEL IS $1,700-2,500 - three 2024 Bonhams solds at $1,625-2,280 plus a 2023 Sotheby's no-sale; those are trade-money lots with no condition text.",
  },
  {
    pos: 4,
    band: [8500, 12000],
    priority: 4,
    caliber: "1055 - manual",
    dates_text: "1997 re-edition",
    variant_add:
      "CORRECTION: ref 37010 is the 1997 re-edition (~26 x 36.5mm, cal 1055), NOT a 1970s watch. The 1970s original is ref 35202/2091 at 21 x 46mm, cal 1050/3 - a different watch that was being pooled into this band. Sharp unpolished case; an Extract from the Archives adds $2,000-3,500.",
    channel:
      "37010 (1997 re-edition, ~26 x 36.5mm), sharp unpolished case, auction/dealer. Ten realized sales span $3,888-10,710.",
  },
  {
    pos: 5,
    band: [40000, 52000],
    priority: 3,
    channel:
      "Yellow gold, Europe/Africa/Asia map ONLY, auction/dealer incl. premium. LIQUIDITY WARNING: four YG examples failed to sell 2023-24 and two platinum in one Sotheby's sale; dealer buyback is ~Y2,550,000 (~$16,000), a ~2.8x spread to retail. Platinum and champleve enamel variants price separately and must not be pooled.",
  },
  {
    pos: 6,
    band: [10500, 13000],
    priority: 3,
    dates_text: "c.2007-early 2010s",
    channel:
      "White gold cal 1420, auction/dealer incl. premium. Four solds, ZERO no-sales - the only perfect sell-through in the review. No rose-gold auction data exists; RG asks run $12,372-17,350.",
  },
  {
    pos: 7,
    band: [11000, 14000],
    priority: 5,
    caliber: "1206 RDT (F. Piguet 1150 base) - automatic",
    variant_add:
      "White gold, silver dial, 39mm (not ~38mm). Confirm unpolished case and sharp lugs, original hands, documented service within 3 years. NEGOTIATION GUIDANCE: open $10,500, settle $11,200-11,500, walk away at $12,500. $12,000 is top-of-fair, not a discount.",
    channel:
      "White gold, full set, dealer channel. Anchor comp is the USD-pegged Phillips HK 2024-09-27 lot 8052 at HK$107,950 incl. premium = $13,756 (NOS, full set). Verified WG record spans only 1.05x. Reference is declining -7.1% y/y / -11.5% 5yr against a VC index of +7.5%; 8 listed on Chrono24, so supply is not scarce.",
  },
  {
    pos: 8,
    band: null,
    priority: 6,
    channel:
      "Steel, auction channel OR Asian dealer supply, incl. premium. Band CONFIRMED by three at-ref steel solds ($11,418 / $12,053 / $13,806). Critical caveat: every Western-jurisdiction ask is $17,800+ (UAE/US/UK $17,340-19,504) - the band is reachable only via China ($11,359) or Hong Kong ($13,434), which carries service and warranty risk on a perpetual calendar + alarm.",
  },
  {
    pos: 9,
    band: null,
    priority: 7,
    variant_add:
      "Dimensions are 35.7 x 41 x 12.7mm (the card's 43.1mm is not reproducible) and the complete calendar INCLUDES A MOONPHASE, which the card omits.",
    channel:
      "Rose gold 000R-9219, full set, dealer channel. Band HELD under challenge: the apparent pink-gold discount was two stale 2020-21 lots; four 2025-26 sales ran $14,063-24,508. US shelf asks $18,000-19,000; a Ginza full-set RG asks ~$13,799.",
  },
  {
    pos: 10,
    band: null,
    priority: 6,
    variant_add:
      "WARNING: ref Q3038420 / 240.8.72 is a DIFFERENT, automatic Grande Reverso GMT/Date - the source of the bimodal ask distribution. Q3028420 / 240.8.18 is itself a two-dial Duo, and sellers apply 'GMT', 'GMT Duo Face' and 'Duo GMT' to the same reference.",
    channel:
      "Steel, good case with accessories, Western retail/private sale. A scratched no-box-no-papers example is ~$4,000; the JDM channel is $4,600-5,500 but those examples are advertised as polished. The ~$17k asks match nothing realized in any metal.",
  },
  {
    pos: 11,
    band: [5500, 8500],
    priority: 2,
    variant_add:
      "REFERENCE IS AMBIGUOUS: the market uses 192.T.25 / Q192T25 for BOTH the AMVOX2 Chronograph and the AMVOX2 DBS Transponder, and both are 44mm and case-actuated - the card's description does not discriminate. Buy on the CASEBACK EDITION TEST: 750 pieces = Chronograph, 999 = DBS. Comps in the market are unassignable between the two.",
    channel:
      "Titanium, dealer channel. No realized AMVOX2 chronograph reaches the old $8,500 floor; two solds at $4,050 and $7,500 against three no-sales including a Christie's failure in May 2024. Chrono24 ask floor IS the old band floor, so clearing sits below it.",
  },
  {
    pos: 12,
    band: [15500, 19000],
    priority: 2,
    channel:
      "Rose gold, full set, sound movement, dealer channel. The one independently-checked realized sale (Sotheby's, Mar 2026, ~$15,553) was an explicitly SERVICE-DUE lot, which is why the band sits above it. TRAP: Collector Square's 'Chronometre Royal' pages are almost entirely the VINTAGE model (refs 508943, 340419, 351265, 9409, 214543) - pooling those is a category error.",
  },
  {
    pos: 13,
    band: [17000, 21500],
    priority: 5,
    channel:
      "Rose gold cal 380, full set, auction/dealer incl. premium. Drifting down: recent solds $15,250 (Dec 2024), $18,891 / $19,671 (Artcurial 2023), $19,050 (Christie's Dec 2025); model estimate $16,994 vs $21,905 on 2022-11-09 (~-22%). The old $18,000 floor is now the market's centre.",
  },
  {
    pos: 14,
    band: [11000, 15000],
    priority: 4,
    dates_text: "2010-2010s",
    variant_add:
      "Launched 2010 (not 'late 2000s'); print the 4.13mm thickness. Platinum sibling 33155/000P-B169 prices separately.",
    channel:
      "Rose gold, box and papers, global dealer channel. NOTE: a WatchCharts private-sale average of $30,467 was REFUTED and discarded - it sits 96% above a brand-new boxed JDM example and 2-3x the entire ask distribution, which is self-refuting for a private-party figure.",
  },
  {
    pos: 15,
    band: null,
    priority: 3,
    dates_text: "2011-",
    variant_add:
      "CORRECTION: the rose gold 81018/000R-9657 is NOT a limited edition - it was unlimited SIHH 2011 production. The 20-piece limited edition is the WHITE GOLD 81018/000G-9559 (2010, Japan only). The card carried this error twice and the entry's scarcity argument rested on it.",
    channel:
      "Worn rose gold via HK/JP dealer channel ($10,180-12,586). The US dealer channel is $15,500-19,500 for the same watch, so the band is a buy-side target, not a US purchase price. Supply is effectively nil - one priced Chrono24 listing worldwide. Only one realized price exists and it is from 2013.",
  },
  {
    pos: 16,
    band: [4800, 7000],
    priority: null,
    dates_text: "2011 (37mm), 39mm from 2012-2024",
    channel:
      "Steel, pre-owned, private/dealer sale. No realized sale exists at this reference; on-ref asks cluster $4,527-6,559 (median ~$5,800). JP-sourced examples carry duty and shorter warranty, part of the discount. Reference is down 14.5% y/y against a JLC index of -8.9%. OWNED at $5,350 - fairly bought.",
  },
  {
    pos: 17,
    band: null,
    priority: 8,
    channel:
      "Steel/silver, full set, GLOBAL channel. Band HELD under challenge: WatchCharts' $7,546 sale and $7,847 private average track the US shelf ($7,985-8,950); the global market is $5,866-6,669 and new JDM stock is $4,633-5,261. A used private average above new-old-stock is impossible.",
  },
  {
    pos: 18,
    band: [10000, 12500],
    priority: null,
    caliber: "5100/1 - automatic",
    channel:
      "Steel B195, pre-owned dealer channel. Market estimate $11,245-11,334 and +6.0% y/y - one of only two entries in the review trending up. The old $9,000 floor was unsupported by any venue. 23 listings is the deepest supply in the guide, so those asks are unlikely to hold. OWNED at $9,150 - well bought, below every observed ask.",
  },
  {
    pos: 19,
    band: [16500, 19000],
    priority: 9,
    channel:
      "Steel B425 or B426, full set, online-auction / US dealer channel. STRONGEST CONFIRMATION IN THE REVIEW: three realized sales inside 12 months at $16,590 / $17,325 / $17,535, sold median within 1% of the guide midpoint. +11.8% y/y, risk 30/100 (best of all 21 entries). No B425-vs-B426 price separation visible.",
  },
  {
    pos: 20,
    band: [12000, 15000],
    priority: null,
    channel:
      "PROVISIONAL - no verified sale exists. Steel, unworn-to-excellent, private sale. Zero auction lots and no market-tracker page confirm 'secondary market still forming'. Dealer asks run 12-19% OVER the $16,100 retail, but a dated completed JDM buyback puts an UNWORN example at Y1,250,000 = $7,847. OWNED at $19,100 - roughly $3,000 over list.",
  },
  {
    pos: 21,
    band: null,
    priority: null,
    channel:
      "No band - retail-anchored only; no secondary market exists at any venue. Retail $17,000 confirmed at US ADs (JP AD Y2,992,000 incl. tax = $18,783). PRE-ORDERED at $17,000 = exact full list, and US list appears to be the cheapest global list. The $17,000 figure appears in no JLC press material. Book as consumption; expect real depreciation over 24-36 months.",
  },
]

function buildNotes(existing, patch) {
  const bandStr = patch.band
    ? `Band $${patch.band[0].toLocaleString("en-US")}-$${patch.band[1].toLocaleString("en-US")}`
    : "Band unchanged"
  const review = `${REVIEW_TAG} ${bandStr} as of ${AS_OF}. ${patch.channel} Source: ${REVIEW_DOC}`
  // Idempotent: strip any prior review block before re-appending.
  const kept = (existing ?? "")
    .split(REVIEW_TAG)[0]
    .trim()
  return kept ? `${kept}\n\n${review}` : review
}

async function main() {
  console.log(
    `Swiss Artisans review corrections${DRY_RUN ? " (DRY RUN - no writes)" : ""}\n`
  )

  const { data: guide, error: gErr } = await supabase
    .from("collection_guides")
    .select("id, name, version")
    .eq("name", "Swiss Artisans")
    .maybeSingle()
  if (gErr) throw new Error(`guide: ${gErr.message}`)
  if (!guide) throw new Error("Swiss Artisans guide not found")

  const { data: entries, error: eErr } = await supabase
    .from("guide_entries")
    .select(
      "id, position, title, target_low_cents, target_high_cents, priority, caliber, dates_text, recommended_variant, notes"
    )
    .eq("guide_id", guide.id)
    .order("position")
  if (eErr) throw new Error(`entries: ${eErr.message}`)

  const byPos = new Map(entries.map((e) => [e.position, e]))
  let bands = 0
  let priorities = 0
  let facts = 0
  let noted = 0
  let updated = 0
  const problems = []

  for (const patch of PATCHES) {
    const entry = byPos.get(patch.pos)
    if (!entry) {
      problems.push(`P${patch.pos}: no entry at this position - SKIPPED`)
      continue
    }

    const update = {}

    if (patch.band) {
      update.target_low_cents = patch.band[0] * 100
      update.target_high_cents = patch.band[1] * 100
      bands++
    }
    if (patch.priority !== null && patch.priority !== undefined) {
      update.priority = patch.priority
      priorities++
    }
    if (patch.caliber) {
      update.caliber = patch.caliber
      facts++
    }
    if (patch.dates_text) {
      update.dates_text = patch.dates_text
      facts++
    }
    if (patch.variant_add) {
      const base = (entry.recommended_variant ?? "").split(` -- ${REVIEW_TAG}`)[0].trim()
      update.recommended_variant = `${base} -- ${REVIEW_TAG} ${patch.variant_add}`
      facts++
    }
    update.notes = buildNotes(entry.notes, patch)
    noted++

    const bandLabel = patch.band
      ? `$${(entry.target_low_cents ?? 0) / 100}-${(entry.target_high_cents ?? 0) / 100} -> $${patch.band[0]}-${patch.band[1]}`
      : "band unchanged"
    const prioLabel =
      patch.priority !== null && patch.priority !== undefined
        ? `priority ${entry.priority ?? "-"} -> ${patch.priority}`
        : "priority unchanged"
    console.log(`P${String(patch.pos).padStart(2)} ${entry.title}`)
    console.log(`     ${bandLabel} · ${prioLabel}`)
    if (patch.caliber) console.log(`     caliber -> ${patch.caliber}`)
    if (patch.dates_text) console.log(`     dates   -> ${patch.dates_text}`)
    if (patch.variant_add) console.log(`     recommended_variant: review clause appended`)

    if (!DRY_RUN) {
      const { error: uErr } = await supabase
        .from("guide_entries")
        .update(update)
        .eq("id", entry.id)
      if (uErr) {
        problems.push(`P${patch.pos}: update failed - ${uErr.message}`)
        continue
      }
    }
    updated++
  }

  console.log(`\n--- Summary ---`)
  console.log(`Entries touched:      ${updated} / ${PATCHES.length}`)
  console.log(`Band changes:         ${bands}`)
  console.log(`Priority changes:     ${priorities}`)
  console.log(`Factual field edits:  ${facts}`)
  console.log(`Notes written:        ${noted}`)
  if (problems.length) {
    console.log(`\nProblems (${problems.length}):`)
    for (const p of problems) console.log(`  - ${p}`)
  }
  console.log(`\nCost: $0.00 (deterministic, no AI)`)
  if (DRY_RUN) console.log(`DRY RUN - nothing was written.`)
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`)
  process.exit(1)
})
