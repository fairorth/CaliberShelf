// Seeder for the "Grand Seiko" Master Collection Guide — v2.0 (2026 Edition,
// Revision 2). Data from docs/Watch Guides/Grand Seiko.pdf, restructured per
// the August 2026 adversarial review (docs/Watch Guides/Grand Seiko Review
// 2026-08.md): 15-slot Part A acquisition plan + 4-entry Part B Canon,
// validated market bands, re-based priorities.
//
// What it does, idempotently:
//   1. DELETES the wish-list watches for cut entries (57GS, SBGT241, SBGA001,
//      SBGH001, SBGW253) and de-capitalized Canon watches (SLGT003, SBGZ001,
//      SBGD001, SLGH002) — wish-list rows only, never owned watches; their
//      storage photos are removed first.
//   2. Upserts the collection_guides row to v2.0.
//   3. REPLACES all guide_entries (positions changed meaning in v2, so the
//      old rows are deleted and 19 fresh rows inserted: 15 Part A + 4 Canon).
//   4. Links existing watches by reference; creates wish-list watches for the
//      three NEW Part A chapters (SLGA015, SBGX261, SLGW003).
//
// Deterministic, $0, no AI.
//
// Usage:
//   npm run seed-gs-guide -- --dry-run     # report what would happen
//   npm run seed-gs-guide                  # do it
//
// Required in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"

loadEnvConfig(process.cwd())

const KNOWN_FLAGS = ["--dry-run"]
const args = process.argv.slice(2)
for (const a of args) {
  if (!KNOWN_FLAGS.includes(a)) {
    console.error(`Unknown argument: ${a}. Known flags: ${KNOWN_FLAGS.join(", ")}`)
    process.exit(1)
  }
}
const DRY = args.includes("--dry-run")

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

const GUIDE = {
  name: "Grand Seiko",
  thesis:
    "Build a compact history of Grand Seiko told one engine at a time: the precision quest from the chronometer-contest hi-beats to U.F.A. No chapter told twice; every purchase must contribute a chapter not already represented.",
  source_document: "Grand Seiko.pdf",
  version: "2.0", // Aug 2026 Revision 2 — restructured per the adversarial review
}

// Wish-list watches removed from the plan in v2 (cut entries + Canon
// de-capitalization). Matched by reference; ONLY is_wishlist rows are deleted.
const CUT_REFS = [
  "5722-9990", // 57GS — conditional half-card candidate now, not a slot
  "SBGT241", // replaced by a real 9F (SBGX261)
  "SBGA001", // 9R65 chapter told by the Snowflake
  "SBGH001", // hi-beat chapter triple-covered
  "SBGW253", // redundant with the J14070 hunt
  "SLGT003", // Canon — no capital
  "SBGZ001", // Canon — no capital
  "SBGD001", // Canon — no capital
  "SLGH002", // Canon — no capital
]

// status: 'candidate' for Part A targets, 'passed' for Canon (acknowledged,
// decided against chasing). owned: never auto-create. create: make a wish-list
// watch when unlinked. Bands are the Aug 2026 validated buy bands.
const ENTRIES = [
  { position: 1, chapter: "Origins & Golden Age", title: "Grand Seiko First", reference_number: "J14070", caliber: "3180 - manual wind", year_from: 1960, dates_text: "1960-1963", historical_role: "Genesis. The first Grand Seiko and the opening statement of the brand's pursuit of precision, legibility, durability and refinement.", recommended_variant: "14K gold-filled J14070 with original dial, crown and caseback medallion. Highest authenticity risk in the guide - vetted specialist dealers only; budget the top of the band and the patience of a year.", target_low: 3600, target_high: 6500, priority: 7.5, category: "Dress", create: true },
  { position: 2, chapter: "Origins & Golden Age", title: "44GS", reference_number: "4420-9000", caliber: "4420B - manual wind", year_from: 1967, dates_text: "1967-1968/69", historical_role: "The design milestone. This reference established the Grand Seiko Style: broad planes, razor-like facets and deliberate light-shadow geometry.", recommended_variant: "The sharpest honest case you can find, with intact medallion and original dial. The 30-40% sharp-case premium buys the only version that appreciates. Buy first.", target_low: 2800, target_high: 4500, priority: 10, category: "Dress", create: true },
  { position: 3, chapter: "Origins & Golden Age", title: "45GS", reference_number: "4520-7010", caliber: "4520A - manual wind, 36,000 vph", year_from: 1969, dates_text: "c. 1969-1970", historical_role: "The vintage technical anchor: late-1960s manual Hi-Beat, first-generation 36,000-vph precision, Daini. Slot one of the precision spine.", recommended_variant: "Keep this exact 4520-7010: clean no-date dial, original case geometry, medallion. Recorded honestly: $1,850 paid was dealer-retail, above the $1,000-1,600 private-sale band.", target_low: 1000, target_high: 1600, priority: null, category: "Dress", owned: true },
  { position: 4, chapter: "Origins & Golden Age", title: "62GS", reference_number: "6245-9000", caliber: "6245A - automatic", year_from: 1966, dates_text: "1966-1968", historical_role: "Grand Seiko's first automatic watch and the bezel-free case architecture - the design counterpoint to the 44GS, still priced pre-discovery.", recommended_variant: "Date-only 6245-9000 with crisp case and correct lion medallion, cleaner than the day-date 6246. Buy through the JDM channel; $3,000 Western asks are retail, not market.", target_low: 1400, target_high: 2600, priority: 6, category: "Dress", create: true },
  { position: 5, chapter: "Origins & Golden Age", title: "61GS Hi-Beat", reference_number: "6145-8000", caliber: "6145A - automatic 36,000 vph", year_from: 1968, dates_text: "October 1968", historical_role: "Japan's first automatic 10-beat Grand Seiko - the Suwa answer to Daini's 45GS; the rivalry embodied by the owned pair.", recommended_variant: "Keep the early Grand Seiko dial / rotor configuration, service paperwork, signed buckle and spare mainspring together as provenance. Acquired Aug 2026 at $1,000 - validated fair market.", target_low: 1000, target_high: 1000, priority: null, category: "Dress", owned: true },
  { position: 6, chapter: "Origins & Golden Age", title: "61GS V.F.A.", reference_number: "6185-8020", caliber: "6185A - automatic 36,000 vph V.F.A.", year_from: 1969, dates_text: "1969-early 1970s", historical_role: "The vintage mechanical precision summit and historical mirror of the owned U.F.A. Also the most faked Grand Seiko in existence.", recommended_variant: "STANDING ORDER, not a hunt item: papered, serial-coherent examples only (movement photos, matching numbers, specialist inspection), hard cap $15,000. Early applied-Suwa examples run $13-18k+. Priority becomes 10 for the right watch.", target_low: 9000, target_high: 16000, priority: 6.5, category: "Horology", create: true, note: "Standing order — papered examples only, $15k cap." },
  { position: 7, chapter: "Quartz & The Rebirth", title: "95GS Quartz", reference_number: "SBGS001", caliber: "9581 - high-accuracy quartz", year_from: 1988, dates_text: "1988-early 1990s", historical_role: "The 1988 return of Grand Seiko in quartz form - the best narrative-per-dollar ratio in Grand Seiko collecting.", recommended_variant: "First-generation steel with original crown and hardware. Zero urgency, zero appreciation - buy whenever, never at a Western premium.", target_low: 450, target_high: 800, priority: 3, category: "Dress", create: true },
  { position: 8, chapter: "Quartz & The Rebirth", title: "The 9F", reference_number: "SBGX261", caliber: "9F62 - thermocompensated quartz, sealed cabin", year_from: 1993, dates_text: "Caliber 1993; SBGX261 2016-present", historical_role: "The real 9F chapter: the 1993 sealed-cabin, twin-pulse quartz built as an end in itself - the hinge of the rebirth previously skipped between 1988 and 1998.", recommended_variant: "Standard-production SBGX261 (canonical 37mm 9F62). Alternate: SBGP011 if the 9F85's independent hour hand appeals. Replaces the commemorative SBGT241.", target_low: 2000, target_high: 2500, priority: 5, category: "Daily", create: true, note: "New chapter — Aug 2026 review." },
  { position: 9, chapter: "Quartz & The Rebirth", title: "Mechanical Rebirth", reference_number: "SBGR001", caliber: "9S55 - automatic", year_from: 1998, dates_text: "1998-early 2000s", historical_role: "The 1998 rebirth of mechanical Grand Seiko and the start of the modern 9S lineage. Quiet-looking, historically enormous.", recommended_variant: "Early double-logo, ideally full set. Solds cluster $1,600-2,000 - never pay the $3,000 dealer ask. Always available; buy last and cheap.", target_low: 1700, target_high: 2500, priority: 4, category: "Daily", create: true },
  { position: 10, chapter: "Modern Grand Seiko Emerges", title: "Original Snowflake", reference_number: "SBGA011", caliber: "9R65 - automatic Spring Drive", year_from: 2005, dates_text: "2005-2017", historical_role: "The watch that made Spring Drive synonymous with Grand Seiko - now the sole teller of the 9R65 chapter, retiring the SBGA001 slot.", recommended_variant: "SBGA011 specifically, not SBGA211: pre-2017 double-logo dial. Appreciation in progress - buy inside 6-12 months; JDM solds run $2,550-2,700.", target_low: 2900, target_high: 3700, priority: 9, category: "Daily", create: true },
  { position: 11, chapter: "The New Technical Age", title: "White Birch", reference_number: "SLGH005", caliber: "9SA5 - automatic Hi-Beat 36,000 vph, 80h", year_from: 2021, dates_text: "2021-present", historical_role: "The wearable flagship of the 9SA5 architecture and Evolution 9 design language - the canonical form of the chapter, retiring SLGH002 to the Canon.", recommended_variant: "Regular production, lightly used and unpolished. Clean used examples at $5,500-6,000 carry near-zero remaining depreciation - the safe slot in the plan.", target_low: 5800, target_high: 7000, priority: 8, category: "Daily", create: true },
  { position: 12, chapter: "The New Technical Age", title: "Birch Bark Manual", reference_number: "SLGW003", caliber: "9SA4 - manual wind Hi-Beat 36,000 vph, 80h", year_from: 2024, dates_text: "2024-present", historical_role: "The 2024 manual-wind hi-beat in a 44GS-lineage Evolution 9 case - the direct modern descendant of the owned 45GS; the rhyme that makes the collection read as composed.", recommended_variant: "High-Intensity Titanium SLGW003 (stretch slot). Alternate: SLGC001 Tentagraph at or under $9,500 if the chronograph chapter must exist.", target_low: 10000, target_high: 11000, priority: 5.5, category: "Dress", create: true, note: "Stretch slot — new chapter, Aug 2026 review." },
  { position: 13, chapter: "The New Technical Age", title: "Evolution 9 Diver", reference_number: "SLGA015", caliber: "9RA5 - Spring Drive five-day, 120h", year_from: 2022, dates_text: "2022-present", historical_role: "One slot, two previously missing chapters: the 9RA5 five-day Spring Drive generation - the largest Spring Drive advance since 2004 - and the diver line.", recommended_variant: "SLGA015 Evolution 9 diver, High-Intensity Titanium. Swap candidate: SLGA007 Omiwatari if dial craft outranks the diver chapter - same movement generation.", target_low: 8000, target_high: 9500, priority: 7, category: "Sport", create: true, note: "New chapter — Aug 2026 review." },
  { position: 14, chapter: "The New Technical Age", title: "Mist Flake GMT", reference_number: "SBGE285", caliber: "9R66 - automatic Spring Drive GMT", year_from: 2022, dates_text: "2022-present", historical_role: "The modern practical anchor: Evolution 9, High-Intensity Titanium, true traveler GMT and mature Spring Drive in one wearable package.", recommended_variant: "Keep the SBGE285 - it fills the modern Spring Drive GMT / Evolution 9 sport chapter; no duplicate GMT needed. Realized market $5,500-6,500 vs ~$4,950 paid.", target_low: 5500, target_high: 6500, priority: null, category: "Sport", owned: true },
  { position: 15, chapter: "The New Technical Age", title: "Violet Dawn", reference_number: "SLGB005", caliber: "9RB2 Spring Drive U.F.A. - +/-20 sec/year", year_from: 2025, dates_text: "2025 - LE 1,300", historical_role: "The U.F.A. precision milestone and modern endpoint of the accuracy obsession - the anchor of the 4520 to V.F.A. to U.F.A. sequence.", recommended_variant: "Keep the full set. Year-one LE J-curve is normal (secondary ~$8,800-10,200 vs $11,100 retail) - a five-year-plus hold, not a regret.", target_low: 8800, target_high: 10200, priority: null, category: "Horology", owned: true },
  // ── Part B: The Canon — acknowledged, unranked, no capital ─────
  { position: 16, chapter: "The Canon", title: "Kodo Constant-Force Tourbillon", reference_number: "SLGT003", caliber: "9ST1 - manual complication", year_from: 2022, dates_text: "2022 - LE 20", historical_role: "First GS mechanical complication: tourbillon and constant force on one axis. No public secondary trade has ever occurred.", recommended_variant: "Canon entry - no capital allocated. Working assumption $250-325k, unverifiable. Enters the plan only if a papered example inside budget ever surfaces.", target_low: 250000, target_high: 325000, priority: null, category: "Horology", canon: true },
  { position: 17, chapter: "The Canon", title: "Micro Artist 9R02 Masterpiece", reference_number: "SBGZ001", caliber: "9R02 - manual Spring Drive", year_from: 2019, dates_text: "2019 - LE 30", historical_role: "Hand-engraved platinum, hand-finished 9R02. Two public sales ever: ~$64k (2022) and $81.9k (2023).", recommended_variant: "Canon entry - no capital allocated. Realistic requirement $60-80k, auction-exit-only.", target_low: 60000, target_high: 80000, priority: null, category: "Horology", canon: true },
  { position: 18, chapter: "The Canon", title: "Spring Drive 8 Days", reference_number: "SBGD001", caliber: "9R01 - manual Spring Drive, 8 days", year_from: 2016, dates_text: "2016-2017", historical_role: "First Micro Artist Studio GS. Same chapter as SBGZ001 - one Micro Artist slot is enough, and it lives here.", recommended_variant: "Canon entry - no capital allocated. Loupe This sold $30,989 (Aug 2025) vs $54k+ asks; a $30-48k watch with brutal spread.", target_low: 30000, target_high: 48000, priority: null, category: "Horology", canon: true },
  { position: 19, chapter: "The Canon", title: "First 9SA5", reference_number: "SLGH002", caliber: "9SA5 - automatic Hi-Beat 36,000 vph", year_from: 2020, dates_text: "2020 - LE 100", historical_role: "The literal beginning of the 9SA5 era - but the chapter is the caliber, and the White Birch tells it on the wrist.", recommended_variant: "Canon entry - no capital allocated. Asking-only market $26-32k, ~25% under retail, months-long exits.", target_low: 26000, target_high: 32000, priority: null, category: "Horology", canon: true },
]

const dollarsToCents = (d) => (d == null ? null : Math.round(d * 100))
const norm = (r) => r.toUpperCase().replace(/\s+/g, "")

async function main() {
  console.log(`Seeding "Grand Seiko" Master Collection Guide v${GUIDE.version}${DRY ? " (DRY RUN)" : ""}\n`)

  const { data: profiles, error: profErr } = await supabase.from("profiles").select("id")
  if (profErr) throw new Error(`profiles: ${profErr.message}`)
  if (!profiles || profiles.length !== 1) {
    throw new Error(`Expected exactly 1 profile, found ${profiles?.length ?? 0}.`)
  }
  const userId = profiles[0].id

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", "grand seiko")
  const brandId = brands?.[0]?.id
  if (!brandId) throw new Error("Grand Seiko brand not found — nothing to update.")

  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
  if (catErr) throw new Error(`categories: ${catErr.message}`)
  const catByName = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id]))
  const fallbackCat = catByName.get("daily") ?? cats[0].id
  const categoryFor = (name) => catByName.get(name.toLowerCase()) ?? fallbackCat

  const loadWatches = async () => {
    const { data, error } = await supabase
      .from("watches")
      .select("id, model, reference_number, is_wishlist, is_coming_soon")
      .eq("user_id", userId)
      .eq("brand_id", brandId)
    if (error) throw new Error(`watches: ${error.message}`)
    return data ?? []
  }
  let gsWatches = await loadWatches()
  const refWatches = () => gsWatches.filter((w) => w.reference_number)
  const findByRef = (ref) => {
    const target = norm(ref)
    return refWatches().find((w) => {
      const wr = norm(w.reference_number)
      return wr === target || wr.endsWith(target) || target.endsWith(wr)
    })
  }

  // ── 1. Delete cut wish-list watches (photos + storage first) ────
  console.log("Cut watches (v2 removes these from the plan):")
  let deleted = 0
  for (const ref of CUT_REFS) {
    const match = findByRef(ref)
    if (!match) {
      console.log(`  ${ref}: no watch found — nothing to delete`)
      continue
    }
    if (!match.is_wishlist) {
      console.log(`  ${ref}: matched "${match.model}" but it is NOT a wish-list watch — SKIPPED (never deleting owned rows)`)
      continue
    }
    if (DRY) {
      console.log(`  ${ref}: would DELETE wish-list watch "${match.model}" (photos + storage included)`)
      continue
    }
    // Remove storage objects for its photos, then the watch (FKs cascade;
    // guide_entries.watch_id is ON DELETE SET NULL).
    const { data: photos } = await supabase
      .from("watch_photos")
      .select("storage_path, thumb_path")
      .eq("watch_id", match.id)
    const paths = (photos ?? []).flatMap((p) => [p.storage_path, p.thumb_path]).filter(Boolean)
    if (paths.length > 0) {
      const { error: rmErr } = await supabase.storage.from("watch-photos").remove(paths)
      if (rmErr) console.warn(`  (storage cleanup warning for ${ref}: ${rmErr.message})`)
    }
    const { error: delErr } = await supabase.from("watches").delete().eq("id", match.id)
    if (delErr) throw new Error(`delete watch ${match.model}: ${delErr.message}`)
    deleted++
    console.log(`  ${ref}: DELETED wish-list watch "${match.model}" (${paths.length} storage object(s) removed)`)
  }
  if (!DRY) gsWatches = await loadWatches()

  // ── 2. Guide upsert ─────────────────────────────────────────────
  let guideId
  const { data: existingGuide } = await supabase
    .from("collection_guides")
    .select("id")
    .eq("user_id", userId)
    .eq("name", GUIDE.name)
    .maybeSingle()
  if (existingGuide) {
    guideId = existingGuide.id
    console.log(`\nGuide exists (${guideId}) — updating to v${GUIDE.version}; entries will be REPLACED.`)
    if (!DRY) {
      await supabase
        .from("collection_guides")
        .update({ thesis: GUIDE.thesis, source_document: GUIDE.source_document, version: GUIDE.version })
        .eq("id", guideId)
    }
  } else if (DRY) {
    console.log(`\nWould create guide: ${GUIDE.name} (v${GUIDE.version})`)
    guideId = "(new)"
  } else {
    const { data: g, error } = await supabase
      .from("collection_guides")
      .insert({ user_id: userId, ...GUIDE })
      .select("id")
      .single()
    if (error) throw new Error(`create guide: ${error.message}`)
    guideId = g.id
  }

  // ── 3. Replace all entries (positions changed meaning in v2) ────
  if (!DRY && guideId !== "(new)") {
    const { error } = await supabase.from("guide_entries").delete().eq("guide_id", guideId)
    if (error) throw new Error(`clear old entries: ${error.message}`)
  }

  let created = 0, linked = 0, watchesCreated = 0
  console.log("")
  for (const e of ENTRIES) {
    const match = findByRef(e.reference_number)
    let watchId = match?.id ?? null
    let watchNote = match
      ? `linked to ${match.is_wishlist ? "wish-list " : match.is_coming_soon ? "coming-soon " : "owned "}watch (${match.model})`
      : null

    if (!watchId && e.create) {
      const mid = dollarsToCents((e.target_low + e.target_high) / 2)
      if (DRY) {
        watchNote = `would create wish-list watch "${e.title}" (${e.reference_number}, est. $${((e.target_low + e.target_high) / 2).toLocaleString()}, category ${e.category})`
      } else {
        const { data: nw, error } = await supabase
          .from("watches")
          .insert({
            user_id: userId,
            brand_id: brandId,
            model: e.title,
            reference_number: e.reference_number,
            category_id: categoryFor(e.category),
            purchase_price_cents: mid,
            is_wishlist: true,
            notes: `From the Grand Seiko Master Collection Guide (v${GUIDE.version}). ${e.recommended_variant}`,
          })
          .select("id")
          .single()
        if (error) throw new Error(`create watch ${e.title}: ${error.message}`)
        watchId = nw.id
        watchesCreated++
        watchNote = `created wish-list watch "${e.title}"`
      }
    } else if (!watchId && e.owned) {
      watchNote = `OWNED in guide but no watch matched ${e.reference_number} — link manually`
    } else if (!watchId && e.canon) {
      watchNote = "Canon — intentionally unlinked, no watch row"
    }

    if (DRY) {
      console.log(`#${String(e.position).padStart(2)} ${e.title.padEnd(34)} ${e.canon ? "CANON " : ""}${watchNote ?? ""}`)
      continue
    }
    const { error } = await supabase.from("guide_entries").insert({
      guide_id: guideId,
      user_id: userId,
      position: e.position,
      chapter: e.chapter,
      title: e.title,
      reference_number: e.reference_number,
      caliber: e.caliber,
      year_from: e.year_from,
      dates_text: e.dates_text,
      historical_role: e.historical_role,
      recommended_variant: e.recommended_variant,
      target_low_cents: dollarsToCents(e.target_low),
      target_high_cents: dollarsToCents(e.target_high),
      priority: e.priority,
      status: e.canon ? "passed" : "candidate",
      notes: e.note ?? (e.canon ? "Part B — The Canon: acknowledged, no capital allocated." : null),
      watch_id: watchId,
    })
    if (error) throw new Error(`insert entry ${e.title}: ${error.message}`)
    created++
    if (watchId) linked++
    if (watchNote) console.log(`#${String(e.position).padStart(2)} ${e.title}: ${watchNote}`)
  }

  console.log(`\nDone${DRY ? " (dry run — nothing written)" : ""}.`)
  if (!DRY) {
    console.log(`Wish-list watches deleted: ${deleted}`)
    console.log(`Entries inserted: ${created} (15 Part A + 4 Canon), linked: ${linked}`)
    console.log(`Wish-list watches created: ${watchesCreated}`)
    console.log("Cost: $0 (deterministic, no AI)")
  }
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err.message}`)
  process.exit(1)
})
