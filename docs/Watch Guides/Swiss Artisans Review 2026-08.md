# Swiss Artisans — Adversarial Review, August 2026

**Guide:** *A Pair of Swiss Artisans* (Jaeger-LeCoultre × Vacheron Constantin),
Horological Master Collection Series Part II, v1.0, Aug 2026 · 21 entries
**Review date:** 2026-08-13 · **Method:** `docs/master-guides.md` §3 (hardened Aug 2026)
**FX stamped:** 2026-08-13 00:02:31 UTC — USD/JPY 159.290909 · USD/CHF 0.812728 ·
USD/GBP 0.740511 · USD/EUR 0.867027 · USD/HKD 7.847438 (source: open.er-api.com)

---

## 1. Executive verdict

The guide is well-written, genuinely non-obvious in its selections, and wrong
about money more often than it is right. Of 17 priced targets, **6 bands move,
2 move only after their supporting finding was reversed, and 9 hold**. Two
entries are priced against the wrong watch, one rests on a factual claim that is
false, and the priority field carries no information at all — 14 of 17 targets
rate ≥9/10 and nothing sits below 8.5.

The three findings that matter most:

1. **The thesis was written backwards from the shopping list.** The architecture
   page's 18 bullets map 1:1 onto 18 of the 21 cards, so the thesis cannot
   exclude anything. Four of nine axes are claimed by *both* maisons, which
   licenses buying two of everything — and the list duly holds 3 complete
   calendars, 3 shaped cases, 3 GMTs, 3 power-reserve-and-date watches and
   2 alarms. The stated rule ("every purchase must add a chapter") is not being
   enforced by the document that states it.
2. **The live P7 negotiation is at top-of-fair, not at a discount** — see §4.
   The band was too high ($14–17k → **$11,000–14,000**), but not for the reason
   this review first believed. The single cheapest "sale" in the evidence turned
   out not to be a sale at all.
3. **Budget concentration is severe and inverted against the evidence.** The 17
   targets total **$241,500** at guide midpoints; the top 5 eat $114,000 (47.2%)
   and the Mercator alone 16.6%. The three chapter-critical cheap entries —
   Futurematic (crownless automatic), Memovox (alarm), Geophysic (deadbeat
   seconds) — total $14,250, or 5.9%. The Mercator costs 2.8× all three combined.

**Do not treat this review as uniformly high-confidence.** See §2 — three of five
venues were hard-blocked, and the review's own worst error was caused by an
aggregator artifact that survived until a dedicated refute-check killed it.

---

## 2. Evidence quality — read before using any band

This is the most important section in the report, and it is not boilerplate.

### 2.1 Three of five venues were locked out of their primary data

| Venue | Outcome |
|---|---|
| **eBay** | **Zero verified solds, all 21 entries.** Sold/completed searches and `/itm/` pages timed out repeatedly on `.com` and `.de`; WorthPoint 403. All rows are asks sourced from EveryWatch, which labels them "Sold / Removed" and **cannot distinguish a sale from a delisting**. |
| **WatchCharts** | **HTTP 403 to every fetch**, WebFetch and curl-with-browser-UA alike, on `/overview`, `/prices`, `/analysis`, `/search`. Never rendered a page. Every row is a search-engine snippet. |
| **Chrono24** | **403 on `.com`, `.co.uk` and individual listings**; read-proxy returned CAPTCHA. Snippet-grade only. Staleness/time-on-market is unrecoverable. |
| **Yahoo Japan** | Partial. aucfree returned 0 rows; aucview/aucfan 429. Data came from `closedsearch` pages served from differently-aged crawls — **dates transcribed as shown, years not assumed**. |
| **Auction houses** | Best of the five, but EveryWatch is fully paywalled, Sotheby's realized prices are login-gated, Rago/Wright and auction.fr 403'd, LiveAuctioneers gated. |

**Consequence:** realized auction prices are the only high-grade evidence in this
review. Asks are ceilings, never comps, and much of the ask data is snippet-grade.

### 2.2 r/WatchExchange is uncovered, not empty

Reddit is host-blocked from the fetch tool at both `www` and `old`, across two
independent agents and five site-restricted search formulations. **This is a
tooling failure, not evidence of a thin private-sale market.** Private-sale data
for P7, P10, P13 and P16 in particular likely exists there. No band in this
report may be read as confirmed by r/WatchExchange's silence. **Re-run this venue
next cycle with a working reddit path.**

### 2.3 The session's WebSearch quota (200 calls) was exhausted partway through

The additions-pricing agent and both refute-check agents ran wholly or partly
without discovery search — WebFetch only, against URLs already named in the
evidence files. Dealer sold-archives and forum sales remain an open gap.

### 2.4 Three systematic distortions found in the ask data

These change how every ask number in this review should be read.

1. **Serial relisting fakes volume.** One JP seller (`shu590218nona`) posted the
   *same* P7 white-gold example five times May–Aug 2025 at $16,992 → $16,422,
   each listing dead within 1–19 days. P7 has ~1 eBay data point, not 6. The same
   seller supplies 3 of 6 P15 rows; Swiss Watch Expo posts two identical $23,980
   rows on P12. **Counting relists as comps inflates any band built from them.**
2. **eBay carries a dealer cross-listing premium.** Same dealer, same stock, same
   month: Bernstein $15,999 eBay vs $12,999 Chrono24 (+23%); TIME GRACE
   $16,583–19,269 vs $14,075; BlackTag $18,200 vs $17,100. **eBay asks are the top
   of the global distribution.** Any band anchored there biases upward.
3. **The JDM channel sells polished watches as a feature.** `外装仕上げ` (exterior
   refinishing) is stated outright on P4 ×2, P9, P10 ×2, P13, P17, advertised as
   a selling point. Since the guide's own buying notes demand unpolished cases,
   **most JDM asks are for watches this guide would reject.** That is a
   condition mismatch, not a discount.

### 2.5 Aggregator calibration — reusable

- **Collector Square (LuxPrice-Index) figures are premium-inclusive, not hammer.**
  Verified arithmetically across 13 rows decomposing exactly into hammer ×
  1.25 / 1.26 / 1.28, matching Christie's/Sotheby's/Bonhams schedules. **Do not
  gross these up again when pooling with dealer asks.**
- **Collector Square also mis-files unsold lots as sales.** On P7 it recorded a
  Bonhams lot's *low estimate* in its "Sold" field with the estimate field left
  empty. That single artifact produced this review's largest false finding and
  survived three agents before a dedicated refute-check destroyed it (§4).
  **Treat any Collector Square figure that exactly equals a round estimate bound
  as suspect until the lot page is fetched.**

### 2.6 FX convention

Foreign-currency comps are converted at the **stamped 2026-08-13 rate**, giving
"what that sum is worth in USD today". This is *not* the contemporaneous USD
price, and on older CHF results the gap is material because the dollar has
weakened against the franc:

| Comp | Contemporaneous | At stamped rate |
|---|---|---|
| P7 Christie's CHF 13,860 (2022) | ~$14,000 | $17,052 |
| P7 Christie's CHF 12,500 (2021) | ~$13,000 | $15,381 |
| P5 Mercator CHF 44,100 (2024) | ~$50,000 | $54,262 |

Where a band would move on the choice, the report says which it used. **For P7
the band is anchored on a USD-pegged HKD comp specifically to sidestep this** —
applying today's FX to 2021–22 CHF results imports dollar weakness into a market
the same evidence says declined 11.5%.

---

## 3. Per-entry band table

Verdict: ✓ within tolerance · ▲ band too low · ▼ band too high · ↔ shape wrong ·
? insufficient data. Confidence: high = ≥5 solds ≤12mo · med = 2–4 solds or solds
>12mo · low = ask-only or n≤1. All as of **2026-08-13**.

| # | Entry | Guide band | Verdict | **Revised band** | Conf. | Channel / condition assumption |
|---|---|---|---|---|---|---|
| P1 | VC Vintage Triple Calendar 4240/4241 | $12,000–20,000 | ↔ | **$12,000–18,000** | med | 18k YG 4240, sound original two-tone dial, auction incl. premium. PG/moonphase +25–30% |
| P2 | JLC Futurematic E501 | $2,500–4,500 | ▲ | **$4,000–6,500** | low | **Steel** E501, honest dial, working back-set. Auction floor ~$4,000, Western dealer $6–7k |
| P3 | JLC Memovox E855 | $3,500–5,500 | ▼ | **$3,000–4,250** | med | Steel, serviced, correct Gay Frères. **Auction channel is $1,700–2,500** |
| P4 | VC "1972" 37010 | $12,500–15,500 | ▼ | **$8,500–12,000** | med | 37010 (1997 re-edition, ~26×36.5mm), sharp unpolished case. Extract +$2–3.5k |
| P5 | VC Mercator 43050 | $35,000–45,000 | ▲ | **$40,000–52,000** | med | YG Europe/Africa/Asia map only. **See liquidity warning** |
| P6 | VC Malte PR/Date 83060 | $9,000–13,000 | ✓ | **$10,500–13,000** | med | WG cal 1420, auction/dealer incl. premium. No RG auction data exists |
| P7 | **VC Malte Dual Time Regulator 42005/000G** | $14,000–17,000 | ▼ | **$11,000–14,000** | med | WG, full set, dealer channel. **See §4** |
| P8 | JLC Master Grand Réveil Q163842A | $10,500–13,500 | ✓ | **$10,500–13,500** | med | Steel, auction **or Asian dealer supply**. Every Western ask is $17,800+ |
| P9 | VC Toledo 1952 47300 | $13,500–16,500 | ✓ | **$13,500–16,500** | med | RG 000R-9219, full set. US shelf $18–19k; Ginza full-set RG $13,799 |
| P10 | JLC Grande Reverso GMT Q3028420 | $7,000–10,000 | ✓ | **$7,000–10,000** | med | Steel, good case + accessories, Western retail. Scratched/no-papers ~$4,000; JDM $4,600–5,500 |
| P11 | JLC AMVOX2 192.T.25 | $8,500–11,000 | ▼ | **$5,500–8,500** | med | Titanium. **Reference is ambiguous — see §5** |
| P12 | VC Chronomètre Royal 86122/000R | $18,000–22,000 | ▼ | **$15,500–19,000** | med | RG, full set, sound movement. Verified sale was service-due |
| P13 | JLC Duomètre Q6012420 | $18,000–23,000 | ✓ drift | **$17,000–21,500** | med | RG cal 380, full set, auction/dealer incl. premium |
| P14 | VC Ultra-Fine 1955 33155/000R | $12,000–18,000 | ▼ | **$11,000–15,000** | low | RG, box + papers, global dealer channel |
| P15 | VC Aronde 1954 81018/000R | $11,000–14,000 | ? | **$11,000–14,000** | low | Worn RG, **HK/JP dealer channel**. US channel is $15,500–19,500 |
| P16 | JLC MUT RdM Q1378420 *(owned $5,350)* | $5,200–7,500 | ▼ floor | **$4,800–7,000** | low | Steel pre-owned, private/dealer. JP examples carry duty |
| P17 | JLC Geophysic True Second Q8018420 | $5,500–7,000 | ✓ | **$5,500–7,000** | med | Steel/silver, full set, **global** channel. US shelf $7,985–8,950 |
| P18 | VC Quai de l'Île 4500S *(owned $9,150)* | $9,000–12,000 | ↔ | **$10,000–12,500** | low | Steel B195, pre-owned dealer. 23 listings — asks unlikely to hold |
| P19 | VC Triple Calendrier 1942 3110V | $16,000–19,000 | ✓ | **$16,500–19,000** | med | Steel B425/B426, full set, online-auction / US dealer |
| P20 | JLC Polaris Geographic Q9078640 *(owned $19,100)* | *(none)* | ? | **$12,000–15,000 provisional** | low | Steel, unworn-to-excellent, private sale |
| P21 | JLC Master Control Q4168120 *(pre-ordered $17,000)* | *(none)* | ? | **no band** | n/a | Retail-anchored only; no secondary market exists |

**Bands that hold: 9.** P6, P8, P9, P10, P13 (with drift), P15 (channel restated),
P17, P19, and P1's floor.

---

## 4. P7 Malte Dual Time Regulator — the live negotiation

The owner is in negotiation at **~$12,000**. This entry received the most
scrutiny in the review, and it is also where the review made and then caught its
own worst error.

### 4.1 The error, stated plainly

Three agents reported a **Bonhams 2023-10-12 sale at $6,000 incl. premium** for a
white-gold 42005/000G, with the specialist estimate at $6,000–8,000. It was the
cheapest realized figure in the file and it dragged the whole analysis downward.

**It was never a sale.** The refute-check fetched the Bonhams lot page: sale
28437 "Fine Watches", live New York, ref 42005/000G, 18k WG, 39mm, cal 1206,
c.2005, est. US$6,000–8,000, **no sold price shown**. It proved this by
controlled comparison inside the same sale — lot 5 displays "Sold for US$7,680
inc. premium" with no estimate line; lot 75 matches the *unsold* pattern.
Collector Square's estimate field is empty and its "Sold" field is exactly
$6,000 — the low estimate, mis-filed as a result. Arithmetic confirms it
independently: the sale's premium is empirically ×1.28 (derived from lots 1, 2
and 5), and $6,000 inclusive requires a $4,687.50 hammer, not a valid bid
increment. The "hammer ~$4,800 at ×1.25" reported earlier is impossible.

Identity checks all resolved *in the row's favour* — it was not a 47400, not
steel, not an online-only sale. The row was real; the *sale* was not.

### 4.2 The evidence that survives

| Date | Venue | Result | Notes |
|---|---|---|---|
| **2024-09-27** | **Phillips HK Sessions Fall, lot 8052** | **HK$107,950 incl. prem. = $13,756** | ref 42005/000G, 18K WG, 38.5mm, cal 1203 COSC, **NOS/unworn, full set**. HKD is USD-pegged — FX-immune. **The anchor comp.** |
| 2022-11-06 | Christie's Geneva #21862 lot 2105 | CHF 13,860 incl. prem. | est. CHF 8,000–12,000, "guarantee and box". = 11,000 × 1.26 exactly → premium-inclusive confirmed |
| 2021-05-10 | Christie's Geneva #20024 lot 43 | CHF 12,500 | est. CHF 10,000–15,000. **Ambiguous** — valid as both a hammer and 10,000 × 1.25. Earlier "hammer 10,000" claim unsupported |
| 2024-05-29 | Sotheby's | **NO SALE** | WG, est. £10,000–20,000 |
| 2024-06-11 | Sotheby's | **NO SALE** | WG, same estimate, 13 days later. May or may not be the same watch |
| 2024-03-19 | Phillips HK lot 8050 | HK$127,000 = $16,183 | **PINK gold, 150-piece boutique LE #10, immaculate, full set + COSC.** Not a WG comp |

Corrected, the verified WG record is **$13,861 / $13,875 / $14,553**
contemporaneous — a **1.05× spread, not 4×**. The mechanism was never condition,
venue or market decline: it was **one wrong row, amplified by FX convention**.
Condition and venue in fact run opposite to the intuitive guess — the cheapest
verified sale is the NOS full set, sold through an online-only auction.

**Dropped as unverifiable:** Iconeek $11,937 (two agents failed on it — EveryWatch
paywalled), Rago/Wright $10,080 (403, metal given only as "gold"), Heritage
$15,000 (yellow gold 42005/2, wrong metal).

### 4.3 Market context

- **Supply is not scarce:** 8 examples of this exact sub-reference listed on
  Chrono24, asks $11,723–15,500, four of nine sellers Hong Kong. The one US ask
  is $15,500 — a ~$2,900 jurisdiction premium, not a condition premium.
- **JDM asks:** ¥1,880,000–2,780,000 = **$11,802–17,451**, cheapest being a
  complete box-and-papers set.
- **Trend:** −7.1% y/y and −11.5%/5yr, against a WatchCharts VC index of +7.5%
  — 18.9% worse than brand over five years. Risk 69/100. WatchCharts reports
  "not enough sales data to compute days on market" and only 2 recorded sales
  (Jan 2026).
- **The one eBay level ($16.4–17.0k) is a single Japanese seller who failed to
  sell at it five times.** That is evidence against the high end, not for it.

### 4.4 Recommendation

**Band: $14,000–17,000 → $11,000–14,000.** Nothing in white gold has ever
verifiably cleared above ~$14.6k contemporaneous.

**$12,000 is top-of-fair, not a discount.**

- **Open $10,500.**
- **Settle $11,200–11,500.**
- **Pay $12,000 only for:** full set, documented service within 3 years,
  unpolished case (confirm 39mm and sharp lugs), original hands, US delivery
  duty-paid.
- **Walk away at $12,500.**

Leverage the owner is not using: eight are listed right now, and on a reference
declining ~7%/yr, waiting is paid. Exit math from $12,000 — hammer $11–13k less
~15% commission, against two Sotheby's no-sales in three weeks — means a
day-one round-trip loss in the 20–30% range.

**Caveats that remain open:** Bonhams passed-vs-withdrawn is indistinguishable
from the page; the two Sotheby's no-sales may be one watch offered twice;
christies.com is hard-blocked, so the Christie's rows are corroborated via
Collector Square rather than source-verified.

---

## 5. Fact-check — corrections to the document

**6 WRONG · 13 PARTIAL · 58 CONFIRMED.** Clean cards: P8, P12, P13, P19, P20, P21.

### Wrong — must be fixed

1. **P15 Aronde is not a limited edition.** The rose gold 81018/000R-9657 was
   unlimited SIHH 2011 production. The 20-piece LE is the **white gold
   81018/000G-9559** (2010, Japan only). The error appears **twice** on the card,
   and the guide's scarcity argument for the entry rests on it.
2. **P4 conflates two watches across 25 years.** Ref **37010 is the 1997
   re-edition**, not a 1970s watch. The 1970s originals are refs **35202/2091**
   (21×46mm, cal 1050/3) and siblings. This is the direct cause of the band
   error — realized 37010 sales ($3,888–10,710) and the $15,569 asks are
   different watches pooled together.
3. **P4 caliber:** 37010 uses **cal. 1055**, not the 1972 original's cal 1050/3.
4. **P6 dates:** the 83060 Power Reserve & Date was introduced **2007**, not
   "1990s–2000s". The card's "neo-vintage" framing goes with it.
5. **P11 name/reference mismatch — see below.**
6. **P4 variant note:** "white or yellow gold depending specimen" — Collector
   Square shows 37010 in yellow, white *and* pink gold at ~26×36mm, so the
   guide's metals are defensible; it is the **date** that is wrong. *(The
   fact-check's stronger claim that all 37010s are white gold was itself refuted
   in validation — the top sale is yellow.)*

### P11 — the reference question, and why it stays open

The fact-check reported that **192.T.25 is the AMVOX2 *DBS* Transponder** (cal
751E) while the **Chronograph is 192.T4.40 / Q192T440** (cal 751B), which would
mean every P11 comp is mis-assigned. **The refute-check could not sustain that
split:** Quill & Pad — the fact-check's own cited source — publishes no reference
numbers at all and gives *both* AMVOX2s as 44×14mm, killing the 43.7mm
discriminator. Christie's 2021 catalogues 192.T.25 as "limited edition of 750"
(the Chronograph) while Sotheby's catalogues a Q192T25 with cal 751E and an
edition of 999 (the DBS). **The market uses one reference string for both
watches, so the comps are genuinely unassignable.** The DBS is also
case-actuated, so the guide's own description does not discriminate either.

**Resolution: editorial, not numerical.** Fix the card by the **caseback edition
test — 750 = Chronograph, 999 = DBS** — and buy on the caseback, not the listing
title. The band comes down independently of the reference question.

### Partial — precision fixes worth making

- **P7:** the card names no caliber. It is **cal. 1206 RDT** (F. Piguet 1150
  base, 65h), and the case is **39mm**, not "~38mm".
- **P1:** V485/P485 is the *moonphase* triple calendar; V495/P495 the
  non-moonphase. The 4240 is the non-moon variant (4240L is the 1948 moonphase).
  Phillips's own 1942 4240 lot cites **cal 455**. Verify per example.
- **P2:** E501 ran **1951–1957**. **P3:** E855 ran **1960–c.1974**, and cal 825
  is a **bumper** automatic — unstated on the card.
- **P5:** yellow gold is *not* exclusively the Europe/Africa/Asia map (Sotheby's
  sold a YG "America", 43050/000J-17); the enamel variant is **champlevé**, not
  cloisonné; the 1994 launch series is a separate ref **11992** (50 pieces).
- **P9:** "35.7 × 43.1mm" is not reproducible — sources give **35.7 × 41 ×
  12.7mm**; thickness is omitted, and the calendar **includes a moonphase**,
  which the card never says.
- **P10:** the references are correct — but the real trap is unnamed:
  **Q3038420 / 240.8.72 is a different, automatic Grande Reverso GMT/Date.**
- **P14:** launched **2010**, not "late 2000s"; print the **4.13mm** thickness.
- **P16:** the line starts **2011 at 37mm**; 39mm from 2012.
- **P18:** caliber is **5100/1** (tungsten rotor), not 5100.

### Cleared

**P10's Q3028420/240.8.18 and P8's Q163842A/149.8.95 each designate one single
watch** — both reference-pair suspicions were unfounded. Cal 878 (manual, 8-day)
and cal 909/1 respectively are correct.

**Unverified (6):** P17 "c.2019" end date · P17 Geophysic-lineage claim · P18
security-print dial and case-construction claims · P18 "c.2019" end date · P19
"c.2022" end date · **P21's $17,000 price, which appears in no JLC press
material** (it comes from AD listings).

---

## 6. Architecture — what the list gets wrong

### 6.1 The thesis has no stopping rule

The architecture page names nine chapters for 21 cards, but **"2000s
Complications" silently holds twelve of them** (cards 5–15 and 19). A chapter
holding twelve watches is a decade, not a chapter. Cards 14 and 15 appear in
**no thesis bullet at all**.

Four of the nine axes are claimed by *both* maisons. Ask the diagnostic question
— *what watch would this thesis exclude?* — and the answer is: almost nothing in
either catalogue.

**Four cards fail the guide's own rule in the text of their own justification:**

- **Card 6** — "exactly the complication mix you enjoy". Power-reserve-and-date
  is already owned twice (P16, P21). The only differentiator offered is the logo.
- **Card 11** — "Aston Martin collaboration". A literal second logo, in a guide
  whose rule is "not merely another prestigious logo".
- **Card 12** — the chapter is a nameplate ("Chronomètre Royal lineage"), not a
  mechanism.
- **Card 15** — "almost nobody outside serious VC circles has it on the standard
  wish list".

The real, unstated thesis is **obscurity as a value** — which systematically
excludes both maisons' canonical objects.

### 6.2 The steelman the guide missed

**VC cal. 1120 is the JLC 920**, and the Toledo's cal. 1125 descends from the
JLC 889. The historically real JLC×VC pairing is **ébauche house and finisher** —
genuinely complementary, and it yields an actual selection rule. The guide never
mentions the relationship, which is the clearest sign the thesis came from taste
rather than from the maisons. *(Flagged as a hypothesis: this is the architecture
critic's claim and was not independently source-verified this cycle.)*
*(Addendum 2026-08-14, v2.0 fact-check: the 1003=JLC 803 and 1120=JLC 920
claims are CONFIRMED and became the spine of the v2.0 trio thesis. The Toledo
claim is REFUTED as stated — cal 1125 is based on the JLC **891**, not the
889; the 889-based VC calibre is the 1126. Full verdicts in the v2.0
fact-check file.)*

### 6.3 Missing chapters, ranked by damage — priced per §3.5

No addition may enter the guide without a validated band. These are the results.

| Rank | Addition | Chapter it fills | **Band** | Conf. | Solds |
|---|---|---|---|---|---|
| 1 | **JLC Atmos** (Classique/560-class, running) | The movement laboratory made physical | **$400–2,000** | **high** | **11** |
| 2 | **JLC Reverso Tribute Small Seconds**, steel | The 1931 case — currently told only through a complicated GMT | $7,800–10,500 | low | 0 priced |
| 3 | **VC Overseas gen-1 ref 42042**, steel | The VC sports / 222 lineage | $6,500–12,500 | med | 4 in ~12mo |
| 4 | JLC Reverso Tribute Duoface, steel | *(alternative to #2)* | $9,500–13,000 | low | 1 |
| 5 | VC Overseas gen-2 ref **47040** | *(alternative to #3)* | $10,500–15,000 | med | 2 (2020) |
| 6 | VC Métiers d'Art | The "artistic craft" axis, asserted twice and filled once | $38,000–52,000 | med | 2, both stale |
| 7 | VC Traditionnelle World Time 86060/000R | World time *(proposed as substitution)* | $19,000–28,000 | low | 1 |

**Cannot ship — no band:** Reverso Tribute Duoface in rose gold (zero prices of
any kind), Traditionnelle WT 86060/**000G** (no data), the steel 222 / 2022
reissue, Atmos Hermès and Atmos Transparente. A genuine pre-war vintage plain
Reverso market was **never demonstrated** — the only dated auction example is a
1995 watch.

**The Atmos is the standout finding of the whole review.** It is the only
HIGH-confidence band produced anywhere in this cycle — 11 priced solds across 7
houses — and **~$1,400 buys a working Atmos 560 Classique**. The single purest
expression of the guide's own "movement laboratory" thesis costs under 1% of its
budget. It should claim the open half-card, or share it with the plain Reverso.

**Warnings on the expensive additions:** Métiers d'Art alone adds ~$45,000
(+18.6%), making it the dearest line in the guide — above the Mercator — against
editions of 20, a dealer refusing to publish a price, and a 2023 platinum
example that failed to sell. The Traditionnelle World Time is the weakest
candidate on liquidity, not merely evidence: **five documented no-sales
2015–2024 against one sale**, and down 18.4% y/y.

**Reference error in the proposal itself:** 49150 is the Overseas *Chronograph*,
not a gen-2 time-and-date. Gen-2 time-and-date is **47040** only.

**Cost:** the minimum coherent version — Reverso SS + Atmos + Overseas 42042 —
is **~$19,850, +8.2%** on the guide's $241,500, and adds three genuine chapters.

---

## 7. Priority re-base (§3.6)

Re-scored as **chapter weight × buyability × entry-point timing**, force-ranked,
median = 5. The guide's own field is unusable: 14 of 17 targets rate ≥9 and
nothing sits below 8.5 — and the proof is that **building the guide's page-3 hunt
list required ignoring it**, since six entries rated 9/10 failed to make a top
eight drawn from seventeen. Cards 5 and 13 are labelled STRETCH *and* rated 9.5,
i.e. buyability was excluded from the number by construction.

| Entry | Guide | **New** | One-line justification |
|---|---|---|---|
| P19 Triple Calendrier 3110V | 9 | **9** | Best-evidenced band in the review, +11.8% y/y, best risk score (30/100), real supply. **Absent from the guide's hunt list — the single clearest priority error in the document.** |
| P17 Geophysic True Second | 9 | **8** | Unique deadbeat-seconds chapter, band confirmed twice, cheap, liquid, condition easy to find |
| P2 Futurematic E501 | 10 | **8** | Crownless-automatic chapter is irreplaceable and directly pairs with the owned P21; cheap even at the corrected band |
| P3 Memovox E855 | 9.5 | **7** | Alarm chapter is central to JLC; cheap; but auction and dealer channels differ 2× and supply is generic |
| P9 Toledo 1952 47300 | 10 | **7** | Shaped complete calendar, band held under challenge, four 2025–26 sales — genuinely buyable |
| P8 Master Grand Réveil | 9 | **6** | Enormous horological content, band dead-centre — but Asian-supply-only below $17k and a heavy service tax |
| P10 Grande Reverso GMT | 9 | **6** | Reverso-as-complication chapter, band confirmed, but the plain 1931 case is the chapter actually missing |
| P7 Malte Dual Time Regulator | 9.5 | **5** | Distinctive regulator chapter and in negotiation — but declining ~7%/yr, thin sales, ample supply |
| P13 Duomètre à Chronographe | 9.5 | **5** | Dual-wing architecture genuinely distinct; softening market and a $17–21.5k ticket |
| P1 VC Vintage Triple Calendar | 9 | **4** | Archival gravity, but overlaps P9 and P19, and no priced yellow-gold 4240 was found anywhere |
| P4 VC "1972" 37010 | 9 | **4** | Asymmetric-design chapter is real and now cheap — but the card describes the wrong watch |
| P14 Ultra-Fine 1955 | 8.5 | **4** | Pure movement chapter (cal 1003); band cut; one realized sale in the entire record |
| P5 Mercator 43050 | 9.5 | **3** | Spectacular chapter, worst liquidity in the guide (6 no-sales 2023–24), and ~20% of budget → **Canon** |
| P6 Malte PR/Date 83060 | 8.5 | **3** | Perfect sell-through, but the chapter is already owned twice; the differentiator is the logo |
| P15 Aronde 1954 | 9 | **3** | The LE claim is false, supply is ~1 listing worldwide, US channel is 40% over band |
| P11 AMVOX2 | 8.5 | **2** | Reference ambiguous, band cut, repeated no-sales, and "Aston Martin collaboration" is a second logo |
| P12 Chronomètre Royal 86122 | 9 | **2** | Chapter is a nameplate; both verified sales sit below the old floor; thin market |

Median = **5**. Distribution: 2,2,3,3,3,4,4,4,5,5,6,6,7,7,8,8,9.

---

## 8. Cut list and the disciplined version

**Proposed cuts — outright:** P6 (chapter owned twice), P11 (second logo,
ambiguous reference, weak demand), P12 (chapter is a nameplate), P15 (scarcity
claim false).
**Proposed move to a Canon appendix:** P5 Mercator, P1 Vintage Triple Calendar,
P8 Master Grand Réveil — real chapters, but unbuyable-in-practice at the stated
prices, and per §1.5 they corrupt the priority scale while sitting as
acquisition rows.
**Proposed cut as duplicate:** P19 *or* P9 — the Toledo and the Triple
Calendrier tell the same complete-calendar chapter in different cases. **Keep
P19**: it is the better-evidenced, better-trending, lower-risk entry.
**Proposed replacement:** P10 Grande Reverso GMT → plain Reverso Tribute, which
tells the 1931 chapter the guide never fills.

**The disciplined version is 13 entries** (4 owned + 9 targets), roughly **$80k
of priced targets against $241.5k**, covering *more* distinct chapters than the
current 21. It requires accepting that the JLC and VC halves stop being
balanced — the 10/11 parity is a quota serving the title, not an architecture.

**Opportunity cost, the strongest single argument in the review:** the top-3
budget ($80,500) buys three watches with **one supporting sale between them**.
The same money buys seven — 3110V, Toledo, Grand Réveil, Malte 83060, Reverso
GMT, Futurematic, Geophysic — for $76,750, covering seven distinct chapters,
every one more liquid than what it replaces.

---

## 9. The foundations

| Entry | Paid | Assessment |
|---|---|---|
| **P16 MUT RdM** | $5,350 | **Fairly bought**, mid-band. On a reference down 14.5% y/y against a JLC index of −8.9%. Guide's $7,500 ceiling is stale. |
| **P18 Quai de l'Île** | $9,150 | **Well bought** — below every observed ask, against a market estimate of $11,245–11,334 and **+6.0% y/y**, one of only two entries in the review trending up. |
| **P20 Polaris Geographic** | $19,100 | **Overpaid by ~$3,000** against $16,100 retail. A dated JDM dealer buyback of ¥1,250,000 = **$7,847 for an unworn example** is a sobering floor. Mark to $12,000–15,000. This is a realized loss, not a forecast. |
| **P21 Master Control** | $17,000 | **Exact full list**, and US list appears to be the cheapest global list — no overpay. But there is no secondary market at all; book it as consumption and expect real depreciation over 24–36 months. |

---

## 10. Corrections to apply — **A/B/D APPLIED 2026-08-13 with user approval**

Sections A (bands), B (priorities) and D (channel/condition + as-of notes)
were applied to `guide_entries` via `scripts/apply-swiss-review-2026-08.mjs`
on 2026-08-13, approved by the user in-session. The cut list / Canon /
additions script (`apply-swiss-review-cuts-2026-08.mjs`) was staged but **not
run** — superseded by the narrative-first reframe (see the v1.1 rebuild) and
note that its KEEP decisions differ from §8 as written.

**A. Band changes (`guide_entries.target_low_cents` / `target_high_cents`) — 10 entries**

| # | From | To |
|---|---|---|
| P1 | $12,000–20,000 | $12,000–18,000 |
| P2 | $2,500–4,500 | $4,000–6,500 |
| P3 | $3,500–5,500 | $3,000–4,250 |
| P4 | $12,500–15,500 | $8,500–12,000 |
| P5 | $35,000–45,000 | $40,000–52,000 |
| P7 | $14,000–17,000 | **$11,000–14,000** |
| P11 | $8,500–11,000 | $5,500–8,500 |
| P12 | $18,000–22,000 | $15,500–19,000 |
| P13 | $18,000–23,000 | $17,000–21,500 |
| P14 | $12,000–18,000 | $11,000–15,000 |
| P16 | $5,200–7,500 | $4,800–7,000 |
| P18 | $9,000–12,000 | $10,000–12,500 |
| P19 | $16,000–19,000 | $16,500–19,000 |
| P20 | *(0–0)* | $12,000–15,000 *(provisional)* |
| P6 | $9,000–13,000 | $10,500–13,000 |

*(P8, P9, P10, P15, P17 unchanged; P21 stays bandless.)*

**B. Priority changes — all 17 targets**, per §7.

**C. Factual corrections to `recommended_variant` / `dates_text` / `caliber`**

- P15: **remove the "limited edition" claim** (twice); note the 20-piece LE is
  the WG 81018/000G-9559.
- P4: `dates_text` → 1997 re-edition; `caliber` → cal 1055; note the 1970s
  original is ref 35202/2091 at 21×46mm.
- P6: `dates_text` → c.2007–early 2010s.
- P7: `caliber` → cal 1206 RDT (F. Piguet 1150 base); size 39mm.
- P11: add the **caseback edition test (750 = Chronograph, 999 = DBS)**.
- P2: dates → 1951–1957. P3: dates → 1960–c.1974; caliber note "bumper".
- P9: dimensions → 35.7 × 41 × 12.7mm; add moonphase.
- P10: add the Q3038420 / 240.8.72 warning.
- P14: launched 2010; add 4.13mm. P16: 2011 at 37mm, 39mm from 2012.
- P18: caliber → 5100/1.

**D. Notes to append** — each corrected entry gets its channel/condition
assumption and the as-of date (2026-08-13) in `notes`, per §3.2.

**E. Structural changes requiring a document revision (v1.1), not a data update**
— the cut list (§8), the Canon appendix, the priced additions (§6.3), and a
thesis rewritten to have a stopping rule.

---

## 11. Evidence appendix

The per-venue comp tables — every row with its date, SOLD/ASK tag, price,
currency, condition note and URL — are the substance of this review and are
reproduced in full in the companion files committed alongside this report:

- `evidence_auctions.md` — realized auction prices + the premium-calibration
  finding (the strongest evidence in the review)
- `evidence_chrono24.md` — ask distributions, listing counts, supply-depth ranking
- `evidence_ebay.md` — ask rows + the relisting and cross-listing-premium findings
- `evidence_watchcharts.md` — index/trend data, with its access caveat
- `evidence_yahoojp.md` — JDM asks and Yahoo hammer prices, JPY as listed
- `factcheck.md` · `critic_architecture.md` · `critic_investment.md`
- `refute_p7.md` — the Bonhams destruction and the Phillips discovery
- `refute_material.md` — the seven material-finding verdicts
- `validation_additions.md` — priced bands for the proposed additions
- `fx.md` — stamped rates and the conversion convention

**Supply depth at 2026-08-13**, thinnest first — the most decision-relevant
single table in the evidence, because a band means nothing if nothing is for
sale: P21 (0 priced) · **P15 (1)** · P5 (2 plain YG) · P20 (2) · P3 (1 priced) ·
P12 (1 clean) · P13 (3) · P11 (3) · P17 (range only) · P9 (4) · P1 (4) · P16 (4)
· P19 (5) · P2 (5) · P10 (6) · P4 (7) · P6 (7) · P8 (7) · **P7 (8, stated)** ·
**P18 (23, stated)**.

---

## 12. Corrections applied — checklist

*(Per §3.7, this section is completed after the data update so the database and
the document cannot silently drift.)*

- [x] A. Band changes applied to `guide_entries` (2026-08-13, user-approved)
- [x] B. Priority re-base applied (2026-08-13, user-approved)
- [x] C. Factual corrections carried into the v2.0 draft cards (2026-08-14);
      original v1.0 entry text superseded by the v2.0 restructure
- [x] D. Channel/condition + as-of notes appended (2026-08-13)
- [x] E. Document revision — completed as **v2.0 "A Trio of Swiss Artisans —
      The Idea, the Engine and the Cathedral"** (narrative-first rebuild +
      Breguet, per user direction): draft + image sources in docs/Watch
      Guides/, database restructured to the 16-chapter spine by
      `scripts/seed-swiss-guide-v2.mjs` (2026-08-14, user-approved; 30
      entries, 4 cuts, Canon + Alternates, owned 7097 linked). Breguet bands
      sold-validated + 31-claim fact-check archived in the evidence folder
      (`breguet_evidence.md`, `breguet_factcheck.md`). Illustrated PDF:
      authored in claude.ai (pending; input package = the v2.0 draft + both
      image-source files)
- [ ] Re-run r/WatchExchange with a working reddit path (§2.2)
- [ ] Verify the Christie's P7 rows against christies.com when reachable (§4.2)
