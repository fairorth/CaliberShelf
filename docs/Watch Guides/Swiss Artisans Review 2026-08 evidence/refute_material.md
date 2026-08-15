# Refute-Check — Material Non-P7 Findings

**Agent:** refute-check (adversarial second pass, §3.5 of `docs/master-guides.md`)
**Session:** 2026-08-13
**Posture:** skeptical. Every finding below was attacked, not corroborated. Default
verdict is NOT PROVEN. A band that moves on bad evidence is worse than a band left
alone with a stated caveat.

## Standing rules applied

1. **FX** — all conversions at the stamped 2026-08-13 rates in `fx.md`
   (GBP ×1.350418 · CHF ×1.230424 · EUR ×1.153365 · HKD ×0.127430 · JPY ×0.0062778).
   Several source files converted at older/rounder rates; where that changes a
   number materially I say so.
2. **No double-grossing** — Collector Square figures are premium-inclusive
   (verified arithmetically in `evidence_auctions.md` §1) and are never grossed up.
3. **Evidence grade** — WatchCharts, Chrono24 and eBay were ALL hard-blocked (403)
   this session, for the venue collectors and again for me. Their rows are
   search-snippet grade. Realized auction prices are the only high-grade evidence.
4. **New numbers** — every figure I introduce below comes from a page I fetched
   *this session*. Those are marked **[FETCHED 2026-08-13]**. Everything else is
   re-used from the venue files with its original grade preserved.
5. **Search budget exhausted.** The session's 200 WebSearch calls were spent before
   I started; I had WebFetch only, so I could not run discovery searches — only
   fetch URLs already named in the evidence files. Four load-bearing figures
   (WatchCharts $30,467 and $7,546; EveryWatch's Phillips and Sotheby's March-2026
   86122 results; the Watch Collecting Auctions $10,100) sit behind hosts that
   returned 403 or an empty shell to me as well. **Where I could not re-derive a
   figure, I say NOT PROVEN rather than inheriting it.**

---

## Finding 1 — P14 Ultra-Fine 1955 (33155/000R-9588): WatchCharts $30,467 vs a $10,100 sale

### Verdict: **PARTIALLY CONFIRMED** — the $30,467 is REFUTED as a market figure; the $10,100 is NOT PROVEN but directionally corroborated; the band's ceiling is genuinely too high.

### Attacking the $30,467

I tried to retrieve it directly. `watchcharts.com/watch/22949/…-33155-000r-9588`
returned **HTTP 403** to me exactly as it did to the WatchCharts collector
**[FETCHED 2026-08-13 — 403]**. So the figure has now failed to be rendered by two
independent agents. It exists only as a search-engine snippet.

Then I tested the four hypotheses the brief asked about:

- **Wrong metal (platinum 33155/000P-B169)?** *Rejected.* The captured URL slug is
  explicitly `historiques-ultra-fine-1955-**pink-gold**-33155-000r-9588`. Whatever
  the number is, the page it sits on is the right reference and metal.
- **Wrong model (a different Ultra-Fine, or a modern Historiques)?** *Rejected* for
  the same reason. The slug carries the full sub-reference.
- **Stale?** *Possible and unfalsifiable.* The WatchCharts collector explicitly
  flagged that **no date was exposed** — "the single gap I would most want closed
  before it moves a band." A private-sale average computed when the watch was near
  new (2010–2015, against a JP list of ¥2,688,000 and an MSRP of ¥3,542,000
  ≈ $16,875 / $22,236) would sit far above today's market.
- **Retail-anchor contamination or garbage model output?** *This is the strongest
  reading.* $30,467 sits almost exactly on the US **new/unworn dealer** shelf that
  the same collector recorded as out-of-venue spillover: Diamondized $25,760
  (discounted from a **$32,200 list**) and Luxury Time NYC **$31,455 unworn**.

**The decisive argument is internal, not external.** WatchCharts' own methodology
note — captured verbatim alongside the figure — says the price history is derived
from *sold listings*, estimates *private party value*, and that "asking prices from
dealers will often be **higher**." A private-party estimate therefore cannot exceed
the venue's own dealer ask distribution. But it does, by 2–3×:

| Channel | Observed range | Source grade |
|---|---|---|
| Chrono24 ref-page asks | **$10,577–16,087** (four discrete: 10,586 / 12,615 / 13,722 / 13,871) | snippet |
| HK dealer asks | $9,828–10,385 | snippet |
| JDM used (Chrono24-JP) | ¥1,728,744–2,361,212 = **$10,852–14,823** | snippet |
| JDM **new**, box + warranty (Jackroad) | ¥2,480,000 = **$15,569** | fetched by yahoojp collector |
| eBay US dealer shelf | $16,000–19,900 | snippet |
| WatchCharts "private party" | **$30,467** | snippet, undated |

**A private-party average that sits above a brand-new, boxed, warranted example
(¥2,480,000 = $15,569) by 96% is self-refuting.** You cannot pay twice new-old-stock
money in a private sale for a watch a Tokyo dealer will sell you unworn. The figure
is not evidence of anything and must not survive into the guide. **Kill it.**

### Attacking the $10,100

I could not verify it. `watchcollecting.com` returned **HTTP 403**
**[FETCHED 2026-08-13 — 403]**, and `everywatch.com/vacheron-constantin/historiques/86122`
(same aggregator family) served me only a navigation shell with no rows
**[FETCHED 2026-08-13]**. The figure is a single EveryWatch row seen once, in a
snippet, by one collector.

Three cautions I would attach to it even if real:
1. Watch Collecting Auctions is an **online consignment platform**, not a major
   house. Its result is not directly comparable to a Christie's hammer-plus-premium.
2. Condition and completeness are entirely unknown. On a 4.13mm ultra-thin whose
   dominant failure mode is a serviced-or-not cal 1003, that gap is large.
3. n = 1.

**But it does not stand alone.** Three independent floors converge on it: HK dealer
asks at $9,828–10,385, the Chrono24 ref-page floor at $10,577–10,586, and JDM used
starting at $10,852. Four venues agreeing on a ~$10,000 floor is a real floor even
if this specific transaction is unproven. **Verdict on the sale: NOT PROVEN as a
datum, but the price level it implies is well corroborated.**

### The fact-check note

The guide's date claim ("late 2000s") is wrong — launched **2010** for the 55th
anniversary of cal 1003. This is a **spec error, not a comp error**: every figure
above is at 33155/000R-9588, the correct reference for the 2010 watch. The comps
are for the right watch. Fix the date; it does not touch the band.

### Defended band

**$11,000–15,000** — global dealer channel (Chrono24 / HK / JDM), good used
condition, box and papers, service history unknown. Explicitly excludes the US
dealer shelf ($16,000–19,900) and the unworn/NOS tier ($15,600–19,900 asked).
State the floor: patient buyers transact near **$10,000–10,600**.

- Moves the ceiling down $3,000 (from $18,000). Well supported: $18,000 is above
  the entire Chrono24 ask range and above a brand-new JDM example.
- Moves the floor down $1,000. Weakly supported but consistent with four venues.

**Confidence: LOW** (n = 1 realized sale, itself unverified; everything else is
ask-grade from blocked venues).

---

## Finding 2 — P11 AMVOX2: is every comp mis-assigned?

### Verdict: **NOT PROVEN.** The fact-check's clean reference split does not survive contact with the sources. The comps cannot be cleanly reassigned because the market itself does not separate these references.

### Attacking the reference claim

The fact-check asserts: *192.T.25 = AMVOX2 **DBS** Transponder (cal 751E, 44mm);
AMVOX2 **Chronograph** = 192.T4.40 / Q192T440 (43.7mm, cal 751B).* I fetched its
own two cited authorities.

**Quill & Pad, "Complete Overview: Jaeger-LeCoultre AMVOX Line"** **[FETCHED 2026-08-13]**:

| Model | Caliber | Materials | Case | Editions |
|---|---|---|---|---|
| AMVOX2 **Chronograph** (2006) | **751B** | black steel/Ti · titanium · Ti/platinum | **44 × 14 mm** | **250 · 750 · 200** |
| AMVOX2 **DBS Transponder** (2008) | **751E** | titanium · pink gold | **44 × 14 mm** | **999** (Ti) · 300 (PG) |

Two things fall out immediately, and both damage the fact-check:

1. **Quill & Pad publishes no reference numbers at all.** The string "192.T.25" does
   not appear on the page. The fact-check's reference mapping therefore did *not*
   come from the authority it cites — it came from a watchuseek forum thread title
   and a PrestigeTime product page.
2. **Both AMVOX2s are 44 × 14 mm.** The fact-check's "the Chronograph is 43.7mm"
   is contradicted by its own source. **Case size cannot discriminate the two.**

**Sotheby's lot page for Q192.T.25** **[FETCHED 2026-08-13]**: "Limited Edition
Amvox2 Aston Martin **Reference Q192.T.25** … **44mm titanium** … **cal. 751E
automatic** … chronograph with date." So Sotheby's puts the DBS caliber on a lot it
titles a chronograph.

**Essential Watches, Q192.T.25** **[FETCHED 2026-08-13]**: page title reads "Amvox
II **Chrono** Aston Martin in Titanium … **Limited Edition of 750pcs**", while the
page's own model designation is "AMVOX2 **DBS Transponder**". Ask **$14,500**. One
dealer page carrying both identities at once.

**Collector Square's AMVOX auction index** **[FETCHED 2026-08-13]** — the source of
every P11 auction row — labels its 192.T.25 lots:

| Date | House | Ref as printed | Material | Description | Result |
|---|---|---|---|---|---|
| 2024-05-30 | Christie's #23091 | 192.T.25 | steel | "buttonless chronograph, AMVOX 2" | **NOT SOLD** (est. $6,000–12,000) |
| 2021-06-26 | Christie's #2062 | 192.T.25 | (mislabelled "silver") | "chronograph, steel, aston martin **limited edition of 750**" | **$7,500** |
| 2020-11-06 | Gros Delettrez #103408 | 192T25 | steel | "AMVOX II chronograph, circa 2008" | **€3,750** = **$4,325** |
| 2020-10-23 | Bonhams #26239 | 192.T.25 | **titanium** | "semi-skeletonized titanium chronograph with date" | **NOT SOLD** (est. €6,500–9,800) |
| 2017-12-12 | Christie's #15364 | 192.T.25 | titanium | AMVOX2 chronograph | price gated |
| 2016-11-27 · 2016-10-08 | Antiquorum #303 / #301 | 192.T.25 | titanium | "chronograph titanium limited series" | price gated |
| 2015-06-03 | Christie's #3429 | 192.T.25 | titanium | "**black PVD-coated titanium** limited edition chronograph" | price gated |

**The Christie's 2021 row is the killer.** It is ref 192.T.25 and it is explicitly a
**limited edition of 750** — which is Quill & Pad's edition size for the AMVOX2
**Chronograph** in titanium, not the DBS's 999. The 2015 PVD-coated titanium row
likewise maps to a Chronograph execution, not a DBS one. Meanwhile Sotheby's
catalogues a Q192T25 with cal **751E** and an edition of **999** — a DBS.

**Conclusion: 192.T.25 is used in the trade and in auction catalogues for BOTH the
AMVOX2 Chronograph and the AMVOX2 DBS Transponder.** The fact-check's mapping is one
plausible reading, not an established fact. **Every P11 comp is therefore
unassignable**, and re-pricing on the strength of the reassignment would be exactly
the plausible-but-wrong correction this pass exists to catch.

Two further points the brief's framing gets wrong:

- **"The watch the guide describes (the case-actuated Chronograph)" does not
  discriminate either.** The DBS *is* a case-actuated chronograph — it is the AMVOX2
  chronograph with a transponder added. The guide's mechanism description fits both
  watches. There is no "correct band for the watch the guide describes" separate
  from the family band.
- **A separate 192.T4.40 market cannot be established.** The only two figures at
  that reference are JDM asks: Time Tunnel ¥499,800 = **$3,138** (no box, no papers,
  "best price / duty-free") and a Chrono24-JP snippet at ¥980,660 = **$6,156**. Two
  ask rows, one of them a stripped example at a discount house, do not constitute a
  market. **Do not build a second band on them.**

### What the guide should actually do

The correction is **editorial, not numerical**: name both references, state that
192.T.25 appears against both executions, and give the buyer the one test that
*does* discriminate — **caseback edition number (750 = Chronograph titanium ·
999 = DBS titanium) and the presence of a transponder**. That is a real improvement
to buying data. Re-banding on the reference claim is not.

### Attacking the band (independently of the reference question)

This survives the reference muddle because it does not depend on it:

- Realized, family-wide: **$7,500** (2021) and **$4,325** (2020, at stamped FX).
- **Three no-sales**, including a **titanium** 192.T.25 failing at Bonhams on a
  €6,500–9,800 estimate and a Christie's failure as recent as **May 2024** whose
  estimate *floor* ($6,000) already sat below the guide band.
- Chrono24 ref-page asks: a hard floor at **$8,477 / $8,535** (two independent
  sellers within $58), top outlier $18,174.
- Wider ask cluster: $8,250 (Rostovsky) · $8,718 (Nautilus IT) · $8,995 (Bezel) ·
  $9,100 (C24) · $9,580 · $9,999 (eBay) · $10,400 (Essential) · $11,277 (C24 FR) ·
  $14,500 (Essential Watches, **[FETCHED 2026-08-13]**).

**The guide's $8,500–11,000 band begins exactly at the ask floor.** Asks are
ceilings. Two realized sales at $4,325 and $7,500 and a 2/5 auction sell-through
put the clearing price below the band's floor. This holds under either reference
assignment. **Band confirmed too high.**

### Testing the investment critic's proposed CUT

**NOT PROVEN.** The cut rests on three planks:
(a) *no realized sale reaches the band floor* — true, and it justifies a re-band;
(b) *2/5 auction sell-through* — true, and it justifies a liquidity warning;
(c) *"uninsurable repair path", "proprietary actuation parts risk"* — **this is
judgment, not evidence.** No row in any of the five evidence files establishes a
parts-availability failure, a refused JLC service, or a repair quote. It is asserted,
not shown.

A reband plus a mandatory "test the case-trigger at 12 and 6, and the 9 o'clock
locking lever, before paying" note achieves the same buyer protection without
deleting a documented and correctly-described watch on an unevidenced premise.
**Reband; do not cut.**

### Defended band

**$5,500–8,500** — dealer channel, titanium, case-actuator function **verified in
person**, condition good. State the auction reality: 2 of 5 recent lots failed to
sell, and the two that cleared did so at $4,325 and $7,500.

**Confidence: MED** (2 solds, both >12 months old, plus 3 no-sales and a dense,
tightly-clustered ask distribution across ~9 sellers).

---

## Finding 3 — P12 Chronomètre Royal 86122/000R-9362: do the two March-2026 sales exist?

### Verdict: **PARTIALLY CONFIRMED.** The category-error trap is real but was correctly avoided. The Sotheby's figure survives an independent arithmetic test. The Phillips figure remains unverified. The band is too high, but by less than the critic claims.

### Attacking the two figures

Neither was fetched from a rendered page by anyone. Both are **EveryWatch aggregator
rows**, seen once in a search snippet by the eBay collector, reported as
"Phillips Bacs & Russo 5–12 Mar 2026 **$16,238**" and "Sotheby's 5–12 Mar 2026
**$15,553**". I attempted independent retrieval and failed twice:
`everywatch.com/vacheron-constantin/historiques/86122` served a navigation shell with
zero rows **[FETCHED 2026-08-13]**, and `phillips.com/search` returned the house's
"we are currently working to bring our website back online" error page
**[FETCHED 2026-08-13]**.

**Test 1 — the category-error trap. PASSED.** The auction collector's warning is
correct and important: Collector Square's "Chronomètre Royal" pages are almost
entirely the **vintage** model (refs 508943, 340419, 351265, 9409, 214543, 381541,
356986, 364064), realizing USD 2,750 / GBP 3,750–4,375 / HKD 50,000–75,000. Pooling
those would be a serious category error. **But the two March-2026 rows did not come
from there.** They were read off a URL that is reference-scoped —
`everywatch.com/vacheron-constantin/historiques/**86122**` — under *Historiques*,
not under the vintage model. The trap was avoided by construction.

**Test 2 — arithmetic consistency against the one genuinely-fetched lot. PASSED,
and this is the strongest result in this section.** `evidence_auctions.md` records a
Sotheby's Fine Watches lot 8756, **2026-03-12**, ref **86122, 18k pink gold**, with
condition text "movement untested, may need a service at the buyer's expense",
Certificat de Qualification + manual + box, estimate **HK$50,000–100,000**, realized
price login-gated. If the claimed $15,553 is that lot:

- $15,553 ÷ 0.127430 (stamped HKD rate) = **HKD 122,050**.
- At Sotheby's HK premium (~26% top band): implied hammer = **HKD ~96,900**.
- That is a hammer just under the **HK$100,000 high estimate** — a completely
  ordinary outcome.

The figure decomposes cleanly into a plausible hammer against a *published* estimate
that the eBay collector never saw. Two collectors working from different venues
produced numbers that reconcile to within a few percent. **That is real
corroboration.** I am satisfied the $15,553 is the March-2026 Sotheby's pink-gold
86122 whose price was gated from the auction collector.

**Test 3 — the Phillips $16,238. NOT PROVEN.** No independent check exists. It sits
within 4.4% of the Sotheby's figure, which is mildly corroborating (two houses in the
same fortnight landing at the same level is what a real market looks like), and
mildly suspicious (adjacent aggregator rows sometimes duplicate). "Bacs & Russo"
is Phillips' watch department, so the attribution is at least internally coherent.
**Treat as one datum of unknown independence, not two.**

### The rest of the picture

| Row | Figure | Note |
|---|---|---|
| Chrono24, only cleanly-attributed ask | GBP 11,978 = **$16,175** | **"Watch only"** — no box, no papers, "good" condition |
| Chrono24 aggregate range | GBP 12,198–15,975 = **$16,472–21,572** | snippet-grade |
| I Play Watch HK (Apr 2026) | $14,778 | below both realized |
| Private seller C24 (Mar 2026) | $17,647 | |
| Chrono24 (Feb 2026) | $18,296 | |
| BIG MOON C24 (Apr 2026) | $21,223 | |
| Swiss Watch Expo, eBay | **$23,980** | **unsold Feb → Jul 2026**; appears twice as one relisted watch |
| WatchCharts | **"No price rating"** | WatchCharts has no market value for this reference at all |
| JDM | no rose-gold price | only the platinum/enamel 000P-9362 at ¥6,348,000, kept separate |

Note the shape: the one clean Chrono24 ask ($16,175) is a **watch-only** example and
already sits *above* both realized prices. A full-set example — the March Sotheby's
lot had box and Certificat de Qualification and still made ~$15,553 on an untested
movement — is worth more than a watch-only one.

### Where I disagree with the investment critic

The critic proposes **$15,000–18,000**. I think that under-reads the completeness and
condition dimension. The single verified transaction was a lot flagged
**"movement untested, may need a service at the buyer's expense"** — a cal 2460 SCC
service is real money — and it still cleared at ~$15,553. A sound, serviced, full-set
example is not a $15,000 watch. Equally, $23,980 demonstrably does not clear.

### Defended band

**$15,500–19,000** — dealer channel, rose gold 86122/000R-9362, box and papers,
movement running and recently serviced. State the auction floor: a service-due
example transacts at **~$15,500**, and the eBay shelf at $23,980 did not clear in
five months.

Note for the card (from `factcheck.md`, and it matters to comps): the 100-piece
**"red twelve" LE 86122/000R-9286** is a different watch and must not be pooled.

**Confidence: MED** — 2 realized within 12 months, but only one independently
corroborated and neither fetched from a rendered page. Re-run when EveryWatch or
Sotheby's results are reachable.

---

## Finding 4 — P4 VC "1972" / 37010: band error or reference error?

### Verdict: **CONFIRMED as a band error. The reference-error claim is REFUTED.** The guide's reference is right; its DATE is wrong; its band is 25–45% too high.

### Attacking the reference claim

The fact-check says: *"Every 37010 located this session is **white gold**"* and treats
the guide's "white or yellow gold" variant note as likely wrong. I fetched Collector
Square's 37010 reference page **[FETCHED 2026-08-13]**:

| Date | House | Metal | Dimensions | Result |
|---|---|---|---|---|
| 2021-09-02 | Sotheby's NY | **Yellow gold** | 37 × 27 mm | **$10,710** |
| 2020-10-07 | Bonhams HK | **Yellow gold** | 26 × 37 mm | €3,888 = **$4,484** |
| 2016-04-06 | Sotheby's HK | White gold | 26 × 36 mm | HKD 40,000 = **$5,097** |
| 2015-03-15 | Antiquorum GVA | White gold | — | CHF 8,125 = **$9,997** |
| 2011-12-16 | Christie's NY | **Pink gold** | 26 mm width | $5,250 |
| 2010-05-08 | Antiquorum GVA | **Pink gold** | 26 × 36 mm | CHF 5,000 = **$6,152** |
| 2009-11-14 | Antiquorum GVA | **Yellow gold** | 26 × 36 mm | CHF 5,400 = **$6,644** |
| 2009-05-10 | Antiquorum GVA | Yellow gold | 26 × 36 mm | **NOT SOLD** (est. €6,000–8,000) |
| 2004-12-01 | Antiquorum NY | White gold | 26 × 36.5 × 31 mm | $5,980 |
| 2004-09-22 | Antiquorum NY | White gold | 26 × 36 × 31 mm | $5,980 |

**Ref 37010 exists in yellow, white AND pink gold**, and the *single highest and most
recent* realized sale is a **yellow gold** one. The JDM file independently confirms
all three: 宝石広場 37010/**000G** (WG), GINZA RASIN 37010/**000J** (YG), BEST ISHIDA
37010/**000R**-8846 (RG). **The fact-check's "all white gold" finding is refuted, and
the guide's "white or yellow gold depending on specimen" note is correct.**

What *is* wrong on the card is the **date** — 37010 is the **1997 re-edition**
(cal 1055, examples dated c.1997–2002), not a 1970s watch — and the **missing size**.
Collector Square states the model as the asymmetric at **~26 × 36–37 mm**
**[FETCHED 2026-08-13]**, confirmed by seven of the ten lot descriptions above. That
is a genuinely small watch and the card does not say so.

**So: this is a spec error, not a reference error.** The guide points at the right
reference and the right metals. Fix the date, print the 26 × 36mm, and add the
"not to be confused with the 1970s original 35202 / 2091 at 21 × 46mm" line.

### Reconciling Chrono24 $16,433 against a $10,710 realized ceiling

The ask distribution is **bimodal**, and both modes are explicable:

- **Low mode — $7,099 · $9,990 (ref 37010, WG, MCMLXXII) · $10,745 + $115 shipping
  (ref 37010, box & papers)** and WatchCharts' one ask at **$8,999** (WG). This mode
  agrees with the realized record almost exactly. There is *real supply at the
  realized level*, which is the single most important fact here.
- **High mode — $14,500 · $14,700 · $15,569 · $16,433.** Two explanations, both
  documented: (a) the **$16,433** example carries an **Extract from the Archives** —
  a genuine provenance premium and the top of any ask distribution; (b) the
  **$15,569** listing is titled "Prestige de la France Asymmetric, 18K **yellow
  gold**" **with no reference stated** — and the fact-check establishes that the
  yellow-gold Prestige de la France pieces on the open market are the **1970s
  original at 46 × 21mm** (Bulang & Sons), a different, larger, rarer watch. The
  Chrono24 collector could not attach listing URLs to the $14,500 / $14,700 /
  $15,569 rows, so their reference attribution is unverified.

**The high mode is at least partly a different watch.** Pooling it produced the
guide's band. That is exactly the failure mode this review exists to catch.

JDM corroborates the low mode: ¥1,480,000 ×2 and ¥1,683,000 = **$9,291 / $9,291 /
$10,566**, plus a soft snippet at ¥1,748,000 = $10,974. **Two of the three priced
JDM pieces are explicitly 外装仕上げ — polished.** On a shaped asymmetric case,
polished is the value-destroying condition, so even those asks are for compromised
examples.

### Defended band

**$8,500–12,000** — dealer channel, ref 37010 (the 1997 re-edition, cal 1055,
~26 × 36mm), **sharp unpolished case**, original dial, box and papers, any of the
three golds. Add **+$2,000–3,500 for an Extract from the Archives** rather than
building it into the base band.

If the user actually wants **the 1970s original** (35202 / 2091, 21 × 46mm,
cal 1050/3), that is a different watch with a different band and **no evidence in
this review supports one** — the only 1970s-original datapoint anywhere in the files
is Phillips' ref **35703** at $63,500, a diamond-set, twin-movement, dual-time
"Prestige de France" that is not a comp for anything. That entry would need
re-research, not a re-band.

**Confidence: MED** — ten realized sales, but the most recent is 2021 and only two
are within any recent window; corroborated by current asks and JDM at the same level.

---

## Finding 5 — P3 Memovox E855: band too high, or auction channel unrepresentative?

### Verdict: **PARTIALLY CONFIRMED.** The channel-split steelman is sound and I accept it. But it does not rescue the band's TOP, which no venue supports.

### Steelmanning the channel argument (for)

The three Bonhams solds are **GBP 1,280 / 1,536 / 1,792** incl. premium = at stamped
FX **$1,729 / $2,074 / $2,420** (the auction file's $1,625–2,280 used a lower GBP
rate; the stamped rate raises them ~6%). Everything about these rows says trade lot:

- All three came out of **Bonhams London high-volume multi-lot watch sales**
  (#29151 May 2024, #29154 Nov 2024) — the channel where UK dealers *buy*.
- **Not one carries any condition text.** No service history, no bracelet, no
  originality statement, no box.
- One of the three (2024-11-13, GBP 1,792) is **14K gold & steel**, a different and
  less desirable configuration than the guide's steel target — so the steel-only
  sample is really **n = 2**.

Against that, the JDM asks are for a materially different object: 宝石広場 at
¥598,000 = **$3,754** and WatchTender 銀座 at ¥588,000 = **$3,691**, both explicitly
**オーバーホール済 / overhauled** and both on the **correct original Gay Frères
bracelet**, with box. A correct Gay Frères bracelet is itself a several-hundred-dollar
object and is the single hardest part of an E855 to find. **A service plus a correct
bracelet plus dealer margin is a coherent, arithmetically sufficient explanation for
a ~2× gap.** Both JDM listings are marked sold out, i.e. they cleared at or near ask.
I accept the channel argument.

### Attacking it (against)

Three things stop it from rescuing the band:

1. **The 2023 Sotheby's no-sale is not a trade-lot artefact.** An E855 steel failed
   at **Sotheby's** on an estimate of CHF 2,400–3,500 = **$2,953–4,306** at stamped
   FX. A Sotheby's specialist priced the watch *straddling the JDM serviced ask
   level* and it still found no buyer. That is a demand signal from a collector
   venue, not a trade venue.
2. **The 2019 Sotheby's lot was 18k yellow gold** — the more expensive metal — and
   was estimated at only CHF 3,000–5,000 = **$3,691–6,152**.
3. **No venue anywhere supports $5,500.** The complete steel-and-silver-dial ask
   record across every file: $3,240 (Chrono24 floor) · $3,519 · $3,543 · $3,691
   (JDM) · $3,754 (JDM) · $3,800 · $4,212 (the one attributed Chrono24 ask) ·
   $4,213 · $4,919 (Mi Time Milano) · one private DE at $1,754. **The highest steel
   ask found on the entire planet this session is $4,919.** The $6,418 row is
   yellow gold; the $14,398 top of the Chrono24 range is a Lapis Lazuli dial — a
   dial variant, explicitly not a comp.

A band whose ceiling sits **12% above the highest ask in the world** for the target
variant is not defensible under any channel argument. Asks are ceilings.

### Defended band

**$3,000–4,250** — **dealer channel**, steel, silver dial with applied markers,
**overhauled cal 825 bumper automatic on a correct original Gay Frères bracelet**.
The channel and condition assumption is load-bearing and must be printed on the card,
because the same watch in the auction channel is a different price:

> **Auction / as-is channel: $1,700–2,500.** Unserviced, bracelet-unknown examples
> trade at roughly half the dealer band. Budget $800–1,500 for a service and be
> prepared to hunt separately for the Gay Frères bracelet.

That two-line construction is more useful to a buyer than either single number, and
it is the honest reading of the evidence.

**Confidence: MED** — 3 realized solds but all ~20 months old, channel-mismatched to
the target variant, and with zero condition text; the dealer side is ask-only, though
from two independent specialists whose stock cleared.

---

## Finding 6 — P9 Toledo 47300 rose gold: is the pink-gold discount real?

### Verdict: **REFUTED.** The pink-gold "discount" is a two-lot, five-to-six-year-old artefact, and the *recent* realized record for the reference runs ABOVE the guide band, not below it. Do not cut this band.

### Attacking the discount

The claim rests on exactly two pink-gold solds and one no-sale, all 2018–2021:

| Date | House | Result | At stamped FX |
|---|---|---|---|
| 2021-11-27 | Christie's HK | HKD 75,000 incl. prem. | **$9,557** |
| 2020-06-24 | Sotheby's | USD 12,500 incl. prem. | $12,500 |
| 2018-04-17 | Sotheby's #l18053 | **NOT SOLD** | — |

Two problems:

1. **n = 2, and both are stale.** The most recent is nearly five years old. The
   Christie's HK lot in particular sits in the softest patch of the HK watch market
   in a decade.
2. **The comparison that generated the "discount" is n=1 vs n=1.** Christie's HK
   sold a *yellow* gold 47300 at HKD 106,250 (**$13,539**) in April 2021 and a
   *pink* gold one at HKD 75,000 (**$9,557**) that November. Same house, same
   market, seven months apart, 29% apart — but one lot each, with **no condition,
   dial or completeness text on either row**. The reference's own spread is
   demonstrably wide: a white-gold 47300/000G-9064 made **$22,500** at Christie's in
   2020 while a yellow-gold 47300/001J-9065 made CHF 13,750 (**$16,918**) the same
   month. **The within-metal variance swamps the claimed between-metal difference.**

### The fact that kills the finding

The evidence files contain a **recent** realized record for this reference that the
finding's framing ignores entirely — four results inside ~15 months, all above or at
the band:

| Date | Venue | Metal | Result |
|---|---|---|---|
| 2026-06 | Christie's US | 35.5mm yellow gold | **$15,240** |
| 2026-04 | Sotheby's HK | 34.5mm white gold | **$24,508** |
| 2025-12 | Sotheby's HK | 36mm yellow gold | **$23,550** |
| 2025-05-10 | Dr. Crott DE | (metal unstated) | **$14,063** |

(Christie's HK May 2026 at $45,389 is the **platinum** 47300/000P-9067 — excluded.)

**The 47300 has re-rated upward since 2021.** Every one of these clears the guide's
$13,500 floor and two of them clear its $16,500 ceiling by ~45%. Concluding "the band
is too high" from two 2020–21 pink-gold lots while four 2025–26 lots print $14,063–
24,508 is the exact error this pass exists to catch. **The direction of the finding
is backwards.**

### Why I am nonetheless not raising the band

The current asks are **geographically split**, precisely as they were on P14:

- Chrono24 / eBay US shelf: **$18,288 (WG) · $18,750 (RG, +$50 ship) · $19,000 (RG,
  eBay) · $19,296 · $23,808**.
- But the eBay collector documented the same dealer's identical stock **$1,100
  cheaper on Chrono24** (BlackTag), HK dealers (I Play Watch) asking **$11,270–
  11,997** for white gold, and — decisively — **TIME GRACE GINZA asking ¥2,198,000
  = $13,799 for a full-set 47300/000R-9219**, box + manual + warranty card, rank
  Used-A. That is a **rose-gold full set asked BELOW the guide's ceiling.**

So the US shelf says raise; the JDM and HK shelves say hold. With no rose-gold
realized sale newer than 2021, I will not move a band on a geography artefact.

### Defended band

**HOLD $13,500–16,500** — dealer channel, rose gold 47300/000R-9219, box and papers,
good condition. Add two mandatory caveats to the card:

> Rose-gold-specific evidence is **five to six years old** (two solds, one no-sale,
> 2018–2021). The reference at large has re-rated upward: four realized sales
> 2025–26 ran **$14,063–24,508** in yellow and white gold. US dealer asks all sit
> **$18,000+**, but a full-set rose gold was asked at **$13,799 in Ginza** — buy on
> geography and completeness, not on the metal discount.

**Confidence: MED** — 4 realized inside ~15 months, but none in the target metal;
rose-gold-specific n = 2 and stale.

---

## Finding 7a — P17 Geophysic True Second: is the band too low?

### Verdict: **REFUTED.** The "asks below a sold price" paradox dissolves completely once channel and geography are separated. The band is one of the best-calibrated in the guide. Do not raise it.

### Resolving the paradox

The apparent contradiction is between three WatchCharts figures (**$7,546** sold
Jun 2026 · **$7,847** private average · **$8,740** dealer average) and a Chrono24 ask
range of **$5,736–7,234**. Asks below solds is indeed backwards — but only if the two
sets measure the same market. They do not.

**Sort every figure in the review by channel and geography and the contradiction
disappears:**

| Tier | Figures | Reading |
|---|---|---|
| **JDM new-old-stock** | ¥738,000 = **$4,633** (宝石広場, NEW, box+papers) · ¥838,000 = **$5,261** (ジャックロード, NEW, on the **steel bracelet**) | A brand-new, boxed, warranted example is available at **$4,633–5,261** |
| **HK / global dealer** | $5,866 · $6,154 · $6,158 · $6,167 · $6,304 (five HK dealers) · $6,499 (US) · $6,500 (Bezel) · $6,669 (TW) | The global clearing shelf: **$5,866–6,669** |
| **Chrono24 model page** | $5,736–7,234 | Consistent with the above |
| **US dealer / eBay** | $7,985 (Bezel) · $7,985 (Element iN Time NYC) · **$8,950** (European Watch Co., the only ref-confirmed eBay row) · $10,404 (AU outlier) | The US retail shelf: **$7,985–8,950** |
| **WatchCharts** | sold $7,546 · private avg $7,847 · **dealer avg $8,740** | **Matches the US shelf almost exactly** |

**WatchCharts' $8,740 "dealer average" and the eBay $8,950 US ask are the same
number.** WatchCharts is a US-centric platform measuring the US channel; its $7,546
sale was "through **Vintage Watch Agency**" — a single dealer transaction, n = 1, no
condition exposed, premium treatment unstated. There is no paradox: a US buyer pays
$6,500–8,950; a patient global buyer pays $5,866–6,669; a JDM buyer gets a **brand
new one** for $4,633–5,261.

**The decisive test:** a used private-party average of $7,847 is impossible when
unworn, boxed, warranted examples are asked at $4,633–5,261 in Tokyo and dealer stock
is $5,866 in Hong Kong. The WatchCharts figures are a US-channel measurement being
mistaken for a market level. The eBay collector reached the identical conclusion
independently and phrased it well: *"P17 is the clearest demonstration in this review
that eBay is a high-ask venue… Do not raise the band on the eBay number."*

### Defended band

**HOLD $5,500–7,000** — global dealer channel (Chrono24 / HK / JDM), steel with
silver dial, good condition with box and papers. Add one line:

> US dealers ask **$8,000–8,950** for the same reference, and a June 2026 US platform
> sale printed **$7,546**. That is a geography premium, not a market level — brand-new
> JDM stock is asked at **$4,633–5,261**. Buy globally, or expect to pay ~35% more.

**Confidence: MED** — one dated sold (unverifiable; WatchCharts 403'd me as well
**[FETCHED 2026-08-13 — 403]**), no auction record at all, but eleven-plus
on-reference asks across four geographies forming a dense, coherent distribution.

---

## Finding 7b — P5 Mercator 43050 yellow gold: right, too low, or illiquid?

### Verdict: **PARTIALLY CONFIRMED — the band is too LOW at the ceiling, AND the asset is genuinely illiquid.** Both are true; the card must say both.

### The band is too low

The auction collector read the guide's $35,000–45,000 as "supported by exactly one
recent realized sale" (Christie's CHF 44,100). That under-counts, because the FX
convention and the eBay collector's non-venue block both push upward:

- **Christie's 2024-05-13, ref 43050/000J YG: CHF 44,100 incl. premium** = **$54,262
  at the stamped 2026-08-13 rate** (`fx.md` states this explicitly). Contemporaneous
  ≈ $50,000. **Even the contemporaneous figure is $5,000 above the band ceiling.**
- The eBay collector recorded a **dense recent YG cluster, Nov 2024 – Jul 2026**:
  Hairspring Jul 2025 **$40,000** · Delray **$41,999** · Grey and Patina May 2026
  **$41,000** · Grailzee Mar 2026 **$42,500** · Allu Jul 2025 **$44,879** ·
  Sotheby's Dec 2025 (000J-17) **$48,260** · Christie's Nov 2025 **$70,881** ·
  Phillips Nov 2025 (000J-9038) **$81,560**. Even discarding the top two as
  special-dial or exceptional examples, the **centre of the recent YG distribution is
  $41,000–48,000**, not $40,000.
- **Asks confirm the floor is wrong, not just the ceiling:** the cheapest plain-YG
  ask found anywhere on Chrono24 is **GBP 35,134 = $47,450** at stamped FX (private
  seller, UK, "good"), with the full-set example at **$73,998**. eBay: $49,349 and
  $74,950. **JDM specialists: ¥6,283,600 = $39,447** (box + 1996 warranty) and
  **¥7,898,000 = $49,582** (factory-refinished, repair docs).

There is essentially nothing to buy at $35,000. The guide band describes the bottom
quartile of observed activity.

### And it is illiquid

This is not a contradiction — it is the defining feature of the watch:

- **Six no-sales in 2023–24**: four yellow-gold 43050s failed (Sotheby's ×2,
  Christie's ×1, Sotheby's HK ×1), plus **two platinum examples failing in a single
  Sotheby's sale**.
- The Sotheby's failure came **two weeks after** the Christie's CHF 44,100 success.
  The same watch, the same month, cleared at $54k in one room and found no bid in
  another.
- **The JDM dealer buyback quote is ¥2,550,000 = $16,008** against a ~$45,000 retail.
  A **~2.8× wholesale-to-retail spread** is the true illiquidity measure, and it is
  the single most useful number on this entry for a buyer.
- Only **638 pieces** were made across 1994–2004 — thin float in both directions.

### Variant discipline (mandatory, per the brief and `factcheck.md`)

The band below is **yellow gold, Europe/Africa/Asia map only.** Keep separate:
platinum (Americas map; $35,674–152,400 observed, C24 asks $62,085 and $163,805),
the **champlevé** enamel regional dials (Taiwan enamel asked at $100,000 — and note
the guide's brief says "cloisonné", which is the wrong technique), the yellow-gold
**Americas** dial (43050/000J-17 — a real and different configuration), and the 1994
launch series **ref 11992** (50 pieces). Specify the map, not just the metal.

### Defended band

**$40,000–52,000** — yellow gold, Europe/Africa/Asia map, cal 1120/2, good condition,
box and papers, dealer or auction channel (they converge here). With a mandatory
liquidity warning:

> Six no-sales across 2023–24 including four yellow-gold examples. A dealer will
> quote you roughly **$16,000** to buy it back against a ~$45,000 purchase. This is
> a keep-forever object, not a position you can exit.

**Confidence: MED** — ≥5 realized figures inside 12 months, which would ordinarily be
HIGH, but they are EveryWatch aggregator rows recorded in another collector's
non-venue block, the auction/dealer split within them is unresolved, and the venue is
403'd. Upgrade to HIGH if the EveryWatch rows can be rendered.

---

## Summary table

| # | Finding | Verdict | Defended band | Channel / condition assumption | Confidence |
|---|---|---|---|---|---|
| 1 | **P14** Ultra-Fine 1955 33155/000R-9588 | **PARTIALLY CONFIRMED** — $30,467 **refuted** (self-contradicting vs WatchCharts' own methodology; sits 96% above a brand-new JDM example); $10,100 **not proven** but the ~$10k floor is corroborated by 4 venues | **$11,000–15,000** | Global dealer channel (C24/HK/JDM), good used, box+papers; excludes US shelf $16–19.9k. Floor: patient buyers transact ~$10,000–10,600 | **LOW** |
| 2 | **P11** AMVOX2 192.T.25 | **NOT PROVEN** on reassignment — 192.T.25 is used for **both** Chronograph and DBS across Christie's, Sotheby's and dealers; Quill & Pad (the fact-check's own source) publishes **no** reference numbers and gives **both** as 44×14mm. Band **confirmed too high** independently. Proposed **CUT: NOT PROVEN** (rests on unevidenced parts-risk judgment) | **$5,500–8,500** | Dealer channel, titanium, **case-actuator tested in person**, good condition. Confirm caseback edition: **750 = Chronograph**, **999 = DBS** | **MED** |
| 3 | **P12** Chronomètre Royal 86122/000R-9362 | **PARTIALLY CONFIRMED** — vintage-pooling trap correctly avoided (rows are ref-scoped); Sotheby's **$15,553** survives an independent arithmetic test against its own HK$50,000–100,000 estimate (implied hammer ~HK$96,900); Phillips **$16,238** unverified | **$15,500–19,000** | Dealer channel, rose gold, box + Certificat de Qualification, **movement running/serviced**. Service-due examples transact ~$15,500; $23,980 did not clear in 5 months | **MED** |
| 4 | **P4** VC "1972" / 37010 | **CONFIRMED as a band error; reference-error claim REFUTED** — Collector Square shows 37010 in **yellow, white and pink** gold at ~26×36mm; guide's metals are right, its **date** is wrong (1997 re-edition, cal 1055). High asks are partly the **1970s original** (46×21mm), a different watch | **$8,500–12,000** | Dealer channel, ref 37010, **sharp unpolished** case (JDM supply is explicitly polished), original dial, box+papers. **+$2,000–3,500** for an Extract from the Archives | **MED** |
| 5 | **P3** Memovox E855 | **PARTIALLY CONFIRMED** — channel steelman **accepted** (Bonhams rows are trade lots, no condition text, one is gold/steel so steel n=2); but a 2023 **Sotheby's** no-sale on a $2,953–4,306 estimate is a collector-venue signal, and **no steel ask anywhere exceeds $4,919** | **$3,000–4,250** | **Dealer channel**, steel/silver applied markers, **overhauled cal 825 on a correct Gay Frères bracelet**. Print the split: **auction/as-is channel $1,700–2,500** + $800–1,500 service | **MED** |
| 6 | **P9** Toledo 47300 rose gold | **REFUTED** — discount rests on n=2 solds from 2020–21 vs n=1 yellow-gold comparator; meanwhile **four 2025–26 realized sales ran $14,063–24,508** (band re-rated *up*). Asks are geography-split: US $18–19k vs a **Ginza full-set RG at $13,799** | **HOLD $13,500–16,500** | Dealer channel, 47300/000R-9219, box+papers, good condition. Caveat that RG evidence is 5–6 yrs stale and buy on geography/completeness, not metal | **MED** |
| 7a | **P17** Geophysic Q8018420 | **REFUTED** — no paradox once channels separate. WatchCharts' $7,546/$7,847/**$8,740** track the **US** shelf ($7,985–8,950); the global shelf is $5,866–6,669 and **brand-new JDM stock is $4,633–5,261**. A $7,847 used private average is impossible against new-at-$4,633 | **HOLD $5,500–7,000** | Global dealer channel, steel/silver, box+papers. Note US asks run $8,000–8,950 — geography premium, not market level | **MED** |
| 7b | **P5** Mercator 43050 YG | **PARTIALLY CONFIRMED — band too LOW, and the asset is illiquid.** Both true. Christie's CHF 44,100 = **$54,262** at stamped FX; recent YG cluster centres **$41,000–48,260**; cheapest plain-YG ask on earth is **$47,450** | **$40,000–52,000** | **Yellow gold, Europe/Africa/Asia map only** (Pt / Americas / champlevé enamel / ref 11992 priced separately), good condition, box+papers. **Mandatory:** 6 no-sales 2023–24; dealer buyback **$16,008** vs ~$45,000 retail = ~2.8× spread | **MED** |

### Bands that MOVE on this pass (4)

- **P14** $12,000–18,000 → **$11,000–15,000** (ceiling cut is well supported; floor cut is weak — LOW confidence overall)
- **P11** $8,500–11,000 → **$5,500–8,500** (survives the reference muddle)
- **P4** $12,500–15,500 → **$8,500–12,000**
- **P5** $35,000–45,000 → **$40,000–52,000** (the only upward move)

### Bands that HOLD (2)

- **P9** $13,500–16,500 — finding reversed, band held with a staleness caveat
- **P17** $5,500–7,000 — finding reversed, band held with a geography caveat

### Band that moves LESS than proposed (1)

- **P12** — critic proposed $15,000–18,000; I defend **$15,500–19,000**, because the
  one verified transaction was explicitly a **service-due, untested-movement** lot
  and a sound full set is worth more than that.

### Corrections that are EDITORIAL, not numerical (2)

- **P11** — do not re-price on the reference claim. Name both references, state the
  ambiguity, and give the buyer the caseback edition-size test (750 vs 999) and the
  transponder check.
- **P4** — the guide's reference and metals are correct; fix the **date** (1997
  re-edition, not 1970s), print **~26 × 36mm**, and add the "not to be confused with
  the 1970s original 35202 / 2091 at 21 × 46mm" line.

### What I could not close, and what would close it

1. **P14's $30,467 and P17's $7,546** — WatchCharts 403'd me exactly as it did the
   venue collector. Neither has ever been seen on a rendered page. My verdicts rest
   on internal-consistency arguments, which I believe are sufficient to reject the
   first and contextualise the second, but a rendered page would settle both.
2. **P12's Phillips $16,238** — EveryWatch served me a navigation shell and
   phillips.com was returning its own outage page. The Sotheby's twin is
   corroborated arithmetically; the Phillips figure is not.
3. **P14's $10,100** — watchcollecting.com returned 403. The price *level* is
   corroborated by four venues; the transaction is not.
4. **P5's recent YG cluster** — eight figures that would lift this entry to HIGH
   confidence sit in another collector's non-venue block with the auction/dealer
   split unresolved. Rendering the EveryWatch Mercator page would upgrade the
   confidence tier without changing the band.
5. **r/WatchExchange remains entirely uncovered** (reddit blocked to the fetch layer,
   five site-restricted searches returned nothing). Private-sale evidence for P4, P11
   and P14 in particular is likely to exist there. **Absence of rows is a tooling
   failure, not evidence of a thin private market** — this must not be read as
   confirming any band.

---

*Sources fetched this session (2026-08-13):*
[Collector Square — JLC AMVOX auction index](https://www.collectorsquare.com/en/watches/jaeger-lecoultre/amvox/lpi) ·
[Collector Square — VC 1972 Petit Modèle ref 37010](https://www.collectorsquare.com/en/watches/vacheron-constantin/1972-petit-modele/ref-vacheron-constantin-37010/lpi) ·
[Quill & Pad — Complete Overview: JLC AMVOX Line](https://quillandpad.com/2017/01/13/complete-overview-jaeger-lecoultre-amvox-line/) ·
[Sotheby's — Limited Edition AMVOX2 Aston Martin ref Q192.T.25](https://www.sothebys.com/en/buy/_limited-edition-amvox2-aston-martin-reference-q192t25-a-titanium-automatic-chronograph-wristwatch-circa-2010-0978) ·
[Essential Watches — JLC Q192.T.25](https://www.essential-watches.com/watch/Jaeger-LeCoultre-Q192T25-Amvox-II-Chrono-Aston-Martin-in-Titanium-On-Black-Leather-Strap-with-Black-Dial-Limited-Edition-of-750pcs/56071)

*Blocked this session (recorded as failures, not as absence of evidence):*
watchcharts.com (403 ×2) · chrono24.com (403) · watchcollecting.com (403) ·
everywatch.com (empty shell) · phillips.com search (site outage page)
