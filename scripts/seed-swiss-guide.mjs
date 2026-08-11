// One-time seeder for the "Swiss Artisans" Master Collection Guide (Part II
// of the Horological Master Collection Series): Jaeger-LeCoultre x Vacheron
// Constantin. Data extracted from docs/Watch Guides/Swiss Artisans.pdf
// (2026 edition, Aug 2026).
//
// What it does, idempotently (same skeleton as seed-gs-guide.mjs):
//   1. Upserts the collection_guides row ("Swiss Artisans").
//   2. Upserts all 21 guide_entries by (guide, position). Unlike the GS guide
//      this one spans TWO brands — each entry carries its brand, and the
//      chapter is the maison name.
//   3. Links existing watches by reference number (suffix-tolerant), with a
//      model-name fallback for watches stored without a reference
//      (match_model hint) — that catches the owned/pre-ordered foundations.
//   4. For still-unlinked TARGET entries, creates a wish-list watch
//      (estimated cost = target band midpoint) under the right brand.
//      Foundation/pre-ordered entries are never auto-created.
//
// Deterministic, $0, no AI.
//
// Usage:
//   npm run seed-swiss-guide -- --dry-run   # report what would happen
//   npm run seed-swiss-guide                # do it
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
  name: "Swiss Artisans",
  thesis:
    "Jaeger-LeCoultre as the movement laboratory; Vacheron Constantin as the Genevan master of shaped cases, displays and calendars. Every purchase must add a chapter, not merely another prestigious logo.",
  source_document: "Swiss Artisans.pdf",
  version: "1.0",
}

// brand: which maison the entry (and any auto-created watch) belongs to.
// match_model: fallback link hint for app watches stored without a reference.
// owned: guide marks it a foundation (owned or pre-ordered) — never auto-create.
const BRANDS = {
  jlc: { search: "%jaeger%", canonical: "Jaeger-LeCoultre", chapter: "Jaeger-LeCoultre" },
  vc: { search: "%vacheron%", canonical: "Vacheron Constantin", chapter: "Vacheron Constantin" },
}

const ENTRIES = [
  { position: 1, brand: "vc", title: "Vintage Triple Calendar", reference_number: "4240 / 4241", caliber: "V485 family - manual", year_from: 1945, dates_text: "1940s", historical_role: "The historical source material behind modern Historiques calendars. A genuine mid-century complicated Vacheron adds archival gravity without chasing stratospheric vintage chronographs.", recommended_variant: "Prefer honest yellow-gold 4240 with untouched two-tone dial and Extract from the Archives. Avoid refinished calendar dials.", target_low: 12000, target_high: 20000, priority: 9, category: "Dress" },
  { position: 2, brand: "jlc", title: "Futurematic E501", reference_number: "E501", caliber: "497 - automatic", year_from: 1951, dates_text: "1951-mid 1950s", historical_role: "One of JLC's great engineering flexes: a crownless automatic architecture with power reserve and back-set time control. Conceptual ancestor of the 2026 Date Power Reserve.", recommended_variant: "Steel, silver/beige dial, crisp case and correct back-setting mechanism. Originality outranks cosmetic perfection.", target_low: 2500, target_high: 4500, priority: 10, category: "Dress" },
  { position: 3, brand: "jlc", title: "Memovox Automatic Calendar", reference_number: "E855", caliber: "825 - automatic alarm", year_from: 1958, dates_text: "late 1950s-1960s", historical_role: "The quintessential JLC audible complication. Automatic winding, date and mechanical alarm make this one of the Maison's most important post-war signatures.", recommended_variant: "Steel, silver dial, applied markers. Avoid refinished dials; pay for a clean alarm disc and strong original case.", target_low: 3500, target_high: 5500, priority: 9.5, category: "Dress" },
  { position: 4, brand: "vc", title: "1972 / Prestige de la France", reference_number: "37010", caliber: "manual-wind ultra-thin family", year_from: 1972, dates_text: "1970s / later Historiques", historical_role: "Vacheron's asymmetric design language distilled into a dress watch. Historically important design recognition, visually daring and far less obvious than an American 1921.", recommended_variant: "Sharp case, original dial, white or yellow gold depending on specimen. This is a condition-first shaped-watch hunt.", target_low: 12500, target_high: 15500, priority: 9, category: "Dress" },
  { position: 5, brand: "vc", title: "Mercator", reference_number: "43050", caliber: "1120/2 - automatic", year_from: 1995, dates_text: "1990s-early 2000s", historical_role: "One of Vacheron's great display oddities: map dial with bi-retrograde hands. Cartography, artistic craft and unconventional mechanics in one unmistakable object.", recommended_variant: "Yellow-gold Europe/Africa/Asia map if a credible sub-$45K example appears. Platinum and rare enamel variants can become financially feral.", target_low: 35000, target_high: 45000, priority: 9.5, category: "Horology", note: "Stretch target." },
  { position: 6, brand: "vc", title: "Malte Power Reserve / Date", reference_number: "83060", caliber: "1420 family - manual", year_from: 1995, dates_text: "1990s-2000s", historical_role: "Neo-vintage Vacheron with exactly the right complication mix: reserve display, date and restrained proportions, usually trading far below modern VC retail logic.", recommended_variant: "White- or rose-gold with clean silver dial; prioritize documented service and unpolished case geometry.", target_low: 9000, target_high: 13000, priority: 8.5, category: "Dress" },
  { position: 7, brand: "vc", title: "Malte Dual Time Regulator", reference_number: "42005/000G-8900", caliber: "automatic regulator / dual-time", year_from: 2003, dates_text: "early 2000s", historical_role: "A magnificently eccentric Vacheron: central minutes, separate hour display, second time zone and calendar architecture. The regulator layout is instantly unlike conventional VC.", recommended_variant: "White-gold silver-dial version. Condition, correct hands and service history are especially important.", target_low: 14000, target_high: 17000, priority: 9.5, category: "Dress", note: "In negotiation (Aug 2026)." },
  { position: 8, brand: "jlc", title: "Master Grand Réveil", reference_number: "Q163842A", caliber: "909/1 family - automatic", year_from: 2005, dates_text: "2000s", historical_role: "Perpetual calendar plus mechanical alarm in steel. Enormous horological content from an era when JLC quietly built complicated monsters for comparatively sane money.", recommended_variant: "Steel Q163842A. Buy only with strong service evidence; complexity makes deferred maintenance a false economy.", target_low: 10500, target_high: 13500, priority: 9, category: "Horology" },
  { position: 9, brand: "vc", title: "Historiques Toledo 1952", reference_number: "47300", caliber: "1125 - automatic", year_from: 2005, dates_text: "2000s-2010s", historical_role: "A sculptural complete calendar in the curved \"cioccolatone\" case. Complicated, shaped and historically rooted without being a generic grail-list Vacheron.", recommended_variant: "Rose gold 47300/000R-9219 for warmth, or yellow gold if the better specimen appears. Full set preferred but not mandatory.", target_low: 13500, target_high: 16500, priority: 10, category: "Dress" },
  { position: 10, brand: "jlc", title: "Grande Reverso GMT", reference_number: "Q3028420", caliber: "878 - manual", year_from: 2006, dates_text: "mid-2000s", historical_role: "The deliberately non-obvious Reverso: two faces, GMT, big date, day/night and power reserve. The icon becomes a complication laboratory.", recommended_variant: "Steel, complete set if possible. Prioritize sharp gadroons and a clean carriage over strap originality.", target_low: 7000, target_high: 10000, priority: 9, category: "Dress" },
  { position: 11, brand: "jlc", title: "AMVOX2 Chronograph", reference_number: "Q192T25", caliber: "751 / 751E - automatic", year_from: 2006, dates_text: "c. 2006-2012", historical_role: "Aston Martin collaboration with a case-actuated vertical-trigger chronograph: press the upper or lower crystal area to start, stop and reset. Peak experimental JLC.", recommended_variant: "Titanium/PVD limited version if condition is excellent. Service history matters more than small cosmetic savings.", target_low: 8500, target_high: 11000, priority: 8.5, category: "Chronograph" },
  { position: 12, brand: "vc", title: "Historiques Chronomètre Royal 1907", reference_number: "86122/000R-9362", caliber: "2460 SCC - automatic", year_from: 2007, dates_text: "2007-era", historical_role: "A chronometry-first Vacheron: tied to the important Chronomètre Royal lineage rather than fashionable sports-watch mythology.", recommended_variant: "Rose-gold 86122. Seek full set and recent service; the appeal is historical seriousness and restrained execution.", target_low: 18000, target_high: 22000, priority: 9, category: "Dress" },
  { position: 13, brand: "jlc", title: "Duomètre à Chronographe", reference_number: "Q6012420", caliber: "380 - manual", year_from: 2007, dates_text: "2007-2010s", historical_role: "The first Duomètre application: two barrels and independent gear trains feed timekeeping and chronograph functions through one regulator, insulating precision from complication load.", recommended_variant: "Early rose-gold Q6012420 at the bottom of the secondary range. A stretch piece justified by architecture, not logo prestige.", target_low: 18000, target_high: 23000, priority: 9.5, category: "Chronograph", note: "Stretch target." },
  { position: 14, brand: "vc", title: "Les Historiques Ultra-Fine 1955", reference_number: "33155/000R-9588", caliber: "1003 - manual ultra-thin", year_from: 2008, dates_text: "late 2000s-2010s", historical_role: "A movement-history card: Calibre 1003 is one of the legendary ultra-thin hand-wound architectures. This adds pure movement elegance instead of another display complication.", recommended_variant: "Rose gold is the canonical target. Buy for movement condition, case sharpness and thinness rather than dial theatrics.", target_low: 12000, target_high: 18000, priority: 8.5, category: "Dress" },
  { position: 15, brand: "vc", title: "Historiques Aronde 1954", reference_number: "81018/000R-9657", caliber: "1400 AS - manual", year_from: 2011, dates_text: "2011 limited edition", historical_role: "A beautifully obscure shaped-case revival with a hand-wound Geneva Seal movement. Almost nobody outside serious VC circles has it on the standard wish list.", recommended_variant: "Rose-gold limited edition. A textbook \"buy the watchmaker, not the hype\" target.", target_low: 11000, target_high: 14000, priority: 9, category: "Dress" },
  { position: 16, brand: "jlc", title: "Master Ultra Thin Réserve de Marche", reference_number: "Q1378420", caliber: "938/1 - automatic", year_from: 2012, dates_text: "c. 2012-2024", historical_role: "The elegant modern JLC baseline: ultra-thin proportions, pointer date, small seconds and the power-reserve complication that is already a recurring thread in the collection.", recommended_variant: "Keep the silver-dial steel reference. It is the quiet classical counterweight to the more experimental pieces.", target_low: 5200, target_high: 7500, priority: null, category: "Dress", owned: true },
  { position: 17, brand: "jlc", title: "Geophysic True Second", reference_number: "Q8018420", caliber: "770 - automatic", year_from: 2015, dates_text: "2015-c. 2019", historical_role: "A mechanical watch that ticks once per second on purpose. Its dead-beat seconds mechanism is wonderfully counterintuitive and tied to JLC's chronometric Geophysic lineage.", recommended_variant: "Steel/silver dial, full set preferred. A modern sleeper where condition is easy to find, so price discipline matters.", target_low: 5500, target_high: 7000, priority: 9, category: "Daily" },
  { position: 18, brand: "vc", title: "Quai de l'Île Self-Winding", reference_number: "4500S/000A-B195", caliber: "5100 - automatic", year_from: 2016, dates_text: "2016-c. 2019", historical_role: "Vacheron at its least conventional: layered security-print-inspired dial, unusual case construction and peripheral date. A brilliant modern-design outlier.", recommended_variant: "Keep the silver/steel execution. It gives the VC half of the collection a modern experimental anchor.", target_low: 9000, target_high: 12000, priority: null, category: "Daily", owned: true, match_model: "quai" },
  { position: 19, brand: "vc", title: "Historiques Triple Calendrier 1942", reference_number: "3110V/000A-B425", caliber: "4400 QC - manual", year_from: 2017, dates_text: "2017-c. 2022", historical_role: "Steel, Geneva Seal, hand-wound complete calendar and one of the most convincing modern heritage revivals. Serious VC character without precious-metal pricing.", recommended_variant: "Slight preference for B426 blue accents; buy whichever dial comes with the cleaner full-set specimen and sharper price.", target_low: 16000, target_high: 19000, priority: 9, category: "Dress" },
  { position: 20, brand: "jlc", title: "Polaris Geographic", reference_number: "Q9078640", caliber: "939 - automatic", year_from: 2024, dates_text: "2024-present", historical_role: "Modern JLC travel engineering: city selector, second zone, day/night and power reserve wrapped in the edgy contemporary Polaris language.", recommended_variant: "The ocean-grey version is the one to keep; it gives the collection a modern sporting spine.", target_low: null, target_high: null, priority: null, category: "Sport", owned: true },
  { position: 21, brand: "jlc", title: "Master Control Chronometre Date Power Reserve", reference_number: "Q4168120", caliber: "738 - automatic", year_from: 2026, dates_text: "2026-present", historical_role: "A 2026 milestone: integrated bracelet, chronometer testing and a twin-register layout deliberately echoing JLC's 1951 Futurematic.", recommended_variant: "Exactly the steel launch reference. Its historical connection to Futurematic makes that vintage pairing irresistible.", target_low: null, target_high: null, priority: null, category: "Daily", owned: true, match_model: "mastercontrol", note: "Pre-ordered direct from JLC (2026)." },
]

const dollarsToCents = (d) => (d == null ? null : Math.round(d * 100))
const normRef = (r) => r.toUpperCase().replace(/\s+/g, "")
const normModel = (m) => m.toLowerCase().replace(/[^a-z0-9]/g, "")

async function main() {
  console.log(`Seeding "${GUIDE.name}" Master Collection Guide${DRY ? " (DRY RUN)" : ""}\n`)

  const { data: profiles, error: profErr } = await supabase.from("profiles").select("id")
  if (profErr) throw new Error(`profiles: ${profErr.message}`)
  if (!profiles || profiles.length !== 1) {
    throw new Error(`Expected exactly 1 profile, found ${profiles?.length ?? 0}.`)
  }
  const userId = profiles[0].id

  // Resolve both brands (fuzzy — the DB may spell them differently).
  const brandIds = {}
  for (const [key, b] of Object.entries(BRANDS)) {
    const { data: found } = await supabase
      .from("brands")
      .select("id, name")
      .eq("user_id", userId)
      .ilike("name", b.search)
    if (found?.length) {
      brandIds[key] = found[0].id
      if (found[0].name !== b.canonical) {
        console.log(`Brand "${found[0].name}" used for ${b.canonical} (spelling differs — rename in-app if desired).`)
      }
    } else if (DRY) {
      console.log(`Would create brand: ${b.canonical}`)
      brandIds[key] = "(new)"
    } else {
      const { data: nb, error } = await supabase
        .from("brands")
        .insert({ user_id: userId, name: b.canonical })
        .select("id")
        .single()
      if (error) throw new Error(`create brand ${b.canonical}: ${error.message}`)
      brandIds[key] = nb.id
      console.log(`Created brand: ${b.canonical}`)
    }
  }

  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
  if (catErr) throw new Error(`categories: ${catErr.message}`)
  if (!cats?.length) throw new Error("No categories found — cannot create watches.")
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))
  const fallbackCat = catByName.get("daily") ?? cats[0].id
  const categoryFor = (name) => catByName.get(name.toLowerCase()) ?? fallbackCat

  // Both brands' watches, for ref + model-name linking.
  const watchesByBrand = {}
  for (const [key, id] of Object.entries(brandIds)) {
    if (id === "(new)") {
      watchesByBrand[key] = []
      continue
    }
    const { data: ws, error } = await supabase
      .from("watches")
      .select("id, model, reference_number, is_wishlist, is_coming_soon")
      .eq("user_id", userId)
      .eq("brand_id", id)
    if (error) throw new Error(`watches: ${error.message}`)
    watchesByBrand[key] = ws ?? []
  }
  const findWatch = (entry) => {
    const pool = watchesByBrand[entry.brand]
    if (entry.reference_number) {
      const target = normRef(entry.reference_number)
      const byRef = pool.find((w) => {
        if (!w.reference_number) return false
        const wr = normRef(w.reference_number)
        return wr === target || wr.endsWith(target) || target.endsWith(wr)
      })
      if (byRef) return byRef
    }
    if (entry.match_model) {
      return pool.find((w) => normModel(w.model).includes(entry.match_model))
    }
    return undefined
  }

  // Guide upsert (by user+name).
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

  const { data: existingEntries } = guideId === "(new)"
    ? { data: [] }
    : await supabase.from("guide_entries").select("id, position, watch_id").eq("guide_id", guideId)
  const entryByPos = new Map((existingEntries ?? []).map((e) => [e.position, e]))

  let created = 0, updated = 0, linked = 0, watchesCreated = 0
  for (const e of ENTRIES) {
    const match = findWatch(e)
    let watchId = match?.id ?? null
    let watchNote = match
      ? `linked to existing ${match.is_wishlist ? "wish-list " : match.is_coming_soon ? "coming-soon " : ""}watch (${match.model})`
      : null

    if (!watchId && !e.owned) {
      const mid = dollarsToCents((e.target_low + e.target_high) / 2)
      if (DRY) {
        watchNote = `would create wish-list watch "${e.title}" (${e.reference_number}, est. $${((e.target_low + e.target_high) / 2).toLocaleString()}, ${BRANDS[e.brand].canonical}, category ${e.category})`
      } else {
        const { data: nw, error } = await supabase
          .from("watches")
          .insert({
            user_id: userId,
            brand_id: brandIds[e.brand],
            model: e.title,
            reference_number: e.reference_number,
            category_id: categoryFor(e.category),
            purchase_price_cents: mid,
            is_wishlist: true,
            notes: `From the Swiss Artisans Master Collection Guide (v${GUIDE.version}). ${e.recommended_variant}`,
          })
          .select("id")
          .single()
        if (error) throw new Error(`create watch ${e.title}: ${error.message}`)
        watchId = nw.id
        watchesCreated++
        watchNote = `created wish-list watch "${e.title}"`
      }
    } else if (!watchId && e.owned) {
      watchNote = `FOUNDATION in guide but no watch matched (${e.reference_number}) — left unlinked, link manually`
    }

    const row = {
      guide_id: guideId,
      user_id: userId,
      position: e.position,
      chapter: BRANDS[e.brand].chapter,
      title: e.title,
      reference_number: e.reference_number,
      caliber: e.caliber,
      year_from: e.year_from,
      dates_text: e.dates_text,
      historical_role: e.historical_role,
      recommended_variant: e.recommended_variant,
      target_low_cents: dollarsToCents(e.target_low),
      target_high_cents: dollarsToCents(e.target_high),
      priority: e.priority ?? null,
      notes: e.note ?? null,
      watch_id: watchId,
    }

    const existing = entryByPos.get(e.position)
    if (DRY) {
      console.log(`#${String(e.position).padStart(2)} ${e.title.padEnd(44)} ${existing ? "update" : "create"}${watchNote ? ` — ${watchNote}` : ""}`)
      continue
    }
    if (existing) {
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
