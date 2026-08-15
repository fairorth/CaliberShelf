# Evidence — Auction Houses + Aggregators + r/WatchExchange
**Collector:** auction/realized-price venue specialist
**Session date:** 2026-08-13
**Guide under review:** Swiss Artisans (Jaeger-LeCoultre × Vacheron Constantin), 21 entries

---

## METHODOLOGY NOTES — read before using any number below

### 1. Hammer vs. buyer's premium — the central calibration finding

The brief asks that every row state hammer vs. hammer-plus-premium. Most aggregator
rows do not label this. I resolved it arithmetically and the result is consistent
enough to treat as established:

**Collector Square (LuxPrice-Index) figures are PREMIUM-INCLUSIVE, not hammer.**

Evidence — nearly every Collector Square figure decomposes exactly into a round
hammer number times a standard buyer's premium rate:

| Collector Square figure | Decomposes as | Implied hammer |
|---|---|---|
| CHF 44,100 (Mercator, Christie's 2024) | 35,000 × 1.26 | 35,000 |
| HKD 100,800 (Malte 42005, Christie's 2023) | 80,000 × 1.26 | 80,000 |
| HKD 403,200 (Mercator Pt, Christie's 2023) | 320,000 × 1.26 | 320,000 |
| CHF 13,860 (Malte 42005 WG, Christie's 2022) | 11,000 × 1.26 | 11,000 |
| CHF 50,400 (Toledo Pt, Christie's 2022) | 40,000 × 1.26 | 40,000 |
| USD 17,640 (VC 4240 YG, Christie's 2023) | 14,000 × 1.26 | 14,000 |
| HKD 106,250 (Toledo YG, Christie's 2021) | 85,000 × 1.25 | 85,000 |
| USD 22,500 (Toledo WG, Christie's 2020) | 18,000 × 1.25 | 18,000 |
| USD 12,500 (Toledo PG, Sotheby's 2020) | 10,000 × 1.25 | 10,000 |
| CHF 18,750 (VC 4240 PG, Antiquorum 2016) | 15,000 × 1.25 | 15,000 |
| USD 17,500 (Aronde 81018, Christie's 2013) | 14,000 × 1.25 | 14,000 |
| HKD 89,600 (Master Grand Réveil, Bonhams 2024) | 70,000 × 1.28 | 70,000 |
| USD 6,000 (Malte 42005 WG, Bonhams 2023) | 4,800 × 1.25 | 4,800 |

Rates match the published house schedules (Christie's ~26% top band, Sotheby's/
Antiquorum ~25%, Bonhams ~28%/25%). **Therefore: every Collector Square row in this
file is tagged `incl. premium`, and a hammer estimate is derivable by dividing by
1.25–1.28.** This matters enormously for band-setting: an unadjusted comparison of
these figures against dealer *asks* is roughly apples-to-apples, but a comparison
against *hammer* would overstate by ~25%.

Phillips and Bonhams display realized prices inclusive of premium as house
convention. Bonhams lot pages state the premium schedule explicitly (28% to
$50,000). Worthy is a consignment auction platform, not a traditional house; its
displayed figure is the gross winning bid and its net-to-seller treatment is not
disclosed on the page.

### 2. Source-reliability tiers used below

- **[FETCHED]** — I retrieved the page this session and read the figure on it.
- **[AGG]** — Collector Square LuxPrice-Index aggregator table, fetched this
  session. Cites house + sale number. Premium-inclusive per §1.
- **[SNIPPET]** — a figure that appeared in a search-engine result summary I saw
  this session but whose underlying page I could NOT open (EveryWatch is
  login-gated; Rago/Wright and auction.fr returned 403). Lower confidence. Used
  only where flagged, never as a sole basis for a load-bearing conclusion.

### 3. Hard blocks encountered

- **EveryWatch** — full paywall ("Only Collectors Beyond This Point"). Its data
  leaks into search snippets only.
- **Rago / Wright** (same lot, ref 42005) — HTTP 403 both hosts.
- **auction.fr** — HTTP 403.
- **LiveAuctioneers** — price results behind "Unlock".
- **reddit.com** — the fetch tool is blocked from reddit entirely, and
  site-restricted searches for r/WatchExchange returned zero WatchExchange threads
  across five attempts. **r/WatchExchange yielded NOTHING this session. Treat that
  venue as uncovered, not as absent-of-sales.**
- **Sotheby's** — lot pages render, but realized prices are behind "log in to view
  results". Estimates and condition text are readable.
- **Loupe This** — lot pages render with condition/estimate, but the final bid is
  not in the served HTML.

### 4. Currency conversion

Where I give a USD approximation it is my own arithmetic at approximate period
rates (HKD≈0.128, CHF≈1.12, EUR≈1.08, GBP≈1.27) and is marked `~`. The
source-currency figure is authoritative.

---

## P1 — VC Vintage Triple Calendar ref 4240/4241 (1940s, cal V485)
*Guide band $12,000–20,000. Target variant: honest yellow-gold 4240, untouched
two-tone dial, Extract from the Archives.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2023-10-05 | SOLD | 17,640 | USD | incl. premium (hammer ~14,000) | 18k yellow gold, cal. V485. Christie's Dubai. Condition not stated in aggregator row | [AGG] collectorsquare.com/en/watches/vacheron-constantin/vintage/ref-vacheron-constantin-4240/lpi |
| 2021-05-20 | SOLD | 10,837 | EUR | incl. premium | 18K gold manual triple calendar, cal. V485 T. Bonhams Paris | [AGG] same page |
| 2021-04-08 | SOLD | 12,500 | USD | incl. premium (hammer ~10,000) | 18k YG, "characteristic horned lugs", cal. 455. Christie's Dubai | [AGG] same page |
| 2017-11-12 | SOLD | 6,875 | CHF | incl. premium (hammer ~5,500) | 18K **pink** gold triple date. Antiquorum Geneva | [AGG] same page |
| 2017-06-07 | UNSOLD | — | EUR | — | 18k pink gold, cal. 11/T. Sotheby's New York. **Failed to sell** | [AGG] same page |
| 2016-11-29 | SOLD | 75,000 | HKD (~9,600 USD) | incl. premium | "rare yellow gold triple calendar". Phillips Hong Kong | [AGG] same page |
| 2016-11-13 | SOLD | 18,750 | CHF | incl. premium (hammer 15,000) | 18K pink gold, **two-tone dial** — matches guide's target dial spec | [AGG] same page |
| 2016-11-13 | SOLD | 15,000 | CHF | incl. premium (hammer 12,000) | 18K pink gold triple date | [AGG] same page |
| 2016-05-31 | SOLD | 112,500 | HKD (~14,400 USD) | incl. premium (hammer 90,000) | "rare pink gold triple calendar". Phillips Hong Kong | [AGG] same page |
| 2016-05-14 | SOLD | 18,750 | CHF | incl. premium (hammer 15,000) | 18k pink gold triple calendar **with moon-phase**. Sotheby's Geneva | [AGG] same page |
| 2008-05-11 | SOLD | (price not shown) | CHF | — | **Rare stainless steel** triple calendar, Sotheby's Geneva — steel is the scarce/premium execution, NOT a comp for a gold 4240 | [AGG] same page |

**Read:** 26 auction appearances on the aggregator, 11 with usable figures. Recent
yellow-gold solds cluster **$12,500–17,640 incl. premium** (hammer ~$10,000–14,000).
Pink gold with two-tone dial and/or moon-phase runs CHF 15,000–18,750 incl. premium.
The guide's $12,000–20,000 band is **supported at its lower two-thirds**; the top of
the band ($18–20k) is reachable only by pink gold, moonphase, or steel examples, not
by the plain honest yellow-gold 4240 the guide specifies. One outright no-sale (2017).
No lot in this data explicitly cited an Extract from the Archives.

---

## P2 — JLC Futurematic E501 (1951–56, cal 497)
*Guide band $2,500–4,500. Target: steel, silver/beige dial, working back-set.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2023-12-12 | SOLD | 3,276 | CHF (~3,670 USD) | incl. premium (hammer ~2,600) | Ref. E501, steel, 1950s. Christie's | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/futurematic/lpi |
| 2023-05-15 | UNSOLD | — | CHF | — | Ref. E501, **steel** — the exact target variant — **failed to sell at Sotheby's** | [AGG] same page |
| 2023-10-27 | UNSOLD | — | GBP | — | Yellow gold Futurematic, Bonhams. Failed | [AGG] same page |
| 2022-09-14 | SOLD | 2,295 | GBP (~2,900 USD) | incl. premium | Steel Futurematic (ref not stated). Bonhams | [AGG] same page |
| 2022-09-14 | SOLD | 1,530 | GBP | incl. premium | **Gold-plated** Futurematic. Bonhams — plated, not a comp for steel | [AGG] same page |
| 2022-09-14 | SOLD | 892 | GBP | incl. premium | Yellow gold Futurematic. Bonhams | [AGG] same page |
| 2023-06-20 | SOLD | 832 | USD | incl. premium | **Gold-plated**. Bonhams — not a comp | [AGG] same page |
| 2021-10-05 | SOLD | 4,080 | HKD (~520 USD) | incl. premium | Yellow gold. Bonhams | [AGG] same page |
| 2022-11-14 | SOLD | 984 | EUR | incl. premium | Artcurial; case metal listed as "leather" in aggregator (data error) — excluded from read | [AGG] same page |

**Read:** Only ONE dated sold that is explicitly ref E501 in steel: **CHF 3,276
incl. premium (2023-12-12, Christie's)** ≈ $3,670. A second explicit E501 steel lot
**failed to sell at Sotheby's in May 2023**. Non-E501 steel Futurematics sold at
GBP 2,295. The guide's $2,500–4,500 band is **well-centred on the single best comp**
but rests on thin evidence — the gold and gold-plated rows are much cheaper and must
not be pooled in. Note the aggregator does not record back-set functionality, which
is the guide's key variant condition.

---

## P3 — JLC Memovox Automatic Calendar E855 (cal 825 alarm)
*Guide band $3,500–5,500. Target: steel, silver dial, applied markers.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-11-13 | SOLD | 1,792 | GBP (~2,280 USD) | incl. premium | E855, **14K gold & steel**. Bonhams #29154 | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/memovox/ref-jaeger-lecoultre-e855/lpi |
| 2024-11-13 | SOLD | 1,536 | GBP (~1,950 USD) | incl. premium | E855, **steel** — target variant | [AGG] same page |
| 2024-05-22 | SOLD | 1,280 | GBP (~1,625 USD) | incl. premium | E.855, **steel** — target variant. Bonhams #29151 | [AGG] same page |
| 2023-05-15 | UNSOLD | est. 2,400–3,500 | CHF | — | E855 steel. **Failed at Sotheby's #GE2311** — estimate alone already below the guide band | [AGG] same page |
| 2020-11-06 | UNSOLD | est. 2,800–3,200 | EUR | — | E855 yellow gold. Failed, Gros Delettrez | [AGG] same page |
| 2013-11-10 | SOLD | 2,500 | CHF | incl. premium (hammer 2,000) | E855 steel. Antiquorum #278 | [AGG] same page |
| 2012-11-28 | SOLD | 3,861 | EUR | incl. premium | E855 steel. Artcurial #2199 | [AGG] same page |
| 2012-11-28 | SOLD | 2,445 | EUR | incl. premium | E855 steel. Artcurial #2199 (same sale, second example) | [AGG] same page |
| 2011-11-29 | SOLD | 5,100 | EUR | incl. premium | E855 steel. Artcurial #1990 — the high outlier, 15 years old | [AGG] same page |
| 2011-11-29 | SOLD | 3,825 | EUR | incl. premium | E855 14K gold & steel. Artcurial #1990 | [AGG] same page |
| 2019 (GE1901) | SOLD (price gated) | est. 3,000–5,000 | CHF | — | E855, **18k yellow gold**, Sotheby's Important Watches lot 201. Condition text: movement running, alarm functional; case very good with minor oxidation; dial aging, some lume still UV-reactive; JLC presentation case. **Realized price requires login** | [FETCHED] sothebys.com/en/auctions/ecatalogue/2019/important-watches-ge1901/lot.201.html |

**Read — this is a divergence worth escalating.** The three most recent E855 solds
(all 2024, all Bonhams) are **GBP 1,280–1,792 incl. premium ≈ $1,625–2,280**, i.e.
roughly *half* the guide's $3,500–5,500 floor. A 2023 Sotheby's E855 steel lot
**failed to sell on a CHF 2,400–3,500 estimate**. Only a single 2011 Artcurial result
(EUR 5,100) reaches the guide band, and it is 15 years old. Caveat to weigh: Bonhams
London runs high-volume multi-lot watch sales where vintage JLC often trades at
trade/parts money and condition is frequently unstated — these three rows carry no
condition text at all. But three concordant recent solds plus a recent no-sale is a
real signal that the guide band is too high for auction-channel E855s.

---

## P4 — VC "1972" / Prestige de la France ref 37010 family (1970s asymmetric)
*Guide band $12,500–15,500. Target: sharp case, original dial, WG or YG.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2021-09-02 | SOLD | 10,710 | USD | incl. premium | Ref. 37010, **yellow gold**, case #725,661, circa 2000. Sotheby's | [AGG] collectorsquare.com/en/watches/vacheron-constantin/1972-petit-modele/ref-vacheron-constantin-37010/lpi |
| 2020-10-07 | SOLD | 3,888 | EUR (~4,200 USD) | incl. premium | Ref. 37010, yellow gold, case #753,993, circa 2000. Bonhams | [AGG] same page |
| 2016-04-06 | SOLD | 40,000 | HKD (~5,120 USD) | incl. premium | Ref. 37010, **white gold**, navy sunburst dial, circa 2010. Sotheby's | [AGG] same page |
| 2015-03-15 | SOLD | 8,125 | CHF | incl. premium (hammer 6,500) | Ref. 37010, white gold, case #719,518, 1990s. Antiquorum | [AGG] same page |
| 2011-12-16 | SOLD | 5,250 | USD | incl. premium | Ref. 37010, pink gold, case #723,927, made 1999. Christie's | [AGG] same page |
| 2010-05-08 | SOLD | 5,000 | CHF | incl. premium | Ref. 37010, pink gold, 7mm thick. Antiquorum | [AGG] same page |
| 2009-11-14 | SOLD | 5,400 | CHF | incl. premium | Ref. 37010, yellow gold. Antiquorum | [AGG] same page |
| 2009-05-10 | UNSOLD | est. 6,000–8,000 | EUR | — | Ref. 37010, yellow gold. Failed, Antiquorum | [AGG] same page |
| 2004-12-01 | SOLD | 5,980 | USD | incl. premium | Ref. 37010, white gold, 26 × 36.5 × 31mm | [AGG] same page |
| 2004-09-22 | SOLD | 5,980 | USD | incl. premium | Ref. 37010, white gold, cal. 1055, 21 jewels | [AGG] same page |

**Explicitly-labelled NON-COMPS I checked and am excluding:**

| Date | Result | Why it is not a comp |
|---|---|---|
| 2024 (NY Watch Auction X, lot 33) | SOLD **$63,500** vs est. $15,000–30,000 | **Ref. 35703**, not 37010 — an 18K white gold *and diamond-set* 1975 "Prestige de France" with **two manual movements** and dual time zone, on a pebble-texture woven gold bracelet, with Certificate of Authenticity + **Extract from the Archives** + box + pouch. A completely different and far rarer watch. Anyone pooling this into a 37010 band would inflate it by 4×. [FETCHED] phillips.com/detail/vacheron-constantin/NY080124/33 |
| various | 25010 / 15207 / 2091 / 25510 / 25517 | These populate Collector Square's separate "1972 **Grand Modèle**" page, sold USD 4,375–8,125 / CHF 4,375–8,125 range (one HKD 175,000 outlier, Antiquorum 2011). Different references; recorded here as family context only. [AGG] collectorsquare.com/en/watches/vacheron-constantin/1972-grand-modele/lpi |

**Read — second major divergence.** Ten realized 37010 sales span **$3,888–10,710
incl. premium**, with the single best and most recent (Sotheby's 2021, yellow gold)
at **$10,710**. Nothing in the auction record reaches the guide's $12,500 floor. Note
the size caveat that may explain the gap: Collector Square files 37010 as the *Petit
Modèle* at roughly 26 × 36.5mm, a genuinely small watch, and the guide does not
specify size. If the guide means a larger 1972, the reference number in the guide is
wrong; if it means the 37010 as catalogued, the band is roughly 25–200% too high.
**This needs the synthesis stage to resolve which watch the guide is describing.**

---

## P5 — VC Mercator ref 43050 (1994–2000s, cal 1120/2 bi-retrograde)
*Guide band $35,000–45,000. Target: YELLOW GOLD Europe/Africa/Asia map. Platinum and
enamel cloisonné variants to be priced separately.*

### Yellow gold — the guide's target variant

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-05-13 | **SOLD** | **44,100** | **CHF (~49,400 USD)** | **incl. premium (hammer 35,000)** | Ref. **43050/000J**, yellow gold. Christie's. The single most load-bearing YG datapoint in this file | [AGG] collectorsquare.com/en/watches/vacheron-constantin/gerard-mercator/lpi |
| 2024-05-29 | UNSOLD | — | GBP | — | Ref. 43050 yellow gold. **Failed at Sotheby's** two weeks after the Christie's success | [AGG] same page |
| 2024-10-27 | UNSOLD | — | CHF | — | Ref. 43050 yellow gold. Failed at Christie's | [AGG] same page |
| 2023-02-02 | UNSOLD | — | HKD | — | Ref. 43050 yellow gold. Failed at Sotheby's | [AGG] same page |
| 2014-09-30 | SOLD | 19,375 | USD | incl. premium | 43050 YG, **Europe map** — explicitly the guide's dial. Antiquorum #285 | [AGG] collectorsquare.com/en/watches/vacheron-constantin/gerard-mercator-europe/lpi |
| 2013-12-06 | SOLD | 150,000 | HKD (~19,200 USD) | incl. premium | 43050 YG, Europe map. Sotheby's #0479 | [AGG] same page |
| 2012-05-30 | SOLD | 187,500 | HKD (~24,000 USD) | incl. premium | 43050 YG, Europe map. Christie's #2919 | [AGG] same page |
| 2011-03-27 | SOLD | 30,000 | CHF | incl. premium | 43050 YG, Europe map. Antiquorum #249 | [AGG] same page |
| 2010-12-02 | SOLD | 275,000 | HKD (~35,200 USD) | incl. premium | YG, Europe map. Christie's #2835 | [AGG] same page |

### Platinum — priced separately per brief instruction (NOT pooled above)

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Notes | Source |
|---|---|---|---|---|---|---|
| 2024-10-27 | SOLD | 277,200 | HKD (~35,500 USD) | incl. premium | 43050 **platinum**. Christie's | [AGG] gerard-mercator/lpi |
| 2023-05-26 | SOLD | 403,200 | HKD (~51,600 USD) | incl. premium (hammer 320,000) | Ref. **43050/000P** platinum. Christie's | [AGG] gerard-mercator/lpi |
| 2024-05-07 | UNSOLD ×2 | — | HKD | — | Two platinum 43050s both failed in one Sotheby's sale | [AGG] gerard-mercator/lpi |
| 2013-05-29 | SOLD | 212,500 | HKD | incl. premium | Platinum, Europe map. Christie's #3219 | [AGG] gerard-mercator-europe/lpi |
| 2009-07-28 | SOLD | 29,040 | EUR | incl. premium | Platinum. Artcurial #1727 | [AGG] gerard-mercator-europe/lpi |

### Pink gold

| Date | Result | Notes | Source |
|---|---|---|---|
| 2023-10-07 | UNSOLD | 43050 pink gold, Sotheby's | [AGG] gerard-mercator/lpi |
| 2023-07-14 | UNSOLD | 43050 pink gold, Sotheby's | [AGG] gerard-mercator/lpi |

### Live/recent non-house auction

| Date | SOLD/ASK | Price | Ccy | Notes | Source |
|---|---|---|---|---|---|
| 2024-08-21 (lot 3175) | ASK / est. | est. 30,000–40,000 | USD | Loupe This, ref 43050 **18kt yellow gold, map of THE AMERICAS** (not the guide's Europe/Africa/Asia dial), cal 1120/2, 36mm, condition grade **M 8.5** "excellent, minor surface wear, minor oxidation along case edges", **watch only, no box or papers**, original 18k YG deployant. **Final bid not in served page** | [FETCHED] loupethis.com/auctions/vacheron-constantin-mercator-43050-18k-yg-0800-08-21-2024 |
| undated (same/sister listing) | ASK / est. | est. 30,000–40,000 | USD | Loupe This, 43050 18k YG, **Europe/Africa/Asia map with sea creatures** — the guide's exact dial. Grade M 8.5, watch only. Production stated as 638 pieces over 1994–2004. Final bid not shown | [FETCHED] loupethis.com/auctions/vacheron-constantin-mercator-43050-18k-yg |

**Read:** The guide's $35,000–45,000 YG band is **supported by exactly one recent
realized sale — CHF 44,100 incl. premium at Christie's, May 2024 (hammer CHF 35,000)**
— which lands squarely at the band's top. Two independent Loupe This estimates at
$30,000–40,000 for watch-only examples corroborate the band's centre. **But the
sell-through picture is poor: four yellow-gold 43050s failed to sell across 2023–24
(Sotheby's ×2, Christie's ×1 plus one HK), and two platinum examples failed in a
single Sotheby's sale.** The Mercator finds its price when it finds a buyer and
frequently does not. Older YG solds (2010–2014) sat at $19,000–35,000, so the CHF
44,100 result represents genuine recent appreciation rather than a stale level —
but it is a sample of one. Platinum trades at or above YG and must stay unpooled.

---

## P6 — VC Malte Power Reserve / Date ref 83060 (cal 1420 manual)
*Guide band $9,000–13,000. Target: WG or RG, silver dial.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2023-07-25 | SOLD | 102,000 | HKD (~13,050 USD) | incl. premium (hammer ~80,000) | Ref. 83060, **white gold**, cal 1420, 38mm, date + power reserve. Bonhams #27456 | [AGG] collectorsquare.com/en/watches/vacheron-constantin/malte/ref-vacheron-constantin-83060/lpi |
| 2020-11-24 | SOLD | 11,970 | USD | incl. premium | Ref. 83060 Malte, white gold. Sotheby's #10557 | [AGG] same page |
| 2012-05-14 | SOLD | 15,000 | CHF | incl. premium (hammer 12,000) | Ref. 83060, white gold. Christie's #1388 | [AGG] same page |
| 2010-05-10 | SOLD | 15,000 | CHF | incl. premium (hammer 12,000) | Ref. **83060/000G-9287**, white gold. Christie's #1372 | [AGG] same page |

All four lots are cal. 1420, 38mm white gold, 2007–2013 manufacture. No pink-gold
83060 appears in the auction record.

**Read:** Four solds, zero no-sales — unusually clean sell-through. Range **$11,970–
~$13,050 incl. premium** for the two most recent (2020, 2023); the older CHF 15,000
pair sits slightly higher. The guide's $9,000–13,000 band is **supported and, if
anything, slightly conservative at the top** — realized prices cluster at the band's
upper edge rather than its middle. Caveat: all evidence is white gold; the guide also
names rose gold, for which there is no auction data.

---

## P7 — VC Malte Dual Time Regulator ref 42005/000G-8900 ⚠ HIGHEST RIGOR
*Guide band $14,000–17,000. Target: WHITE GOLD, silver dial. User is negotiating at
~$12,000.*

### White gold — the exact target variant

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-06-11 | **UNSOLD** | est. 10,000–20,000 | GBP | — | Ref. 42005 **white gold**. **Failed to sell at Sotheby's** | [AGG] collectorsquare.com/en/watches/vacheron-constantin/malte-regulateur-dual-time/ref-vacheron-constantin-42005/lpi |
| 2024-05-29 | **UNSOLD** | est. 10,000–20,000 | GBP | — | Ref. 42005 **white gold**. **Failed to sell at Sotheby's** — second failure in under two weeks | [AGG] same page |
| 2023-10-12 | **SOLD** | **6,000** | **USD** | **incl. premium (hammer ~4,800)** | Ref. **42005/000G**, 18k white gold, c.2005, Bonhams "Fine Watches" lot 75. Est. **US$6,000–8,000**. Accessories: leather pouch and box, **undated Certificate of Origin**, instruction manual, service booklet. No condition text on the lot page. Bonhams premium 28% to $50,000 | [AGG] price + [FETCHED] lot page bonhams.com/auction/28437/lot/75/... |
| 2022-11-06 | SOLD | 13,860 | CHF (~15,500 USD) | incl. premium (hammer 11,000) | Ref. 42005 white gold. Christie's | [AGG] same page |
| 2021-05-10 | SOLD | 12,500 | CHF (~14,000 USD) | incl. premium (hammer 10,000) | Ref. 42005 white gold. Christie's | [AGG] same page |
| 2025-10-16 | SOLD | 11,937 | USD | premium treatment unstated | Ref. **42005/000g-8900** — the exact guide reference — Iconeek Auctions, Switzerland. Reported as "missing the estimate by 5%". **[SNIPPET] — appeared consistently in two independent search-result summaries this session; underlying EveryWatch page is paywalled and I could NOT open it. Treat as indicative, not confirmed.** | [SNIPPET] via everywatch.com/vacheron-constantin/malte/42005-000g/watch-14764290 |
| 2020 (Watches Online 3) | SOLD (price gated) | — | — | — | Ref. **42005/2**, white gold automatic dual time with date and regulator dial, circa 2005. Sotheby's Important Watches. **Page fetched but returned no readable lot body; realized price not obtained** | [FETCHED, empty] sothebys.com/en/buy/auction/2020/watches-online-3/vacheron-constantin-reference-42005-2-malte |

### Other metals — sister-reference context, explicitly NOT pooled into the WG read

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Notes | Source |
|---|---|---|---|---|---|---|
| 2024-03-19 | SOLD | 127,000 | HKD (~16,250 USD) | Phillips convention: incl. premium (not stated on page) | Ref. **42005/000R-9034**, 18K **PINK gold**, 38mm, cal 1206, **numbered 10 of a 150-piece boutique-only limited edition**, c.2002. Est. HK$60,000–120,000. Condition "well-preserved and attractive", "immaculate". Full set: VC certificate stamped Carda Watch Co Ltd Hong Kong dated 22 Nov 2002, COSC certificate, instruction manual, literature, fitted presentation box and outer packaging. Phillips HK Sessions Spring 2024 lot 8050 | [FETCHED] phillips.com/detail/vacheron-constantin/HK080124/8050 |
| 2023-05-26 | SOLD | 100,800 | HKD (~12,900 USD) | incl. premium (hammer 80,000) | Ref. 42005 **yellow gold**. Christie's | [AGG] ref-42005 page |
| 2021-10-27 | SOLD | 15,000 | USD | incl. premium | Ref. 42005 yellow gold. Christie's | [AGG] ref-42005 page |
| 2021-05-12 | SOLD | 11,340 | CHF | incl. premium | Ref. 42005 yellow gold. Sotheby's | [AGG] ref-42005 page |
| 2023-05-15 | UNSOLD | est. 13,000–20,000 | CHF | — | Ref. 42005 yellow gold. Failed at Sotheby's | [AGG] ref-42005 page |
| 2019-05-11 | SOLD | 18,125 | CHF | incl. premium (hammer 14,500) | Ref. 42005 **pink gold**. The high mark in the series — 7 years old | [AGG] ref-42005 page |

### Lots I could NOT verify and am therefore NOT counting

- **Rago / Wright, 8 May 2024, lot 117**, "VACHERON CONSTANTIN 'Malte Dual Time
  Regulator' gold wristwatch, Ref. 42005", reported in search summaries as sold
  **$10,080** against an est. $10,000–12,000. **Both ragoarts.com and wright20.com
  returned HTTP 403.** The metal is given only as "gold" — not confirmed white.
  Recorded as unverified; note that $10,080 = $8,000 × 1.26, consistent with a
  premium-inclusive figure.

**Read — this is the most consequential finding in the file.**

The guide's band is **$14,000–17,000**. The white-gold 42005 auction record is:

- **Two consecutive Sotheby's no-sales in 2024** on £10,000–20,000 estimates. The
  watch was offered twice inside three weeks and found no buyer either time.
- **A 2023 Bonhams sale at $6,000 incl. premium** — and, tellingly, Bonhams
  *estimated* it at US$6,000–8,000, meaning a major house's specialist valued a
  white-gold 42005/000G with box and Certificate of Origin at well under half the
  guide band. It then hammered at ~$4,800, below even that low estimate.
- The two Christie's results that do approach the band — CHF 13,860 (2022) and
  CHF 12,500 (2021) incl. premium — are 3–5 years old and equate to roughly
  **$14,000–15,500**, i.e. the band's *floor*, not its middle.
- The one figure at the exact guide reference (42005/000G-8900), the Iconeek
  Oct-2025 result at **$11,937**, is snippet-sourced and unconfirmed — but it is
  described as having *missed* its estimate, and it points the same direction as
  everything else.
- The only result comfortably inside the guide band is Phillips' **HK$127,000
  (~$16,250)** — and that is a **PINK gold, boutique-only, 150-piece limited
  edition, numbered 10, in immaculate condition with a complete original set
  including COSC certificate**. It is a materially rarer and better-provisioned
  watch than a standard white-gold 42005/000G-8900, and using it to anchor the
  band would be exactly the misread this review exists to catch.

**Bearing on the user's negotiation:** the proposed ~$12,000 is **above, not below,
the central tendency of realized white-gold 42005 auction prices**, and sits above
every white-gold realized figure in this file except the two Christie's results from
2021–22. The guide's $14,000–17,000 band is not supported by realized data for the
white-gold variant. Retail/dealer asks do run higher (European Watch Company,
SwissWatchExpo, Chrono24 examples appeared in search results at roughly $12,000–
15,500), so ~$12,000 is defensible as a *dealer-channel* price — but it should not be
framed as a discount to market. Two 2024 Sotheby's no-sales are the single most
important fact here: at £10,000+ this reference did not clear at auction at all.

---

## P8 — JLC Master Grand Réveil ref Q163842A / 149.8.95 (steel PC + alarm)
*Guide band $10,500–13,500.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-05-28 | **SOLD** | **89,600** | **HKD (~11,470 USD)** | **incl. premium (hammer 70,000)** | Ref. **Q163842A**, **steel** — the exact guide reference. Bonhams | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/master-control-grand-reveil/lpi |
| 2022-05-17 | SOLD | 8,925 | GBP (~11,340 USD) | incl. premium | Ref. **149.8.95**, steel — the guide's alternate reference. Bonhams | [AGG] same page |
| 2021-09-27 | SOLD | 11,970 | EUR (~12,930 USD) | incl. premium | Ref. **149.8.95**, steel. Sotheby's | [AGG] same page |
| 2021-09-07 | SOLD | 137,500 | HKD (~17,600 USD) | incl. premium | Steel, reference not stated. Christie's — high outlier | [AGG] same page |
| 2022-07-18 | SOLD | 11,808 | EUR | incl. premium | Ref. 180.6.99 **platinum** — different reference/metal | [AGG] same page |
| 2021-08-03 | SOLD | 70,125 | HKD | incl. premium | Ref. 180.1.99 **yellow gold** — different reference/metal | [AGG] same page |
| 2020-10-09 | SOLD | 327,600 | HKD | incl. premium | Ref. 149.2.95 **pink gold** — different metal, far higher | [AGG] same page |
| 2024-12-10 | UNSOLD | est. 40,000–60,000 | HKD | — | Ref. 180.1.99 yellow gold. Failed at Sotheby's | [AGG] same page |
| 2022-11-10 | UNSOLD | est. 6,000–8,000 | CHF | — | Ref. 141.2.97 pink gold. Failed at Sotheby's | [AGG] same page |
| 2020-08-04 | UNSOLD | est. 20,000–30,000 | USD | — | Ref. 149.6.95 **platinum**. Failed at Sotheby's | [AGG] same page |

**Read — the best-evidenced entry in the file.** Three steel solds at the guide's
exact references, all within the last five years, at **$11,340 / $11,470 / $12,930
incl. premium**. That is a tight cluster sitting almost exactly in the middle of the
guide's $10,500–13,500 band. **Band confirmed.** (The Christie's HK$137,500 steel
outlier and all the gold/platinum rows are excluded from that read.)

---

## P9 — VC Historiques Toledo 1952 ref 47300 (esp. 47300/000R-9219 rose gold)
*Guide band $13,500–16,500. Cal 1125 complete calendar.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2022-11-06 | SOLD | 50,400 | CHF (~56,400 USD) | incl. premium (hammer 40,000) | Ref. 47300 **PLATINUM**. Christie's #21862 — different metal, far above band | [AGG] collectorsquare.com/en/watches/vacheron-constantin/toledo/ref-vacheron-constantin-47300/lpi |
| 2021-11-27 | **SOLD** | **75,000** | **HKD (~9,600 USD)** | **incl. premium (hammer 60,000)** | Ref. 47300 **PINK gold** — the guide's target metal. Christie's #19868 | [AGG] same page |
| 2021-04-01 | SOLD | 106,250 | HKD (~13,600 USD) | incl. premium (hammer 85,000) | Ref. 47300 yellow gold. Christie's #1874 | [AGG] same page |
| 2020-07-20 | SOLD | 13,750 | CHF (~15,400 USD) | incl. premium (hammer 11,000) | Ref. **47300/001J-9065** yellow gold. Christie's #18827 | [AGG] same page |
| 2020-07-01 | SOLD | 22,500 | USD | incl. premium (hammer 18,000) | Ref. **47300/000G-9064** white gold. Christie's #19005 | [AGG] same page |
| 2020-06-24 | **SOLD** | **12,500** | **USD** | **incl. premium (hammer 10,000)** | Ref. 47300 **PINK gold** — target metal. Sotheby's #10388 | [AGG] same page |
| 2018-05-24 | SOLD | 12,500 | USD | incl. premium (hammer 10,000) | Ref. 47300 yellow gold. Sotheby's #n09879 | [AGG] same page |
| 2018-05-13 | SOLD | 15,000 | CHF | incl. premium (hammer 12,000) | Ref. 47300 platinum. Sotheby's #ge1801 | [AGG] same page |
| 2018-05-13 | UNSOLD | — | EUR | — | Ref. 47300 white gold. Failed, Sotheby's #ge1801 | [AGG] same page |
| 2018-04-17 | UNSOLD | — | EUR | — | Ref. 47300 **pink gold**. Failed, Sotheby's #l18053 | [AGG] same page |

Roughly 30 further 47300 appearances (2008–2017, Christie's / Sotheby's / Antiquorum
/ Bonhams / Artcurial / Heritage) are listed on the same page with prices withheld
behind login.

**Read:** Deep sale history — 40 appearances — but the *pink gold* subset the guide
targets is thin and soft: **HKD 75,000 (~$9,600) at Christie's HK in 2021** and
**USD 12,500 at Sotheby's in 2020**, plus **one pink-gold no-sale in 2018**. Both
pink-gold solds fall **below** the guide's $13,500 floor. Yellow and white gold
examples actually did better ($13,600, $15,400, $22,500). Two caveats before
concluding the band is too high: (a) all pink-gold data is 2020–21, now 5–6 years
stale; (b) no condition, dial or completeness text accompanies any row, and the
$22,500 white-gold outlier shows the reference's spread is wide. Retail asks for
47300/000R-9219 remain far higher (Shreve/Essential/PrestigeTime listings appeared
in search at up to $38,200 list). Direction of travel: **guide band likely optimistic
for the pink-gold auction channel, but the sample is small and dated.**

---

## P10 — JLC Grande Reverso GMT ref Q3028420 / 240.8.18 (steel manual GMT)
*Guide band $7,000–10,000.*
**Assigned question: resolve whether the bimodal ask distribution (~$9,100–9,900 vs
~$16,900–17,800) reflects conflation of the plain GMT with the GMT Duoface.**

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-12-31 | **SOLD** | **4,072** | **USD** | gross winning bid; consignment platform, net-to-seller not disclosed | Ref. **240.8.18 / Q3028420**, stainless steel, 29mm. Condition: "Scratches throughout, Clasp with scratches, Slight impression near the bottom right lug." **No box, no papers.** Worthy auction, 238 interested buyers | [FETCHED] worthy.com/about/recent-deals/watches/watch-jaeger-lecoultre-reverso-grande-gmt-240.8.18---q3028420--9695694 |
| 2011-12-16 | SOLD | 8,750 | USD | incl. premium (hammer 7,000) | Ref. 240.8.18, steel. Christie's | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/reverso-grande-gmt/lpi |
| 2011-06-25 | SOLD | 75,000 | HKD (~9,600 USD) | incl. premium (hammer 60,000) | Ref. 240.8.18, steel. Antiquorum | [AGG] same page |
| 2010-12-08 | SOLD | 6,875 | USD | incl. premium (hammer 5,500) | Ref. 240.8.18, steel. Antiquorum | [AGG] same page |
| 2010-10-20 | SOLD | 6,700 | USD | incl. premium | Ref. 240.8.18, steel. Antiquorum | [AGG] same page |
| 2009-09-17 | SOLD | 6,600 | USD | incl. premium | Ref. 240.8.18, steel. Antiquorum | [AGG] same page |
| 2008-12-12 | SOLD (gated) | — | USD | — | Ref. 240.8.18, steel. Christie's | [AGG] same page |
| undated (live) | ASK / est. | est. 6,000–8,000 | USD | — | Ref. **240.8.18 / Q3028420**. Condition grade **M 8.5** — "excellent overall, light case scratches, slight discolouration on white dial near 8 and 6 o'clock". JLC travel pouch and leather roll, black alligator strap with steel deployant. **No box/papers.** CITES note on the strap. Final bid not in served page | [FETCHED] loupethis.com/auctions/jaeger-lecoultre-grande-reverso-duo-gmt-q3028420 |

### Pink gold 240.2.18 — sister reference, NOT pooled

| Date | Result | Price | Notes | Source |
|---|---|---|---|---|
| 2023-03-07 | UNSOLD | est. 10,000–15,000 USD | Ref. 240.2.18 pink gold. Failed at Sotheby's | [AGG] same page |
| 2016-06-08 | SOLD | 10,625 USD incl. premium (hammer 8,500) | Ref. 240218 pink gold. Sotheby's | [AGG] same page |
| 2011-04-07 | SOLD | 106,250 HKD (~13,600 USD) incl. premium | Pink gold "Grande GMT". Sotheby's | [AGG] same page |
| 2009-10-07 | SOLD | 90,000 HKD (~11,500 USD) incl. premium | Pink gold "Grande GMT". Sotheby's | [AGG] same page |
| 2010-04-19 | SOLD | 16,250 USD incl. premium | "Grande GMT", metal not specified. Sotheby's | [AGG] same page |

### ANSWER to the assigned question

**The bimodal ask split is not two different models. It is naming variance on one
model, compounded by a metal split.** Three findings:

1. **Q3028420 / 240.8.18 IS itself a two-dial watch.** The Loupe This lot for this
   exact reference — titled "Grande Reverso **Duo** GMT Q3028420" — describes it as
   carrying a silver front dial (date at 7, small seconds at 5, AM/PM at 2) *and* a
   black reverse dial (8-day power reserve, 24-hour subdial, day/night). There is no
   separate plain single-dial Q3028420. Sellers on Chrono24 and 1stDibs list the
   identical reference variously as "Reverso Grande GMT", "Reverso Grande GMT Duo
   Face" and "Grande Reverso Duo GMT" — I saw all three spellings applied to
   240.8.18 in search results this session. **So the two ask clusters are largely
   the same watch under two names.**
2. **Realized prices land unambiguously in the LOWER cluster.** Every steel 240.8.18
   sold in this file falls between **$4,072 and ~$9,600**: $6,600, $6,700, $6,875,
   $8,750, HKD 75,000 (~$9,600), and the 2024 Worthy result at $4,072 for a scratched,
   no-box-no-papers example. Loupe This independently estimated a good M 8.5 example
   at **$6,000–8,000**. Nothing realized anywhere near $16,900–17,800.
3. **What plausibly populates the upper ask cluster:** pink gold (ref 240.2.18),
   which realized $10,625–13,600 at Sotheby's and is the only variant with any claim
   to five figures — and even that reference **failed to sell on a $10,000–15,000
   estimate in 2023**. The $16,900–17,800 asks are not supported by any realized
   figure I found in any metal.

**Verdict on the band:** the guide's **$7,000–10,000 is well supported** for steel
240.8.18 in good condition with accessories — it sits right at the top of the
realized range, which is the correct posture for a retail/private-sale band versus
auction hammer. The upper ask cluster should be disregarded as evidence.

---

## P11 — JLC AMVOX2 Chronograph ref Q192T25 (Aston Martin, case-actuated)
*Guide band $8,500–11,000. Variant: titanium/PVD LE.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-05-30 | **UNSOLD** | est. 6,000–12,000 | USD | — | Ref. **192T.25**. **Failed to sell at Christie's** — and note the estimate *floor* is below the guide band | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/amvox/lpi |
| 2021-06-26 | SOLD | 7,500 | USD | incl. premium (hammer 6,000) | Ref. **192.T.25** chronograph, limited edition of 750. Christie's | [AGG] same page |
| 2020-11-06 | SOLD | 3,750 | EUR (~4,050 USD) | incl. premium | Ref. **192T25** chronograph, steel. Gros Delettrez | [AGG] same page |
| 2020-10-23 | **UNSOLD** | est. 6,500–9,800 | EUR | — | Ref. **192.T.25**, **titanium** — the guide's stated variant. **Failed at Bonhams** | [AGG] same page |
| 2022-12-09 | UNSOLD | est. 4,000–6,000 | USD | — | Ref. 190T97 titanium AMVOX — sister ref. Failed at Sotheby's | [AGG] same page |
| 2024-10-22 | SOLD | 4,480 | EUR | incl. premium | Ref. 190.8.09778 AMVOX **alarm** (not the chronograph) — different model. Bonhams | [AGG] same page |
| 2019-07-18 | SOLD | 5,200 | EUR | incl. premium | Ref. 194T470 chronograph — different reference. Artcurial | [AGG] same page |
| 2023-10-26 | SOLD | 163,800 | HKD | incl. premium | Ref. 193.K.78 **Tourbillon GMT** white gold, LE 300 — different and far costlier model, NOT a comp | [AGG] same page |
| 2020-11-19 | SOLD | 22,500 | CHF | incl. premium | Ref. 193.K.78 Tourbillon GMT white gold — NOT a comp | [AGG] same page |
| 2018-05-28 | SOLD | 150,000 | HKD | incl. premium | Ref. 1926450 platinum, LE 100 — NOT a comp | [AGG] same page |

**Read — third divergence.** For the actual Q192T25 chronograph: **two solds at
$7,500 and ~$4,050 incl. premium, and two no-sales**, including a titanium example
that failed at Bonhams on a €6,500–9,800 estimate and a Christie's failure as
recently as May 2024. **No realized AMVOX2 chronograph in this data reaches the
guide's $8,500 floor.** The AMVOX2's auction record is one of weak demand and
frequent failure to clear. The guide band looks materially too high. Caution: the
Q192T25 was made in several executions (steel, titanium, PVD LE) and the aggregator
rows do not consistently distinguish them, so a scarce PVD LE could sit higher —
but the one row explicitly labelled titanium is a no-sale.

---

## P12 — VC Historiques Chronomètre Royal 1907 ref 86122/000R-9362 (rose gold)
*Guide band $18,000–22,000.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2026-03-12 | **SOLD — price gated** | est. **50,000–100,000** | HKD (~6,400–12,800 USD) | — | Ref. **86122**, **18k pink gold**, Sotheby's Fine Watches lot 8756. Condition: **movement untested, "may need a service at the buyer's expense."** Accompanied by VC Certificat de Qualification, instruction manual and presentation box. **Lot is closed but the realized price requires login — I could not obtain it** | [FETCHED] sothebys.com/en/buy/auction/2026/fine-watches-10/historiques-chronometre-royal-1907-reference-86122 |

**Everything else on Collector Square's "Chronomètre Royal" pages is the VINTAGE
Chronomètre Royal (1900s–1970s pocket and wristwatches, refs 508943, 340419, 351265,
9409, 214543, 381541, 356986, 364064), NOT the modern 86122 Historiques.** Those
vintage lots realized USD 2,750 / GBP 3,750–4,375 / HKD 50,000–75,000, and pooling
them into an 86122 band would be a serious category error. I am recording them here
solely so the synthesis stage knows the trap exists and does not fall into it.
Ref 86122 does not appear anywhere in Collector Square's Historique reference index.

**Read: effectively NO REALIZED PRICE FOUND for ref 86122.** The single genuine
auction datapoint is a Sotheby's March-2026 lot whose result is paywalled — but its
**estimate of HK$50,000–100,000 (~$6,400–12,800)** is striking: a major house
estimated a pink-gold 86122 at *below* the guide's $18,000 floor even at the top of
its range, albeit on an untested, service-due movement. Dealer asks seen in search
this session spanned $11,102 (Chrono24 private seller) to CHF 23,000 (Geneva Watch
Co). **This entry is a coverage gap and the guide band is unvalidated from my venue.**

---

## P13 — JLC Duomètre à Chronographe ref Q6012420 rose gold (cal 380)
*Guide band $18,000–23,000.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2023-12-01 | SOLD | 16,380 | EUR (~17,690 USD) | incl. premium | Ref. **600.0.28.S**, **pink gold**. Artcurial #3953 | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/duometre-chronographe/lpi |
| 2023-07-16 | SOLD | 17,056 | EUR (~18,420 USD) | incl. premium | Ref. **600.0.28.S**, pink gold. Artcurial #1105 | [AGG] same page |
| 2021-06-26 | **SOLD** | **32,500** | **USD** | incl. premium (hammer 26,000) | Ref. **Q6012420** — the exact guide reference — pink gold. Christie's #2062 | [AGG] same page |
| 2021-06-10 | SOLD | 21,420 | USD | incl. premium | Ref. **600.2.28**, pink gold. Sotheby's #10701 | [AGG] same page |
| 2020-07-30 | SOLD | 18,750 | CHF (~21,000 USD) | incl. premium (hammer 15,000) | Ref. 600.2.28 **platinum** — different metal | [AGG] same page |
| 2016-10-19 | SOLD | 23,750 | USD | incl. premium (hammer 19,000) | Ref. 600.2.28, pink gold. Christie's #1245 | [AGG] same page |
| 2016-12-14 | SOLD | 12,250 | GBP (~15,560 USD) | incl. premium | Ref. 600.2.28, pink gold. Bonhams #23512 | [AGG] same page |
| 2016-06-22 | SOLD | 13,750 | GBP (~17,460 USD) | incl. premium | Ref. 600.2.28, pink gold. Bonhams #23511 | [AGG] same page |
| 2015-11-10 | SOLD | 20,000 | CHF | incl. premium (hammer 16,000) | Ref. 600.2.28, pink gold. Sotheby's #GE1504 | [AGG] same page |
| 2022-11-01 | UNSOLD | — | CHF | — | Ref. **Q6011420** yellow gold. Failed at Christie's | [AGG] same page |

**Read:** Nine pink/platinum solds, one no-sale. Rose-gold results span **~$15,560–
32,500 incl. premium**, with a clear recency signal: the two most recent (Artcurial,
2023) are **EUR 16,380 and 17,056 ≈ $17,690 and $18,420**, i.e. sitting **at or just
below the guide's $18,000 floor**. The $32,500 Christie's 2021 result at the exact
Q6012420 reference is the outlier high. The guide's $18,000–23,000 band is
**defensible but drifting above the 2023 auction level**; the honest read is that the
band's floor is now the market's centre. Auction-house prices for the rose gold cal.
380 Duomètre have softened since 2021. No condition or completeness text is available
on any row.

---

## P14 — VC Les Historiques Ultra-Fine 1955 ref 33155/000R-9588 (rose gold, cal 1003)
*Guide band $12,000–18,000.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2013-05-29 | SOLD | 93,750 | HKD (~12,000 USD) | incl. premium (hammer 75,000) | Ref. **33155**, **YELLOW gold** — not the guide's rose gold. Christie's #3219 | [AGG] collectorsquare.com/en/watches/vacheron-constantin/historique/ref-historique/lpi |
| 2021-05-21 | appearance, price gated | — | — | — | Ref. **33155**, yellow gold. Gros Delettrez. Result not shown | [AGG] collectorsquare.com/en/watches/vacheron-constantin/historique/lpi |

**Read: essentially NO USABLE DATA.** One realized figure, thirteen years old, and in
the wrong metal (yellow, not rose). Multiple targeted searches for 33155 auction
results across Sotheby's, Christie's, Phillips, Barnebys, the-saleroom, Invaluable
and LiveAuctioneers returned only dealer listings, no auction results. Dealer/retail
asks seen in search this session ran roughly $13,883 (Chrono24 yellow gold) up into
the high teens/twenties for rose gold; a platinum sibling (33155/000P-B169) exists
and must be priced separately. **The guide's $12,000–18,000 band is unvalidated from
the auction venue.** The single 2013 yellow-gold result at ~$12,000 is coincidentally
at the band's floor but should carry almost no weight.

---

## P15 — VC Historiques Aronde 1954 ref 81018/000R-9657 (rose gold LE)
*Guide band $11,000–14,000.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2013-06-11 | **SOLD** | **17,500** | **USD** | **incl. premium (hammer 14,000)** | Ref. **81018**, 18k **pink gold** rectangular, "Historiques Aronde 1954 Model", movement no. 5'218'184, case no. 1'206'730, circa 2011, cal. 1400 with Geneva Seal, 20 jewels. Est. $10,000–15,000 — **sold above high estimate.** Christie's #2713, New York Rockefeller Plaza, lot 353 | [AGG] collectorsquare.com/montres/vacheron-constantin/aronde/lpi |
| 2020-08-11 | appearance, price gated | — | — | — | Ref. 81018, pink gold. Sotheby's. Result not shown | [AGG] collectorsquare.com/en/watches/vacheron-constantin/historique/lpi |
| 2019-07-16 | appearance, price gated | — | — | — | Ref. 81018, pink gold. Antiquorum. Result not shown | [AGG] same page |
| undated | ASK | starting 12,000 EUR; est. 100,000–160,000 HKD (~12,800–20,500 USD) | — | — | Ref. **81018/000R**, "Les Historiques Aronde 1954", 18k pink gold, silver dial, sub-seconds at 6. Antiquorum in association with Boule Auction, Monaco, lot 142. **[SNIPPET] — auction.fr page returned HTTP 403; estimate seen in search summary only, sale date not established, result unknown** | [SNIPPET] auction.fr lot 15724503 |

### Sister reference, explicitly NOT a comp

Collector Square's Aronde page also carries seven results for **ref 4984** (the
*vintage* Aronde): CHF 7,500 (2015), USD 6,250 (2013), CHF 27,600 pink gold (2005),
CHF 16,100 (2005), USD 13,800 (2003), CHF 14,950 (2002). Different watch — vintage,
not the 2010s Historiques re-edition. Recorded only to prevent pooling.

**Read:** Exactly **one realized 81018 price, and it is from 2013**: $17,500 incl.
premium (hammer $14,000), which *exceeded* its $10,000–15,000 estimate. Two further
81018 appearances (Sotheby's 2020, Antiquorum 2019) have gated results. The guide's
$11,000–14,000 band sits **below** the only realized figure — but that figure is
thirteen years old and rectangular gold VCs have generally softened since, and
current dealer asks seen this session ($20,664 discounted from $28,700 list; retail
$28,600) tell us nothing about clearing prices. **Thin; treat the band as
unvalidated rather than as refuted or confirmed.**

---

## P16 — JLC Master Ultra Thin Réserve de Marche ref Q1378420 (steel) — OWNED
*Guide states market $5,200–7,500.*

| Date | SOLD/ASK | Price | Ccy | Hammer or incl. premium | Condition / completeness | Source |
|---|---|---|---|---|---|---|
| 2024-04-16 | SOLD | 4,032 | USD | incl. premium | Ref. **Q1288420**, steel. Christie's #23035. **SISTER REFERENCE — this is not the Q1378420 Réserve de Marche.** Recorded as proxy only | [AGG] collectorsquare.com/en/watches/jaeger-lecoultre/master-ultra-thin/lpi |
| 2021-12-14 | SOLD | 5,040 | USD | incl. premium | Ref. 170.8.37, steel. Sotheby's #10850. Sister reference | [AGG] same page |
| 2021-11-11 | SOLD | 16,380 | CHF | incl. premium | Ref. Q1308470, steel. Sotheby's #2114. Sister reference, much higher — likely a different complication | [AGG] same page |
| 2024-12-09 | SOLD | 1,197 | EUR | incl. premium | Ref. "5002 42", steel. Aguttes. Sister reference | [AGG] same page |
| 2023-12-01 | SOLD | 3,411 | EUR | incl. premium | Ref. 145.1.79, yellow gold. Artcurial. Sister reference | [AGG] same page |

**Read: NO DATA FOUND for ref Q1378420 specifically.** Not one auction lot at that
reference surfaced. The steel Master Ultra Thin family at large realizes **$4,032–
5,040 incl. premium** at auction (excluding the anomalous CHF 16,380 row), which sits
**below** the guide's stated $5,200–7,500 market value — but these are different
references without the power-reserve complication, so this is directional context,
not a comp. Targeted searches for Q1378420 auction results returned exclusively
retail and authorised-dealer listings.

---

## P17 — JLC Geophysic True Second ref Q8018420 (steel/silver, dead-beat seconds)
*Guide band $5,500–7,000.*

**NO DATA FOUND.**

Collector Square has no `geophysic` model page (HTTP 404). Targeted searches across
Bonhams, Christie's and general auction indices returned no lot at ref Q8018420.
What did surface this session was retail/secondary listing context only: original
retail stated as EUR 8,500 / US$9,000, and a secondary listing at $6,500 — plus a
Subdial listing for a 2015 example with box and papers. None of these are realized
auction prices and none are recorded as comps here.

The modern Geophysic True Second (2015–) appears not to have entered the auction
channel in any volume. Vintage Geophysic references (e.g. E168) do appear at auction
but are an entirely different watch and are **not** offered as proxies.

---

## P18 — VC Quai de l'Île Self-Winding ref 4500S/000A-B195 (steel) — OWNED
*Guide states market $9,000–12,000.*

**NO DATA FOUND for ref 4500S.** Collector Square's Quai de l'Île page contains
**no 4500S row at all** — the entire auction history for the model is the earlier
85050 / 86050 generation in titanium, platinum, pink gold and steel.

Sister-generation context, explicitly NOT comps (different reference, different case
material mix, earlier and more complicated executions):

| Date | Result | Price | Ccy | Notes | Source |
|---|---|---|---|---|---|
| 2024-11-13 | SOLD | 12,800 | GBP | Ref. 85050 **titanium**. Bonhams #29154 | [AGG] collectorsquare.com/en/watches/vacheron-constantin/quai-de-l-ile/lpi |
| 2023-04-24 | SOLD | 30,240 | USD | Ref. 86040/000R **18K pink gold**. Christie's #21993 | [AGG] same page |
| 2023-03-10 | SOLD | 163,800 | HKD | Ref. 86050 titanium. Christie's #21464 | [AGG] same page |
| 2023-04-14 | UNSOLD | — | HKD | Ref. 85050 pink gold/titanium. Failed at Sotheby's | [AGG] same page |
| 2020-12-02 | SOLD | 13,208 | EUR | Ref. 86050/1 platinum. Bonhams #26251 | [AGG] same page |
| 2019-05-11 | SOLD | 11,875 | CHF | Ref. 86050/000T titanium. Antiquorum #321 | [AGG] same page |
| 2018-07-17 | SOLD | 20,800 | EUR | Ref. 86050 **steel**. Artcurial #M1043 | [AGG] same page |

The steel-cased 4500S (the 2019-onward simplified Quai de l'Île) has no auction
record I could find. The guide's $9,000–12,000 is unvalidated from this venue.

---

## P19 — VC Historiques Triple Calendrier 1942 ref 3110V/000A-B425 (and B426) steel
*Guide band $16,000–19,000.*

**NO DATA FOUND.**

Collector Square has no `triple-calendrier` page (HTTP 404) and ref 3110V does not
appear in its Historique reference index alongside 33155 and 81018. Four separate
searches specifically targeting the-saleroom, Invaluable, Barnebys and general
auction indices for a realized 3110V price returned **only dealer and retail
listings** — Chrono24 asks at $22,495 and $25,254, Shreve Crump & Low CPO,
SwissWatchExpo, PrestigeTime, Bulang & Sons, DavidSW and similar; and one search
summary citing a Chrono24 ask range of roughly $15,434–18,995. **No realized
transaction of any kind.**

This is a 2017-launched steel reference that has not yet reached the auction channel
in any findable volume. The band is unvalidated from my venue. The one useful
observation is directional only: the reference's *asks* straddle the guide band from
both sides, which is consistent with a band that is roughly right but carries no
realized-price support.

---

## P20 — JLC Polaris Geographic ref Q9078640 (ocean grey, 2024–) — OWNED
*Guide says "secondary market still forming."*

**NO AUCTION DATA FOUND.** No lot at this reference at any house or aggregator.

Non-auction context gathered this session, recorded as ASK only:

| Date | SOLD/ASK | Price | Ccy | Notes | Source |
|---|---|---|---|---|---|
| current | RETAIL | 16,100 (excl. local tax) / EUR 17,700 incl. VAT | USD / EUR | Manufacturer suggested retail, ref Q9078640 | [SNIPPET] monochrome-watches.com introducing article |
| current | ASK | 19,220 | USD | Dealer listing, thewatchpages.com | [SNIPPET] thewatchpages.com/watches/jaeger-lecoultre-polaris-geographic-q9078640/ |

The guide's characterisation — secondary market still forming — is **correct and
confirmed by absence**: a 2024-launch reference with zero auction appearances. Note
one ask above retail, which is a thin-supply artefact rather than a market level.

---

## P21 — JLC Master Control Chronometre Date Power Reserve ref Q4168120 (2026 launch)
*User pre-ordered at $17,000. Task: note current retail and any early secondary.*

**NO DATA FOUND — auction or secondary.** No lot, no listing, no realized price at
this reference surfaced in any search this session. This is expected for a 2026-launch
reference: there is no auction channel for a watch that has barely shipped, and my
venue is structurally incapable of covering it. **This entry should be assessed from
the retail/AD venue, not from auction evidence.**

---

## Coverage summary

### Entries WITH realized (SOLD) auction prices — 12

| Entry | Solds | Asks/est. only | No-sales recorded | Best/most load-bearing realized figure |
|---|---|---|---|---|
| P1 · VC 4240 triple calendar | 11 | — | 1 | USD 17,640 incl. prem., Christie's Dubai 2023-10-05 (YG) |
| P2 · JLC Futurematic E501 | 1 at-ref (+7 family) | — | 2 | CHF 3,276 incl. prem., Christie's 2023-12-12 (steel E501) |
| P3 · JLC Memovox E855 | 8 | — | 2 | GBP 1,536 incl. prem., Bonhams 2024-11-13 (steel) |
| P4 · VC 1972 / 37010 | 10 | — | 1 | USD 10,710 incl. prem., Sotheby's 2021-09-02 (YG) |
| P5 · VC Mercator 43050 | 9 (4 YG, 5 Pt) | 2 Loupe This est. | 6 | **CHF 44,100 incl. prem. (hammer 35,000), Christie's 2024-05-13, ref 43050/000J YG** |
| P6 · VC Malte 83060 | 4 | — | 0 | HKD 102,000 incl. prem., Bonhams 2023-07-25 (WG) |
| **P7 · VC Malte 42005 WG** | **4 WG (+4 other metals)** | 1 snippet | **3** | **USD 6,000 incl. prem., Bonhams 2023-10-12 (ref 42005/000G) — plus TWO Sotheby's no-sales in 2024** |
| P8 · JLC Master Grand Réveil | 3 at-ref (+4 other metals) | — | 3 | HKD 89,600 incl. prem., Bonhams 2024-05-28 (steel Q163842A) |
| P9 · VC Toledo 47300 | 8 (2 pink gold) | — | 2 | HKD 75,000 incl. prem., Christie's 2021-11-27 (pink gold) |
| P10 · JLC Grande Reverso GMT | 6 steel (+4 pink gold) | 1 Loupe This est. | 1 | USD 8,750 incl. prem., Christie's 2011; USD 4,072, Worthy 2024-12-31 |
| P11 · JLC AMVOX2 Q192T25 | 2 at-ref | — | 3 | USD 7,500 incl. prem., Christie's 2021-06-26 |
| P13 · JLC Duomètre Q6012420 | 9 | — | 1 | EUR 17,056 incl. prem., Artcurial 2023-07-16 (pink gold) |

### Entries with ONE stale realized price only — 2

- **P14 · VC Ultra-Fine 33155** — one 2013 Christie's HK result, HKD 93,750, and in
  **yellow** gold not the guide's rose. Band unvalidated.
- **P15 · VC Aronde 81018** — one 2013 Christie's NY result, USD 17,500 incl. premium
  (above its $10,000–15,000 estimate). Two further appearances gated. Band unvalidated.

### Entries ASK / ESTIMATE ONLY — 2

- **P12 · VC Chronomètre Royal 86122** — one genuine Sotheby's lot (March 2026, pink
  gold, movement untested/service due, full box and Certificat de Qualification) but
  the **realized price is behind a login**. Its estimate of HK$50,000–100,000
  (~$6,400–12,800) is notably below the guide band. All other "Chronomètre Royal"
  auction data is the unrelated vintage model — do not pool.
- **P20 · JLC Polaris Geographic Q9078640** — retail $16,100 / EUR 17,700; one dealer
  ask at $19,220. Zero auction presence, which *confirms* the guide's own
  "still forming" language.

### Entries NO DATA FOUND — 5

- **P16 · JLC MUT Réserve de Marche Q1378420** — no lot at this reference. Family
  proxies (Q1288420 at $4,032; 170.8.37 at $5,040) are different references.
- **P17 · JLC Geophysic True Second Q8018420** — no auction presence at all.
- **P18 · VC Quai de l'Île 4500S** — no 4500S in the auction record; only the earlier
  85050/86050 generation, which is not a comp.
- **P19 · VC Triple Calendrier 1942 3110V** — no realized price anywhere; dealer asks
  only ($15,434–25,254 across listings).
- **P21 · JLC Master Control Q4168120** — 2026 launch, structurally uncoverable from
  the auction venue.

### Venue gaps and caveats the synthesis stage must weigh

1. **r/WatchExchange produced ZERO rows.** The fetch tool is blocked from
   reddit.com entirely, and five site-restricted search formulations returned no
   WatchExchange threads. This is a **tooling failure, not evidence of absence** —
   private-sale prices for P7, P10, P13 and P16 in particular are likely to exist
   there and remain uncollected. **Do not infer thin private-sale volume from this
   file.** This venue should be re-run with a working reddit path.
2. **EveryWatch is fully paywalled** and is the aggregator with the deepest
   auction-result coverage. Only one figure leaked via search snippet (the P7 Iconeek
   result), and I could not confirm it.
3. **Sotheby's realized prices are login-gated** across the board. I have Sotheby's
   *estimates* and *condition text* on three lots (P3 E855, P7 42005/2, P12 86122)
   but their hammer results are missing. Sotheby's **no-sales**, however, come
   through the aggregator reliably and I have recorded them — they are among the
   most informative rows in this file.
4. **Condition data is the weakest dimension.** Collector Square rows carry no
   condition, polish, redial or service text. Only the pages I fetched directly
   (Phillips 8050, Bonhams lot 75, Loupe This ×3, Worthy, Sotheby's ×2) have real
   condition and completeness detail, and those are noted inline. **No band derived
   from the aggregator rows can be condition-adjusted.**
5. **No lot in this entire file cited an Extract from the Archives** except the
   Phillips ref-35703 non-comp. The guide's P1 variant spec (Extract from Archives)
   therefore carries no price premium evidence from my venue.
6. **The premium calibration in §1 is the single most reusable output here.** If the
   synthesis stage pools my rows with dealer asks from the Chrono24/WatchCharts
   collectors, it must not additionally gross up my figures — they already include
   the buyer's premium.

### Ranked list of divergences this venue found

1. **P7 Malte 42005 WG** — guide $14,000–17,000 vs. two 2024 Sotheby's no-sales, a
   2023 Bonhams sale at $6,000 on a $6,000–8,000 estimate, and 2021–22 Christie's
   results equal to roughly $14,000–15,500. **The user's ~$12,000 is at or above
   realized market, not below it.**
2. **P4 VC 1972 / 37010** — guide $12,500–15,500 vs. ten realized sales spanning
   $3,888–10,710. Possible reference/size mismatch in the guide (Petit Modèle).
3. **P3 JLC Memovox E855** — guide $3,500–5,500 vs. three 2024 Bonhams solds at
   $1,625–2,280 and a 2023 Sotheby's no-sale.
4. **P11 JLC AMVOX2 Q192T25** — guide $8,500–11,000 vs. solds at $4,050 and $7,500
   and three no-sales including a 2024 Christie's failure.
5. **P9 VC Toledo 47300 pink gold** — guide $13,500–16,500 vs. two pink-gold solds at
   ~$9,600 and $12,500 (both 2020–21) and a pink-gold no-sale.
6. **P13 JLC Duomètre** — guide $18,000–23,000 vs. 2023 Artcurial pair at ~$17,700
   and ~$18,420; band floor is now the market centre.

### Entries this venue CONFIRMS

- **P8 Master Grand Réveil** — three steel solds at $11,340 / $11,470 / $12,930,
  dead-centre of the guide's $10,500–13,500. Strongest confirmation in the file.
- **P10 Grande Reverso GMT** — guide $7,000–10,000 correctly tracks the top of a
  $4,072–9,600 realized range; the high ask cluster is a naming artefact and should
  be disregarded (see P10 for the full answer to the assigned question).
- **P6 Malte 83060** — guide $9,000–13,000; four solds, zero no-sales, clustering at
  the band's upper edge.
- **P5 Mercator 43050 YG** — guide $35,000–45,000 supported by the single 2024
  Christie's result at CHF 44,100 and two independent $30,000–40,000 Loupe This
  estimates, but **with a serious sell-through warning** (four YG no-sales in 2023–24).
- **P1 VC 4240** — guide $12,000–20,000 supported across its lower two-thirds.
