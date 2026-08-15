# eBay Venue Evidence — Swiss Artisans Guide Review

Collector: eBay venue specialist · Session date: 2026-08-13

---

## METHOD & THE CENTRAL CAVEAT — READ BEFORE USING ANY ROW

**There are ZERO verified eBay sold prices in this file.**

What I attempted this session:

| Channel | Result |
|---|---|
| `ebay.com/sch/i.html?...&LH_Sold=1&LH_Complete=1` (sold/completed search) | Fetch **timed out** (60s), repeatedly, for multiple queries |
| Individual `ebay.com/itm/<id>` pages | Fetch **timed out** (60s), repeatedly |
| `ebay.de/itm/<id>` | Fetch **timed out** |
| `worthpoint.com` search | **HTTP 403 Forbidden** |
| `watchcharts.com` search | **HTTP 403 Forbidden** |
| `everywatch.com` model pages | **Fetchable** — and it tags source sellers as `<sellername> (eBay)` |

**Sold data gated — no verified solds, at any entry, at this venue.**

Every eBay row below therefore comes from EveryWatch's per-model pages. EveryWatch
labels these rows **"Sold / Removed"** — verbatim. It **cannot distinguish a
completed sale from a delisting/relisting**, and the price it records is the
listing price at the moment the listing disappeared. Accordingly:

- **Every row below is tagged `ASK`** — a last-observed asking price. None is a comp.
- The synthesis stage must **not** treat these as transaction evidence.

### Two systematic distortions I found in the eBay ask data

**(1) Serial relisting by single sellers inflates apparent volume.** The same
seller reappears month after month at near-identical prices with 1–19 day
listing durations. This is one unsold watch cycling, not N sales. Worst cases:
`shu590218nona` (JP) — 5 rows on P7, 3 rows on P15; `Swiss Watch Expo` — 2
identical $23,980 rows on P12. Counting these as separate comps would badly
inflate any band built from them. I have flagged every instance inline.

**(2) eBay carries a dealer cross-listing premium.** Where the same dealer sells
on both eBay and Chrono24/direct, the eBay ask is frequently higher for
identical stock in the same month:

| Dealer | eBay ask | Same dealer, non-eBay | Delta | Entry |
|---|---|---|---|---|
| Bernstein Watch Co. | $15,999 | $12,999 (Chrono24) | **+$3,000 (+23%)** | P15 |
| TIME GRACE GINZA | $16,583–19,269 | $14,075 (Chrono24) | **+$2,500–5,200** | P14 |
| BlackTag Watches | $18,200–18,500 | $17,100–17,400 (Chrono24) | **+$1,100 (+6%)** | P9 |
| DealMaker Co. | $5,082 | $4,912 (Chrono24) | +$170 (+3.5%) | P16 |
| State 48 Luxe | $20,995 | $20,500 (Chrono24) | +$495 | P19 |
| Arrowood Collective | $16,799 | $16,499 (Chrono24) | +$300 | P19 |
| The 1916 Company | $19,450 | $19,950 (direct) | −$500 | P15 |
| European Watch Co. | $16,500 | $16,500 (direct) | par | P14 |
| Watch Your Wrist | $17,499 | $17,499 (direct) | par | P19 |

**Implication for the whole review: eBay asks are, on average, the HIGH end of
the global ask distribution — not a clearing level.** Any band anchored on eBay
asks will be biased upward. This is the single most important thing this venue
contributes.

### Non-venue rows
Where I report a Chrono24 / auction-house / direct-dealer row, it is inside an
explicitly marked **NON-VENUE CONTEXT** block. Those are not eBay evidence; I
include them only because they are what the same EveryWatch page showed
alongside the eBay rows, and the contrast is load-bearing.

---

## P1 — VC Vintage Triple Calendar ref 4240/4241

**NO DATA FOUND (eBay).**

`everywatch.com/vacheron-constantin/4240` and `/vintage-triple-calendar` both
returned the gated shell ("Only Collectors Beyond This Point") — no rows.

A search snippet referenced "a 4240 triple date model sold in July 2026 for
17,999 USD" but gave **no venue attribution and no fetchable source page**, so I
am not recording it as a row. Snippet boilerplate claiming "9387 available …
from Chrono24 and eBay, $359 to $2,099,999" is generic site furniture, not data.

---

## P2 — JLC Futurematic E501

On-target = **E501 in steel**. Gold-plated / gold-filled LeCoultre-market
Futurematics are a materially cheaper different watch and are marked as such.

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Mar 2026 | ASK | 5,847 | USD | **ON TARGET.** "Futurematic E501 35mm Stainless steel". Seller `santafee200 (eBay) • US`. No condition/service detail exposed. | https://everywatch.com/jaeger-lecoultre/futurematic |
| Aug 2025 | ASK | 6,795 | USD | **ON TARGET.** "Futurematic E501 37mm Stainless steel White". Seller `tailoredtimepieces (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jul 2026 | ASK | 6,400 | USD | Steel, silver dial, 37mm — **no reference in title**, so E501 unconfirmed. `watch-time*de (eBay) • DE` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jul 2025 | ASK | 6,800 | USD | 35mm **yellow gold** — different material, not the steel target. `kota-antique (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jan 2026 | ASK | 3,999 | USD | 35mm **yellow gold**, no ref. `5starwatches (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Nov 2025 | ASK | 4,100 | USD | **E502 sister ref**, gold-plated + 14k. Not the E501. `jlc-futurematic (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jul 2026 | ASK | 5,039 | USD | Gold-plated, black dial — cheaper variant, not target | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jun 2026 | ASK | 4,202 | USD | Gold-plated, black dial — not target. `paperenginesales (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Aug 2026 | ASK | 4,400 | USD | Gold-plated and gold, black dial — not target. `eBay • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jan 2026 | ASK | 3,500 | USD | Gold-plated — not target. `eBay • US` | https://everywatch.com/jaeger-lecoultre/futurematic |
| Jul 2025 | ASK | 1,500 | USD | "Futurematic 497 35mm Gold-plated Multi-colored" — likely redialled; not target. `dreck-amass (eBay) • US` | https://everywatch.com/jaeger-lecoultre/futurematic |

**NON-VENUE CONTEXT** (same page, not eBay): Analog:Shift US Mar 2026 $7,950
"E501 35mm Stainless steel Silver"; Pascal Karp BE Feb 2025 $6,126 "E501 37mm
Stainless steel Silver"; Analog:Shift E501 **yellow gold** $3,250–3,750 (Mar–Apr
2026); European gavel results for gold-plated examples run $625–1,955.

**Finding vs guide band $2,500–4,500 (steel, silver/beige, working back-set):**
every steel E501 ask I can see — eBay $5,847 and $6,795, non-eBay $6,126 and
$7,950 — is **above the band's top**. The $2,500–4,500 prices attach to
gold-plated/gold-filled examples, which is a different watch. **The band looks
too low for steel by roughly $1,500–3,000.** Caveat: these are asks, and vintage
condition (redial, back-set function, service) is unexposed at every row.

---

## P3 — JLC Memovox Automatic Calendar E855

**NO DATA FOUND (eBay).**

The EveryWatch Memovox page carries plenty of eBay rows, but **not one of them
has E855 in the title**. The eBay Memovox rows I saw were generic or other refs
(e.g. `irvinegoldmine.com` $6,999 ref R1189 YG; `falkwatches` $5,100 gold-plated;
`teruteru-osaka-japan` $6,194 no ref; `finevintagewristwatches` $4,642 no ref;
`sonningvintagewatchesltd` $6,061 ref 951722; `jude357` $4,499 ref 9386 YG;
`azodi85` $4,500 ref 1064976). Per the no-lookalikes rule these are **not**
E855 comps and I am not offering them as such.

**NON-VENUE CONTEXT** — every E855-titled row on that page was Chrono24/private,
not eBay: Jul 2026 Mi Time Milano (C24, IT) $4,919 steel; Jul 2026 Private
Seller (C24, CA) $4,213 steel; Jul 2026 Private Seller (C24, CA) $3,543 steel;
Aug 2026 Private Seller (C24, AU) $3,519 yellow gold; Jul 2026 Private Seller
(C24, US) $3,800 yellow gold; Jul 2026 TimeKeeping (C24, FR) $6,418 yellow gold;
Jul 2026 Private Seller (C24, DE) $1,754 "Memovox 855 37mm Stainless steel".
Source: https://everywatch.com/jaeger-lecoultre/memovox/e855

That non-venue steel cluster ($3,543–4,919) sits **at or below the guide band's
$3,500–5,500 floor-to-mid**, suggesting the band's top is optimistic — but this
is not eBay evidence and another collector should own it.

---

## P4 — VC "1972" / Prestige de la France ref 37010

**NO DATA FOUND (eBay).** `everywatch.com/vacheron-constantin/37010` returned
the gated shell with no rows; I could not locate a working model slug.

---

## P5 — VC Mercator ref 43050 (yellow gold map dial)

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jun 2026 | ASK | 74,950 | USD | "43050/000J-8232 36mm Yellow gold" — on-target YG. `the1916company (eBay)` | https://everywatch.com/vacheron-constantin/mercator |
| Mar 2026 | ASK | 49,349 | USD | "43050 36mm Yellow gold". `arrowoodcollectivellc (eBay)` | https://everywatch.com/vacheron-constantin/mercator |
| Feb 2026 | ASK | 49,349 | USD | "43050 36mm Yellow gold", `eBay` — **identical price to the row above; almost certainly the same listing recycled, not a second data point** | https://everywatch.com/vacheron-constantin/mercator |
| Dec 2025 | ASK | 75,000 | USD | Title says "43050/**000R** 38mm Yellow gold" — internally inconsistent (000R = rose gold). Treat ref as unreliable. `breguetcamera (eBay)` | https://everywatch.com/vacheron-constantin/mercator |
| Jul 2025 | ASK | 10,489 | USD | **DIFFERENT REFERENCE — 31046, 32mm.** Not a Mercator 43050 comp. Listed only to explain why a $10k "Mercator" number exists. `shu590218nona (eBay)` | https://everywatch.com/vacheron-constantin/mercator |

**NON-VENUE CONTEXT:** yellow-gold 43050 auction/dealer results Nov 2024–Jul
2026 span $35,674–$121,540 — e.g. Phillips Nov 2025 $81,560 (000J-9038),
Christie's Nov 2025 $70,881, Sotheby's Dec 2025 $48,260 (000J-17), Allu Jul 2025
$44,879, Hairspring Jul 2025 $40,000, Grailzee Mar 2026 $42,500, Grey and Patina
May 2026 $41,000, Delray $41,999. Platinum examples (000P) are separately
$35,674–$152,400 and should not be pooled with YG.

**Finding vs guide band $35,000–45,000:** the two credible eBay YG asks are
**$49,349 and $74,950 — both above the band**, and the non-eBay distribution has
a fat tail well past $80k. The $35–45k band matches the *bottom quartile* of
observed YG activity (Grailzee/Hairspring/Delray/Allu), not the middle.
**The band is probably 20–40% too low.** Wide dispersion here is real, not noise
— condition and dial variant drive it, and none of these rows exposes either.

---

## P6 — VC Malte Power Reserve/Date ref 83060

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 13,999 | USD | "Malte 83060 38mm 18k rose gold". Only eBay row on the page. `eurowatchworks (eBay)` | https://everywatch.com/vacheron-constantin/malte |

**NON-VENUE CONTEXT:** Aug 2026 Lone Star Timepieces US $17,350 (83060/000R, RG,
white dial); Aug 2026 Hapais Trading (C24, HK) $11,766 (83060/000G, WG, silver);
Aug 2026 Bezel $15,810 (83060/000G-9287, WG, silver); Jul 2026 Bezel $14,250
(83060, RG, black dial).

**Finding vs guide band $9,000–13,000:** the single eBay ask ($13,999) and every
non-eBay ask except the HK discounter ($11,766) sit **above the band's top**.
Observed ask range $11,766–17,350 centres near ~$14,500. **The band looks
low by $2,000–4,000**, though one eBay row is thin support — flag for another
venue to confirm.

---

## P7 — VC Malte Dual Time Regulator 42005/000G-8900 ★ LOAD-BEARING

**User is negotiating at ~$12,000. This entry got the most scrutiny.**

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Aug 2025 | ASK | 16,422 | USD | 42005/000G 38mm WG silver. `shu590218nona (eBay) • JP`. Listed 13 days. **Relist #5 — see note** | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |
| Jul 2025 | ASK | 16,584 | USD | Same seller, same spec. Listed 17 days. **Relist #4** | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |
| Jul 2025 | ASK | 16,741 | USD | Same seller, same spec. Listed 17 days. **Relist #3** | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |
| Jun 2025 | ASK | 16,992 | USD | Same seller, same spec. Listed 19 days. **Relist #2** | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |
| May 2025 | ASK | 16,836 | USD | Same seller, same spec. Listed 1 day. **Relist #1** | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |
| Aug 2025 | ASK | 21,500 | USD | **SISTER-REFERENCE PROXY ONLY — ref 42505/000G-8900, the diamond-set variant, NOT 42005.** Do not pool. `breguetcamera (eBay) • US`, listed 92 days | https://everywatch.com/vacheron-constantin/malte-dual-time-regulator |

**⚠ THE FIVE ROWS ARE ONE WATCH.** Same seller (`shu590218nona`, JP), same
38mm WG silver 42005/000G, five consecutive months May–Aug 2025, prices drifting
*downward* $16,992 → $16,422, each listing surviving only 1–19 days before
removal and reappearing. This is a **single unsold watch being relisted with a
slowly declining ask**, not five sales. Treat P7 as having **ONE** eBay data
point: an ask of ~$16.4–17.0k that **repeatedly failed to clear**.

That is evidence *against* the high end, not for it.

**NON-VENUE CONTEXT — the only genuine transaction evidence I saw:**

| Date | Venue | Price | Note |
|---|---|---|---|
| 8 May 2024 | Rago Auctions, lot 117 | **$10,080** | ref 42005, gold. Auction result (search snippet; ragoarts.com/auctions/2024/05/watches/117) |
| 27 Sep 2024 | Phillips Bacs & Russo HK | **$13,854** | 42005/000G 38.5mm 18k white gold — **the on-spec auction comp** |
| 15 Jun 2026 | Heritage Auctions HK | $15,000 | 42005/2 38mm **yellow** gold |

Dealer asks for context: I Play Watch HK Jan 2026 **$10,732** (42005/000G, WG —
the cheapest WG ask anywhere); Luxury Bazaar Mar 2025 $14,950 (42005/2 WG);
European Watch Co Mar 2025 $15,100 (42005/000G WG); Horlogerie Desbiolles CH Nov
2025 $15,530 (42005/000G WG); Orologeria Duomo IT Mar 2026 $19,944 (42005/000J,
yellow gold).

**Finding vs guide band $14,000–17,000, and vs the $12,000 negotiation:**

- The band is built on the **ask** side of the market. The one on-spec white-gold
  **auction** result is $13,854 (Phillips HK, Sep 2024) — *below the band*.
- The one on-ref auction result at Rago (May 2024) is **$10,080**.
- The cheapest live WG dealer ask is **$10,732** (I Play Watch, Jan 2026).
- The $16.4–17.0k eBay level is a **single Japanese seller who could not sell at
  it across five attempts**.

**A $12,000 purchase sits comfortably between the two real auction results
($10,080 and $13,854) and above the cheapest dealer ask ($10,732). It is well
supported. The guide's $14,000–17,000 band appears anchored on unsold eBay and
dealer asks and should probably come down to roughly $11,000–15,000.**
Caveats: no row exposes box/papers, service history or polish, all of which move
this reference materially; and the WG 000G vs YG 000J vs 42005/2 distinction is
inconsistently recorded across sources.

---

## P8 — JLC Master Grand Réveil Q163842A / 149.8.95

**NO DATA FOUND (eBay).** No dedicated EveryWatch model page resolved.

**NON-VENUE CONTEXT** (search snippet, everywatch.com): Watchfinder UK $12,796
(ref 163842A, listed 3 days); Vintage Watch Agency SE $26,726 (ref 163842A,
listed 260 days — 260 days unsold is itself a signal that ask is unrealistic).
Neither is eBay. Guide band $10,500–13,500 is consistent with the Watchfinder
number but that is one non-venue ask.

---

## P9 — VC Historiques Toledo 1952 ref 47300 ★ LOAD-BEARING

Target is especially **47300/000R-9219 rose gold**.

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Feb 2026 | ASK | 19,000 | USD | **"47300 Rose gold Silver" — the ONLY rose-gold eBay row.** `weneag (eBay) • US`. No sub-ref, no condition detail | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Jul 2026 | ASK | 19,999 | USD | 47300/000J-9065 35.5mm **yellow** gold. `watchyourwristatlanta (eBay) • US`. Same price as its own direct listing (parity) | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Feb 2026 | ASK | 18,500 | USD | 47300/000J-9065 yellow gold. `blacktag.watch (eBay) • US` — **cross-listed at $17,400 on Chrono24 same month** | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Feb 2026 | ASK | 18,200 | USD | 47300/000G-9064 white gold. `blacktag.watch (eBay) • US` — **Chrono24 twin at $17,100** | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Jan 2026 | ASK | 18,500 | USD | 47300/000G-9064 white gold. `blacktag.watch (eBay) • US` — **Chrono24 twin at $17,400** | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Jan 2026 | ASK | 12,995 | USD | "47300 35mm Yellow gold Silver". `jzl.enterprises (eBay) • US`. Lowest credible eBay ask | https://everywatch.com/vacheron-constantin/historiques/47300 |
| Dec 2025 | ASK | 10,000 | USD | **⚠ EXCLUDE — "47300 **43mm Stainless steel** White". The Toledo 47300 is a 35–36mm gold reference; a 43mm steel example does not exist. Mis-specified or counterfeit. `katerynmartynenk0 (eBay) • US` | https://everywatch.com/vacheron-constantin/historiques/47300 |

**NON-VENUE CONTEXT — real auction results:** Christie's US Jun 2026 **$15,240**
(35.5mm 18k yellow gold); Sotheby's HK Dec 2025 $23,550 (36mm YG); Sotheby's HK
Apr 2026 $24,508 (34.5mm 18k white gold); Dr. Crott DE 10 May 2025 **$14,063**
(search snippet). Christie's HK May 2026 $45,389 is the **platinum**
47300/000P-9067 — a different watch, do not pool. Cheapest dealer asks are I Play
Watch HK at $11,270–11,997 (WG).

**Finding vs guide band $13,500–16,500:**
- Every eBay ask except one is **$18,200–19,999 — above the band**, and the
  rose-gold row specifically is $19,000.
- But eBay is demonstrably the expensive shelf here: BlackTag's identical stock
  is $1,100 cheaper on Chrono24, and HK dealers ask $11.3–12.0k.
- Auction results straddle the band: $14,063 and $15,240 inside it, $23,550 and
  $24,508 far above it.

**Read: the band is defensible for yellow/white gold at auction, but the rose
gold 000R-9219 target has exactly ONE eBay ask ($19,000) and no verified sale at
this venue.** I would not move the band on eBay evidence alone — I would flag
that eBay asks systematically overstate it.

---

## P10 — JLC Grande Reverso GMT ref Q3028420 / 240.8.18

**NO DATA FOUND (eBay).**

The general Reverso page carries ~15 eBay rows, but **none matches Q3028420 /
240.8.18**. Per the no-lookalikes rule (a plain Reverso is not a Grande Reverso
GMT comp) I am recording none of them.

**NON-VENUE CONTEXT — one exact-reference listing, fetched individually:**
"Grande Reverso Duo GMT Q3028420/240.8.18 Duo Face 47.0 x 29mm", **$9,920 USD**,
seller **ElegantSwiss via Chrono24 (NOT eBay)**, New York US, last seen
**1 Feb 2026**, status "No Longer Available", listed 1 day, pre-owned "excellent,
pristine", **no original box, no original papers** (a Certificate of Appraisal
only), ~2010 production.
URL: https://everywatch.com/jaeger-lecoultre/reverso/watch-31444057

Also, from a search snippet only: a 240.8.18 sold at **Bonhams UK, 12 Nov 2025,
$10,084**, beating estimate by 27%. And an Ineichen CH lot (Feb 29–Mar 7 2024)
went **unsold** — but that lot is titled "Reverso Grande Date 240.8.18", a
different model, so treat with caution.

**Finding vs guide band $7,000–10,000:** the two on-reference numbers I can see
($9,920 ask without box/papers, $10,084 Bonhams result) sit **at the very top of
the band or just above it**. A full-set example would plausibly exceed it. The
band's floor of $7,000 is unsupported by anything I found. **No eBay evidence
either way.**

---

## P11 — JLC AMVOX2 Chronograph ref Q192T25

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 9,999 | USD | "AMVOX 192.T.25 44mm Titanium Silver-1". `eBay • US` (seller not exposed) | https://everywatch.com/jaeger-lecoultre/amvox |
| Aug 2026 | ASK | 9,580 | USD | "AMVOX AMVOX2 44mm Titanium Black and Silver-1" — AMVOX2, **no ref in title**. `orangeberry-japan (eBay) • JP` | https://everywatch.com/jaeger-lecoultre/amvox |

**NON-VENUE CONTEXT:** Jul 2026 Essential Watches US $10,400 ("AMVOX 2
Chronograph 192.T.25 44mm **Stainless steel**" — material likely mis-tagged, the
LE is titanium/PVD); Jul 2026 Chad Warrick (C24) $9,100 (Q192T.25 titanium);
Jul 2026 Rostovsky $8,250; Jul 2026 Bezel $8,995; Jun 2026 Nautilus IT $8,718;
Jun 2026 Chrono24 FR $11,277. One Bezel row at $15,185 for a Q192.T.25 titanium
is an unexplained outlier — probably a different/precious-metal variant.

**Finding vs guide band $8,500–11,000:** both eBay asks ($9,580, $9,999) fall
**inside the band**, and the non-eBay cluster $8,250–11,277 brackets it almost
exactly. **This is the best-supported band in the whole set from this venue** —
no change indicated. Caveat: still asks, not sales; and no row exposes the
case-actuated chrono's working condition, which is the expensive failure mode on
this model.

---

## P12 — VC Historiques Chronomètre Royal 1907 ref 86122/000R-9362

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 23,980 | USD | 86122/000R-9362 39mm rose gold, white dial. `Swiss Watch Expo (eBay)` | https://everywatch.com/vacheron-constantin/historiques/86122 |
| Feb 2026 | ASK | 23,980 | USD | **Identical seller, identical price, identical spec — one watch relisted, not a second comp.** `Swiss Watch Expo (eBay)` | https://everywatch.com/vacheron-constantin/historiques/86122 |

Effectively **ONE** eBay data point: $23,980, unsold across at least Feb→Jul 2026.

**NON-VENUE CONTEXT — auction results:** Phillips Bacs & Russo 5–12 Mar 2026
**$16,238**; Sotheby's 5–12 Mar 2026 **$15,553**. Dealer asks: I Play Watch Apr
2026 $14,778; Private Seller (C24) Mar 2026 $17,647; Chrono24 Feb 2026 $18,296;
BIG MOON (C24) Apr 2026 $21,223; DPRF (C24) Jul 2026 $34,784 (outlier).

**Finding vs guide band $18,000–22,000:** the two March 2026 auction results
— the only real transaction evidence — are **$15,553 and $16,238, both BELOW the
band's floor**. The single eBay ask ($23,980) is above the band's ceiling and
demonstrably did not clear in five months. **The band looks too high by roughly
$2,000–4,000; something like $15,000–19,000 fits the observed evidence better.**

---

## P13 — JLC Duomètre à Chronographe ref Q6012420 rose gold

**NO DATA FOUND (eBay).** The Duomètre model page and its reference sub-pages all
returned the gated shell.

**NON-VENUE CONTEXT** (search snippet, everywatch.com): Bezel Auctions US
8–15 Dec 2024 sold **$15,250**; Christie's US 4–17 Dec 2025 sold **$19,050**; one
live listing at $18,600 (42mm rose gold, cal. 380, **with original box and
papers**, "used but very good"). Venue for the $18,600 not established.

Guide band $18,000–23,000: the 2025 Christie's result ($19,050) supports the
lower half; the Dec 2024 Bezel result ($15,250) is below the band. No eBay input.

---

## P14 — VC Les Historiques Ultra-Fine 1955 ref 33155/000R-9588

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Apr 2026 | ASK | 16,500 | USD | 33155/000R-9588 36mm RG silver. `european-watch (eBay) • US` — **parity with its own direct listing ($16,500)** | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Jan 2026 | ASK | 16,583 | USD | "Historiques 33155". `time-grace (eBay) • JP` | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Dec 2025 | ASK | 16,714 | USD | "Historiques 33155". `time-grace (eBay) • JP` — **same seller, 3rd of 3 rows** | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Nov 2025 | ASK | 19,269 | USD | "Historiques 33155". `time-grace (eBay) • JP` — **its Chrono24 store asked $14,075 in Oct 2025 for the same ref** | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Dec 2025 | ASK | 19,900 | USD | 33155/000R-9588 36mm RG silver. `european-watch (eBay) • US` | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Dec 2025 | ASK | 17,950 | USD | 33155/000R-9588. `the1916company (eBay) • US` — direct twin $18,002 (parity) | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Dec 2025 | ASK | 17,450 | USD | 33155/000R-9588. `the1916company (eBay) • US` | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Nov 2025 | ASK | 16,004 | USD | 33155/000R-9588 36mm RG silver. `eic_rm (eBay) • JP` | https://everywatch.com/vacheron-constantin/historiques/33155 |
| Jul 2025 | ASK | 12,995 | USD | "Historiques 33155 36mm Rose gold Silver". `jzl.enterprises (eBay) • US` — parity with its Chrono24 twin ($12,995). **Lowest eBay ask** | https://everywatch.com/vacheron-constantin/historiques/33155 |

**NON-VENUE CONTEXT — the one auction result:** Watch Collecting Auctions UK,
25 May–1 Jun 2026, **$10,100**. Dealer asks span very wide: I Play Watch HK
$9,828–10,385 at the bottom; Hapais/IPLAYWATCH (C24, HK) $13,045–13,382;
GINZA RASIN $13,932; European Watch Co US $17,500–19,900; Luxusagentur (C24, DE)
$28,322 (outlier) at the top.

**Finding vs guide band $12,000–18,000:** eBay asks cluster **$16,000–19,900**
(nine rows, but only ~6 distinct sellers) — i.e. the **top half and above** of
the guide band. Meanwhile the single auction result is **$10,100, below the
band's floor**, and HK dealers ask under $10,500. **The true spread is far wider
than $12–18k in both directions; the band is roughly right in the middle but is
not capturing a real $10k floor.** Geography matters more than condition here —
US eBay sellers ask ~60% more than HK dealers for the same reference.

---

## P15 — VC Historiques Aronde 1954 ref 81018/000R-9657

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Aug 2026 | ASK | 19,450 | USD | 81018/000R-9657. `the1916company (eBay) • US` — direct twin $19,950 | https://everywatch.com/vacheron-constantin/historiques/81018 |
| Jul 2026 | ASK | 15,999 | USD | 81018/000R-9657. `bernsteinwatches (eBay) • US` — **its own Chrono24 store asked $12,999 the same month: +$3,000 eBay premium, the largest I found** | https://everywatch.com/vacheron-constantin/historiques/81018 |
| Mar 2026 | ASK | 18,783 | USD | 81018/000R-9657. `shu590218nona (eBay) • JP` — **serial relister, same seller as P7** | https://everywatch.com/vacheron-constantin/historiques/81018 |
| Mar 2026 | ASK | 18,214 | USD | Same seller, same month, same spec — **one watch, two rows** | https://everywatch.com/vacheron-constantin/historiques/81018 |
| Sep 2025 | ASK | 16,794 | USD | Same seller again. `shu590218nona (eBay) • JP` | https://everywatch.com/vacheron-constantin/historiques/81018 |
| Sep 2025 | ASK | 15,500 | USD | 81018/000R-9657. `european-watch (eBay) • US` | https://everywatch.com/vacheron-constantin/historiques/81018 |

Six rows, but **≈4 distinct watches** (three of the six are `shu590218nona`).

**NON-VENUE CONTEXT:** cheapest asks are I Play Watch HK $10,180–11,314 and
Hapais Trading (C24, HK) $12,093–12,586 — a very stable HK floor across
Jan 2025–Nov 2025. Mid: Watchnian (C24, JP) $15,032; RIBERO (C24, JP)
$14,008–14,303; Grailzee US $12,000–16,000; European Watch Co $13,600–15,100.
Top: Watchfinder UK $18,361; Geneva Watch Co CH $19,207; Montredo DE $35,610
(outlier).

**Finding vs guide band $11,000–14,000:** **every single eBay ask
($15,500–19,450) is above the band's ceiling.** The band matches the HK/Chrono24
discount tier ($10,180–12,586) and the low Grailzee results, not the US/JP eBay
shelf. Given the Bernstein cross-listing showing a $3,000 eBay markup on
identical stock, I read the band as **defensible as a buy-side target but
unrealistic as a US eBay purchase price** — a buyer shopping eBay should expect
$15,500+. Worth calling out explicitly in the guide rather than moving the band.

---

## P16 — JLC Master Ultra Thin Réserve de Marche ref Q1378420 steel ★ LOAD-BEARING

Guide states market **$5,200–7,500**. Target is the **silver-dial 1378420**;
the blue-dial **1378480** is a sister reference and is marked as such.

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 5,082 | USD | "Q1378420 176.8.38.S 39mm Stainless steel". `dealmaker1287 (eBay) • JP` — **cross-listed at $4,912 on Chrono24 the same month (+3.5% eBay)** | https://everywatch.com/jaeger-lecoultre/master-ultra-thin-réserve-de-marche |
| Jun 2026 | ASK | 7,121 | USD | "176.8.38.S/Q1378420 39mm Stainless steel". `eBay • JP` (seller not exposed) | https://everywatch.com/jaeger-lecoultre/master-ultra-thin-réserve-de-marche |
| Mar 2026 | ASK | 11,291 | USD | **SISTER-REFERENCE PROXY — Q1378480 blue dial, not the silver 1378420.** `great_watches_kyoto (eBay) • JP`. Also a clear outlier | https://everywatch.com/jaeger-lecoultre/master-ultra-thin-réserve-de-marche |
| Feb 2026 | ASK | 6,960 | USD | **SISTER-REFERENCE PROXY — Q1378480 blue dial.** `shu590218nona (eBay) • JP` | https://everywatch.com/jaeger-lecoultre/master-ultra-thin-réserve-de-marche |

**NON-VENUE CONTEXT — on-reference Q1378420/176.8.38.S asks, Oct 2025–Jul 2026:**
Chrono24 JP May 2026 **$4,527** (lowest); DealMaker (C24, JP) $4,912; BRAND SHOP
LIPS (C24, JP) $5,433 and $5,471; YINLIINTERNATIONAL (C24, HK) $5,764; Komehyo
(C24, JP) $5,757; GINZA RASIN (C24, JP) $5,810 and $6,262; World Wide Watches
(C24, ES) $6,000; Horlogerie du Châtelain (C24, BE) $6,139 and $6,514; Legacy in
Time (C24, US) $6,450; Falco Watches (C24, UK) $6,559; Joaillerie Royale BE
$7,324. Loose "1378420" rows without the sub-ref run higher: Subdial UK $7,325,
Vintage Watch Agency SE $7,007–12,790.

**Finding vs the guide's stated $5,200–7,500:** the two on-target eBay asks
($5,082 and $7,121) **bracket the guide range almost exactly** — good corroboration
at the top. But the **on-reference Chrono24 cluster runs $4,527–6,559 with a
median near $5,800**, meaning the guide's $5,200 floor is a little high: this
watch is routinely asked at $4,500–5,100 from Japanese sellers. **I'd nudge the
range to roughly $4,800–7,200.** The guide's top of $7,500 is well supported.
Caveat: JP-sourced examples may carry import/duty and shorter warranty exposure,
which partly explains the discount — none of these rows exposes box/papers.

---

## P17 — JLC Geophysic True Second ref Q8018420 ★ LOAD-BEARING

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 8,950 | USD | "Q8018420 39.5mm Stainless steel Silver" — **the only ref-confirmed eBay row**. `europeanwatchcompany (eBay) • US` | https://everywatch.com/jaeger-lecoultre/geophysic |
| Jul 2026 | ASK | 8,000 | USD | "39mm Stainless steel Silver" — **no reference in title; True Second probable but UNCONFIRMED**. `a-slow-five-oh (eBay) • US` | https://everywatch.com/jaeger-lecoultre/geophysic |

Other eBay rows on that page are **Geophysic Universal Time** (Q8108420 /
Q8108120, blue, 41.5mm) — a different watch, excluded: `mometan` $8,495,
`Swiss Watch Expo` $10,440 (×2), `ginzarasin` $10,732, `jzl.enterprises` $9,995,
`tnsdiamondsandwatches` $8,750.

**NON-VENUE CONTEXT — on-reference Q8018420 asks, Jul–Aug 2026 (dense and tight):**
TMD MAX WATCH (C24, HK) **$5,866**; Martin XL (C24, HK) $6,154; TAOTAO (C24, HK)
$6,158 and $6,167; WenYou (C24, HK) $6,304; Alux Watches (C24, US) $6,499;
Bezel US $6,500; Private Seller (C24, TW) $6,669; Bezel US $7,985; Element iN
Time NYC (C24) $7,985.

**Finding vs guide band $5,500–7,000:** **the band matches the non-eBay market
almost perfectly** — eleven on-reference asks land $5,866–7,985 with the mass at
$6,100–6,700. But the **single ref-confirmed eBay ask is $8,950, about 35% above
the band's ceiling** and ~50% above the HK cluster. **Do not raise the band on
the eBay number.** The correct conclusion is the opposite: P17 is the clearest
demonstration in this review that eBay is a high-ask venue for these references,
and the guide band is sound.

---

## P18 — VC Quai de l'Île Self-Winding ref 4500S/000A-B195

**NO DATA FOUND (eBay).** `everywatch.com/vacheron-constantin/quai-de-lile` and
its `4500s` sub-page both returned the gated shell.

**NON-VENUE CONTEXT** (search snippet, everywatch.com): Grailzee Auction Aug 2026
sold **$11,944** (4500S/000A-B196); Jomashop ask $14,520 (4500S/000A-B196);
4500S/000A-B195 listed ~$10,685. Note **B196 ≠ B195** — the guide's target is
B195, and the only B195-specific figure I saw is the $10,685 ask.

Guide says market $9,000–12,000: the one auction result ($11,944) and the B195
ask ($10,685) both sit **inside** it. No eBay input.

---

## P19 — VC Historiques Triple Calendrier 1942 ref 3110V (B425 / B426) steel

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Jul 2026 | ASK | 20,995 | USD | 3110V/000A-**B426**. `state48luxe (eBay)`, listed 1 day — Chrono24 twin $20,500 | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jul 2026 | ASK | 20,520 | USD | 3110V/000A-**B425**. `Swiss Watch Expo (eBay)`, listed 29 days | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jul 2026 | ASK | 18,995 | USD | "3110V". `jzl.enterprises (eBay)`, listed 2 days | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jun 2026 | ASK | 18,995 | USD | 3110V/000A-**B425**. `thestellariscollection (eBay)`, **listed 114 days** — long unsold at this level | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jun 2026 | ASK | 18,975 | USD | 3110V/000A-**B426**. `eBay`, listed 5 days | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jun 2026 | ASK | 18,399 | USD | 3110V/000A-**B425**. `eBay`, listed 11 days | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Aug 2026 | ASK | 17,995 | USD | "3110V 40mm Stainless steel Silver". `eBay`, **listed 66 days** | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Jun 2026 | ASK | 17,499 | USD | 3110V/000A-**B425**. `watchyourwristatlanta (eBay)`, listed 5 days — direct twin $17,499 (parity) | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Apr 2026 | ASK | 16,799 | USD | 3110V/000A-**B425**. `arrowoodcollectivellc (eBay)`, listed 11 days — Chrono24 twin $16,499 | https://everywatch.com/vacheron-constantin/historiques/3110v |
| May 2026 | ASK | 16,495 | USD | 3110V/000A-**B426**. `worldtraveledbylandandsea (eBay)`, **listed 135 days** | https://everywatch.com/vacheron-constantin/historiques/3110v |
| Apr 2026 | ASK | 12,500 | USD | 3110V/000A-**B426**. `viver_official (eBay)`, listed 12 days. **Low outlier — no condition data, treat with suspicion** | https://everywatch.com/vacheron-constantin/historiques/3110v |
| May 2026 | — | ~~117,395~~ | USD | **⚠ EXCLUDED AS BAD DATA.** `themarinvault (eBay)`, 3110V/000A-B426 — The Marin Vault's own non-eBay listing the same month was $17,110. Off by ~7×; a data error | https://everywatch.com/vacheron-constantin/historiques/3110v |

**NON-VENUE CONTEXT — three real auction results:** Grailzee Auctions 13–15 Jul
2026 **$17,535** (B426); 6–13 Jun 2026 **$17,325** (B425); 24 May–1 Jun 2026
**$16,590** (B425). Dealer asks $15,122 (ALLU, C24) to $22,500 (Beirutimes), with
Bezel repeatedly $17,850–19,695 and I Play Watch HK $13,427 at the floor.

**Finding vs guide band $16,000–19,000:** **well supported — the best-evidenced
entry here.** Eleven usable eBay asks span $16,495–20,995 (median ≈ $18,400), and
three independent auction results cluster very tightly at **$16,590 / $17,325 /
$17,535**. The auction cluster sits in the band's lower-middle. Note the two
listings that sat 114 and 135 days unsold were at $18,995 and $16,495 — mixed
signal, but the $20,000+ asks all turned over fast or came from parity
cross-listers. **I'd keep $16,000–19,000, perhaps tightening to $16,500–19,000.**
No B425-vs-B426 price separation is visible in the data.

---

## P20 — JLC Polaris Geographic ref Q9078640 (ocean grey, 2024–)

Guide says "secondary market still forming."

| Date | SOLD/ASK | Price | Cur | Condition/notes | URL |
|---|---|---|---|---|---|
| Aug 2026 | ASK | 18,450 | USD | "Polaris Q9078640 42mm Stainless steel **Blue and Gray**" — dial description may indicate a different variant. `the1916company (eBay)` | https://everywatch.com/jaeger-lecoultre/polaris |
| Aug 2026 | ASK | 16,000 | USD | "Polaris Q9078640 42mm Stainless steel Silver and Gray". `as215 (eBay)` | https://everywatch.com/jaeger-lecoultre/polaris |
| Aug 2026 | ASK | 14,200 | USD | "Polaris Q9078640 42mm Stainless steel Gray". `bokhak (eBay)` | https://everywatch.com/jaeger-lecoultre/polaris |

**⚠ TREAT AS UNVERIFIED.** All three rows are the same month, none has a
condition/box-papers note, and the $14,200–18,450 spread on a current-production
reference is implausibly wide. I could not corroborate against a retail figure
this session, and I am not supplying one from memory. If the synthesis needs
P20, current retail must be confirmed from JLC directly.

**Finding:** the guide's "secondary market still forming" is **corroborated** —
a 30% ask spread across three simultaneous listings with zero verified sales is
exactly what an unformed secondary market looks like. No band should be stated.

---

## P21 — JLC Master Control Chronometre Date Power Reserve ref Q4168120 (2026 launch)

**NO DATA FOUND (eBay).** The Master Control model page returned the gated shell;
no rows for 4168120, and no early secondary listings surfaced at this venue.

I did **not** find a current retail figure from a fetchable source this session
and will not state one from memory. The user's $17,000 pre-order price is
therefore **uncorroborated by eBay evidence — neither confirmed nor challenged**.
Expected for a 2026-launch reference: there is unlikely to be any secondary
market yet.

---

## Coverage summary

**Entries with VERIFIED SOLD prices at this venue: NONE (0 of 21).**
eBay sold/completed listings are login-gated and every direct fetch timed out;
WorthPoint and WatchCharts both returned 403. This is a hard venue-wide gap, not
a per-entry one.

**Entries with eBay ASK data (13):**

| Entry | eBay rows | Distinct watches (after de-duping relists) | eBay ask range (on-target only) |
|---|---|---|---|
| P2 Futurematic E501 | 11 | ~11 | $5,847 / $6,795 steel E501 (rest are gold-plated variants) |
| P5 Mercator 43050 | 5 | ~3 | $49,349 – $74,950 |
| P6 Malte 83060 | 1 | 1 | $13,999 |
| **P7 Malte Dual Time Reg.** | 6 | **~2** | $16,422 – $16,992 (5 rows = 1 relisted watch) |
| **P9 Toledo 47300** | 7 | ~6 | $12,995 – $19,999; rose gold: $19,000 (n=1) |
| P11 AMVOX2 | 2 | 2 | $9,580 – $9,999 |
| P12 Chronomètre Royal | 2 | **1** | $23,980 |
| P14 Ultra-Fine 1955 | 9 | ~6 | $12,995 – $19,900 |
| P15 Aronde 1954 | 6 | ~4 | $15,500 – $19,450 |
| **P16 MUT RdM Q1378420** | 2 on-target (+2 sister) | 2 | $5,082 – $7,121 |
| **P17 Geophysic True Second** | 1 confirmed (+1 unconfirmed) | 1–2 | $8,950 |
| P19 Triple Calendrier 3110V | 11 usable (+1 excluded) | ~11 | $12,500 – $20,995 |
| P20 Polaris Geographic | 3 | 3 | $14,200 – $18,450 (unverified) |

**Entries with NO eBay DATA (8):** P1 (VC 4240/4241), P3 (Memovox E855 — eBay
rows exist for other Memovox refs but none for E855; not offered as comps),
P4 (VC 37010), P8 (Master Grand Réveil), P10 (Grande Reverso GMT — eBay Reverso
rows exist but none on-reference), P13 (Duomètre Q6012420), P18 (Quai de l'Île
4500S), P21 (Master Control Q4168120).

**Rows I excluded as bad data:** `themarinvault` $117,395 (P19 — 7× the same
dealer's own price); `katerynmartynenk0` $10,000 "43mm stainless steel Toledo"
(P9 — that watch does not exist in the reference).

**Rows included only as explicitly labelled sister-reference proxies:**
ref 42505/000G-8900 at $21,500 (P7, diamond-set — NOT the 42005);
ref Q1378480 blue dial at $6,960 and $11,291 (P16 — NOT the silver 1378420).

### Where this venue's evidence should and should not move a band

- **Should move (band likely too HIGH):** P12 Chronomètre Royal — two March 2026
  auction results at $15,553/$16,238 vs a band floor of $18,000. P7 Malte Dual
  Time — real auction evidence $10,080/$13,854 vs a band floor of $14,000.
- **Should move (band likely too LOW):** P2 Futurematic E501 in steel (every
  steel ask exceeds $4,500); P5 Mercator; P6 Malte 83060.
- **Should NOT move on eBay evidence:** P17 Geophysic True Second — the lone
  eBay ask is 35% above a band that the rest of the market fits precisely.
  P15 Aronde — every eBay ask exceeds the band, but a $3,000 same-dealer eBay
  markup explains it.
- **Confirmed as-is:** P11 AMVOX2, P19 Triple Calendrier.

### Confidence

Low-to-moderate, and lower than the row count suggests. No transaction data at
all; asks only; serial relisting inflates apparent sample size on P7, P12 and
P15; and **not one row in this entire file exposes box/papers, service history,
polish or redial status** — the variables that dominate value on the vintage
entries (P1–P4, P9). All figures were read off EveryWatch pages fetched this
session via the summariser, so individual digits carry transcription risk; the
load-bearing ones (P7, P9, P12, P17) were re-fetched with verbatim-quote prompts
to reduce that.
