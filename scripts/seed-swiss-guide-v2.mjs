// Restructures the "Swiss Artisans" Master Collection Guide to v2.0:
// "A Trio of Swiss Artisans — The Idea, the Engine and the Cathedral"
// (Breguet × Jaeger-LeCoultre × Vacheron Constantin), narrative-first,
// per docs/Watch Guides/Swiss Artisans v2.0 draft.md.
//
// What it does, idempotently:
//   1. Updates the collection_guides row (thesis, version 2.0).
//   2. Re-chapters and re-positions the 21 existing entries onto the
//      sixteen-chapter timeline spine (two-phase move through +1000
//      positions to dodge the UNIQUE (guide_id, position) constraint).
//   3. CUTS P6 Malte 83060, P10 Grande Reverso GMT, P11 AMVOX2, P15 Aronde
//      -> status 'passed', watch_id cleared (linked entries derive status
//      live, so unlinking is what makes 'passed' take effect). Watch rows
//      are NEVER deleted.
//   4. Canon: Mercator stays in-guide under chapter 'Canon'.
//      Alternates: Grand Réveil + Toledo stay live under 'Alternates'.
//   5. Inserts the new chapters: Breguet Classique, Tradition 7097 (owned,
//      linked by ref/model — never auto-created), Type XX 3800, Reverso
//      Tribute, Overseas 42042, Roth-era Breguet, plus Canon rows for the
//      222, Classique Tourbillon and Souscription 2025 (Canon rows get no
//      wish-list watches — no capital assigned).
//   6. Creates wish-list watches (band midpoint, variant advice in notes)
//      ONLY for new target entries whose band is validated; entries whose
//      band is still null are inserted bandless with a "pending evidence
//      pass" note and no watch.
//
// Deterministic, $0, no AI.
//
// Usage:
//   node scripts/seed-swiss-guide-v2.mjs --dry-run
//   node scripts/seed-swiss-guide-v2.mjs
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

const AS_OF = "2026-08-14"
const TAG = "[v2.0 2026-08]"

const GUIDE = {
  name: "Swiss Artisans",
  version: "2.0",
  source_document: "Swiss Artisans v2.0 draft.md (illustrated PDF pending)",
  thesis:
    "The Idea, the Engine and the Cathedral: Breguet invents (Paris — the overcoil, tourbillon, pare-chute and the visual grammar of watchmaking), Jaeger-LeCoultre engineers (the Vallée de Joux — ébauches, calibre 920, the laboratory), Vacheron Constantin composes (Geneva — Seal-finished elegance on valley engines). A watch earns a chapter only as a documented crossing between the houses or the definitive statement of a virtue one house owns outright.",
}

// ---- Breguet bands: FILL FROM scratch/swiss-review/breguet_evidence.md
// ---- before the live run. null = band pending -> entry inserted bandless,
// ---- no wish-list watch created.
// Validated 2026-08-14, scratch/swiss-review/breguet_evidence.md:
const BREGUET_BANDS = {
  classique: { low: 8000, high: 13000 }, // 5157-path, med conf (7147 runs $13-18k ask-derived, low conf)
  typexx: { low: 3800, high: 5200 }, //     3800 no box/papers, med conf (6 solds)
  rothEra: { low: 14000, high: 22000 }, //  3130/3137, LOW conf (2 solds, 2006/2011)
  tourbillon: { low: 28000, high: 42000 }, // 3350/3357, med conf (7 solds, freshest 19mo)
}

const BRANDS = {
  jlc: { search: "%jaeger%", canonical: "Jaeger-LeCoultre" },
  vc: { search: "%vacheron%", canonical: "Vacheron Constantin" },
  breguet: { search: "%breguet%", canonical: "Breguet" },
}

// Existing entries, keyed by CURRENT position -> their v2.0 disposition.
// Fields not listed are left as-is (bands/titles/refs already carry the
// Aug 2026 review corrections).
const REMAP = {
  12: { pos: 4, chapter: "1907 · The chronometry covenant", priority: 5, note: "Restored in v2.0: the review cut this as 'a nameplate'; the narrative reframe reverses that — it is the covenant's second signing (1815 Breguet -> 1907 VC -> 2015 JLC)." },
  1: { pos: 6, chapter: "1940s · The calendar in wartime Geneva", priority: 3 },
  2: { pos: 7, chapter: "1951 · The automatic, argued differently", priority: 9, note: "Buy first — best story-per-dollar in the collection; pairs with the owned 2026 Master Control." },
  3: { pos: 8, chapter: "1956 · The watch that speaks", priority: 8, note: "Buy second." },
  14: { pos: 9, chapter: "1955 · The first crossing", priority: 6, note: "SPLURGE candidate #1 — cal 1003 is JLC's 803 finished to Geneva Seal standard; the thesis made physical." },
  4: { pos: 11, chapter: "1972 · Geneva breaks symmetry", priority: 4 },
  7: { pos: 13, chapter: "2003 · Geneva's eccentric interlude", priority: 5 },
  13: { pos: 14, chapter: "2007 · The complication laboratory", priority: 3, note: "SPLURGE candidate #2. Named alternate: Master Grand Réveil (Alternates section)." },
  17: { pos: 15, chapter: "2015 · The covenant, renewed as wit", priority: 8, note: "Buy third." },
  19: { pos: 16, chapter: "2017 · The revival perfected", priority: 7, note: "Named alternate: Historiques Toledo 1952 (Alternates section). Verify B425/B426 suffix-to-color against the seller's spec sheet — sources conflict." },
  16: { pos: 17, chapter: "Foundations", priority: null },
  18: { pos: 18, chapter: "Foundations", priority: null },
  20: { pos: 19, chapter: "Foundations", priority: null },
  21: { pos: 20, chapter: "Foundations", priority: null },
  5: { pos: 21, chapter: "Canon", priority: null, note: "Canon in v2.0: real chapter (1990s memory-as-strategy), worst liquidity in the review, ~20% of any sane budget. Promotion rule: papered example inside band -> re-enters the plan." },
  8: { pos: 25, chapter: "Alternates", priority: null, note: "Named alternate to Ch. 14 (Duomètre): maximal content vs architecture. Band reachable only via HK/China channel — service risk priced in." },
  9: { pos: 26, chapter: "Alternates", priority: null, note: "Named alternate to Ch. 16 (3110V): the same revival chapter, shaped instead of steel." },
  6: { pos: 31, chapter: "Cut in v2.0", priority: null, cut: true, note: "CUT: power-reserve-and-date already owned twice; the card's own differentiator was the logo. (On record: only perfect sell-through in the review — cut as a chapter, not as a watch.)" },
  10: { pos: 32, chapter: "Cut in v2.0", priority: null, cut: true, note: "CUT (demoted, not disgraced): the Reverso chapter is the 1931 case, told by the plain Tribute (Ch. 5). If a second Reverso ever joins, it should be this one." },
  11: { pos: 33, chapter: "Cut in v2.0", priority: null, cut: true, note: "CUT: a second logo with a reference the market cannot assign (caseback edition test: 750 = Chronograph, 999 = DBS)." },
  15: { pos: 34, chapter: "Cut in v2.0", priority: null, cut: true, note: "CUT: the scarcity claim was false — the rose gold is unlimited production; the 20-piece LE is the white-gold 81018/000G-9559." },
}

// New v2.0 entries. band: key into BREGUET_BANDS, or {low, high} dollars,
// or null (Canon / owned). owned: link only, never create.
const NEW_ENTRIES = [
  {
    pos: 1, brand: "breguet", chapter: "1783 · The grammar of watchmaking",
    title: "Classique (Ultra-Thin 5157 or 7147)", reference_number: "5157BR/11/9V6",
    caliber: "502.3 family - automatic", year_from: 1783, dates_text: "current production; grammar dates to 1783",
    historical_role: "Every dress watch on earth still speaks Breguet's visual grammar: coined hands, cursive numerals, rose-engine guilloché, the secret signature. A modern Classique is the living textbook of the language the other houses write in.",
    recommended_variant: "Ultra-thin 5157 (5157BR/BB) is the validated-value path ($8-13k, med conf); the 7147 silvered guilloché (/12/ refs; /29/ = grand feu enamel) runs $13-18k ASK-DERIVED, low conf — negotiate hard there. Used market — nobody hypes them, everybody who handles one keeps it.",
    band: "classique", priority: 6, category: "Dress",
  },
  {
    pos: 2, brand: "breguet", chapter: "1796 · The idea, made visible", owned: true,
    title: "Tradition 7097 Automatique Seconde Rétrograde", reference_number: "7097",
    caliber: "505SR1 - automatic (Tradition/souscription architecture)", year_from: 2015, dates_text: "2015-present; architecture from 1796",
    historical_role: "THE CORNERSTONE. The 1796 souscription architecture turned face-out: pare-chute working at 10 o'clock, retrograde seconds arcing where a souscription hand once swept — the movement performing its own history. The collection's thesis, already owned.",
    recommended_variant: "Owned. The frontispiece of the collection — deserves the best Marc-original photograph in the document.",
    band: null, priority: null, category: "Horology", match_model: "7097",
  },
  {
    pos: 3, brand: "breguet", chapter: "1815→1954 · In the service of the state",
    title: "Type XX Aéronavale 3800", reference_number: "3800ST/92/9W6",
    caliber: "582 (Lemania-based) - automatic flyback", year_from: 1995, dates_text: "1995-c.2010; lineage 1815 & 1954",
    historical_role: "The house of ideas was also a house of duty: Horloger de la Marine 1815, Type 20 flybacks to the Aéronavale from 1954. The no-date 3800 is the closest civilian echo of the military watch — genius, reporting for work.",
    recommended_variant: "Aéronavale 3800 (NO date, matt dial, typically serifed numerals — both variants exist) — not the date-at-6 Transatlantique 3820, not Type XXI/XXII. Working flyback, unpolished edges preferred; tritium (T-SWISS-T) early dials carry the romance. OFFERS OUT at $4,250 across a dozen listings (2026-08-14) — mid-band of the validated $3,800-5,200.",
    band: "typexx", priority: 7, category: "Chronograph",
  },
  {
    pos: 5, brand: "jlc", chapter: "1931 · The shaped case",
    title: "Reverso Tribute Monoface Small Seconds", reference_number: "Q713842J",
    caliber: "822 family - manual", year_from: 1931, dates_text: "current production; case from 1931",
    historical_role: "The greatest single case idea of the twentieth century — Art Deco architecture born from broken polo crystals. The plain small-seconds Tribute IS the 1931 argument; v1.0 taught the sonnet using only a parody.",
    recommended_variant: "Steel: Q713842J silver (purest 1931 statement) or Q397843J green sunray. Lightly-used full set — current-line depreciation works for you. (Burgundy exists only in pink gold.)",
    band: { low: 7800, high: 10500 }, priority: 5, category: "Dress",
  },
  {
    pos: 10, brand: "vc", chapter: "1967–1977 · The engine JLC never signed",
    title: "Overseas Gen-1", reference_number: "42042",
    caliber: "1311 (GP-based) - automatic", year_from: 1996, dates_text: "line from 1996 (42040/cal 1310 debut; 42042/cal 1311 later)",
    historical_role: "Carries the lineage of calibre 920/1120 — the JLC engine inside the Royal Oak, Nautilus and 222 that JLC never signed. The gen-1 Overseas is the 222's direct design heir; caveat printed honestly: its calibres (1310/1311) are GP-based, so it carries the lineage, not the calibre.",
    recommended_variant: "Steel, bracelet sharp and unstretched — the bracelet is the design. Full set strongly preferred. A fairly-priced 1120-powered VC (or a 222 inside Canon band) outranks it for this chapter.",
    band: { low: 6500, high: 12500 }, priority: 4, category: "Sport",
  },
  {
    pos: 12, brand: "breguet", chapter: "1970–1987 · Keepers of the flame",
    title: "Chaumet-era Breguet (Daniel Roth revival)", reference_number: "3130",
    caliber: "502 family (F. Piguet base) - automatic", year_from: 1975, dates_text: "1975-1988 (Roth tenure)",
    historical_role: "The quartz winter's most beautiful act of defiance: while the industry drowned, Daniel Roth re-learned A.-L. Breguet's language by hand — rose-engine guilloché, coined cases. Every 'Historiques' and 'Tribute' in this collection walks through the door Roth reopened.",
    recommended_variant: "Moonphase + power reserve, 36mm gold. For a true Roth-tenure piece: solid-back 3130 with pre-A-series serial (the display-back 3137 is c.2001 post-Roth production of the same design — price accordingly). Hand-guilloché dial in honest condition is the entire object. Band is LOW confidence (2 solds, 2006/2011) — fresh comps mandatory before buying.",
    band: "rothEra", priority: 4, category: "Horology",
  },
  {
    pos: 22, brand: "vc", chapter: "Canon",
    title: "222 Jumbo", reference_number: "44018",
    caliber: "1121 (JLC 920 base) - automatic", year_from: 1977, dates_text: "1977-1985",
    historical_role: "The true object of Ch. 10 — Hysek's integrated-bracelet answer to the Royal Oak, running the same JLC engine. Post-2022-reissue market moved it to Canon money.",
    recommended_variant: "Steel 44018, honest bracelet. Standing order: papered example inside a sane band -> promotes into Ch. 10 and bumps the 42042.",
    band: null, priority: null, category: "Sport",
  },
  {
    pos: 23, brand: "breguet", chapter: "Canon",
    title: "Classique Tourbillon (3350/3357)", reference_number: "3357",
    caliber: "558T family - manual tourbillon", year_from: 1801, dates_text: "revival from 1988; patent 1801",
    historical_role: "The 1801 patent itself — the invention every maison now sells back to us. The chapter is told in prose until a papered example inside a sane band surfaces.",
    recommended_variant: "Roth-era 3350 (1988, the revival's first) or later 3357. Canon money in any honest form.",
    band: "tourbillon", priority: null, category: "Horology",
  },
  {
    pos: 24, brand: "breguet", chapter: "Canon",
    title: "Souscription 2025", reference_number: "2025BH/28/9W6",
    caliber: "VS00 - manual", year_from: 2025, dates_text: "2025 (250th anniversary)",
    historical_role: "The Idea's newest echo: the single-hand souscription reborn for the 250th anniversary. New-retail money keeps it Canon.",
    recommended_variant: "Noted for the record; revisit on the secondary market in a few years.",
    band: null, priority: null, category: "Dress",
  },
]

const dollarsToCents = (d) => (d == null ? null : Math.round(d * 100))
const normRef = (r) => r.toUpperCase().replace(/\s+/g, "")
const normModel = (m) => m.toLowerCase().replace(/[^a-z0-9]/g, "")
const resolveBand = (b) =>
  b == null ? null : typeof b === "string" ? BREGUET_BANDS[b] : b

async function main() {
  console.log(`Seeding "Swiss Artisans" v2.0 — The Idea, the Engine and the Cathedral${DRY ? " (DRY RUN)" : ""}\n`)

  const { data: profiles, error: profErr } = await supabase.from("profiles").select("id")
  if (profErr) throw new Error(`profiles: ${profErr.message}`)
  if (!profiles || profiles.length !== 1) {
    throw new Error(`Expected exactly 1 profile, found ${profiles?.length ?? 0}.`)
  }
  const userId = profiles[0].id

  const brandIds = {}
  for (const [key, b] of Object.entries(BRANDS)) {
    const { data: found } = await supabase
      .from("brands").select("id, name").eq("user_id", userId).ilike("name", b.search)
    if (found?.length) {
      brandIds[key] = found[0].id
    } else if (DRY) {
      console.log(`Would create brand: ${b.canonical}`)
      brandIds[key] = "(new)"
    } else {
      const { data: nb, error } = await supabase
        .from("brands").insert({ user_id: userId, name: b.canonical }).select("id").single()
      if (error) throw new Error(`create brand ${b.canonical}: ${error.message}`)
      brandIds[key] = nb.id
      console.log(`Created brand: ${b.canonical}`)
    }
  }

  const { data: cats, error: catErr } = await supabase
    .from("categories").select("id, name").eq("user_id", userId)
  if (catErr) throw new Error(`categories: ${catErr.message}`)
  if (!cats?.length) throw new Error("No categories found — cannot create watches.")
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))
  const fallbackCat = catByName.get("daily") ?? cats[0].id
  const categoryFor = (name) => catByName.get(name.toLowerCase()) ?? fallbackCat

  const { data: guide, error: gErr } = await supabase
    .from("collection_guides").select("id, version").eq("user_id", userId).eq("name", GUIDE.name).maybeSingle()
  if (gErr) throw new Error(`guide: ${gErr.message}`)
  if (!guide) throw new Error(`Guide "${GUIDE.name}" not found — run the v1 seeder first.`)
  console.log(`Guide ${guide.id} (currently v${guide.version}) -> v${GUIDE.version}`)
  if (!DRY) {
    const { error } = await supabase
      .from("collection_guides")
      .update({ thesis: GUIDE.thesis, version: GUIDE.version, source_document: GUIDE.source_document })
      .eq("id", guide.id)
    if (error) throw new Error(`update guide: ${error.message}`)
  }

  const { data: entries, error: eErr } = await supabase
    .from("guide_entries").select("id, position, title, watch_id, notes, status").eq("guide_id", guide.id)
  if (eErr) throw new Error(`entries: ${eErr.message}`)
  const byPos = new Map(entries.map((e) => [e.position, e]))
  const alreadyV2 = entries.some((e) => e.position >= 22 && e.position <= 24)

  // ---- Phase 1: move everything out of the way (skip if re-running on v2 layout)
  if (!alreadyV2) {
    console.log(`Phase 1: offsetting ${entries.length} entry positions by +1000`)
    if (!DRY) {
      for (const e of entries) {
        const { error } = await supabase
          .from("guide_entries").update({ position: e.position + 1000 }).eq("id", e.id)
        if (error) throw new Error(`offset ${e.title}: ${error.message}`)
      }
    }
  } else {
    console.log("Entries look already v2-shaped (positions 22-24 present) — remap will upsert in place.")
  }

  // ---- Phase 2: remap existing entries
  let remapped = 0, cuts = 0
  for (const [oldPosStr, r] of Object.entries(REMAP)) {
    const oldPos = Number(oldPosStr)
    const src = byPos.get(alreadyV2 ? r.pos : oldPos)
    if (!src) {
      console.log(`  !! no entry found at old position ${oldPos} — skipping (already migrated?)`)
      continue
    }
    const patch = {
      position: r.pos,
      chapter: r.chapter,
      priority: r.priority,
    }
    if (r.cut) {
      patch.status = "passed"
      patch.watch_id = null
      cuts++
    }
    if (r.note && !(src.notes ?? "").includes(TAG)) {
      patch.notes = `${src.notes ? src.notes + "\n\n" : ""}${TAG} ${r.note}`
    }
    if (DRY) {
      console.log(`  P${String(oldPos).padStart(2)} -> ${String(r.pos).padStart(2)}  [${r.chapter}]${r.cut ? " CUT (passed, unlinked)" : ""}  ${src.title}`)
    } else {
      const { error } = await supabase.from("guide_entries").update(patch).eq("id", src.id)
      if (error) throw new Error(`remap ${src.title}: ${error.message}`)
    }
    remapped++
  }

  // ---- Phase 3: new entries
  const watchesByBrand = {}
  for (const [key, id] of Object.entries(brandIds)) {
    if (id === "(new)") { watchesByBrand[key] = []; continue }
    const { data: ws, error } = await supabase
      .from("watches").select("id, model, reference_number, is_wishlist, is_coming_soon")
      .eq("user_id", userId).eq("brand_id", id)
    if (error) throw new Error(`watches: ${error.message}`)
    watchesByBrand[key] = ws ?? []
  }
  const findWatch = (e) => {
    const pool = watchesByBrand[e.brand]
    if (e.reference_number) {
      const target = normRef(e.reference_number)
      const byRef = pool.find((w) => {
        if (!w.reference_number) return false
        const wr = normRef(w.reference_number)
        return wr === target || wr.includes(target) || target.includes(wr)
      })
      if (byRef) return byRef
    }
    if (e.match_model) return pool.find((w) => normModel(w.model).includes(e.match_model))
    return undefined
  }

  let created = 0, updated = 0, linked = 0, watchesCreated = 0, pendingBands = 0
  for (const e of NEW_ENTRIES) {
    const band = resolveBand(e.band)
    const bandPending = e.band != null && (band?.low == null || band?.high == null)
    if (bandPending) pendingBands++

    const match = findWatch(e)
    let watchId = match?.id ?? null
    let watchNote = match ? `linked to existing watch (${match.model})` : null

    if (!watchId && e.owned) {
      watchNote = `FOUNDATION but no watch matched (${e.reference_number}) — link manually`
    } else if (!watchId && !e.owned && e.chapter !== "Canon" && !bandPending) {
      const mid = dollarsToCents((band.low + band.high) / 2)
      if (DRY) {
        watchNote = `would create wish-list watch (est. $${((band.low + band.high) / 2).toLocaleString()})`
      } else {
        const { data: nw, error } = await supabase
          .from("watches")
          .insert({
            user_id: userId, brand_id: brandIds[e.brand], model: e.title,
            reference_number: e.reference_number, category_id: categoryFor(e.category),
            purchase_price_cents: mid, is_wishlist: true,
            notes: `From Swiss Artisans v2.0 (${e.chapter}). ${e.recommended_variant}`,
          })
          .select("id").single()
        if (error) throw new Error(`create watch ${e.title}: ${error.message}`)
        watchId = nw.id
        watchesCreated++
        watchNote = "created wish-list watch"
      }
    } else if (!watchId && bandPending) {
      watchNote = "band pending evidence pass — no watch created"
    }

    const noteParts = []
    if (bandPending) noteParts.push(`${TAG} Band PENDING the Breguet evidence pass (${AS_OF}) — do not buy against this entry until validated.`)
    else if (band) noteParts.push(`${TAG} Band as of ${AS_OF}; see Swiss Artisans v2.0 draft + Review 2026-08 evidence.`)

    const row = {
      guide_id: guide.id, user_id: userId, position: e.pos, chapter: e.chapter,
      title: e.title, reference_number: e.reference_number, caliber: e.caliber,
      year_from: e.year_from, dates_text: e.dates_text,
      historical_role: e.historical_role, recommended_variant: e.recommended_variant,
      target_low_cents: bandPending ? null : dollarsToCents(band?.low),
      target_high_cents: bandPending ? null : dollarsToCents(band?.high),
      priority: e.priority ?? null,
      notes: noteParts.join(" ") || null,
      watch_id: watchId,
    }

    const existing = byPos.get(e.pos)
    const isV2Row = alreadyV2 && existing && existing.position === e.pos
    if (DRY) {
      console.log(`  NEW ${String(e.pos).padStart(2)}  [${e.chapter}]  ${e.title}${watchNote ? ` — ${watchNote}` : ""}${bandPending ? " — BAND PENDING" : ""}`)
      continue
    }
    if (isV2Row) {
      const patch = { ...row }
      if (existing.watch_id) delete patch.watch_id
      const { error } = await supabase.from("guide_entries").update(patch).eq("id", existing.id)
      if (error) throw new Error(`update new-entry ${e.title}: ${error.message}`)
      updated++
    } else {
      const { error } = await supabase.from("guide_entries").insert(row)
      if (error) throw new Error(`insert ${e.title}: ${error.message}`)
      created++
    }
    if (watchId) linked++
    if (watchNote) console.log(`  ${e.title}: ${watchNote}`)
  }

  console.log(`\nDone${DRY ? " (dry run — nothing written)" : ""}.`)
  console.log(`Remapped: ${remapped} (cuts: ${cuts}) · New entries created: ${created}, updated: ${updated}, linked: ${linked}`)
  console.log(`Wish-list watches created: ${watchesCreated} · Entries with bands pending: ${pendingBands}`)
  console.log("Cost: $0 (deterministic, no AI)")
  if (pendingBands > 0) {
    console.log(`\nNOTE: ${pendingBands} Breguet entr${pendingBands === 1 ? "y" : "ies"} seeded WITHOUT bands — fill BREGUET_BANDS from scratch/swiss-review/breguet_evidence.md and re-run to complete them.`)
  }
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err.message}`)
  process.exit(1)
})
