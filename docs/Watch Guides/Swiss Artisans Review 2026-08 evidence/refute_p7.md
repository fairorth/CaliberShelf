# Refute-check — P7 · VC Malte Dual Time Regulator ref 42005/000G-8900

**Agent:** refute-check (master-guides.md §3.5)
**Session date:** 2026-08-13 · FX per `fx.md` stamp 2026-08-13
**Subject:** white gold, silver dial · guide band **$14,000–17,000** · owner negotiating **~$12,000**

**Headline: the review's single most load-bearing row is false.** The Bonhams
"$6,000 sale" never happened — that lot did **not sell**, and the aggregator wrote
its *low estimate* into the *sold* column. Removing it collapses the claimed 4×
spread to **1.05× on a contemporaneous basis**. Separately I found a **verified
2024 white-gold realized sale the entire review missed**.

---

## Bonhams $6,000 — verified or not

### VERDICT: **DESTROYED. The lot did not sell. There is no $6,000 realized price.**

**What I verified from the Bonhams page itself** (fetched this session):

| Field | Value |
|---|---|
| Lot | **75Y**, Bonhams sale **28437** "Fine Watches" |
| Date / venue | **12 October 2023, New York — LIVE auction**, 113 lots |
| Title | "An 18K White Gold Automatic Dual Time Regulator Calendar Wristwatch" |
| Reference | **42005/000G** |
| Metal | **18k white gold** |
| Case | 39mm, polished round, case No.728924 |
| Movement | 31-jewel **Cal.1206** automatic, No.909211 |
| Year | c.2005 |
| Dial | Silvered, black Roman 5-minute markers, subdial at 12 (hours), 9 (24-hr dual time), 6 (date + seconds), **polished sword hands** |
| Accessories | Leather pouch and box, **undated** Certificate of Origin, instruction manual, service booklet |
| Estimate | **US$6,000 – US$8,000** |
| Condition report | **None on the page** |
| **Sold price** | **NONE SHOWN** |

Source: `https://www.bonhams.com/auction/28437/lot/75/vacheron-constantin-an-18k-white-gold-automatic-dual-time-regulator-calendar-wristwatch-malte-ref-42005000g-c2005/`

**Identity questions the brief asked — all resolved, and all in the row's favour:**

- Really ref 42005/000G in white gold? **Yes**, stated verbatim on the lot page.
- A different Malte (47400 non-regulator) or steel? **No.** The title, reference,
  18k white gold, cal. 1206, the three-subdial regulator layout and the 39mm case
  are all explicit. **Variant confusion is ruled out.**
- A weak US online-only sale? **No.** Bonhams 28437 is a **live New York sale**.
  The venue-weakness explanation is unavailable.

**So the identity was never the problem. The problem is that it didn't sell.**

### How I proved it did not sell — a controlled test inside the same sale

Bonhams uses two mutually exclusive display states on a closed lot page. I fetched
two control lots from **the same sale**:

| Lot | Page displays | Meaning |
|---|---|---|
| **Lot 5** (Breguet Marine) | "**Sold for US$7,680 inc. premium**" — and **no estimate** | SOLD |
| **Lot 3** (Vacheron & Constantin Les Historiques) | "**US$3,000 - US$5,000**" — and **no sold line** | UNSOLD |
| **Lot 75** (our watch) | "**US$6,000 - US$8,000**" — and **no sold line** | **UNSOLD** |

I re-fetched lot 75 with an explicit verbatim-only prompt: *"Is there ANY line
reading 'Sold for US$…' or 'inc. premium'?"* → **"No. The price area displays an
estimate range: 'US$6,000 - US$8,000'."**

The sale's results gallery confirms the same convention across lots 1–48 (sold lots
carry "Sold for US$X inc. premium"; lots 3, 9 and 10 show bare estimate ranges).

### The premium arithmetic independently refutes the row

The review's methodology decomposed the row as **$6,000 = 4,800 × 1.25**. That rate
is **wrong for this sale**, and the review contradicts itself — its own P7 note
states "Bonhams premium 28% to $50,000."

I established the actual rate **empirically** from three sold lots in sale 28437:

| Lot | Sold (inc. prem.) | ÷ implied hammer | Rate |
|---|---|---|---|
| 1 | $1,664 | 1,300 | **1.28** |
| 2 | $3,840 | 3,000 | **1.28** |
| 5 | $7,680 | 6,000 | **1.28** |

At 28%, a **$6,000 premium-inclusive** figure requires a hammer of **$4,687.50** —
**not a valid bid increment at any level** (Bonhams steps $200 then $500 in that
range). **No possible hammer produces $6,000 inclusive at this sale's rate.** The
"hammer ~$4,800" in the review is arithmetically impossible.

### What the aggregator actually did

I re-fetched the Collector Square row. It reports:

> **12/10/2023 | Bonhams #28437 | Lot 75 | White Gold | Est. USD *(not listed)* | Sold USD 6,000**

Its **estimate field is empty** and its **sold field is exactly $6,000** — which is
**precisely the low estimate** on the Bonhams page. Collector Square mis-mapped the
low estimate of an unsold lot into its "Sold:" column. CS labels the column only
"Sold:" with **no premium legend at all** (confirmed this session) — the review's
"premium-inclusive" tag was an inference, not a stated fact.

### What this does to the band

- **The $6,000 floor is deleted.** It must not appear in the corrected review at
  any confidence level. An unverifiable — here, *disproven* — figure cannot set a floor.
- **But it is not a free upgrade.** The lot becomes a **third failure to clear**,
  and a troubling one: Bonhams' published terms state the reserve will not exceed
  the low estimate, so on its face **nobody bid $6,000** for a white-gold 42005/000G
  with box and Certificate of Origin at a live New York sale.
- **Caveat I cannot close:** a **withdrawn** lot displays identically to a passed
  lot. I could not distinguish "passed" from "withdrawn". So the *depth* of the
  failure is unknown, and I decline to treat "no one bid $6,000" as established.

**Net: the row moves from "cheapest realized sale" to "no-sale of unknown depth."**

---

## Christie's results — verified or not

### VERDICT: **Both corroborated in detail and arithmetically coherent — but NOT verified from a house page. christies.com is hard-blocked.**

`www.christies.com` returned **"Claude Code is unable to fetch"** on two separate
paths (site search and a direct `/en/lot/` URL). Host-level block. I could not open
either lot. Fallback aggregators also failed: barnebys 404, lot-art returned only
its homepage, antiquorum.swiss 404, EveryWatch paywalled ("Only Collectors Beyond
This Point"), Phillips site search served an outage page.

What I *did* obtain is materially richer than the review had — a targeted
Collector Square re-fetch returned **lot numbers, full lot titles, estimates,
case sizes and sale cities** that were absent from the review:

**Row 1 — Christie's Genève, 6 Nov 2022, sale #21862, lot 2105**
- "AN 18K WHITE GOLD AUTOMATIC DUAL TIME WRISTWATCH WITH DATE, REGULATOR-STYLE
  DIAL, **GUARANTEE AND BOX**"
- 18k white gold · **38 mm** · circa 2000 · automatic
- Estimate **CHF 8,000–12,000** → **Sold CHF 13,860**

**Premium treatment: PREMIUM-INCLUSIVE, essentially certain.** CHF 13,860 is not a
valid bid increment; `11,000 × 1.26 = 13,860` **exactly**, matching Christie's
Geneva 26% band, and a **CHF 11,000 hammer sits inside the CHF 8,000–12,000
estimate**. Fully coherent. Note this example **had box and guarantee**.

**Row 2 — Christie's Geneva, 10 May 2021, sale #20024, lot 43**
- "AN 18K WHITE GOLD AUTOMATIC DUAL TIME WRISTWATCH WITH DATE AND REGULATOR-STYLE
  DIAL" — **no box or guarantee mentioned**
- 18k white gold · **38 mm** · circa 2000 · automatic
- Estimate **CHF 10,000–15,000** → **Sold CHF 12,500**

**Premium treatment: GENUINELY AMBIGUOUS — the review overstated its confidence.**
CHF 12,500 is *both* a valid hammer bid inside the estimate *and* equal to
`10,000 × 1.25`. Unlike row 1, the arithmetic does not discriminate. If it is
hammer, a buyer paid ~CHF 15,600 all-in (**$19,200** at today's FX); if inclusive,
CHF 12,500 all-in. **The review's flat "incl. premium (hammer 10,000)" is an
assumption, not a finding.**

**The one failure mode I could exclude.** Having caught CS filing a low estimate as
a sale, I checked whether these rows are the same artifact. **They are not:**
CHF 13,860 matches neither 8,000 nor 12,000; CHF 12,500 matches neither 10,000 nor
15,000. Both rows carry populated estimate *and* result fields. **The Bonhams
defect does not propagate to the Christie's rows.**

**Grade: [AGG-STRONG]** — sale number, lot number, full title, metal, size,
estimate and result all present and mutually consistent; house page unreachable.
Condition, service state and movement condition are **unknown for both** — CS
carries no condition text, and I could not reach the catalogues.

---

## The spread explained

**The 4× spread was largely manufactured by one bad row.** Do not average; here is
the mechanism, ranked.

### After correction, the verified white-gold realized record is:

| Date | Venue | Metal / example type | Realized (incl. prem.) | @ today's FX | @ contemporaneous FX |
|---|---|---|---|---|---|
| 2021-05-10 | Christie's Geneva #20024 L43 | WG, no box/papers cited | CHF 12,500 | $15,381 | ~$13,875 |
| 2022-11-06 | Christie's Geneva #21862 L2105 | WG, **box + guarantee** | CHF 13,860 (hammer 11,000) | $17,052 | ~$14,553 |
| **2024-09-27** | **Phillips HK Sessions Fall 2024 L8052** | **WG, NOS/unworn, FULL SET** | **HK$107,950 (hammer 85,000)** | **$13,756** | **~$13,861** |

- **Spread at today's FX: 1.24×.**
- **Spread at contemporaneous FX: 1.05×** — $13,861 / $13,875 / $14,553.

Three sales, three houses, three continents, across three years, landing within
**5% of each other**. That is not a chaotic market. That is a *very* well-behaved one.

### Ranked mechanism

1. **(e) A row was wrong — DOMINANT.** The Bonhams $6,000 is a no-sale's low
   estimate mis-filed as a realized price. It alone created the entire bottom half
   of the claimed spread. Delete it and the "4×" becomes 1.24×.
2. **FX convention — SECOND LARGEST, and it is an artifact of our own method.**
   Converting 2021–22 CHF at 2026 rates adds ~11% and turns a 1.05× spread into
   1.24×. See below.
3. **(c) Genuine market decline — real but modest.** −7.1% y/y and −11.5%/5yr
   (WatchCharts; Chrono24 independently prints −11.5%/5yr) against a VC index of
   +7.5%. This explains flat-to-soft *local-currency* prices 2021→2024, not a 4× range.
4. **(d) Metal/variant confusion — real, and correctly caught by the review.** The
   Phillips **HK$127,000 pink gold** row (150-piece boutique LE #10, full set +
   COSC) is not a WG comp. The review was right to fence it. Same for the eBay
   ref **42505**/000G-8900 diamond-set row and the Heritage 42005/2 yellow gold.
5. **(b) Venue/audience — near-zero, and the opposite sign to the review's guess.**
   The Phillips result came from an **online-only** sale and still cleared at
   $13,756. A live New York Bonhams sale failed. Venue prestige did not drive this.
6. **(a) Condition/service state — near-zero *among the verified rows*, and again
   the opposite sign.** The **new-old-stock, unworn, full-set** Phillips example is
   the **cheapest** of the three at today's FX. If condition drove the spread this
   would be inverted. **Condition matters enormously for pricing THIS example — but
   it did not cause the observed spread.**

**One-line mechanism: a data-quality failure in a single aggregator row, amplified
by an FX convention, masquerading as market chaos.**

### What did NOT change

The **sell-through picture stays poor**, and it is the strongest surviving bear
signal: **three consecutive failures to clear** — Bonhams NY 12 Oct 2023 (est.
$6,000–8,000), Sotheby's **L24070 lot 24**, 29 May 2024 (est. GBP 10,000–20,000 =
$13,504–27,008 today), Sotheby's **N11526 lot 619**, 11 Jun 2024 (same estimate).
Both Sotheby's rows are **[AGG]**, corroborated across two independent CS reads with
sale and lot numbers. I could not open Sotheby's (search URL: redirect loop;
guessed ecatalogue slug: 404), so I **could not confirm they are the same physical
watch offered twice** — different sale numbers and different lot numbers are
consistent with either reading.

Read together: **the watch clears reliably at ~$13,500–14,500 all-in and reliably
fails above that.** The Sotheby's estimates began at GBP 10,000 hammer (~$13,504
today, ~$16,900 all-in with premium) — *above* the observed clearing level. They
did not fail because demand is absent; they failed because they were **priced above
where this reference actually trades.**

---

## FX convention

**The question is nearly moot, and that is the most useful thing I can report.**

**The best comp is FX-immune.** The most recent, fully verified, on-spec white-gold
realized sale — Phillips, Sept 2024 — is denominated in **HKD, which is pegged to
the USD**. HK$107,950 is **$13,756** at the stamped rate and **~$13,861**
contemporaneous: a **0.8% difference**. The entire FX argument evaporates on the
row that matters most. **Anchor the band on the Phillips comp precisely because it
carries no FX opinion.**

**For the two CHF rows, the answer is: use today's rate per the stamped convention,
but treat those figures as the CEILING of the plausible range, not its centre.**
Reasoning:

*For today's rates:* the buyer spends 2026 dollars. `fx.md`'s convention — "what
that sum is worth in USD today" — is the right frame for a band spent against today.
Applying it consistently across the review also prevents cherry-picking.

*Against reading them as current value:* today's-FX **double-counts in the buyer's
disfavour**. It imports four years of *dollar weakness* and presents it as if the
watch had held value — while the same review's own trend data says the model fell
**−11.5% over five years**. You cannot simultaneously claim the CHF price is intact
and the market fell 11.5%. A CHF 12,500 result from 2021 tells you the watch was
worth **CHF 12,500 in 2021**; carrying that to 2026 requires an FX step *and* a
price-trend step, and the review took only the first.

**Rule for the corrected band:**
1. Anchor on the **HKD/USD-pegged Phillips 2024** comp — no FX opinion required.
2. Quote the CHF rows at today's rate ($15,381 / $17,052) **per the stamped
   convention**, but label them **"today's-FX, not trend-adjusted"** and treat them
   as an upper bound.
3. Also print the contemporaneous figures (~$13,875 / ~$14,553), because those are
   what reveal the true 1.05× consistency with Phillips. **The corrected review
   should show both — the agreement between them is the finding.**
4. **Do not** let $17,052 anchor the band top. It is one 2022 Swiss hammer wearing
   four years of dollar depreciation.

---

## Steelman: fair

**"$12,000 is a fair price."**

1. **It is below the entire ask distribution at two independent venues.**
   WatchCharts asks **$13,455–16,445**; not one is below $12,000. Chrono24's
   typical cluster is **$12,600–14,000**.
2. **Only one of nine Chrono24 asks undercuts it** — $11,723 **plus shipping**,
   which lands at or above $12,000 anyway. **$12,000 is effectively the floor of
   the global ask distribution.**
3. **Japan corroborates the floor independently.** Six of six priced JDM asks are
   **≥ ¥1,880,000**, and the cheapest (**$11,802**) is a **complete box-and-papers
   set** — before export, freight and US import duty. Landed, that is $12,500–13,500.
4. **It is a discount to the last verified realized sale.** Phillips Sept 2024:
   **$13,756 all-in**. Two years of −7% y/y takes an equivalent example to roughly
   **$11,900–12,800**. $12,000 sits inside that.
5. **On an auction-equivalent basis it is genuinely cheap.** $12,000 all-in from a
   private seller corresponds to roughly a **$9,400–9,600 hammer**. Every verified
   WG hammer is **above** it: CHF 10,000–12,500 and HK$85,000 (~$10,830).
6. **Supply is thin and geographically awkward.** Eight listings worldwide;
   **4 of 9 asks are Hong Kong** (duty, warranty and service friction for a US
   buyer). The one confirmed **US** ask is **$15,500**. The realistically
   accessible US supply is one or two watches.
7. **The Bonhams "$6,000 floor" that made $12,000 look reckless does not exist.**

## Steelman: overpay

**"$12,000 is a significant overpay."**

1. **Three consecutive failures to clear at auction in 13 months** (Bonhams NY
   Oct 2023, Sotheby's May 2024, Sotheby's Jun 2024). A watch with no demonstrated
   liquid floor is a bad thing to pay the top of the range for.
2. **The Bonhams failure is worse than it looks.** With box, Certificate of Origin,
   manual and service booklet, at a **live New York sale**, against an estimate
   whose **low was $6,000** — and Bonhams' terms cap the reserve at the low
   estimate. On its face **no one bid $6,000**. (Withdrawal is an unexcluded
   alternative — but it is not a *good* alternative either.)
3. **You are buying into a declining sub-market.** −7.1% y/y, **−11.5%/5yr while
   the VC index rose +7.5%** — 19 points of relative underperformance. Chrono24's
   model prints the same −11.5%/5yr independently.
4. **It is illiquid by the data provider's own admission.** WatchCharts:
   **"not enough sales data to compute days on market"**, **2 recorded sales in
   January 2026**, risk **69/100 "High Risk"**, "no longer in production."
5. **The one seller who tried to sell at retail failed five times.** The eBay
   seller `shu590218nona` relisted **one** watch May–Aug 2025 at
   $16,992 → $16,836 → $16,741 → $16,584 → $16,422 — a descending ask that never
   found a buyer and **never approached $12,000**. The ask curve has not found its floor.
6. **The best comp is the best possible example, and $12,000 is not far below it.**
   Phillips' $13,756 was **new-old-stock, unworn, caseback sticker intact, COSC
   certificate, full set with outer packaging** — the top 1% of surviving examples.
   A normal worn example is a materially different watch. Paying $12,000 for an
   ordinary one is paying **87% of NOS-full-set money**.
7. **Round-trip cost is brutal.** At $12,000 in, consigning to auction needs
   ~$9,400 hammer to gross even — and net of a 10–15% seller's commission the seller
   receives ~$8,000–8,500. **Realistic loss on exit: 30%+.**
8. **$12,000 is above the cheapest available ask** in a market where asks are
   ceilings and typically clear 8–15% below.

---

## Verdict, offer, walk-away

**My verdict: $12,000 is at the TOP of fair — not a bargain, and a modest overpay
unless this specific example is complete, unpolished and recently serviced.**

The review told the owner that $12,000 was *above* market and that the guide band
was unsupported. **The first half was wrong** — it rested on a phantom $6,000 sale.
**The second half was right, for better reasons than the review gave.**

**Corrected band: $11,000–14,000** (was $14,000–17,000).

- **Floor $11,000** — the cheapest global ask ($11,723 + shipping) and the cheapest
  JDM full set ($11,802 pre-freight) minus normal ask-to-clear compression.
- **Centre ~$12,500** — the Phillips Sept 2024 verified realized $13,756 for a
  NOS full set, discounted ~7%/yr for two years and again for ordinary condition.
- **Ceiling $14,000** — the highest contemporaneous all-in price this reference has
  *ever* verifiably achieved in white gold ($14,553, Christie's 2022, with box and
  guarantee). Reserve $13,500–14,000 for NOS/full-set/freshly-serviced examples only.
- The guide's **$14,000–17,000 top is unreachable**: nothing in white gold has
  cleared above ~$14.6k contemporaneous, ever, at any venue in this record.

| | Number | Rationale |
|---|---|---|
| **Opening offer** | **$10,500** | Below the ask floor; leaves room and is defensible from the auction-hammer equivalence |
| **Target settle** | **$11,200–11,500** | Good, complete, unpolished example with papers |
| **Pay up to** | **$12,000** | ONLY if: full set (box + Certificate of Origin), **documented service ≤3 years**, unpolished case, **US-domestic delivery, duty paid** |
| **WALK AWAY** | **$12,500** | Above this you exceed the trend-adjusted value of the best verified comp (a NOS full set) for a used watch, in a market falling ~7%/yr with no demonstrated auction floor |

**If the seller is in Hong Kong** (statistically likely — 4 of 9 asks), subtract
**$700–1,000** from every number above for duty and service/warranty friction, or
demand delivered-duty-paid pricing.

---

## What to demand on this example

Each failed item is a deduction, not a talking point. Suggested deductions are my
own judgement, calibrated to the verified comps.

| # | Demand | Why it matters here | If absent/failed |
|---|---|---|---|
| 1 | **Dated service invoice** from VC or a VC-qualified independent, ≤5 yrs | A 20-year-old automatic with no service history is a near-certain near-term bill. **Neither Christie's row carries any condition or service text**, and Bonhams published **no condition report at all** | **−$1,200–1,800** |
| 2 | **VC Certificate of Origin / warranty — is it DATED, and to whom?** | Both documented full sets carry **undated** certificates stamped by Hong Kong retailers (Bonhams: undated; Phillips: undated, stamped **Carlson Watch Co. Ltd HK**; the pink-gold LE: **Carda Watch Co. HK**). An undated certificate is the norm here, not a defect — but it is also **not proof of provenance**. Do not pay a "full set" premium for an undated card | **−$700–1,000** |
| 3 | **COSC certificate** | Cal. 1203 is COSC-certified and the Phillips full set included one. Its absence marks an incomplete set | **−$300** |
| 4 | **Movement photo showing caliber no., serial, and Poinçon de Genève** | **Sources disagree on the caliber for this exact reference — Bonhams recorded cal. 1206, Phillips recorded cal. 1203.** Resolve which this watch has and that the serial suits a c.2000–2005 case | Mismatch → **stop, investigate** |
| 5 | **Straight-on, diffuse-light dial photo** | The Phillips NOS example had aged to a **"warm cream hue" with "intense yellow patina" on the date ring**, and European Watch Co. lists **both** "silver dial" and "cream dial" 42005/000G-8900. The guide specifies **silver**. Even creaming is acceptable; **blotchy or refinished is not** | Refinished → **−$2,000+, prefer walk** |
| 6 | **Hands: polished, faceted SWORD hands** | Bonhams: "polished sword hands"; Phillips: "faceted sword hands". Both independent descriptions agree — this is a firm originality check | Wrong hands → **walk** |
| 7 | **Lug and chamfer macros — NOT a caliper reading** | **The "confirm 39mm" instruction is unreliable: the sources genuinely disagree** — Bonhams **39mm**, Phillips **38.5mm**, Christie's/Chrono24/JDM dealers **38mm**. A 0.5mm reading proves nothing. Judge polishing by **lug thickness, crispness of the Maltese-cross lug profile, and bezel/caseback chamfers** | Polished → **−$1,000–1,500** |
| 8 | **Which caseback?** | One Chrono24 ask at **$15,290** is the **"Officer case back"** variant and is priced apart. Establish which this is before comparing to any ask | Miscompared → repricing |
| 9 | **Signed 18k WG VC buckle/deployant** | Bonhams' lot specifies a "signed 18k white gold buckle"; replacement is costly | **−$800–1,500** |
| 10 | **Seller jurisdiction + delivered-duty-paid quote** | The one confirmed **US** ask is **$15,500** vs HK asks from **$12,586** — a **jurisdiction premium, not a condition premium**. Do not pay US-domestic money for a HK-sourced watch | **−$700–1,000** |

**Two things that would move the number UP:** a **dated** certificate naming an
original owner, and a **VC service within 3 years with the invoice**. Together they
justify going to $12,500 — but not beyond.

---

## New evidence found

### 1. A verified 2024 WHITE-GOLD realized sale the review entirely missed ★

**This is the most important new fact in the file.**

> **Phillips Watches Online Auction: The Hong Kong Sessions, Fall 2024** —
> concluded **27 September 2024**, **lot 8052**
> `https://www.phillips.com/detail/vacheron-constantin/197751`
>
> - **Ref. 42005/000G · 18K WHITE GOLD · 38.5 mm**
> - Automatic **cal. 1203**, 31 jewels, **COSC certified**, circa 2000s
> - Dial: Roman and Arabic numerals, **faceted sword hands**; aged to a "warm cream
>   hue" with "an intense yellow patina" on the date indicator ring
> - Condition: **new-old-stock, never worn, caseback sticker intact**
> - Accessories: **undated VC warranty stamped Carlson Watch Co. Ltd Hong Kong,
>   COSC certificate, instruction manual, product literature, setting pin,
>   additional crocodile strap, travel pouch, fitted presentation box and outer
>   packaging** — a genuinely complete set
> - Estimate **HK$60,000–120,000** ($7,700–15,400 as printed by Phillips)
> - **Realized HK$107,950, stated as INCLUDING buyer's premium**
>   (= hammer HK$85,000 × 1.27 exactly)
> - **= $13,756 at the stamped FX; ~$13,861 contemporaneous (HKD is USD-pegged)**
> - Note: charity consignment — "proceeds… given by the Consignor to various charities"

**Why it matters:** it is the **most recent verified white-gold realized price**,
it is **FX-immune**, and it **contradicts the review's central claim** that "the
only result comfortably inside the guide band is [the] PINK gold" LE. A white-gold
42005/000G cleared at $13,756 all-in in September 2024.

**Process finding worth escalating:** this lot was sitting in **`evidence_ebay.md`
line 222** ("27 Sep 2024 | Phillips Bacs & Russo HK | $13,854 | 42005/000G 38.5mm
18k white gold — the on-spec auction comp") and the auctions specialist never
cross-checked it. **Two agents held complementary halves of the decisive fact and
neither reconciled them.** The synthesis stage should cross-read venue files for
the load-bearing entries rather than trusting each venue's own P7 section.

### 2. Additional Collector Square rows the review did not surface

Twelve WG appearances exist, not the five the review listed. Price-gated (login)
white-gold rows: **Sotheby's #10388 lot 157 (24/06/2020)**, **Christie's #1891
lot 281 (17/10/2007)**, **Antiquorum #163 lot 98 (13/05/2007)**, **Antiquorum #221
lot 148 (03/10/2009)**, **Bonhams #17685 lot 818 (28/11/2009)**. Also a
**Christie's #19652 lot 78 (29/10/2020)** filed as **"Silver/Diamonds"** — a
distinct variant that must not be pooled. **49 auction rows total on the page.**

### 3. Sotheby's no-sales now carry sale and lot numbers

**L24070 lot 24** (29 May 2024) and **N11526 lot 619** (11 Jun 2024), both white
gold, both est. **GBP 10,000–20,000**, both **not sold**. The differing sale
prefixes (L = London, N = New York) with an identical GBP estimate is internally
odd and may indicate a CS currency-normalisation error.

### 4. Phillips sales checked and cleared

No further 42005 in **The Hong Kong Watch Auction: XVIII** (May 2024), **XXI**
(23 Nov 2025), or **The Hong Kong Sessions, Fall 2025** (17–24 Sep 2025). The
Sept-2024 lot 8052 appears to be the only recent Phillips white-gold example.

---

## What I could not verify

| Item | Status | What I tried |
|---|---|---|
| **Christie's 2021 & 2022 lot pages** | **UNVERIFIED at source** (AGG-STRONG on detail) | `www.christies.com` **hard-blocked** — "Claude Code is unable to fetch" on both `/en/search` and `/en/lot/`. Fallbacks: barnebys **404**, lot-art **homepage only**, antiquorum.swiss **404**, EveryWatch **paywalled**, Phillips search **outage page** |
| **Christie's 2021 CHF 12,500 — hammer or inclusive?** | **UNRESOLVED** | Arithmetic is genuinely ambiguous (valid bid *and* = 10,000 × 1.25). If hammer, the all-in is ~CHF 15,600 (**$19,200** today) — the review's confident "hammer 10,000" is unsupported |
| **Condition/service state of both Christie's lots** | **UNKNOWN** | No condition text on CS; catalogues unreachable |
| **Bonhams lot 75: passed vs. withdrawn** | **UNRESOLVED** | Both states render identically. Established only that **no sale price exists** |
| **Whether the two Sotheby's 2024 no-sales are one watch** | **UNRESOLVED** | sothebys.com search = **redirect loop (>10)**; guessed ecatalogue slug **404**. Different sale + lot numbers are consistent with either reading |
| **Iconeek 2025-10-16, $11,937** | **STILL UNVERIFIED — recommend dropping** | `iconeek.com` **HTTP 403**; the cited EveryWatch page returned the paywall interstitial **"Only Collectors Beyond This Point"**. **Two agents have now failed to open it.** It should not appear in the corrected review except as an explicitly-flagged unconfirmed note |
| **Rago/Wright 2024-05-08 lot 117, $10,080** | **UNVERIFIED** | Previously 403 on both hosts; metal given only as "gold", **not confirmed white**. Do not count |
| **Heritage Auctions HK 2026-06-15, $15,000** | **UNVERIFIED, and not a WG comp** | `ha.com` **HTTP 403**. Row is ref **42005/2 YELLOW gold** — wrong metal regardless |
| **r/WatchExchange and all reddit** | **HARD-BLOCKED — venue remains uncovered** | **`www.reddit.com` and `old.reddit.com` both return "Claude Code is unable to fetch" — a host-level block, not a rate limit.** I could not reach reddit by any path. **This is the second agent to fail. Treat r/WatchExchange as UNCOVERED, not as absent-of-sales** |
| **WatchCharts' 2 Jan-2026 sale prices** | **NOT EXPOSED** | Counts only; prices never rendered |
| **Chrono24 listing staleness** | **NOT OBTAINED** | No "listed since" data available |

**Budget note:** the session's **WebSearch quota (200/200) was exhausted** partway
through; all subsequent work was done with direct WebFetch. This limited my ability
to discover *unknown* venues (dealer sold-archives, forum sales, the VC collector
community) — I could only fetch URLs I could construct or infer. **Dealer
sold-archives and forum sales therefore remain an open coverage gap**, alongside reddit.

---

## Bottom line for the corrected review

1. **Delete the Bonhams $6,000 row.** It is disproven, not merely unverified.
   Re-file it as a no-sale of unknown depth.
2. **Add the Phillips 27 Sep 2024 white-gold result — HK$107,950 incl. premium
   ($13,756) — and make it the anchor.** It is the most recent, most completely
   documented, on-spec, FX-immune comp available.
3. **Drop the Iconeek $11,937** or flag it as twice-unverifiable.
4. **Downgrade the Christie's 2021 premium treatment to "ambiguous."**
5. **Retire the "4× spread" framing entirely.** The verified spread is **1.05×
   contemporaneous**. The market is consistent; our data was not.
6. **Band: $14,000–17,000 → $11,000–14,000.** The guide's floor was ~$1,000 too
   high and its ceiling ~$2,400 above anything ever achieved.
7. **The owner's ~$12,000 is fair-to-slightly-rich, not a discount.** Offer
   $10,500, settle $11,200–11,500, walk at $12,500.
