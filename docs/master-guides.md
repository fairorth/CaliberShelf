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
illustrated PDF output is its strength), then *ingested* here. The format
below was refined twice: by the GS adversarial review, and by the Aug 2026
Swiss Artisans lesson — the guide that was priced rigorously and told no
story, and had to be rebuilt narrative-first as "The Engine and the
Cathedral."

**The prime directive: the story is the product.** A Master Guide exists to
inform, explain and *excite* — it should read like a talk you'd give to
watch-loving friends, teaching them something they don't know. Price is the
overlay, never the spine. If a draft leads with bands and buries the
horology, it has failed regardless of how accurate the bands are.

1. **Start with the thesis — singular, and story-shaped.** One story the
   collection tells; the owned foundations usually already sketch it. A
   multi-axis thesis ("design + precision + technology") has no stopping
   rule — that's how a 12-watch idea becomes a 22-watch list. Test: could
   the thesis be the title of a talk? Does it exclude most of the catalog?
   The best theses are TRUE and under-told (the JLC×VC ébauche relationship
   beat "two temperaments" because it's documented history almost nobody
   knows).
2. **Build the timeline spine before choosing a single watch.** Eras,
   turning points, crossings, rivalries — the historical structure comes
   first, and watches are then cast to *play the chapters*. Place the owned
   pieces on the spine immediately: a guide is a collection plan, and the
   strongest endings are owned pieces that close a circle a chapter opened
   (Futurematic 1951 ↔ Master Control 2026).
3. **Chapters, not models — and every card leads with what it teaches.**
   One watch per chapter; if two entries tell the same chapter, one is
   padding (keep it as a named *alternate* inside the chapter, not a second
   slot). The card's first sentences are the lesson, not the spec sheet.
4. **Per-entry card fields** (map 1:1 to `guide_entries` columns):
   title · reference · caliber · dates · what-it-teaches/historical role
   (leads the card) · recommended variant (originality criteria, what to
   avoid) · target band (LOW–HIGH USD) · priority 0–10. Group into
   era/chapter sections; multi-brand guides use the maison as the chapter
   and carry a per-entry brand.
5. **Price is the overlay, applied last — solds, not asks.** Attach bands
   only after the spine stands (bands from sold transactions; JDM runs
   20–40% under Western asks on vintage; thin-data bands are marked as
   assumptions). Then declare the **budget architecture** explicitly: a
   rough total, plus a VALUE / CORE / SPLURGE designation per chapter —
   splurge where the object IS the argument, hunt value where the story is
   cheap. v1.0 Swiss drifted to $241k because no budget was ever stated.
6. **Separate the Canon from the plan.** Unbuyable-in-practice entries
   (allocation-gated, LE-20 auction-only, six-figure) corrupt the priority
   scale — the GS guide had 84% of its midpoint budget in four watches that
   will never be bought. Canon appendix + a one-line promotion rule.
7. **Structural pages:** the timeline spine (owned + gaps on one arc), a
   ranked "buy first" list that follows the *story logic* not just price,
   and a sources/methodology appendix separating documented facts from
   assumptions (mark unverified narrative claims — an exciting story that
   turns out false costs more than a dull one).
8. **Version the document** (v1.0, v1.1 …) and end with the owned pieces
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
output for *format and tone* — but it predates the method hardening below
(added Aug 2026 after a critical audit of that run), so treat its process as
a floor, not the spec. The stages:

### 3.1 Evidence collection — 5 venue agents as COMP COLLECTORS, not judges

One agent per venue class. Each returns **structured comp rows** — entry # ·
venue · date · **SOLD or ASK** tag · price + currency · condition/completeness
note · URL — *not* a band opinion. Hard rules: a number without a live,
fetched citation is discarded (**no prices from model memory** — with thin
data, seven same-model agents converge on the same training anchor and the
convergence masquerades as confirmation); every row carries its SOLD/ASK tag.
Venue briefs must match what each venue can actually show:

- **eBay** — sold listings where visible; where sold data is gated, report
  the gap, never fill it from memory.
- **WatchCharts** — index values and private-sale averages; note paywall
  limits explicitly.
- **Chrono24** — **asks only, structurally.** Brief: ask distribution,
  listing count (supply depth), staleness/time-on-market signals. Asks are
  ceilings and liquidity data, never comps.
- **Yahoo Japan closed auctions** (via aggregators — aucfree/aucview class) —
  hammer prices; note coverage gaps.
- **Auction houses + r/WatchExchange** — realized prices, premium-included
  status noted per row.

### 3.2 Synthesis computes the bands — from pooled evidence, explicit rules

Bands are computed from the pooled comp rows, not by merging five opinions:

- Sold-weighted; asks bound the ceiling only.
- **Normalize to landed USD**: hammer + buyer's premium/proxy fees + shipping
  + import, with the FX rate used stamped in the report header.
- **Every band states its assumed channel and condition tier** (e.g., "sharp
  original, JDM, landed") — a single number spanning a 20–40% channel spread
  is ill-defined. Vintage entries also state the typical polished/redialed
  discount, since impaired examples are most of the supply.
- **Disagreement rule**: venues apart by >~20% is a signal, not noise —
  almost always a channel or condition mismatch. Investigate; never average.
- **Verdict tolerances** (so two reviews are comparable): ✓ = sold-weighted
  midpoint within ±12–15% of the guide midpoint AND the sold median falls
  inside the guide band · ▲/▼ = beyond tolerance · ↔ = shape wrong (floor/top
  need re-drawing even if the midpoint passes) · ? = insufficient data.
- **Confidence tiers, defined by evidence**: high = ≥5 solds within 12
  months · med = 2–4 solds, or solds older than 12 months · low = ask-only
  or n≤1. Never assign confidence by feel.
- Every band carries an **as-of date**. (As-of lives in the report and, on
  correction, in the entry's notes; a `band_validated_at` column is a future
  option if drift becomes a recurring problem.)

### 3.3 Three adversarial critics, briefed to attack

The **horological-narrative critic comes first and is co-equal with the
pricing stages** (added Aug 2026 after the Swiss review over-indexed on
pricing): does the guide teach? Is the story TRUE — every historical claim
checked for the excitement it's carrying? Does each card lead with what the
watch teaches, and does the timeline have real structure, or is it a shopping
list wearing a chronology? What's the strongest story the material offers
that the guide missed (the Swiss review buried its best finding — the
ébauche-house relationship — in one flagged paragraph)? Then one critic on
**collection architecture** (does the list obey its own thesis? what's
padding? what chapters are missing?), and one on **investment/collectability**
(entry points, liquidity, J-curves, allocation reality, exit paths). Hostile
briefs — the job is to find what's wrong, not to grade generously.

### 3.4 Fact check

A cheap dedicated pass validates every entry's reference number, caliber,
dates, production claims, and recommended-variant claims against
authoritative sources. A wrong reference is worse than a wrong band — it
means hunting (and authenticating against) the wrong watch.

### 3.5 Validation tail — the review must survive its own method

Two rules, both closing gaps the GS run demonstrated:

- **Critic-proposed additions get priced properly.** Any entry a critic
  proposes adding runs through §3.1–3.2 (sold-weighted, cited) before it
  enters the corrections. A critic-invented band never ships — in the GS run
  the most actionable outputs (new hunt-list entries) carried exactly the
  unvalidated ask-based bands the review exists to eliminate.
- **Material findings are verified before corrections are final.** Band moves
  beyond tolerance, cuts, and additions each get an independent refute-style
  check against the evidence appendix. A plausible-but-wrong finding applied
  to `guide_entries` corrupts buying data permanently.

### 3.6 Priority re-base

Priorities get the same rigor as bands: re-score as **chapter weight ×
buyability × entry-point timing**, force-ranked so the median lands ≈5, one
line of justification per entry. (The GS guide had 17 of 22 entries ≥6.5 —
a scale that ranks nothing.)

### 3.7 The report

**Lead with the story verdict, not the band table.** The executive section
answers, in order: is the story true, is it the best story available, does
the collection teach — and only then, is the money right. Then: narrative
verdicts per chapter · missing chapters ranked by damage · cut list (each cut
justified narratively, not just financially — "the band was wrong" doesn't
survive the owner's second-guessing; "it has no chapter" does) · per-entry
band table (verdict + confidence + channel/condition assumption + as-of) ·
corrections to apply · **evidence appendix** — the full comp-row table with
URLs. The run journal dies with the session; the report file is the only
place the evidence survives, and both next year's diff and every §4 listing
evaluation depend on it. Evidence-retrieval war stories (blocked venues,
quota exhaustion) belong in a caveats appendix, not the headline sections —
the reader is a collector, not a scraping engineer.

Findings feed back in two directions: **data** (update `guide_entries` bands/
priorities/status — a small update script or direct SQL) and **document** (the
next PDF version incorporates the architecture verdicts). After the data
update, append a **"corrections applied" checklist** to the review file so
database and document can't silently drift. File the report next to the PDFs.

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
   validated band if one exists (§3 — prefer it; it's sold-weighted; check
   its channel/condition assumption matches this listing), and fresh comps
   (WebSearch: sold listings first — eBay solds, WatchCharts, Yahoo JP
   closed; asks are ceilings, not comps). Fresh comps are **mandatory, not
   optional, for any Buy or Negotiate verdict when the latest review is
   older than ~6 months** — bands drift within a year (the GS V.F.A. moved
   past its band in under one). Adjust for the specific example's
   condition/completeness (full set, papers, service records).
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

Copy-paste-ready prompt files (the canonical versions — edit them there, not
here):

- **Guide lifecycle session** (ingest · review · create — keep one mode block,
  delete the others): [`docs/prompts/guide-lifecycle-prompt.txt`](prompts/guide-lifecycle-prompt.txt)
- **Listing evaluation** (any session; fill the template, paste photos
  directly): [`docs/prompts/listing-evaluation-prompt.txt`](prompts/listing-evaluation-prompt.txt)

---

*Lifecycle summary: author in chat (§1) → PDF archived in git → ingest by
seeder (§2) → live in-app (spine, gaps, badges) → adversarial review keeps it
honest (§3) → listing evaluations spend against it (§4). The PDF is frozen at
each version; the database is the living state; git holds both.*
