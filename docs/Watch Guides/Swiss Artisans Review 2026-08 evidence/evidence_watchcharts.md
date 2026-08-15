# Evidence — Venue: WatchCharts

Collected 2026-08-13. Collector: WatchCharts venue specialist.

## READ THIS FIRST — venue access constraint (affects every row below)

**WatchCharts blocked all direct page retrieval this session.** Both `WebFetch`
and a direct `curl` with a browser User-Agent returned **HTTP 403** on
`watchcharts.com` and `watchcharts.uk`, for the search endpoint, model
`/overview` pages and `/prices` pages alike. This is edge/bot protection, not a
login wall — I never reached a page to see what was gated behind an account.

Consequence: **every number in this file comes from a search-engine snippet of
an indexed WatchCharts page, not from a page I rendered.** That is a weaker
grade of evidence than the other venue collectors will have, and it carries
three specific defects that the synthesis stage must price in:

1. **No paywall map.** I cannot tell you what WatchCharts gates, because I never
   saw a page. WatchCharts is *known* to require a paid account for full sales
   history; I could not verify that this session and I am not asserting it from
   memory. Where a sales figure surfaced in a snippet, it surfaced because the
   indexer saw it — I cannot say whether a logged-out human would.
2. **Snippet-to-page attribution is not always isolable.** Domain-restricted
   searches guarantee the text came from a WatchCharts page; they do not always
   tell me *which* WatchCharts page. Rows where this bites are flagged
   `[ATTRIB-WEAK]`.
3. **Sibling-reference conflation.** The snippet summarizer repeatedly blended
   numbers across adjacent model pages (most severely on the JLC Master Ultra
   Thin family, where six sibling refs share a naming pattern). Rows affected
   are flagged `[CONFLATION-RISK]` and should be treated as indicative only.

Tags used: **MODEL-EST** = WatchCharts model output (market value / private-sale
average / dealer average / index trend). **SOLD** = a recorded transaction.
**ASK** = a listing price. Non-WatchCharts prices that appeared in results were
**excluded** from the comp tables; a few are noted in prose as out-of-venue
spillover so a later collector is not surprised by them.

---

## P1 — VC Vintage Triple Calendar ref 4240/4241 (1940s, cal V485)

**NO DATA FOUND.**

WatchCharts has no model page for ref 4240 or 4241. A domain-restricted search
for the vintage reference returned only the **modern** Historiques reissues
(3110V/000A-B425 and -B426, see P19) plus unrelated vintage VC listings. That is
the expected outcome — WatchCharts' model coverage is built around post-1990
references and does not extend to 1940s VC calendar wristwatches.

One adjacent marketplace listing exists but is **not a comp** and I include it
only so nobody mistakes it for one later: "Vacheron Constantin Triple Calendar.
1946. Full Set. Mint." (`marketplace.watchcharts.com/listing/12453863-vacheron-constantin-triple-calendar-1946-full-set-mint`).
No reference number confirmed, no price visible in the snippet, date of listing
unknown. Not usable.

---

## P2 — JLC Futurematic E501 (1951–56, cal 497)

**No reference-specific data. Family-level range only.**

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| undated | MODEL-EST | 3,448 – 37,492 | USD | **Family-level, NOT E501.** WatchCharts "Futurematic" market range spanning all Futurematic variants incl. gold/gold-filled. Useless as a band check on its own — the spread is 11×. `[ATTRIB-WEAK]` | watchcharts.com/watches/brand/jaeger-lecoultre |
| undated | MODEL-EST | 2,000 – 26,000 | GBP | Same family-level range on the UK site. `[ATTRIB-WEAK]` | watchcharts.uk |

Individual Futurematic listings confirmed to exist on WatchCharts, **all with no
price visible in snippet**:
- 1953 JLC Futurematic — `watchcharts.com/listing/621023`
- 1950s Futurematic, "ORIGINAL DIAL AUTOMATIC BUMPER 35mm WORKS" — `watchcharts.uk/listing/582821`
- 1950s Futurematic, "ALL ORIGINAL BLACK DIAL LONG SPIDER LUGS" — `watchcharts.com/listing/427785`
- Futurematic Power Reserve vintage — `watchcharts.com/listing/3833354`

Note the third is a **black** dial; the guide variant is silver/beige. None of
these confirm the E501 case reference specifically. **No usable comp for the
$2,500–4,500 band from this venue.**

---

## P3 — JLC Memovox Automatic Calendar E855 (cal 825 alarm)

**NO PRICE DATA FOUND.** Reference present, prices not exposed.

A WatchCharts listing for a **"Memovox E855 'Jumbo' Alarm, automatic, Cal 825,
37.5mm 10k gold-filled case"** was confirmed in a snippet, but **no asking price
was visible**. Two cautions, both material:

- That example is **10k gold-filled**, whereas the guide variant is **steel**.
  Different metal, different market — it would not be a clean comp even with a
  price attached.
- The other E855-adjacent WatchCharts listings that surfaced are the wrong
  watch: cal 814 manual (`listing/857956`), a K825 "Memovox GT"
  (`listing/1162902`), a ca.1970 steel automatic calendar Memovox
  (`listing/1294997`, reference unconfirmed), and a modern 141.8.97 Réveil
  (`listing/5804343`). Per the brief's rule I am **not** offering any of these as
  comps.

**Nothing here tests the $3,500–5,500 band.**

---

## P4 — VC "1972" / Prestige de la France ref 37010

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| undated | ASK | 8,999 | USD | "Rare Vacheron Constantin Asymmetrical 1972 37010, **white gold**." Condition, completeness and listing date all unstated in snippet. `[ATTRIB-WEAK]` — domain-restricted to watchcharts.com/.uk so the text is from a WatchCharts page, but the snippet did not isolate which listing URL. | (watchcharts.com — specific listing URL not isolable) |

**One ASK, no solds, no model page.** The single figure sits **~28% below the
bottom** of the guide's $12,500–15,500 band. I want to be blunt about how thin
this is: one undated asking price of unknown condition, on a vintage asymmetric
where case sharpness drives most of the value, is not enough to move a band on
its own — but it is also not nothing, and it points the same direction a
skeptical reviewer would already be leaning.

---

## P5 — VC Mercator ref 43050 (cal 1120/2 bi-retrograde)

**NO PRICE DATA FOUND at this venue.**

No WatchCharts model page exists for the Mercator 43050. One marketplace listing
is confirmed to exist — `marketplace.watchcharts.com/listing/18418454-wts-vacheron-constantin-mercator-43050`
— but **no price was visible in any snippet** across two attempts.

**Out-of-venue spillover, explicitly NOT counted as WatchCharts evidence:** a
search returned Mercator estimates of ~$30,000–40,000 (yellow gold) and
~$20,536–30,804 (platinum ref 43050/000P) sourced to **EveryWatch**, plus a
Chrono24 platinum listing at $163,805. I am recording these **only** so the
synthesis stage does not later attribute them to WatchCharts. They are another
collector's rows, and note the platinum/enamel variants are the ones the brief
told us to price separately anyway.

**The $35,000–45,000 band is untested by this venue.**

---

## P6 — VC Malte Power Reserve/Date ref 83060 (cal 1420 manual)

**No reference-specific value. Two listings, both priceless in snippet.**

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| listing era 2000–2009 | ASK | not visible | USD | **83060/000R-9289**, rose gold, black dial, leather strap, full kit (box, pouch, instructions, warranty certificate). Price not exposed in snippet. | marketplace.watchcharts.com/listing/30700041 |
| listing era 2010–2019 | ASK | not visible | USD | **83060/000R-9288**, rose gold, silver dial, brown leather. Price not exposed in snippet. | marketplace.watchcharts.com/listing/14667185 |

Family-level context only, and it is **internally inconsistent across snapshots**
— worth noting as a reliability signal on WatchCharts collection pages:

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| ~May 2025 snapshot | MODEL-EST | ~11,000 avg (9,000 – 45,000) | USD | Malte **collection** average/range | watchcharts.com/watches/brand/vacheron+constantin/malte?page=1 |
| ~Jul 2026 snapshot | MODEL-EST | ~12,000 avg (10,000 – 52,000) | USD | Malte **collection** average/range | watchcharts.com/watches/brand/vacheron+constantin/malte |

Both listings are **rose gold**; the guide variant allows WG or RG. A Chrono24
83060 at $10,446 appeared in results — **out-of-venue, excluded.**

**The $9,000–13,000 band is untested by this venue.**

---

## P7 — VC Malte Dual Time Regulator ref 42005/000G-8900 *(priority — live negotiation)*

Model page exists: `watch_model/25155`, indexed title **"Price as of February 2026."**
This is the richest entry I have, and the most important finding is a *negative* one.

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| ~Feb 2026 page | ASK (range) | 13,455 – 16,445 | USD | Stated as the current **pre-owned secondary listing** range for this reference. Asking prices, not sales. Condition mix unstated. | watchcharts.com/watch_model/25155-…/overview |
| Jan 2026 | SOLD (count only) | count = 2 | — | **2 recorded sales in January 2026.** Sale *prices* were NOT exposed in any snippet across three attempts. Ranks top 82% of VC by popularity. | watchcharts.com/watch_model/25155-…/overview |
| trailing 1 yr to ~Feb 2026 | MODEL-EST | −7.1% | — | Market price change, past 1 year | watchcharts.com/watch_model/25155-…/overview |
| trailing 5 yr | MODEL-EST | −11.5% | — | vs WatchCharts VC Index **+7.5%** — i.e. **18.9% worse than brand average over 5 years** | watchcharts.uk/watch_model/25155-…/analysis |
| ~Feb 2026 | MODEL-EST | risk 69/100 | — | "High Risk" | watchcharts.uk/watch_model/25155-…/analysis |
| — | MODEL-EST | — | — | **"There is not enough sales data for this watch to compute days on market."** Also flagged "no longer in production." | watchcharts.com/watch_model/25155-…/overview |

**Sister reference — flagged as such, NOT a comp:** 42005/000J-8901 (yellow
gold), page titled "Price as of January 2026": **−8.0%** past 1 year, risk
**72/100**. Different metal.
A rose-gold example also exists on WatchCharts — "Malte Dual Time Regulator 39mm
**ROSE GOLD** Ref. 42005/OOR SERVICED" (`watchcharts.com/listing/1003658`) — **no
price visible**, and again wrong metal for this entry.

**The load-bearing point for the negotiation.** I could **not** extract
WatchCharts' headline market-value dollar figure for this reference despite three
separately-phrased attempts; that specific number appears to sit in a part of the
page the indexer did not surface. What I *can* say is better than that number
anyway: WatchCharts itself reports **too few sales to compute days on market**,
and only **2 recorded sales in a month**. The guide's $14,000–17,000 band is
therefore resting on a reference that this venue considers **statistically thin**,
and the only hard dollar figures available are **asks** ($13,455–$16,445) — which
are, by WatchCharts' own published methodology note (see P14), systematically
**above** private-party value. A ~$12,000 negotiated price sits **below the entire
observed ask range**, on a reference trending **−7.1% y/y** and **−11.5% over five
years while its brand index rose 7.5%**. Nothing here supports paying up.

---

## P8 — JLC Master Grand Réveil ref Q163842A / 149.8.95

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| undated | ASK | 12,750 | USD | FS listing, stated **"condition 99"** (WatchCharts' 0–100 condition scale). Completeness not stated. | watchcharts.com/listing/1342263-fs-jaeger-lecoultre-master-grand-eveil-perpetual-calendar-alarm-q163842a-149-8-95 |
| undated | ASK | 16,700 | USD | FS listing, **"Mint, Original Box Papers"** — full set. | watchcharts.com/listing/1437106-fs-jaeger-lecoultre-master-grand-eveil-149-8-95-q163842a-mint-original-box-papers |

**Two asks, zero solds, no model page.** Both correctly matched to the exact
double reference (Q163842A / 149.8.95). Neither listing's date was exposed, which
matters — the brief prefers the last 18 months and I cannot confirm either
qualifies.

These **bracket the guide's $10,500–13,500 band from above**: the bare-ish
example asks $12,750 (inside the band, at the top) and the full-set mint example
asks $16,700 (~24% above the band ceiling). Since asks run above private-party
value, this is not proof the band is wrong — but the full-set premium here looks
larger than the band allows for.

---

## P9 — VC Historiques Toledo 1952 ref 47300 (target: 47300/000R-9219 rose gold)

**NO reference-specific data for the rose-gold 000R-9219.**

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| ~Jul 2026 page | — | not visible | — | **Sister reference only:** a model page exists for **47300/000J-9065** — *yellow* gold, not the rose gold 000R-9219 the guide targets. No price figure exposed in snippet. Flagged as sister, not offered as a comp. | watchcharts.com/watch_model/25144-vacheron-constantin-historiques-toledo-47300-000j-9065/overview |
| ~Jun 2026 snapshot | MODEL-EST | ~26,000 avg (13,000 – 68,000) | USD | **Historiques collection-level**, spans everything from Aronde to American 1921. Far too broad to test a Toledo band. | watchcharts.com/watches/brand/vacheron+constantin/historiques |
| ~Jul 2026 snapshot | MODEL-EST | ~27,000 avg (13,000 – 70,000) | USD | Same collection page, later snapshot — note the drift between snapshots. | watchcharts.com/watches/brand/vacheron%20constantin/historiques |

An explicit quoted search on `"47300/000R-9219"` returned **no page carrying that
reference**. One marketplace listing "Vacheron Constantin Toledo Historiques
1952" exists (`marketplace.watchcharts.com/listing/12243688`) with **no price and
no reference suffix** visible — unusable.

**The $13,500–16,500 band is untested by this venue.**

---

## P10 — JLC Grande Reverso GMT ref Q3028420 / 240.8.18

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| undated | ASK | 7,400 | USD | Grande Reverso GMT 8 Days, ref 240.8.18 / Q3028420, on WatchCharts Marketplace. Condition/completeness not exposed. `[ATTRIB-WEAK]` on which of the several near-identical listing IDs carried the figure. | marketplace.watchcharts.com/listing/9997415-fs-jaeger-lecoultre-reverso-grande-gmt-8-days-240-8-18-q3028420 |
| undated | ASK | not visible | USD | "REVERSO GRANDE GMT 8 DAYS POWER **FULL SET** 240.8.18 Q3028420" — full set confirmed, price not exposed. | watchcharts.com/listing/428023 |
| undated | ASK | not visible | USD | "[WTS] JLC Grande Reverso Q3028420 240.8.18 **black/white dial, box & papers**" — full set, price not exposed. | watchcharts.com/listing/22394760 |
| undated | ASK | not visible | USD | Duplicate/mirror listings of the same watch on the UK and .com marketplaces. | marketplace.watchcharts.uk/listing/7901975 · marketplace.watchcharts.com/listing/7963238 |
| ~Aug 2026 | MODEL-EST | ~9,000 avg (3,000 – 35,000) | USD | **Reverso collection-level** — spans quartz ladies' to Tribute Gyrotourbillon. Not a band test. | watchcharts.com/watches/brand/jaeger-lecoultre/reverso |

**Excluded — different watch, per the brief's anti-padding rule:**
`watchcharts.com/listing/17248694` "[WTS] Jaeger-LeCoultre Grande Reverso **GMT
Big Date** $6,799" — the Big Date is a different model from the 8 Days GMT. Also
excluded: `listing/1010039` (Grande Reverso GMT in **rose gold**, wrong metal),
and `marketplace/27631610` (Reverso **Grande Date** 240.8.15, different ref).

**Out-of-venue spillover, excluded:** Chrono24 asks of $14,864 (Fair condition)
and $17,840 (2009, Good, Duo Face). Flagging these because they are **roughly
double** the WatchCharts ask and someone will notice the discrepancy at synthesis
— it likely reflects Chrono24 dealer pricing vs WatchCharts forum private sales,
but that is the other collector's call, not mine.

**One usable ask at $7,400** — inside the guide's $7,000–10,000 band, near the
floor. Zero solds.

---

## P11 — JLC AMVOX2 Chronograph ref Q192T25 (Aston Martin)

**NO price data for Q192T25 itself.** Everything priced is a different reference.

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| undated | ASK | 8,800 + shipping | USD | **SISTER REF — AMVOX2 *DBS* Chronograph**, not Q192T25. Excellent condition. Explicitly flagged: the DBS is a distinct variant. | watchcharts.com/listing/8215161-fs-jlc-jaeger-lecoultre-aston-martin-amvox-2-dbs-chronograph |
| 2018 listing | ASK | 9,500 + shipping | USD | **SISTER REF — AMVOX2 DBS** again, listing dated 2018 (well outside the brief's 18-month preference). | watchcharts.uk/listing/1018661-fs-jlc-jaeger-lecoultre-aston-martin-amvox-2-dbs-chronograph |
| undated | ASK | not visible | USD | **DIFFERENT REF** — AMVOX2 Q192T450 DBS with box/papers. | watchcharts.com/listing/2325448 |
| undated | ASK | not visible | USD | **DIFFERENT REF/METAL** — AMVOX 2 ref 197.2.25, 18k **rose gold**, limited. | watchcharts.uk/listing/428138 |

WatchCharts listings for the true **192.T.25 titanium** are confirmed to exist
(the AMVOX brand pages index them) but **no sold or asking price for that
reference was exposed** in any snippet across two attempts.

**Out-of-venue spillover, excluded:** a Q192.T.25 at **$11,422.95** (Pacific Bay
Watch, via EveryWatch) and a Q192T440 at $7,400 (eBay).

**The $8,500–11,000 band is untested by this venue** — the two DBS asks sit
around $8,800–9,500 but the brief forbids me from treating a different variant as
a comp, and I am not going to.

---

## P12 — VC Historiques Chronomètre Royal 1907 ref 86122/000R-9362

**NO PRICE DATA FOUND.**

A WatchCharts listing for the **Historiques Chronomètre Royal 1907 rose gold
86122**, offered by dealer **SwissWatchExpo**, is confirmed to exist. The snippet
reported it carries **"No price rating"** on WatchCharts — meaning WatchCharts
had no market value against which to grade the ask, and **no dollar figure was
exposed**. No model page for this reference.

Only the Historiques collection-level figures apply (~$26,000–27,000 avg, range
$13,000–$70,000) and they are far too broad to test an $18,000–22,000 band.

**Untested by this venue.**

---

## P13 — JLC Duomètre à Chronographe ref Q6012420 rose gold (cal 380)

Model page exists: `watch_model/6571` (listed as "Duomètre Chronographe **Pink
Gold** 6012420" — same watch, WatchCharts' naming).

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| current (date not pinned) | MODEL-EST | 16,994 | USD | WatchCharts market value for the reference. | watchcharts.com/watch_model/6571-jaeger-lecoultre-duometre-chronographe-pink-gold-6012420/overview |
| **2022-11-09** | MODEL-EST | 21,905 | USD | **Private sales market average**, explicitly dated. Nearly 4 years stale — included because it is dated and shows the trajectory. | watchcharts.com/watch_model/6571-…/overview |
| **2022-11-09** | MODEL-EST | 22,136 | USD | **Secondary market dealer** average, same date. | watchcharts.com/watch_model/6571-…/overview |
| ~May 2026 | MODEL-EST | ~21,000 avg (17,000 – 25,000) | USD | Duomètre **collection-level** (includes Quantième Lunaire, Unique Travel Time — pricier refs, so this overstates the Chronographe). | watchcharts.com/watches/brand/jaeger-lecoultre/duometre |

**Load-bearing:** the current MODEL-EST of **$16,994** sits **below** the guide's
$18,000–23,000 band, and the dated Nov-2022 pair ($21,905 private / $22,136
dealer) shows roughly a **−22% slide** over the intervening period. The guide's
band looks like it was set on the 2022-era market. Zero solds, zero asks — this
entry is model output only.

---

## P14 — VC Les Historiques Ultra-Fine 1955 ref 33155/000R-9588 rose gold (cal 1003)

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| date not exposed | MODEL-EST | **30,467** | USD | **Private sales market average.** WatchCharts' own methodology note was captured alongside it and is worth quoting for the whole review: *"the price history is only affected by sold listings… this graph is an estimate of private party value… asking prices from dealers will often be higher."* So this figure is **already the conservative, private-party number** — not a dealer ask. | watchcharts.com/watch/22949/vacheron-constantin-historiques-ultra-fine-1955-pink-gold-33155-000r-9588 |

**This is the single largest discrepancy I found.** The guide's band is
**$12,000–18,000**; WatchCharts' private-party estimate is **$30,467** — roughly
**1.7× the band ceiling**, and it is the *sold-listings-derived* figure rather
than an ask. Confirmed twice in independently-phrased searches, both resolving to
the same model page and the same number, so I have reasonable confidence in the
figure itself. The **date is my gap** — no snapshot month was exposed, so I
cannot date it or confirm it falls inside the 18-month window.

**Out-of-venue spillover, excluded but directionally corroborating:** dealer asks
of $25,760 (Diamondized, discounted from $32,200) and $31,455 unworn (Luxury Time
NYC). These are not WatchCharts rows and I am not counting them — but they sit in
the same neighbourhood as the $30,467, which argues the WatchCharts figure is not
a stray artifact.

---

## P15 — VC Historiques Aronde 1954 ref 81018/000R-9657 rose gold LE

**NO PRICE DATA FOUND.**

WatchCharts indexes the model as "Historiques Aronde 1954 Gold Manual Strap
**81018/000R-9657**" with aggregated eBay-sourced listings, but **no market value
and no asking price was exposed** in any snippet. No dedicated model page with
figures surfaced.

Everything else the search returned for this reference was a dealer site
(European Watch Co., Timepiece Trader, Pacific Bay, my-watchsite, Demesy) —
**out of venue, excluded.**

**The $11,000–14,000 band is untested by this venue.**

---

## P16 — JLC Master Ultra Thin Réserve de Marche ref Q1378420 steel *(owned)*

Model page exists: `watch_model/6667`, indexed title **"Price as of December 2025."**

⚠️ `[CONFLATION-RISK]` — **this is the worst entry in the file for attribution
hygiene** and I am not going to paper over it. The Master Ultra Thin family has
at least seven sibling references with near-identical names (1368420 Moon,
1288420 Date, 1248420 Moon 36, 1258420 Moon, 1238420 Date, 1232510 Date,
1362520 Moon). Across three separately-phrased searches the summarizer returned
MKT dollar values drawn from **that whole cluster of pages**, not from 1378420
alone. The **non-dollar** metrics below were each stated in direct connection
with "the Jaeger-LeCoultre 1378420" and I hold those with good confidence; the
**dollar figures I hold only loosely.**

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| ~Dec 2025 page | MODEL-EST | ~5,400 – 6,200 (indicative) | USD | **LOW CONFIDENCE.** MKT values in this band were returned in association with the 1378420 page, but the snippet set demonstrably mixed sibling refs. The two figures that recurred nearest to 1378420 context were **$5,730** and **$5,996**. Treat as a rough locator, not a datum. `[CONFLATION-RISK]` | watchcharts.com/watch_model/6667-jaeger-lecoultre-master-ultra-thin-reserve-de-marche-1378420/overview |
| trailing 1 yr | MODEL-EST | **−14.5%** | — | Stated directly of "the Jaeger-LeCoultre 1378420." vs WatchCharts JLC Index **−8.9%** → **5.6% worse than brand average.** Good confidence. | watchcharts.com/watch_model/6667-…/overview |
| trailing 5 yr | MODEL-EST | −3.8% | — | vs JLC Index −0.2%. Good confidence. | watchcharts.com/watch_model/6667-…/overview |
| ~Dec 2025 | MODEL-EST | risk 58/100 | — | "High Risk." Good confidence. | watchcharts.com/watch_model/6667-…/overview |

**Load-bearing despite the caveat.** Even taking the *top* of the loose range
($6,189) the WatchCharts market value falls **below the guide's stated
$5,200–7,500 market value at the midpoint**, and the whole indicative band sits
in the **bottom half** of what the guide claims. Combined with a hard **−14.5%
y/y**, the guide's upper bound of $7,500 looks stale. Zero solds, zero asks — a
$8,763 WatchMaxx and a €9,990 Timepiece Bank figure appeared but are **new-retail
dealer prices, out of venue, excluded.**

---

## P17 — JLC Geophysic True Second ref Q8018420 steel/silver

Model page `watch_model/6599` ("Price as of April 2026") **plus** a sales page.
**This is my only entry with a confirmed dated sold price.**

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| **Jun 2026** | **SOLD** | **7,546** | USD | Sold **through Vintage Watch Agency**. Condition/completeness not exposed. Buyer's premium treatment not stated. Well inside the 18-month window. | watchcharts.uk/watch_model/6599-jaeger-lecoultre-geophysic-true-second-8018420/sales |
| ~Apr 2026 page | MODEL-EST | **7,847** | USD | **Private sales market average.** Confirmed independently in two separately-phrased searches returning the identical figure — my highest-confidence MODEL-EST in this file. | watchcharts.com/watch_model/6599-…/overview |
| ~Apr 2026 page | MODEL-EST | **8,740** | USD | **Secondary market dealer** average — "what you can expect to pay from a dealer." | watchcharts.com/watch_model/6599-…/overview |
| trailing 1 yr | MODEL-EST | −6.5% | — | Market price change | watchcharts.com/watch_model/6599-…/overview |
| — | SOLD (count) | 1 auction result | — | WatchCharts UK reports **1** auction result from major houses for this ref. Price not exposed — this is the clearest single instance where I suspect gating, but cannot prove it. | watchcharts.uk/watch_model/6599-…/sales |
| undated | ASK | 6,500 | USD | An individual forum listing. Condition not exposed. | watchcharts.com/listing/2542047-fs-jaeger-lecoultre-q8018420-geophysic-true-watch · watchcharts.com/listing/1045057 · watchcharts.com/listing/168622 |
| ~Jun 2026 | MODEL-EST | ~9,000 avg (6,000 – 14,000) | USD | Geophysic **collection-level** (includes Universal Time 8108420 — pricier). | watchcharts.com/watches/brand/jaeger-lecoultre/geophysic |

**Load-bearing:** the guide's band is **$5,500–7,000**. A **June 2026 recorded
sale at $7,546** is **above the band ceiling**, and the private-party average of
**$7,847** is ~12% above it. The dealer average of $8,740 is 25% above. Only the
lone $6,500 forum ask lands inside the band. **This band reads too low**, and
unlike most entries here I have a dated sold to say so with.

**Sister reference noted, not counted:** 8018480 has its own page
(`watch_model/6600`) — different variant.

---

## P18 — VC Quai de l'Île Self-Winding ref 4500S/000A-B195 steel *(owned)*

Model page exists: `watch_model/25106`.

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| **Apr 2026** | MODEL-EST | **11,334** | USD | Estimated market value. Described as the most popular Quai de l'Île reference. | watchcharts.com/watch_model/25106-vacheron-constantin-quai-de-l-ile-self-winding-4500s-000a-b195/overview |
| **May 2026** | MODEL-EST | **11,245** | USD | Estimated market value, later snapshot — a **−0.8%** month-on-month drift. | watchcharts.com/watches/brand/vacheron+constantin/quai+de+l'ile?page=1 |
| trailing 1 yr to ~Apr 2026 | MODEL-EST | **+6.0%** | — | Market price change. **One of only two entries in this file trending up.** | watchcharts.com/watch_model/25106-…/overview |
| ~Apr 2026 | MODEL-EST | ~11,000 avg (11,000 – 12,000) | USD | Quai de l'Île collection-level — unusually tight range, small collection. | watchcharts.com/watches/brand/vacheron+constantin/quai+de+l'ile |
| undated | ASK | not visible | USD | "[WTS] 4500S/000A-B195 — 2018, **with papers**, 4500s/1 100m", graded **"Fair Price"** by WatchCharts. Dollar figure not exposed. Seller claims "cheapest in the world"/"cheapest in the USA" across repost variants. | watchcharts.com/listing/25799324-wts-vacheron-constantin-quai-de-ile-4500s-000a-b195-2018-cheapest |
| — | MODEL-EST | — | — | Flagged "no longer in production" — fixed secondary supply. | watchcharts.com/watch_model/25106-…/overview |

**Two dated MODEL-EST snapshots, no solds, no priced asks.** The guide claims
**$9,000–12,000**; WatchCharts puts it at **$11,245–11,334**, i.e. in the **top
quarter** of the guide's range and rising **+6.0% y/y**. The guide's band is
defensible here but its *floor* is doing no work — nothing at this venue supports
$9,000.

---

## P19 — VC Historiques Triple Calendrier 1942 ref 3110V/000A-B425 steel

Model page exists: `watch_model/22967` ("Price as of June 2026").

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| trailing 1 yr to ~Jun 2026 | MODEL-EST | **+11.8%** | — | Market price change — the strongest riser in this file. | watchcharts.com/watch_model/22967-vacheron-constantin-historiques-triple-calendrier-1942-stainless-steel-3110v-000a-b425/overview |
| ~Jun 2026 | MODEL-EST | risk **30/100** | — | **"Medium Risk"** — by a wide margin the best risk score across all 21 entries (P7 was 69, P16 was 58). | watchcharts.com/watch_model/22967-…/overview |
| trailing 5 yr | MODEL-EST | **+15.1% vs brand average** | — | Outperformed the VC index over five years. | watchcharts.com/watch_model/22967-…/overview |
| listing is a 2018 watch | ASK | 18,500 | USD | "Excellent condition, **full kit**", described as aggressively priced. Listing date not exposed. `[CONFLATION-RISK]` — snippet set mixed B425 and B426 results; I could not confirm which suffix this example carries. | watchcharts.com/listing/2860480-fsot-vacheron-3110v-les-historiques-triple-calendar-1942 |
| undated | ASK | 13,250 | USD | **New, unworn**, stated against **MSRP $20,000**. `[CONFLATION-RISK]` — likely the **B426** blue-accent sister rather than B425; the brief treats B426 as in-scope for this entry, but the suffix was not isolable. | watchcharts.com/listing/1019313-fs-vacheron-constantin-3110v-000a-b426-historiques-triple-calendar-1942-40mm |

**Sister reference confirmed in scope:** B426 has its own model page
(`watch_model/22961`, "Price as of April 2026") — the brief explicitly includes
the B426 blue-accent variant under P19, so both are legitimate here, but I could
not cleanly assign the two dollar figures between them.

Guide band **$16,000–19,000**. The full-set ask at **$18,500** sits inside it; the
unworn-at-$13,250 figure sits **well below** it and against a $20,000 MSRP, which
is odd enough that I would not lean on it without confirming the suffix. No
headline MODEL-EST dollar value was exposed. **No solds.**

---

## P20 — JLC Polaris Geographic ref Q9078640 (ocean grey, 2024–) *(owned)*

**NO WATCHCHARTS DATA FOUND for this reference.** Three separately-phrased
searches, including one restricted to the marketplace subdomain, found **no model
page and no listing** for Q9078640.

This is consistent with the guide's own claim that the secondary market is "still
forming" — and I'd say this venue **actively corroborates** that: a 2024 release
with no WatchCharts model page has essentially no tracked secondary market.

| Date | Tag | Price | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| ~Jul 2026 | MODEL-EST | ~8,000 avg (5,000 – 22,000) | USD | **Polaris collection-level only.** Spans Automatic, Memovox, Mariner, Chronograph — does not isolate the Geographic. Not a band test. | watchcharts.com/watches/brand/jaeger-lecoultre/polaris |

**Explicitly NOT a comp — different watch:** WatchCharts carries listings for a
**2018 Polaris Geographic WT** ("with Box and Papers", 42mm steel, blue dial, one
of **250** limited pieces) at `watchcharts.uk/listing/9262966` and
`marketplace.watchcharts.com/listing/9279479`. That is the **2018 limited World
Time** piece, a different watch from the **2024 ocean-grey Q9078640**. No price
was exposed for it in any case. Per the brief's anti-padding rule I am not
offering it.

**Out-of-venue, excluded:** retail of **US$16,100** (excl. tax) / €17,700 incl.
VAT, sourced to Monochrome and Time+Tide-style press coverage, and a $19,220
figure from The Watch Pages — **not WatchCharts**, recorded only to prevent
misattribution.

---

## P21 — JLC Master Control Chronomètre Date Power Reserve ref Q4168120 (2026)

**NO WATCHCHARTS DATA FOUND.** No model page, no listings, no market value. An
explicit search on the reference returned only other Master Control refs
(4138420 Chronograph Calendar, 4148120 Calendar, Q4018420 Date, Q1548420) —
**all different watches, none offered as comps.**

Expected and unremarkable: this reference launched in **2026**, so there is no
secondary market for WatchCharts to track yet.

**Out-of-venue, excluded from the comp table but relevant to the user's
pre-order:** retail is reported at **€18,000 / US$17,000** (Monochrome, The Watch
Pages, JLC's own site). The user's **$17,000 pre-order is at full list.** That
matches retail exactly — but note that the one adjacent data point this venue
*does* offer is a **Master Control Date Q4018420 in very good condition asking
$7,100** (`watchcharts.com/listing/13577281`), a different and simpler reference,
which I flag only as a reminder of how steeply Master Controls depreciate off
list. It is **not** a comp for Q4168120.

---

## Coverage summary

**Total entries: 21.**

### Entries with a recorded SOLD price (1)
- **P17** Geophysic True Second — **$7,546, June 2026**, via Vintage Watch Agency.

*Partial:* **P7** Malte Dual Time Regulator — WatchCharts reports **2 recorded
sales in January 2026** but exposed **no sale prices**.

### Entries with usable ASK prices (6)
| Entry | Asks captured |
|---|---|
| P4 · VC 37010 | $8,999 (WG) `[ATTRIB-WEAK]` |
| P7 · Malte DTR 42005/000G | ask **range** $13,455–$16,445 |
| P8 · Master Grand Réveil | $12,750 (cond. 99) · $16,700 (mint, full set) |
| P10 · Grande Reverso GMT | $7,400 |
| P17 · Geophysic True Second | $6,500 |
| P19 · Triple Calendrier 1942 | $18,500 (full set) · $13,250 (unworn) `[CONFLATION-RISK]` |

### Entries with MODEL-EST only, no solds and no asks (4)
- **P13** Duomètre à Chronographe — **$16,994** current; $21,905 private / $22,136 dealer as of **2022-11-09**.
- **P14** Ultra-Fine 1955 — **$30,467** private-sales average (date not exposed).
- **P16** MUT Réserve de Marche — ~$5,400–6,200 indicative `[CONFLATION-RISK]`; −14.5% y/y firm.
- **P18** Quai de l'Île — **$11,334** (Apr 2026) / **$11,245** (May 2026); +6.0% y/y.

### Entries with NO reference-specific data (11)
**P1** (4240/4241 — no page, vintage out of WatchCharts' coverage) · **P2**
(Futurematic E501 — family range only, 11× spread) · **P3** (Memovox E855 — ref
present, no price; the one example seen was gold-filled, not steel) · **P5**
(Mercator 43050 — listing exists, no price) · **P6** (Malte 83060 — two listings,
neither priced) · **P9** (Toledo 47300/000R-9219 — only the yellow-gold sister
has a page) · **P11** (AMVOX2 Q192T25 — only DBS sister refs priced) · **P12**
(Chronomètre Royal 86122 — listing carries "No price rating") · **P15** (Aronde
81018 — indexed, no figures) · **P20** (Polaris Geographic Q9078640 — no page;
market still forming) · **P21** (Master Control Q4168120 — no page; 2026 launch).

### Paywall and access gaps — the honest accounting

I must not overclaim here. **I never rendered a WatchCharts page**, so I cannot
give you the per-entry paywall map the task asked for. What I can state:

- **Hard block, not a paywall.** `watchcharts.com` and `watchcharts.uk` returned
  **403** to WebFetch *and* to curl with a browser UA, on `/overview`, `/prices`,
  `/analysis` and `/watches/search`. Edge bot protection, hit before any login
  question arises.
- **What that hides.** The figure most conspicuously absent across my results is
  the **headline market-value dollar amount on model `/overview` pages** — I got
  it for P13, P14, P17 and P18, but *not* for P7 or P19 despite repeated
  attempts, and only conflated for P16. Whether that is gating or merely
  incomplete indexing, **I cannot tell**, and I decline to guess.
- **Sales history specifically.** Two entries show WatchCharts *counting* sales
  while exposing no prices (P7: "2 recorded sales in January 2026"; P17: "1
  auction result"). P17's June 2026 sale price *did* surface. That asymmetry is
  the closest thing to evidence of sales-history gating I have, and it is
  suggestive, not conclusive.
- **Dating.** Model pages are indexed with titles like "Price as of February
  2026," which dates the *snapshot* but not necessarily each figure on it.
  **P14's $30,467 — my largest discrepancy — carries no date at all.** That is
  the single gap I would most want closed before it moves a band.
- **Currency.** All figures are USD from `.com` pages except the GBP family range
  in P2 from `watchcharts.uk`. Buyer's premium / shipping treatment was stated by
  the source in only one place — the two AMVOX2 DBS asks are explicitly "+
  shipping."

### Cross-venue hygiene note
Prices from **EveryWatch, Chrono24, WatchMaxx, Pacific Bay, Luxury Time NYC,
Diamondized, Timepiece Bank, The Watch Pages** and press coverage appeared in my
search results and are **excluded from every comp table above**. Where I judged a
later misattribution likely, I named them in prose under the relevant entry
(P5, P6, P10, P11, P14, P16, P20, P21) so the synthesis stage does not credit
them to WatchCharts.
