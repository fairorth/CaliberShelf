// One-time seeder for the "Grand Seiko" Master Collection Guide (migration
// 00038). Data extracted from docs/Watch guides/Grand Seiko Master Collection
// Guide.pdf (v1.1, Aug 2026).
//
// What it does, idempotently:
//   1. Upserts the collection_guides row ("Grand Seiko").
//   2. Upserts all 22 guide_entries by (guide, position).
//   3. For each entry, links an existing watch when one matches the entry's
//      reference number (this catches the 3 OWNED FOUNDATION pieces AND any
//      wish-list watch you already created for a candidate).
//   4. For still-unlinked candidate entries, creates a wish-list watch
//      (estimated cost = target band midpoint) and links it.
//
// Deterministic, $0, no AI. Requires migration 00038 to be applied first.
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
    "Every watch must earn its place: a future Grand Seiko should add a chapter, not merely another beautiful dial.",
  source_document: "Grand Seiko Master Collection Guide.pdf",
  version: "1.1",
}

// category: preferred category name for the auto-created wish-list watch
// (falls back to "Daily", then the first category found).
const ENTRIES = [
  { position: 1, chapter: "Origins & Golden Age", title: "Grand Seiko First", reference_number: "J14070", caliber: "3180 - manual wind", year_from: 1960, dates_text: "1960-1963", historical_role: "Genesis. The first Grand Seiko and the opening statement of the brand's pursuit of precision, legibility, durability and refinement.", recommended_variant: "14K gold-filled J14070 with original dial, crown and caseback medallion. Pay up for originality; avoid redials.", target_low: 4500, target_high: 8000, priority: 9.5, category: "Dress" },
  { position: 2, chapter: "Origins & Golden Age", title: "57GS", reference_number: "5722-9990", caliber: "5722A/B - manual wind", year_from: 1964, dates_text: "c. 1964-1967", historical_role: "The bridge from the classical First toward the sharper, more modern visual language that would culminate in the 44GS.", recommended_variant: "Sharp steel 5722-9990 with factory-original dial and strong medallion. Treat AD/SD dial claims cautiously unless documented.", target_low: 1400, target_high: 2300, priority: 6.5, category: "Dress" },
  { position: 3, chapter: "Origins & Golden Age", title: "44GS", reference_number: "4420-9000", caliber: "4420B - manual wind", year_from: 1967, dates_text: "1967-1968/69", historical_role: "The design milestone. This reference established the Grand Seiko Style: broad planes, razor-like facets and deliberate light-shadow geometry.", recommended_variant: "The sharpest honest case you can find, with intact medallion and original dial. Case geometry matters more than saving $1,000.", target_low: 3200, target_high: 5000, priority: 10, category: "Dress" },
  { position: 4, chapter: "Origins & Golden Age", title: "45GS", reference_number: "4520-7010", caliber: "4520A - manual wind, 36,000 vph", year_from: 1969, dates_text: "c. 1969-1970", historical_role: "Vintage technical anchor. A late-1960s manual Hi-Beat Grand Seiko carrying the first generation of GS 36,000-vph precision in a softer C-line case.", recommended_variant: "Keep this exact 4520-7010. Preserve the clean no-date dial, original case geometry and medallion — the vintage starting point of the precision lineage.", target_low: 1000, target_high: 1600, priority: 10, category: "Dress", owned: true },
  { position: 5, chapter: "Origins & Golden Age", title: "62GS", reference_number: "6245-9000", caliber: "6245A - automatic", year_from: 1966, dates_text: "1966-1968", historical_role: "Grand Seiko's first automatic watch, and a historically important bezel-free case architecture still echoed in modern GS design.", recommended_variant: "Date-only 6245-9000, preferably with a crisp case and correct lion medallion. Cleaner and more elegant than the day-date 6246.", target_low: 1500, target_high: 3000, priority: 8.5, category: "Dress" },
  { position: 6, chapter: "Origins & Golden Age", title: "61GS Hi-Beat", reference_number: "6145-8000", caliber: "6145A - automatic 36,000 vph", year_from: 1968, dates_text: "1968-early 1970s", historical_role: "Japan's first automatic 10-beat / 36,000-vph Grand Seiko. A perfect technical counterpart to the manual-wind 45GS.", recommended_variant: "Date-only 6145-8000 with the best original case and dial available. Crosshair dial only if factory originality is convincing.", target_low: 1200, target_high: 1800, priority: 9, category: "Dress" },
  { position: 7, chapter: "Origins & Golden Age", title: "61GS V.F.A.", reference_number: "6185-8020", caliber: "6185A - automatic 36,000 vph V.F.A.", year_from: 1969, dates_text: "1969-early 1970s", historical_role: "The vintage mechanical precision summit. V.F.A. watches were adjusted to extraordinary monthly accuracy and form the ideal bridge to modern U.F.A.", recommended_variant: "Dream target: early 1969 short-hand, applied Suwa-logo dial without printed VFA, if originality is verified. Otherwise the best original printed-VFA example.", target_low: 8000, target_high: 14000, priority: 10, category: "Horology" },
  { position: 8, chapter: "Quartz & The Rebirth", title: "95GS Quartz", reference_number: "SBGS001", caliber: "9581 - high-accuracy quartz", year_from: 1988, dates_text: "1988-early 1990s", historical_role: "The 1988 return of Grand Seiko in quartz form. The historically exact 95GS chapter before the later 9F generation.", recommended_variant: "Steel SBGS001 from the first generation, ideally with original crown and bracelet/strap hardware and an unmolested slim case.", target_low: 500, target_high: 900, priority: 6.5, category: "Dress" },
  { position: 9, chapter: "Quartz & The Rebirth", title: "9F 25th Anniversary", reference_number: "SBGT241", caliber: "9F83 - special +/-5 sec/year quartz", year_from: 2018, dates_text: "2018 only - LE 1,500", historical_role: "A deliberately collectible commemoration of 25 years of 9F, revisiting the original 9F aesthetic with a specially selected oscillator.", recommended_variant: "Full-set SBGT241 with sharp case and original bracelet. Tells the 9F story more vividly than a generic later 9F reference.", target_low: 2500, target_high: 3200, priority: 8, category: "Dress" },
  { position: 10, chapter: "Quartz & The Rebirth", title: "Mechanical Rebirth", reference_number: "SBGR001", caliber: "9S55 - automatic", year_from: 1998, dates_text: "1998-early 2000s", historical_role: "The 1998 rebirth of mechanical Grand Seiko and the start of the modern 9S lineage. Quiet-looking, historically enormous.", recommended_variant: "Early double-logo SBGR001, ideally full set. Buy on condition and completeness rather than dial drama.", target_low: 1800, target_high: 3000, priority: 8, category: "Daily" },
  { position: 11, chapter: "Quartz & The Rebirth", title: "Automatic Spring Drive Genesis", reference_number: "SBGA001", caliber: "9R65 - automatic Spring Drive", year_from: 2004, dates_text: "2004-2017", historical_role: "The launch-generation automatic 9R Spring Drive Grand Seiko — Spring Drive becoming a core GS technology rather than an experiment.", recommended_variant: "Pre-2017 double-logo SBGA001, preferably an early full-set example. The old branding makes the watch a timestamp.", target_low: 2500, target_high: 3500, priority: 8.5, category: "Daily" },
  { position: 12, chapter: "Modern Grand Seiko Emerges", title: "Original Snowflake", reference_number: "SBGA011", caliber: "9R65 - automatic Spring Drive", year_from: 2005, dates_text: "2005-2017", historical_role: "The watch that made Spring Drive visually and emotionally synonymous with Grand Seiko. A modern icon with real historical weight.", recommended_variant: "SBGA011 specifically, not SBGA211: the pre-2017 SEIKO / Grand Seiko double-logo dial is the more historically expressive version.", target_low: 3300, target_high: 4200, priority: 10, category: "Daily" },
  { position: 13, chapter: "Modern Grand Seiko Emerges", title: "Modern Hi-Beat Revival", reference_number: "SBGH001", caliber: "9S85 - automatic 36,000 vph", year_from: 2009, dates_text: "2009-2017 era", historical_role: "The return of automatic 36,000-vph Grand Seiko roughly four decades after the 61GS. A direct modern echo of the vintage Hi-Beat era.", recommended_variant: "Early double-logo SBGH001, ideally full set. Lower priority only because the 45GS already owns this historical theme so well.", target_low: 2700, target_high: 3500, priority: 7, category: "Daily" },
  { position: 14, chapter: "Modern Grand Seiko Emerges", title: "Spring Drive 8 Days", reference_number: "SBGD001", caliber: "9R01 - manual Spring Drive, 8 days", year_from: 2016, dates_text: "2016-2017", historical_role: "First Grand Seiko made by the Micro Artist Studio. The 8-day movement and rear power-reserve display push Spring Drive into haute horlogerie.", recommended_variant: "SBGD001 rather than later SBGD201: the original pre-rebrand, first-series expression. Full provenance is highly desirable.", target_low: 35000, target_high: 55000, priority: 7.5, category: "Horology" },
  { position: 15, chapter: "Modern Grand Seiko Emerges", title: "First Re-Creation", reference_number: "SBGW253", caliber: "9S64 - manual wind", year_from: 2017, dates_text: "2017 only - LE 1,960", historical_role: "A modern steel re-creation of the 1960 First, released as Grand Seiko stepped forward with a more independent global brand identity.", recommended_variant: "Steel SBGW253 over the precious-metal sisters for wearability and value. Full set, clean case, original strap/buckle preferred. (Guide: priority 9 while the First is unowned; drops to 7 once a First is acquired.)", target_low: 5000, target_high: 6500, priority: 9, category: "Dress" },
  { position: 16, chapter: "Modern Grand Seiko Emerges", title: "Micro Artist 9R02 Masterpiece", reference_number: "SBGZ001", caliber: "9R02 - manual Spring Drive", year_from: 2019, dates_text: "2019 - LE 30", historical_role: "An artisanal Spring Drive summit: hand-finished 9R02, 84-hour reserve and hand-engraved platinum case from the Micro Artist Studio.", recommended_variant: "SBGZ001 itself, with complete provenance. At this level, condition, original accessories and service history matter enormously.", target_low: 55000, target_high: 70000, priority: 6.5, category: "Horology" },
  { position: 17, chapter: "The New Technical Age", title: "First 9SA5", reference_number: "SLGH002", caliber: "9SA5 - automatic Hi-Beat 36,000 vph", year_from: 2020, dates_text: "2020 - LE 100", historical_role: "The first production watch with 9SA5: Dual Impulse Escapement, free-sprung balance and 80 hours of reserve at 36,000 vph.", recommended_variant: "Full-set SLGH002 in 18K yellow gold — the collector-first choice for the literal beginning of the 9SA5 era.", target_low: 28000, target_high: 36000, priority: 8.5, category: "Horology" },
  { position: 18, chapter: "The New Technical Age", title: "White Birch", reference_number: "SLGH005", caliber: "9SA5 - automatic Hi-Beat 36,000 vph", year_from: 2021, dates_text: "2021-present", historical_role: "The wearable flagship expression of the new 9SA5 mechanical architecture and Evolution 9 design language. A modern mechanical cornerstone.", recommended_variant: "Regular-production SLGH005, bought lightly used and unpolished. Far more wearable value than SLGH002 while telling nearly the same technical story.", target_low: 6000, target_high: 7500, priority: 9.5, category: "Daily" },
  { position: 19, chapter: "The New Technical Age", title: "Mist Flake GMT", reference_number: "SBGE285", caliber: "9R66 - automatic Spring Drive GMT", year_from: 2022, dates_text: "2022-present", historical_role: "Modern practical anchor: Evolution 9, High-Intensity Titanium, true traveler GMT and mature Spring Drive in one highly wearable package.", recommended_variant: "Keep the SBGE285 — it fills the modern Spring Drive GMT / Evolution 9 sport chapter extremely well; no duplicate GMT needed.", target_low: 6200, target_high: 6300, priority: 9, category: "Sport", owned: true },
  { position: 20, chapter: "The New Technical Age", title: "Kodo Constant-Force Tourbillon", reference_number: "SLGT003", caliber: "9ST1 - manual complication", year_from: 2022, dates_text: "2022 - LE 20", historical_role: "Grand Seiko's first mechanical complication: a tourbillon and constant-force mechanism coaxially on one axis. A true technical landmark.", recommended_variant: "Original SLGT003, full provenance, if the laws of household finance temporarily cease to apply. Historically essential; practically optional.", target_low: 250000, target_high: 325000, priority: 4, category: "Horology" },
  { position: 21, chapter: "The New Technical Age", title: "Tentagraph", reference_number: "SLGC001", caliber: "9SC5 - automatic Hi-Beat chronograph", year_from: 2023, dates_text: "2023-present", historical_role: "Grand Seiko's first mechanical chronograph, built around a 36,000-vph movement with a three-day reserve. A major complication milestone.", recommended_variant: "Original blue-dial SLGC001 launch reference. Mandatory wrist test before buying: the historical importance is easier than the dimensions.", target_low: 9000, target_high: 11500, priority: 7.5, category: "Chronograph" },
  { position: 22, chapter: "The New Technical Age", title: "Violet Dawn", reference_number: "SLGB005", caliber: "9RB2 Spring Drive U.F.A. - +/-20 sec/year", year_from: 2025, dates_text: "2025 - LE 1,300", historical_role: "The U.F.A. precision milestone and the modern endpoint of Grand Seiko's long accuracy obsession — the modern anchor of a 4520 → V.F.A. → U.F.A. precision sequence.", recommended_variant: "Keep the full set and enjoy it.", target_low: 11100, target_high: 11100, priority: 10, category: "Horology", owned: true },
]

function dollarsToCents(d) {
  return Math.round(d * 100)
}

async function main() {
  console.log(`Seeding "Grand Seiko" Master Collection Guide${DRY ? " (DRY RUN)" : ""}\n`)

  // Single-user app: resolve the owner from profiles.
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("id")
  if (profErr) throw new Error(`profiles: ${profErr.message}`)
  if (!profiles || profiles.length !== 1) {
    throw new Error(`Expected exactly 1 profile, found ${profiles?.length ?? 0}.`)
  }
  const userId = profiles[0].id

  // Brand: Grand Seiko must exist (create if somehow missing).
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", "grand seiko")
  let brandId = brands?.[0]?.id
  if (!brandId) {
    if (DRY) {
      console.log("Would create brand: Grand Seiko")
      brandId = "(new)"
    } else {
      const { data: nb, error } = await supabase
        .from("brands")
        .insert({ user_id: userId, name: "Grand Seiko" })
        .select("id")
        .single()
      if (error) throw new Error(`create brand: ${error.message}`)
      brandId = nb.id
      console.log("Created brand: Grand Seiko")
    }
  }

  // Categories for auto-created wish-list watches.
  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
  if (catErr) throw new Error(`categories: ${catErr.message}`)
  if (!cats?.length) throw new Error("No categories found — cannot create watches.")
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))
  const fallbackCat = catByName.get("daily") ?? cats[0].id
  const categoryFor = (name) => catByName.get(name.toLowerCase()) ?? fallbackCat

  // The user's Grand Seiko watches, for reference-number linking.
  const { data: gsWatches, error: wErr } = await supabase
    .from("watches")
    .select("id, model, reference_number, is_wishlist, is_coming_soon")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
  if (wErr) throw new Error(`watches: ${wErr.message}`)
  const watchByRef = new Map(
    (gsWatches ?? [])
      .filter((w) => w.reference_number)
      .map((w) => [w.reference_number.trim().toLowerCase(), w])
  )

  // 1. Guide upsert (by user+name).
  let guideId
  const { data: existingGuide } = await supabase
    .from("collection_guides")
    .select("id")
    .eq("user_id", userId)
    .eq("name", GUIDE.name)
    .maybeSingle()
  if (existingGuide) {
    guideId = existingGuide.id
    console.log(`Guide exists (${guideId}) — entries will be upserted.`)
    if (!DRY) {
      await supabase
        .from("collection_guides")
        .update({ thesis: GUIDE.thesis, source_document: GUIDE.source_document, version: GUIDE.version })
        .eq("id", guideId)
    }
  } else if (DRY) {
    console.log(`Would create guide: ${GUIDE.name} (v${GUIDE.version})`)
    guideId = "(new)"
  } else {
    const { data: g, error } = await supabase
      .from("collection_guides")
      .insert({ user_id: userId, ...GUIDE })
      .select("id")
      .single()
    if (error) throw new Error(`create guide: ${error.message}`)
    guideId = g.id
    console.log(`Created guide: ${GUIDE.name} (${guideId})`)
  }

  // Existing entries (idempotent re-run).
  const { data: existingEntries } = guideId === "(new)"
    ? { data: [] }
    : await supabase.from("guide_entries").select("id, position, watch_id").eq("guide_id", guideId)
  const entryByPos = new Map((existingEntries ?? []).map((e) => [e.position, e]))

  let created = 0, updated = 0, linked = 0, watchesCreated = 0
  for (const e of ENTRIES) {
    // Resolve the watch link: existing watch with this reference?
    const match = e.reference_number
      ? watchByRef.get(e.reference_number.trim().toLowerCase())
      : undefined
    let watchId = match?.id ?? null
    let watchNote = match
      ? `linked to existing ${match.is_wishlist ? "wish-list " : ""}watch (${match.model})`
      : null

    // No match and it's a candidate → create the wish-list watch.
    if (!watchId && !e.owned) {
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
      watchNote = `OWNED in guide but no watch matched ref ${e.reference_number} — left unlinked, link manually`
    }

    const row = {
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
      watch_id: watchId,
    }

    const existing = entryByPos.get(e.position)
    if (DRY) {
      console.log(`#${String(e.position).padStart(2)} ${e.title.padEnd(32)} ${existing ? "update" : "create"}${watchNote ? ` — ${watchNote}` : ""}`)
      continue
    }
    if (existing) {
      // Preserve an existing link/status; only fill a missing link.
      const patch = { ...row }
      if (existing.watch_id) delete patch.watch_id
      const { error } = await supabase.from("guide_entries").update(patch).eq("id", existing.id)
      if (error) throw new Error(`update entry ${e.title}: ${error.message}`)
      updated++
      if (!existing.watch_id && watchId) linked++
    } else {
      const { error } = await supabase.from("guide_entries").insert(row)
      if (error) throw new Error(`insert entry ${e.title}: ${error.message}`)
      created++
      if (watchId) linked++
    }
    if (watchNote) console.log(`#${String(e.position).padStart(2)} ${e.title}: ${watchNote}`)
  }

  console.log(`\nDone${DRY ? " (dry run — nothing written)" : ""}.`)
  if (!DRY) {
    console.log(`Entries created: ${created}, updated: ${updated}, linked: ${linked}`)
    console.log(`Wish-list watches created: ${watchesCreated}`)
    console.log("Cost: $0 (deterministic, no AI)")
  }
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err.message}`)
  process.exit(1)
})
