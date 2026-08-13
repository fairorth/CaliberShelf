# Master Collection Guides — Methodology

The complete playbook for creating, ingesting, reviewing, and buying against a
Master Collection Guide. Written after the process ran end-to-end twice
(**Grand Seiko**, Aug 2026; **Swiss Artisans** JLC×VC, Aug 2026) and one guide
survived a full adversarial review. A new session given this document plus a
guide PDF should be able to repeat any part of the lifecycle.

**What a guide is:** a curated acquisition narrative — ordered "chapters" a
collection should cover, each with a reference, historical role, target price
band, priority (0–10), and recommended variant, plus a thesis that acts as a
stopping rule ("every watch must earn its place — add a chapter, not merely
another beautiful dial"). Guides are the *strategic* tier of the two-tier
wanting model; the flat `watches.is_wishlist` tag stays the impulse tier.

**Where things live:**

| Artifact | Location |
|---|---|
| Illustrated guide PDFs (frozen originals) | `docs/Watch Guides/*.pdf` (git, binary-attributed) |
| Review reports | `docs/Watch Guides/<Guide> Review YYYY-MM.md` |
| Live data | `collection_guides` + `guide_entries` (migration 00038; schema notes in data-model.md) |
| Seeders | `scripts/seed-gs-guide.mjs`, `scripts/seed-swiss-guide.mjs` (templates for the next) |
| In-app | `/guides` (spine, gaps, chapters), guide-name badges on `/collection` |

Key schema facts a session must know: entries link to real watch rows via
`watch_id`, and a **linked entry's status derives LIVE from the watch**
(owned / coming soon / wish list) — stored status is only `candidate | passed`
for unlinked entries. `UNIQUE (guide_id, position)` makes seeders idempotent.

---

## 1. Creating a new guide from scratch

Guides are *authored* in the claude.ai chat surface (long-form research +
illustrated PDF output is its strength), then *ingested* here. The format that
worked, refined by the adversarial review's findings:

1. **Start with the thesis, and make it singular.** The review's sharpest
   architecture finding: "design + precision + technology" is three theses
   stapled together, and a multi-axis thesis has no stopping rule — that's how
   a 12-watch idea becomes a 22-watch list. State ONE story the collection
   tells, and let the owned foundation pieces suggest it (they usually already
   sketch the real thesis).
2. **Chapters, not models.** Each entry must answer "what chapter does this
   add?" One watch per chapter; if two entries tell the same chapter, the
   guide has padding. A good sizing test from the review: "one watch per
   engine/era" style formulations expose duplicates instantly.
3. **Per-entry card fields** (these map 1:1 to `guide_entries` columns):
   title · reference · caliber · dates · historical role (2 sentences max) ·
   recommended variant (originality criteria, what to avoid) · target band
   (LOW–HIGH USD) · priority 0–10. Group into era/chapter sections; multi-brand
   guides use the maison as the chapter and carry a per-entry brand.
4. **Price bands: solds, not asks.** The single biggest defect the review
   found (15 of 22 bands wrong-ish): bands built from Western dealer asking
   prices. Weight sold transactions; note the JDM channel runs 20–40% under
   Western asks on vintage Japanese refs. Mark thin-data bands as assumptions.
5. **Separate the Canon from the plan.** Unbuyable-in-practice entries
   (allocation-gated, LE-20 auction-only, six-figure) corrupt the priority
   scale — the GS guide had 84% of its midpoint budget in four watches that
   will never be bought. Keep them in a "Canon" appendix or mark priority
   honestly low; don't let them sit as acquisition rows.
6. **Structural pages:** an architecture/spine overview (owned + gaps),
   a ranked "high-value gaps to fill first" list, and a sources/methodology
   appendix separating documented facts from assumptions.
7. **Version the document** (v1.0, v1.1 …) and end with the owned pieces
   integrated into the same sequence — a guide is a *collection* plan, not a
   wish list, so owned foundations belong in it.

Export as PDF → drop in `docs/Watch Guides/` → commit (binary attributes
already cover PDFs) → ingest (§2).

## 2. Ingesting a guide PDF into the app

The pipeline that ran for both guides. All deterministic, $0, no AI spend.

### 2.1 Extract the text
No pandoc/poppler on this machine. Use PyMuPDF (`import fitz` — installed):
extract per-page text to the scratchpad, read it, and hand-build the entry
list. 2–3k words per guide; this is a careful read, not a parsing problem.

### 2.2 Write the seeder
Copy `scripts/seed-swiss-guide.mjs` (the newer template — it supersedes the GS
one). The skeleton, and the lessons baked into it:

- **Idempotent upserts**: guide by `(user_id, name)`, entries by
  `(guide_id, position)`; re-runs update in place and never duplicate.
  Preserve an existing entry's `watch_id`/status on update.
- **Env/user resolution**: service role from `.env.local` (never print
  values); single-profile check resolves `user_id`.
- **Brand + category resolution** by name lookup with create-if-missing
  (brand) and sensible fallback (category); per-entry `category` hints map to
  the user's real categories (vintage dress → Dress, complications → Horology,
  chronos → Chronograph, wearable moderns → Daily).
- **Watch linking, in order**: (1) reference match — **normalized
  suffix-tolerant** (the owned 45GS was stored as `GS 4520-7010`; exact match
  missed it); (2) `match_model` fallback for watches stored without a
  reference; (3) only then create.
- **Foundation vs target entries**: owned/pre-ordered foundations are marked
  and NEVER auto-created — if they don't link, report "link manually" rather
  than inventing a duplicate watch.
- **Wish-list creation for targets**: `is_wishlist: true`, estimated cost =
  band midpoint, reference filled, the recommended-variant advice copied into
  the watch's notes. Creating even the moonshots is a deliberate choice
  (chapter ≠ shopping cart) — cap by priority if the user prefers.
- **CLI discipline** (house rules): `--dry-run`, unknown flags hard-fail,
  end-of-run counts, `$0` cost printout. Register an npm script alias.
- **Order of operations**: migration applied by the USER in the SQL Editor
  first → `--dry-run` → fix surprises (there will be one; both runs had one)
  → live run → update supabase/CLAUDE.md "latest applied" + project memory.

### 2.3 Card images (optional but worth it)
The PDFs embed each card's photo. Extract with PyMuPDF (`page.get_images`,
filter ≥400px — smaller ones are unusable thumbnails), build labeled contact
sheets, **identify visually** (dial codes are often readable at full size:
`6185…` = V.F.A., `9581` = 95GS — and placement metadata is NOT reliable, so
never map by page position alone). Upload via a temp in-repo script (module
resolution requires it — a scratchpad script can't find `node_modules`):
normalize to 2000px JPEG + 600px `thumb_`, storage path
`{user}/{watch_id}/{uuid}.jpg`, `watch_photos` row `is_cover: true`, skip any
watch that already has photos. Delete the temp script after. Credits remain in
the archived PDF; images are private, RLS-protected reference material.

## 3. Reviewing a guide (adversarial, multi-agent)

Run periodically (annually, or before a buying campaign). The August 2026 GS
review (`docs/Watch Guides/Grand Seiko Review 2026-08.md`) is the reference
output. Method: **7 agents** —

- **5 market-pricing agents, one per venue class**: eBay sold listings ·
  WatchCharts · Chrono24 · Yahoo Japan closed auctions · auction houses +
  r/WatchExchange. Each validates every entry's band independently,
  prioritizing SOLD transactions over askings.
- **2 adversarial critics**, briefed to attack: one on **collection
  architecture** (does the list obey its own thesis? what's padding? what
  chapters are missing?), one on **investment/collectability** (entry points,
  liquidity, J-curves, allocation reality).
- **Synthesis** merges them into: executive verdict · per-entry band table
  with verdicts (✓ confirmed · ▲ too low · ▼ too high · ↔ re-shape · ?
  unverifiable) + confidence + evidence · missing chapters ranked by damage ·
  cut list · corrections to apply.

Findings feed back in two directions: **data** (update `guide_entries` bands/
priorities/status — a small update script or direct SQL) and **document** (the
next PDF version incorporates the architecture verdicts). File the review
report next to the PDFs.

## 4. Evaluating a found listing against a guide

The buying-side protocol: the user pastes a listing (reference, asking price,
photos, link, seller notes) into a session and asks "how does this fit?"
Structure every evaluation as:

1. **Identify** — resolve the listing to a guide entry, or the *nearest*
   entry when it's an off-spec sibling (different dial, sister reference,
   later production, other metal). Name exactly what differs from the guide's
   recommended variant and whether the delta is cosmetic, historical
   (different chapter significance), or value-relevant.
2. **Chapter test** — apply the thesis: does this watch add the chapter the
   entry exists for? An off-spec variant can still tell the chapter (a
   printed-VFA dial vs the dream applied-Suwa) or can miss it entirely (a
   6246 day-date when the chapter is the clean 6245 architecture).
3. **Condition read** — from the photos: dial originality (redial tells:
   font weight, misaligned minute track, wrong lume), case sharpness vs
   polish loss, medallion/caseback state, crown correctness, service
   evidence. State confidence honestly — photos limit certainty, and vintage
   verdicts below "high confidence" should recommend dealer/extract
   verification. For the vintage refs, condition IS the value: the guides'
   own rule is that a cheaper polished/redialed example is the more expensive
   mistake.
4. **Value** — three numbers side by side: the guide band, the review's
   validated band if one exists (§3 — prefer it; it's sold-weighted), and
   fresh comps if the market may have moved (WebSearch: sold listings first —
   eBay solds, WatchCharts, Yahoo JP closed; asks are ceilings, not comps).
   Adjust for the specific example's condition/completeness (full set,
   papers, service records).
5. **Verdict** — a compact block:
   - **Fit**: which entry/chapter, variant delta, priority context
   - **Condition**: grade + the caveats
   - **Fair-buy range** for THIS example (not the abstract band)
   - **Ask assessment**: over/at/under fair, by how much
   - **Recommendation**: Buy / Negotiate (with a number) / Pass / Watch —
     always justified against the thesis, not just the price
6. **On action**: if bought → add/convert the watch (link auto-fulfills the
   guide entry); if passed on a *category* of variant, consider recording it
   in the entry's notes so the reasoning survives.

## 5. Session kickoff prompts

### 5.1 Guide lifecycle session (review · creation · ingestion)

> TenTenLoupe Master Collection Guides. Read `docs/master-guides.md` first —
> it is the complete methodology — plus `docs/data-model.md` for the
> guides schema. The live guides are in `collection_guides`/`guide_entries`;
> archived guide PDFs and past review reports are in `docs/Watch Guides/`.
>
> Today's job: [pick one]
> (a) **Ingest** the new Master Guide PDF at `docs/Watch Guides/<NAME>.pdf` —
> extract it, walk me through your proposed entry list (chapters, bands,
> priorities, foundation links) before seeding, then follow §2 of the
> methodology end-to-end including card images.
> (b) **Review** the "<NAME>" guide — run the §3 adversarial method (5
> market-pricing agents by venue, solds over asks; 2 critics: architecture +
> investment), produce the review report in `docs/Watch Guides/`, and propose
> the band/priority corrections before applying anything.
> (c) **Create** a new guide with me on <TOPIC> — interview me §1-style
> (thesis first, one story; chapters not models; solds not asks; Canon
> separated from plan), then draft the card list for my review.
>
> House rules apply: migrations are run BY ME in the SQL Editor (tell me the
> file), dry-run before any live seeding, and remind me to git push when done.

### 5.2 Listing evaluation (works in any session)

> Evaluate this listing against my Master Collection Guides (read
> `docs/master-guides.md` §4 for the protocol if this is a fresh session;
> guide data is in `collection_guides`/`guide_entries`, and check
> `docs/Watch Guides/` for a review report with validated bands):
>
> [paste: reference / asking price / link / photos / seller description]
>
> I want: nearest guide entry and the variant delta, the chapter test,
> a photo-based condition read with your confidence stated, a fair-buy range
> for this specific example vs the ask (use sold comps, not askings), and a
> Buy / Negotiate / Pass / Watch verdict argued from the guide's thesis.

---

*Lifecycle summary: author in chat (§1) → PDF archived in git → ingest by
seeder (§2) → live in-app (spine, gaps, badges) → adversarial review keeps it
honest (§3) → listing evaluations spend against it (§4). The PDF is frozen at
each version; the database is the living state; git holds both.*
