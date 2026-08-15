# Evidence — Yahoo Japan closed auctions + Japanese domestic dealers (JDM)

Collector: Yahoo Japan / JDM venue specialist
Collected: 2026-08-13 (all figures fetched or seen in search snippets THIS session)
Currency: **JPY as listed. No USD conversion applied by this collector.** Where a
page itself printed a USD figure, that is noted as "page's own conversion".

## Method / venue notes (read before using these rows)

- **Yahoo! Auctions closed listings** were reached via
  `auctions.yahoo.co.jp/closedsearch/closedsearch/<query>/0/`. These pages render a
  rolling **180-day** window with a summary (min / avg / max / count) plus per-lot
  hammer prices. Hammer prices are **final winning bid, no buyer's premium**
  (Yahoo charges the seller, not the buyer); shipping is separate and not included.
- **DATE CAVEAT (important):** the closedsearch pages returned through the fetch
  layer are evidently served from differently-aged crawls — the "E855" page showed
  explicit 2025 dates, the "フューチャーマチック" page showed 2024 dates, and the
  Memovox page showed bare `M/D` with no year. Dates below are **transcribed as
  shown on the page**. Treat any bare `M/D` as "within the 180 days preceding that
  page's crawl", not necessarily 2026. Flagged per row.
- **aucfree.com** returned zero rows for every query tried (`/search?q=…` and
  `/search?o=t&q=…`) — the archive appears empty or gated to this fetcher.
  **aucview.aucfan.com returned HTTP 429.** Neither aggregator produced usable data.
- **JDM dealers** (宝石広場 Houseki Hiroba, ジャックロード Jackroad, GINZA RASIN,
  BEST ISHIDA, TIME GRACE, watchnian, kingsroad/Zetton, premiervalue, WatchTender,
  watch-colle, Takayama pawn, renzu, 江口時計店) are tagged **ASK**. Most JDM dealer
  pages show `在庫切れ / SOLD OUT` while retaining the last asking price — that is
  still an **ASK**, not a sold price, and is tagged `ASK (sold out — last ask)`.
  Several sold-out pages zero the price field entirely (`¥0`); those are recorded
  as "price withheld".
- **買取 (kaitori / buyback) quotes** are dealer trade-in offers — a hard floor, not
  a transaction. Tagged `BUYBACK` and kept separate from ASK/SOLD.
- Condition vocabulary as it appears: `ジャンク` junk/non-running · `研磨` polished ·
  `オーバーホール済` overhauled/serviced · `リダン` redial · `現状品` as-is ·
  `外装仕上げ` exterior refinishing (i.e. **polished**) · `訳アリ` fault noted.

---

## P1 — VC Vintage Triple Calendar ref 4240/4241 (1940s, cal V485)

**NO DATA FOUND** for ref 4240 / 4241 at this venue.

Searched (JP + EN): `ヴァシュロンコンスタンタン ref 4240 トリプルカレンダー 1940年代`,
`ヴァシュロンコンスタンタン ヴィンテージ トリプルカレンダー ムーンフェイズ 1940年代 イエローゴールド`,
Yahoo closedsearch `ヴァシュロン アンティーク 腕時計` and `ヴァシュロンコンスタンタン 腕時計`.
Zero triple-calendar, zero moonphase, zero 4240/4241 in any closed lot or dealer page.

Context rows only — **these are NOT comps for a V485 triple calendar**, they are the
ambient level for plain vintage gold VC on Yahoo, recorded so the gap is quantified:

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| 6/29 (bare M/D) | SOLD | ¥910,000 | JPY | "Gold solid 57.8g" — max VC lot in the 180-day window; no complication stated | https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%B4%E3%82%A1%E3%82%B7%E3%83%A5%E3%83%AD%E3%83%B3%E3%82%B3%E3%83%B3%E3%82%B9%E3%82%BF%E3%83%B3%E3%82%BF%E3%83%B3%20%E8%85%95%E6%99%82%E8%A8%88/0/ |
| 7/4 (bare M/D) | SOLD | ¥701,000 | JPY | 18K gold solid, ref 43038 | same |
| 7/15 (bare M/D) | SOLD | ¥687,500 | JPY | K18 case, automatic | same |
| 6/14 (bare M/D) | SOLD | ¥509,850 | JPY | **ジャンク / junk** — K18 Geneve hand-wind, non-running | same |
| 5/22 (bare M/D) | SOLD | ¥503,000 | JPY | 18K gold solid vintage | same |
| 5/27 (bare M/D) | SOLD | ¥398,000 | JPY | 18K, 21.6g, hand-wind, "ref 1003" (movement cal, not a model ref) | same |
| 2025-02-25 | SOLD | ¥17,500 | JPY | Lone hit on `ヴァシュロン アンティーク 腕時計`; title mixes wristwatch/pocket/desk clock — **almost certainly not genuine**; recorded only to show the query returned nothing usable | https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%B4%E3%82%A1%E3%82%B7%E3%83%A5%E3%83%AD%E3%83%B3%20%E3%82%A2%E3%83%B3%E3%83%86%E3%82%A3%E3%83%BC%E3%82%AF%20%E8%85%95%E6%99%82%E8%A8%88/0/ |

Window summary for `ヴァシュロンコンスタンタン 腕時計`: **89 lots, min ¥1, avg ¥143,152,
max ¥910,000** — i.e. the JDM auction channel for VC is dominated by straps, boxes,
buckles, movements and parts. There is no vintage VC complication supply here.

---

## P2 — JLC Futurematic E501 (1951–56, cal 497)

No lot or dealer page in this session was labelled **E501**. Everything below is
"Futurematic" generic or an explicitly different case metal. Recorded as such.

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| 2024-03-02 (page-stated year) | SOLD | ¥204,000 | JPY | "ビンテージ 名作 … Futurematic ゴールド ブラックミラーダイヤル綺麗 自動巻" — **gold, black mirror dial**; not steel/silver, ref not stated | https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%AB%E3%82%AF%E3%83%AB%E3%83%88%20%E3%83%95%E3%83%A5%E3%83%BC%E3%83%81%E3%83%A3%E3%83%BC%E3%83%9E%E3%83%81%E3%83%83%E3%82%AF/0/ |
| 2024-05-20 (page-stated) | SOLD | ¥180,000 | JPY | "JAEGER-LECOULTRE … ゴールド AT メンズ フューチャーマチック ヴィンテージ **現状品**" — gold, sold **as-is / untested** | same |
| 2024-05-10 (page-stated) | SOLD | ¥158,000 | JPY | "ヴィンテージ ルクルト フューチャーマチック ハーフローター" + wine-red croc strap; metal not stated, ref not stated | same |
| 2024-05-29 (page-stated) | SOLD | ¥10,000 | JPY | **Parts lot** — "中古純正文字盤" = used original dial only, no watch | same |
| — (180-day window summary, same page) | SOLD (agg) | min ¥10,000 · avg ¥138,000 · max ¥204,000 · n=4 | JPY | Aggregate as printed on the closedsearch page | same |
| — (search-snippet aggregate, different crawl) | SOLD (agg) | min ¥12,800 · avg ¥54,615 · max ¥137,606 | JPY | Second, **lower** aggregate for the same query seen in a search snippet this session — the two windows disagree; both recorded rather than picking one | (snippet over the same closedsearch URL, surfaced via search) |
| listing live at fetch | ASK (out of stock) | ¥398,000 | JPY | 宝石広場: Futurematic, **yellow gold**, silver/champagne dial, 33.5mm, 1950s. Ref not stated on page; gold case means this is **not** the steel E501 | https://housekihiroba.jp/shop/g/g602684001/ |

**Assessment:** the JDM auction channel does have Futurematic supply, but it is
**gold-cased and mostly as-is**, hammering ¥158,000–204,000. Steel E501 with a
working back-set: **not observed at this venue this session.**

---

## P3 — JLC Memovox Automatic Calendar E855 (cal 825 alarm)

Two clean, explicitly-E855 JDM dealer asks. Auction channel: **zero E855.**

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (sold out — last ask) | ¥598,000 (税込) | JPY | 宝石広場: **Ref E855**, steel, silver dial, cal K825, c.1960, **オーバーホール済 (serviced)**, Gay Frères bracelet, box | https://housekihiroba.jp/shop/g/g622388001/ |
| live at fetch | ASK (SOLD OUT) | ¥588,000 | JPY | WatchTender 銀座: **Ref E855**, steel, cal K825 auto alarm, 1960s, **overhauled**, original Gay Frères bracelet, store box | https://watchtenderjapan.com/products/…-ref-e855-jaeger-lecoultre-memovox |
| live at fetch | ASK (sold out) | ¥825,000 (税込) | JPY | **SISTER REF — K18 yellow gold, not steel.** BEST ISHIDA: Memovox cal K825, 1960s, overhauled in-house; **dial discoloured, hands corroded, caseback slightly warped**, aftermarket bracelet, store box only | https://ishida-watch.com/c/bestvintage/1002000022388-f07 |
| listing sold | SOLD OUT (price withheld, ¥0 shown) | — | JPY | watch-colle: cal 825 half-rotor, date+alarm, 1960s, orig. Gay Frères, OH Aug 2021; **dial shows burn marks and soiling**, hands tarnished, caseback tool marks, no accessories. Price not displayed | https://www.watch-colle.com/view/item/000000007078 |

Yahoo closedsearch, query `ルクルト メモボックス` — **22 lots, min ¥2,380, avg ¥131,345,
max ¥290,000**; **no E855 and no cal 825 in any title.** Nearest-in-kind lots recorded
as sister/context only, NOT as E855 comps:

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| 6/7 (bare M/D) | SOLD | ¥290,000 | JPY | "1972製 … アラーム付自動巻メモボックス" — 1970s, wrong era for E855 | https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%83%AB%E3%82%AF%E3%83%AB%E3%83%88%20%E3%83%A1%E3%83%A2%E3%83%9C%E3%83%83%E3%82%AF%E3%82%B9/0/ |
| 4/5 (bare M/D) | SOLD | ¥280,000 | JPY | Memovox Automatic **コンビ (two-tone)** — different config | same |
| 4/14 (bare M/D) | SOLD | ¥245,000 | JPY | Memovox date + alarm, used | same |
| 6/20 (bare M/D) | SOLD | ¥216,000 | JPY | "希少 … 自動巻き 37mm デイト" — 37mm auto date alarm, ref not stated (closest in spirit to E855) | same |
| 4/5 (bare M/D) | SOLD | ¥203,001 | JPY | "Memovox 最初期" (earliest型) | same |
| 3/8 (bare M/D) | SOLD | ¥200,000 | JPY | O5897 Memovox date auto, 70s | same |
| 4/17 (bare M/D) | SOLD | ¥200,000 | JPY | Memovox 1277763, silver, AT, **【訳アリ品】 fault noted** | same |
| 3/20 (bare M/D) | SOLD | ¥178,000 | JPY | **10KGF (gold-filled)**, "OH前提・現状渡し" = sold as-is, service assumed needed | same |
| 7/1 (bare M/D) | SOLD | ¥33,833 | JPY | **ジャンク / junk** — Memovox Ref.10007 cal K910 | same |

**Assessment:** the guide's E855 sits at **¥588,000–598,000 ask** from two independent
Ginza/Shibuya vintage specialists, both serviced and both on the correct Gay Frères
bracelet. The auction channel does not supply E855; generic 1960s–70s Memovox alarm
hammers ¥178,000–290,000, and gold/junk variants scatter far wider.

---

## P4 — VC "1972" / Prestige de la France ref 37010 family

Real, repeatable JDM supply. **Four independent dealer asks, all ¥1.48M–1.75M.**

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (out of stock) | ¥1,480,000 (税込) | JPY | 宝石広場: **37010/000G**, white gold, cal 1055, VC strap, overhaul history noted, vintage | https://housekihiroba.jp/shop/g/g613190001/ |
| live at fetch | ASK (在庫切れ) | ¥1,480,000 (税込) | JPY | GINZA RASIN: **37010/000J**, yellow gold, silver dial, 36×26mm, **オーバーホール + 外装仕上げ Aug 2024 (i.e. POLISHED)**, no original box/papers — store box only | https://www.rasin.co.jp/SHOP/U-37010000J.html |
| live at fetch | ASK (out of stock, inquire) | ¥1,683,000 (税込) | JPY | BEST ISHIDA: **37010/000R-8846**, K18 rose gold, silver dial, **外装仕上げ performed (POLISHED)**, warranty card Mar 2002, box (outer deteriorated), new third-party calf strap | https://ishida-watch.com/c/bestvintage/1002000015328-f05 |
| snippet only | ASK | ¥1,748,000 (税込) | JPY | Search snippet for **37010/000G** used; underlying page not fetched — treat as soft | (snippet, JP query `37010 1972 プレステージ・ド・ラ・フランス 中古`) |
| sold | SOLD (price withheld, ¥0) | — | JPY | ANTIQURIOUS 銀座: **37010/000G-8813**, WG, **navy dial**, rank A, cal 1055 manual, warranty card 1999, box (interior damaged), **overhauled Dec 2023**, new belt w/ 750 clasp. Marked SOLD; price removed | https://antiqurious.com/products/rc_iteyy862pbnm_z3rk |

**Assessment:** JDM asks for 37010 cluster ¥1.48M–1.75M across WG, YG and RG, and
**two of the three priced pieces are explicitly polished (外装仕上げ)**. Sharp,
unpolished cases are not what this channel is offering at these numbers.

---

## P5 — VC Mercator ref 43050 (YG map dial)

Widest spread of any entry. Specialist-vintage asks and pawn/trade-in numbers are
a factor of ~3 apart.

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (out of stock, inquire) | ¥7,898,000 | JPY | BEST ISHIDA 新宿: **43050/000J-8232**, "**ヨーロッパ・アジア・アフリカ**" edition = the Europe/Africa/Asia map, 1995, K18 YG case + YG buckle, **factory 外装仕上げ (refinished by VC)**, no notable scratches, repair docs + store box. *Page printed its own conversion "≈$53,000" — page's conversion, not mine* | https://ishida-watch.com/c/bestvintage/1002000035456-g10 |
| live at fetch | ASK (在庫なし) | ¥6,283,600 (税込) | JPY | renzu (Yahoo Shopping mirror): **43050/000J-17**, YG, 36mm, cal 1120/2, 1994 400th-anniversary model, "中古（目立った傷や汚れなし）", **box + international warranty dated May 1996 + booklet**, original croc shows wear | https://store.shopping.yahoo.co.jp/renzu/v4907.html |
| live at fetch | ASK (sold out) | ¥2,838,000 | JPY | **OUTLIER — 高山質店 (pawn shop)**: "43050/000J" (no suffix), rank AB, YG, **no box/papers**, 12-month store warranty. Far below the two specialist asks; treat with suspicion (possible stale/legacy price or incomplete piece) | https://takayama78online.jp/shop/g/g3150287540014/ |
| live at fetch | BUYBACK quote | ¥2,550,000 | JPY | ゴールドウィン 買取 table: **43050/000J-17**. Trade-in offer, no date printed on page | https://gol-win.com/watch/vacheron.html |
| sold | SOLD OUT (price withheld) | — | JPY | 江口時計店 渋谷松濤: **43050/000J**, K18 YG, 1995, rank A, "**non-polished**", complete VC factory service Nov 2025, **VC Extract from Archives Dec 2022**, ~638 pieces made. Price removed on sale | https://eguchi-store.jp/stocklist/297290/ |
| sold | SOLD OUT (price withheld) | — | JPY | GINZA RASIN: **43050/000J-17**, YG case + bracelet, gold dial, mechanical inspection Aug 2015, **outer+inner box, warranty May 1996, loupe**. Price removed | https://www.rasin.co.jp/SHOP/U-43050J17.html |
| sold | SOLD OUT (price withheld) | — | JPY | コミット銀座: **43050/000P** — **PLATINUM variant, priced separately per brief**. Price removed | https://www.commit-watch.co.jp/buyer/watches/mens/vacheron_constantin/mercator-319223/ |

**Assessment:** the two credible JDM specialist asks are **¥6.28M and ¥7.90M**; the
dealer buyback floor is **¥2.55M**. The ¥2,838,000 pawn ask is the one number that
would drag a band downward and it is the least trustworthy row here.

---

## P6 — VC Malte Power Reserve / Date ref 83060 (cal 1420 manual)

Four asks from one dealer's live 83060 inventory page, cross-checked against the
individual product page for the cheapest.

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (**in stock**) | ¥1,980,000 | JPY | 宝石広場 item 662392001, 83060 manual-wind, used | https://housekihiroba.jp/shop/c/c01vcus02/ |
| live at fetch | ASK (out of stock) | ¥2,380,000 | JPY | 宝石広場 item 639667001, 83060, used | same |
| live at fetch | ASK (out of stock) | ¥1,880,000 | JPY | 宝石広場 item 648919001, 83060, used | same |
| live at fetch | ASK (out of stock) | ¥1,350,000 | JPY | 宝石広場 item 556035001 = **83060/000G-9287**, WG, 38mm, silver/skeletonised dial, see-through back, date + power reserve. Page also prints **reference (retail) price ¥2,808,000**. Cheapest of the four | https://housekihiroba.jp/shop/g/g556035001/ |
| snippet only | ASK | ¥2,288,000 (税込) | JPY | Search snippet: **83060/000R-9288** in **new** condition (rose gold). Underlying page not fetched | (snippet, JP query `"83060" マルタ パワーリザーブ デイト 中古`) |

**Assessment:** JDM 83060 asks run **¥1.35M–2.38M**, with the single in-stock piece at
¥1.98M. RG variants sit at the top.

---

## P7 — VC Malte Dual Time Regulator ref 42005/000G-8900 (EXTRA RIGOR)

Best-covered entry at this venue: **five distinct asks plus a retail anchor.**

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (SOLD OUT) | ¥2,780,000 (税込, ≈¥2,527,273 ex-tax) | JPY | **ジャックロード, condition NEW**: 42005/000G-8900, 18K WG, silver dial, 38mm, **original VC box + 3-year international warranty**. This is the JDM new-old-stock ceiling. *Page printed its own "≈$19,000 before tax" — page's conversion* | https://www.jackroad.co.jp/shop/g/gva020/ |
| live at fetch | ASK (out of stock) | ¥2,280,000 | JPY | 宝石広場 item 503484001: 42005/000G-8900, WG, silver dial, **manufactured Oct 2003**, dual-time + regulator, original VC strap, overhaul available. Page prints **reference (retail) ¥3,348,000** | https://housekihiroba.jp/shop/g/g503484001/ |
| live at fetch | ASK (out of stock) | ¥2,180,000 | JPY | 宝石広場 item 486191001, 42005 Malte dual time, used | https://housekihiroba.jp/shop/c/c01vcus02/ |
| live at fetch | ASK (out of stock) | ¥2,100,000 | JPY | 宝石広場 item 633931001, 42005 Malte dual time, used/vintage | same |
| live at fetch | ASK (out of stock) | ¥2,080,000 | JPY | 宝石広場 item 587112001, 42005 Malte dual time, used/vintage | same |
| live at fetch | ASK (out of stock) | ¥1,880,000 | JPY | 宝石広場 item 540984001: **42005/000G-8900**, WG case **and band**, white/silver dial, **box + papers included**. Cheapest JDM ask found. Page prints reference (retail) ¥3,348,000 | https://housekihiroba.jp/shop/g/g540984001/ |
| live at fetch | ASK (在庫切れ, price withheld ¥0) | — | JPY | GINZA RASIN: 42005/000G-8900, WG, silver dial, 38mm, **inspected Aug 2024**, minor scratches on case, some scratches on crystal, **no box/papers** (store box supplied). Price removed on sale | https://www.rasin.co.jp/SHOP/U-42005G8900.html |
| snippet only | reference/retail | ¥2,780,000 ref · MSRP ¥3,410,000 | JPY | Retail anchors repeated across search snippets; ¥2,780,000 independently confirmed by the Jackroad fetch above | (snippets + Jackroad page) |
| — | ASK (page 404) | — | — | PLUS ONE `used2711` listed in search results as 中古美品 42005/000G-8900 WG — **page returned 404**, no price captured | http://plusone-watch.co.jp/fs/plusone/used2711 |
| — | ASK (page 403) | — | — | 腕時計のGMT item 3717013934907, 42005/000G-8900 — **HTTP 403**, no price captured | https://www.gmt-j.com/item/3717013934907 |

**Assessment — load-bearing for the negotiation:** every JDM ask for this reference
sits between **¥1,880,000 and ¥2,780,000**, with six of six priced listings at
**¥1.88M or above** and the cheapest one being a *complete set with box and papers*.
Nothing at this venue supports a JDM price below ¥1.88M for a 42005/000G-8900.

---

## P8 — JLC Master Grand Réveil ref Q163842A / 149.8.95

**NO DATA FOUND.**

Searched `ジャガールクルト マスター グランレヴェイユ 149.8.95 Q163842A 中古 価格`,
`"グランレヴェイユ" ジャガールクルト 149.8.95 中古 円`, and
`マスター グランレヴェイユ パーペチュアルカレンダー アラーム 中古 販売`. Results returned
only dealer *category* pages (宝石広場, RASIN, かめ吉, ティッケン, れんず, timepeaks) with
no Grand Réveil line item and no price. No Yahoo closed lot. No JDM ask, no JDM sold.

---

## P9 — VC Historiques Toledo 1952 ref 47300

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (品切れ) | ¥2,198,000 (税込, ¥1,998,182 ex-tax) | JPY | **TIME GRACE GINZA: 47300/000R-9219 — the rose-gold variant the guide names.** Rank "Used-A", pink gold case+bezel, white dial w/ bar indices, 41×35.7mm, **box + manual + warranty card**, cal auto, moonphase/small seconds/triple calendar | https://timegrace.jp/products/detail/7199 |
| live at fetch | ASK (out of stock) | ¥1,680,000 | JPY | 宝石広場: **47300/000G-9064**, 18K **white gold**, silver dial, 43.0×35.0mm, triple calendar + moonphase, used, 1-yr store guarantee | https://housekihiroba.jp/shop/g/g583671001/ |
| live at fetch | ASK (在庫切れ, price withheld ¥0) | — | JPY | GINZA RASIN: **47300/000G-9064**, WG, silver dial. Outer box (damaged) + inner box + **warranty issued Dec 2003** + **VC complete service Jan 2026**, refinished by retailer (**POLISHED**), new original croc strap. Noted as "rarely seen domestically". Price removed on sale | https://www.rasin.co.jp/SHOP/U-473G9064.html |
| sold | SOLD OUT (price withheld ¥0) | — | JPY | ベルモンド: **47300/000R-9219**, 18K pink gold, silver dial, rank AB (minor wear/scratches, dial and hands undamaged), ~35mm, **no box/papers**. Price removed | https://bellemonde.tokyo/view/item/000000000796 |
| — | ASK (page not resolvable) | — | — | ビッグムーン listed a **47300/000J-9065** (yellow gold) — product page returned "該当商品はありません"; no price captured | https://www.e-bigmoon.com/search/detail.php?id=12757 |

**Assessment:** the named RG 47300/000R-9219 asks **¥2,198,000 with full set**; the WG
sibling asks **¥1,680,000**. Both are dealer asks; no JDM sold price obtained.

---

## P10 — JLC Grande Reverso GMT ref Q3028420 / 240.8.18

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (品切れ, back-order offered) | ¥868,000 | JPY | 宝石広場, condition **NEW**: Q3028420, steel, silver dial w/ black subdials, 47.0×27.0mm, cal 878, 192h power reserve. Page prints **reference (retail) ¥1,449,000** | https://housekihiroba.jp/shop/g/gJL087/ |
| live at fetch | ASK (在庫切れ — "price is from previous listing") | ¥738,000 (税込) | JPY | kingsroad / Zetton: 240.8.18 (Q3028420), steel, silver/black reversible, 47×29mm, hand-wound 8-day, leather strap, **box + warranty card**, "**当店で外装仕上げ済み** = POLISHED by the store", 6-month used warranty. Page prints reference price ¥1,397,000 | https://www.kingsroad.jp/SHOP/used-8298.html |
| live at fetch | ASK (在庫切れ, price withheld ¥0) | — | JPY | GINZA RASIN: Q3028420 (240.8.18), steel, silver dial, croc strap, **outer+inner box (both damaged), manual, guarantee card Feb 2009**, **外装仕上げ + mechanical inspection May 2026 (POLISHED)**. Page cites original retail ¥1,593,000. Price removed on sale | https://www.rasin.co.jp/SHOP/U-Q3028420.html |
| 6/18 (bare M/D) | SOLD | ¥98,876 | JPY | **NOT A WATCH — movement only.** "純正ムーブメント cal.970 … レベルソ グランド GMT … 自動巻" (JLC genuine movement, cal 970, automatic). Q3028420 is **manual-wind cal 878**, so this is neither the reference nor the calibre. Sole hit on `グランドレベルソ GMT` in the 180-day window (n=1, min=avg=max=¥98,876), 19 bids from ¥1 | https://auctions.yahoo.co.jp/closedsearch/closedsearch/%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%89%E3%83%AC%E3%83%99%E3%83%AB%E3%82%BD%20GMT/0/ |
| — | not used | (¥1,783,000) | JPY | A search snippet asserted a Mercari used price of ¥1,783,000 for Q3028420. That is above JDM *retail* and above every dealer ask found; the underlying page was not fetched. **Recorded as rejected, not as a comp.** | (snippet only) |

**Assessment:** two JDM asks at **¥738,000 (polished, complete) and ¥868,000 (new)**.
Both are materially below the JDM retail anchors of ¥1,397,000–1,593,000 the same
pages print. Yahoo auction supply for this reference is effectively nil.

---

## P11 — JLC AMVOX2 Chronograph ref Q192T25 (titanium/PVD LE)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK | ¥499,800 ("Time Tunnel best price"; ¥454,364 duty-free). Page also prints **regular ¥1,728,000** | JPY | **SISTER VARIANT — ref Q192.T4.40**, 750-piece LE, **titanium 44mm**, Aston Martin AMVOX2 chronograph. "Beautiful used watch, **no original box, no guaranty-card, no instruction book**". Guide's target is Q192T25 / 192.T.25 — related family, different variant code, so flagged | https://www.timetunnel-jp.com/jlc_q192t440_2748435.html |
| snippet only | ASK | ¥1,705,000 | JPY | Search snippet: 銀座エバンス, **Q192T400 (192.T.25)** AMVOX2 Chronograph Aston Martin Racing LE, used. Evance blog page was fetched and contains **no price** — the ¥1,705,000 comes from the search snippet only, so treat as soft | (snippet; blog fetched at https://evance.co.jp/company/blog/95317 confirms the model, not the price) |
| snippet only | ASK | ¥980,660 | JPY | Search snippet: Chrono24 JP listing for titanium LE **Q192T440 (192.T.25)** | (snippet) |
| snippet only | ASK | ¥2,798,000 | JPY | Search snippet: **platinum** AMVOX2 chronograph 192.6.25 — different metal, priced separately | (snippet) |
| — | ASK (page 404) | — | — | au PAY Market listed a used **Q192T470 (192.T.25)**, 500-piece LE — page 404, no price captured | https://wowma.jp/item/461930142 |

**Assessment:** thin and inconsistent. Only one fetched page with a price, and it is a
sister variant with no box or papers. The ¥1,705,000 Evance figure is snippet-only.

---

## P12 — VC Historiques Chronomètre Royal 1907 ref 86122/000R-9362 (RG)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch, ships 2026-08-15→17 | ASK (**in stock**) | ¥6,348,000 (税込) | JPY | **SISTER REF — 86122/000P-9362 = PLATINUM with enamel dial**, not the rose gold the guide names. コミット銀座 (Yahoo Shopping): 中古（目立った傷や汚れなし） | https://store.shopping.yahoo.co.jp/commitginza/65zg7r4p.html |
| sold | SOLD OUT (price withheld ¥0) | — | JPY | GINZA RASIN: **86122/000R-9362 — the correct rose gold ref.** White dial, 39.0mm, self-winding; **light polish applied**, "minimal scratches barely remaining", machine inspection Jan 2018; **original box (damaged) + inner box + warranty card + chronometer certificate**. Price removed on sale | https://www.rasin.co.jp/SHOP/U-86122R9362.html |
| snippet only | retail anchors | ¥5,346,000 (2017 AD list, 税込) · ¥5,940,000 (another listing, 税込) | JPY | Retail-level anchors seen in search snippets; not used pricing | (snippets) |
| — | ASK (no content) | — | — | 楽天 ハタ貴金属 and 正木屋質店 both returned pages with no product data | https://item.rakuten.co.jp/jw-hata/va86122000r9362/ · https://7masakiya.com/products/…86122-000r-9362-pg-… |

**Assessment:** **no usable RG price.** The only priced piece is the platinum/enamel
variant at ¥6,348,000, which the brief requires be kept separate.

---

## P13 — JLC Duomètre à Chronographe ref Q6012420 (rose gold, cal 380)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (在庫切れ; page shows "normal price" ¥3,380,000 with ¥0 current) | ¥3,380,000 (税込) | JPY | GINZA RASIN: Q6012420 (600.2.28.S), **pink gold 42mm**, hand-wound, silver dial, croc strap. "No noticeable scratches or damage"; **外装仕上げ + 機械点検 Jun 2025 (POLISHED)**. Outer box (damaged), inner box (damaged), manual, **warranty card Jan 2014**, **VC/JLC maker service record Jul 2023** | https://www.rasin.co.jp/SHOP/U-Q612426228S.html |
| snippet only | ASK | ¥3,980,000 (税込) | JPY | ジャックロード, condition NEW, Q6012420 | (snippet, JP query `デュオメトル Q6012420`) |
| snippet only | BUYBACK quote | ~¥1,750,000 | JPY | 買取本舗七福神 trade-in offer for Q6012420 | (snippet) |
| snippet only | MSRP | ¥5,142,500 (税込) | JPY | Manufacturer list price | (snippet) |
| — | ASK (page 404) | — | — | 腕時計のGMT Yahoo mirror 3717005829396 (used RG Q6012420) — 404, no price | https://store.shopping.yahoo.co.jp/gmt/3717005829396.html |

**Assessment:** one solid fetched ask at **¥3,380,000** for a polished, fully-papered,
recently-serviced RG example, against a ¥1,750,000 trade-in floor.

---

## P14 — VC Les Historiques Ultra-Fine 1955 ref 33155/000R-9588 (RG, cal 1003)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (SOLD OUT) | ¥2,480,000 (税込, ¥2,254,546 ex-tax) | JPY | ジャックロード, condition **NEW**: 33155/000R-9588, 18K pink gold 36mm, cal 1003, 4.10mm thin, silver dial, **original box + warranty documentation** | https://www.jackroad.co.jp/shop/g/gva116/ |
| snippet only | ASK range | ¥1,728,744 – ¥2,361,212 | JPY | Chrono24 JP used listings range, seen in search snippet | (snippet) |
| snippet only | retail anchors | ¥2,688,000 (2010 list, 税込) · MSRP ¥3,542,000 (税込) | JPY | Retail anchors | (snippet) |

**Assessment:** one fetched new ask at ¥2,480,000; used JDM/Chrono24-JP snippet range
¥1.73M–2.36M. No JDM sold price.

---

## P15 — VC Historiques Aronde 1954 ref 81018/000R-9657 (RG LE)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (SOLD OUT) | ¥2,480,000 (税込, ¥2,254,546 ex-tax) | JPY | ジャックロード, condition **NEW**: 81018/000R-9657, 18K rose gold case+bracelet, silver dial, 44.5×31.2mm, cal 1400SA, **original box + warranty, 3-year warranty** | https://www.jackroad.co.jp/shop/g/gva121/ |
| live at fetch | ASK (out of stock) | ¥1,980,000 | JPY | 宝石広場: 81018/000R-9657, used, silver dial, 44.5×31.2mm, 日本正規品 (JP domestic-market authentic), 2014, 1-yr guarantee. Page prints **reference (retail) ¥3,375,000** | https://housekihiroba.jp/shop/g/g512208001/ |
| sold | SOLD OUT (price withheld) | — | JPY | WATCHNIAN: 81018/000R-9657, **rank 中古A**, pink gold, silver dial, brown alligator, manual wind, 44.5×31×9.5mm. **Maker warranty from Oct 2011 domestic purchase + repair invoice Feb 2026 (strap replacement)**. Price removed | https://watchnian.com/shop/g/gik-00-0712509/ |
| snippet only | ASK | ¥3,942,000 (税込) | JPY | oomiya 心斎橋 (authorised dealer) listing | (snippet) |

**Assessment:** used JDM ask **¥1,980,000**; new/NOS ask **¥2,480,000**.

---

## P16 — JLC Master Ultra Thin Réserve de Marche ref Q1378420 (steel) [OWNED]

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (out of stock / back-order) | ¥1,350,000 | JPY | 宝石広場, condition **NEW**: Q1378420, steel 39.0×9.9mm, cal 938 automatic, 43h reserve, silver dial, **box + papers**. Page prints **reference (retail) ¥1,575,200** | https://housekihiroba.jp/shop/g/gJL267/ |
| **2024-05-19 (dated on page)** | BUYBACK quote | **up to ¥630,000** | JPY | 宝石広場買取: Q1378420 reference buyback for a used example; page states actual offer varies with condition, accessories and warranty-card date | https://www.housekihiroba-kaitori.jp/watch_product/jl267 |
| snippet only | ASK | ¥932,800 | JPY | A retailer sale price seen in a search snippet for Q1378420 | (snippet) |
| snippet only | BUYBACK actual | ¥800,000–900,000 on 2025-01-04 | JPY | Reported completed buyback for 176.8.38.S (= Q1378420 case code) | (snippet) |

**Assessment:** guide claims market $5,200–7,500. JDM: **new ask ¥1,350,000**, used
retail snippet **¥932,800**, dealer buyback **¥630,000–900,000**.

---

## P17 — JLC Geophysic True Second ref Q8018420 (steel/silver)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (SOLD OUT) | ¥838,000 (税込, ¥761,819 ex-tax) | JPY | ジャックロード, condition **NEW**: Q8018420, steel case **and steel bracelet**, silver dial, 39.6mm, cal 770, **original JLC box + warranty card** | https://www.jackroad.co.jp/shop/g/gjl220/ |
| live at fetch | ASK (Out of Stock) | ¥738,000 | JPY | 宝石広場, condition **NEW**: Q8018420, steel, silver dial, 39.6mm, cal 770, box + papers. Page prints **reference (retail) ¥984,500** | https://housekihiroba.jp/shop/g/gJL361/ |
| live at fetch | ASK (SOLD OUT, price withheld ¥0) | — | JPY | GINZA RASIN: Q8018420, steel, silver dial, croc strap (original, cleaned), cal 770. **Serviced AND polished by dealer Nov 2024**; warranty documentation Jul 2018; 1-yr mechanical guarantee. Price removed on sale | https://www.rasin.co.jp/SHOP/U-Q8108420.html |
| snippet only | ASK range | ¥688,000 – ¥968,000 | JPY | Range across JDM retailers seen in search snippet; a used purchase example "up to ¥850,000" also cited | (snippet, JP query `ジオフィジック トゥルーセカンド Q8018420 中古 価格`) |

**Assessment:** two fetched JDM **new** asks at **¥738,000 and ¥838,000**, both on the
correct steel/silver spec — the ¥838,000 one on the steel bracelet.

---

## P18 — VC Quai de l'Île Self-Winding ref 4500S/000A-B195 (steel) [OWNED]

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (Out of Stock) | ¥1,450,000 | JPY | 宝石広場, condition **NEW**: 4500S/000A-B195, steel case + bracelet, silver dial, 41.0mm, cal 5100 automatic, 60m WR, deployant, box + papers. Page prints **reference (retail) ¥1,914,000** | https://housekihiroba.jp/shop/g/gVC160/ |
| snippet only | new lowest / MSRP | ¥1,456,380 (税込 lowest new) · MSRP ¥1,584,000 (税抜) | JPY | 価格.com-style aggregates seen in search snippet | (snippet) |
| — | ASK (no price rendered) | — | — | ALLU listed 4500S/000A-B195 SS AT silver dial (AP040722) but the page returned title only, no price | https://allu-official.com/jp/ja/market/items/1461090/ |

**Assessment:** one clean JDM new ask at **¥1,450,000**. No used JDM ask, no sold.

---

## P19 — VC Historiques Triple Calendrier 1942 ref 3110V/000A-B425 / B426 (steel)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | ASK (SOLDOUT) | ¥2,486,000 | JPY | プレミアバリュー: **3110V/000A-B425**, condition **NEW**, steel 40mm × 10.35mm, 3ATM, sector dial, cal 4400 QC, 65h reserve | https://www.premiervalue.shop/shopdetail/000000001166/ |
| snippet only | retail anchors | ¥3,124,000 (税込 dealer ref) · MSRP ¥3,453,000 (税込) · ¥2,332,800 (earlier JP list) · ¥2,125,000 (launch 予価) | JPY | Multiple retail-level anchors across snippets; the ¥2,332,800 and ¥2,125,000 figures are older/launch-era JP list prices | (snippets) |
| — | ASK (not fetched) | — | — | Ribero listed a **used** 3110V/000A-B425 "箱、保証書付" (box + warranty) — product page returned **404**, no price captured | https://www.ribero-watch.com/products/detail/8001 |
| — | ASK (not fetched) | — | — | GINZA RASIN U-311VAB425 and ジャックロード gva109 (B426 variant) both surfaced in search but no price captured | https://www.rasin.co.jp/SHOP/U-311VAB425.html · https://www.jackroad.co.jp/shop/g/gva109/ |

**Assessment:** one fetched new ask at **¥2,486,000**, against a current JP retail
reference of ¥3,124,000 and MSRP ¥3,453,000. No used JDM price, no sold.

---

## P20 — JLC Polaris Geographic ref Q9078640 (ocean grey, 2024–)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| **2025-08-02 (dated on page)** | **BUYBACK, completed** | **¥1,250,000** | JPY | ピアゾ actual-buyback table: **Q9078640 "Ocean Grey Geographic"**, described **unworn**, power reserve + small seconds. This is a real completed trade-in with a stamped date — the single most concrete P20 number found | https://piazo.jp/actual.php?pricelist_search=%E3%82%B8%E3%83%A3%E3%82%AC%E3%83%BC%E3%83%AB%E3%82%AF%E3%83%AB%E3%83%88%E3%83%9D%E3%83%A9%E3%83%AA%E3%82%B9 |
| snippet only, contradicted | BUYBACK ref | ¥594,000 | JPY | A search snippet attributed a ¥594,000 buyback reference to なんぼや for Q9078640 (SS×rubber, black dial). **The なんぼや page was then fetched directly and states "お探しの買取実績価格は現在ございません" — no price data at all.** Recorded as contradicted; do not use | https://nanboya.com/search/item-list/b-343/m-7341/ |

Sibling Polaris buybacks from the same dated ピアゾ table, for context on where the
line sits (all `BUYBACK`, dates as printed): Q9028181 blue chrono ¥1,000,000
(2025-08-01) · Q9068650 silver date ¥850,000 (2025-08-01) · Q906863J green date LE
¥930,000 (2025-08-02) · Q9028651 grey chrono ¥1,120,000 (2025-08-04).

**Assessment:** secondary market is indeed still forming — no JDM retail ask and no
auction lot for Q9078640 was found. The one hard number is a **¥1,250,000 unworn
trade-in dated 2025-08-02**.

---

## P21 — JLC Master Control Chronometre Date Power Reserve ref Q4168120 (2026)

| Date | SOLD/ASK | Price (JPY) | Currency | Condition/notes | URL |
|---|---|---|---|---|---|
| live at fetch | **RETAIL (authorised dealer)** | ¥2,992,000 (税込) → ≈¥2,720,000 ex-tax | JPY | TANAKA 名古屋, JLC authorised retailer, listed as 新作 (new release): Q4168120, stainless steel, **blue dial**, 39mm × 9.2mm, Manufacture cal 738, 70h power reserve | https://www.kk-tanaka.com/jaeger_le_coultre/q4168120/ |
| — | RETAIL (same ref, not separately fetched) | — | — | Also carried by eye-eye-isuzu, jw-oomiya (blue-grey dial) and JR名古屋タカシマヤ ウオッチメゾン — all authorised-dealer new-retail pages, no secondary listings | https://www.eye-eye-isuzu.co.jp/products/watch-jaeger-lecoultre-q4168120 · https://www.jw-oomiya.co.jp/products/q4168120 |

**No early secondary/grey listings for Q4168120 found at this venue** — every JP hit
was an authorised-dealer retail page. Note the JP retail is **tax-inclusive**; the
ex-tax figure is the fairer comparison to a US pre-order price.

---

## Coverage summary

### Entries with SOLD data (Yahoo hammer prices)
- **P2 Futurematic** — 4 sold lots, ¥10,000 (dial only) / ¥158,000 / ¥180,000 (現状品)
  / ¥204,000 (gold). **None confirmed E501; all gold or metal-unstated.**
- **P3 Memovox** — 22 sold lots in window (avg ¥131,345, max ¥290,000), of which
  9 recorded above. **Zero E855, zero cal 825 in the auction channel** — all sold
  rows are sister/context only.
- **P1 VC vintage** — 6 sold gold VC lots ¥398,000–¥910,000 (one explicitly ジャンク),
  **none a triple calendar**; context only.
- **P10 Grande Reverso GMT** — 1 sold lot ¥98,876, but it is a **cal 970 movement
  only**, wrong calibre for Q3028420. Not a comp.

### Entries with ASK data only (JDM dealers)
P3 (¥588k / ¥598k, both E855, both serviced) · **P4** (¥1.48M ×2 / ¥1.683M, two
explicitly polished) · **P5** (¥6.28M / ¥7.90M specialists; ¥2.838M pawn outlier;
¥2.55M buyback) · **P6** (¥1.35M–2.38M, four asks) · **P7** (¥1.88M / ¥2.08M /
¥2.10M / ¥2.18M / ¥2.28M / ¥2.78M new — six asks, the richest entry here) ·
**P9** (¥2.198M RG full set; ¥1.68M WG) · **P10** (¥738k polished used; ¥868k new) ·
P11 (¥499,800 sister-variant Ti, no box/papers) · P13 (¥3.38M) · P14 (¥2.48M new) ·
P15 (¥1.98M used, ¥2.48M new) · P16 (¥1.35M new; ¥630k buyback dated 2024-05-19) ·
**P17** (¥738k / ¥838k, both new) · P18 (¥1.45M new) · P19 (¥2.486M new) ·
P21 (¥2,992,000 AD retail 税込).

### Entries with NO DATA at this venue
- **P1 · VC Triple Calendar 4240/4241** — no listing, no lot, nothing. Complete gap.
- **P8 · JLC Master Grand Réveil Q163842A / 149.8.95** — no listing, no lot, no price.
- **P12 · VC Chronomètre Royal 1907 86122/000R-9362 (RG)** — no price for the rose
  gold. Only the **platinum/enamel 000P-9362 at ¥6,348,000** (kept separate per brief).
- **P20 · JLC Polaris Geographic Q9078640** — no retail ask, no auction lot; only a
  **¥1,250,000 dated buyback**.

### Known holes and cautions for synthesis
1. **All prices are JPY as listed; no FX applied here.** Apply the stamped rate.
2. **Aggregator failure:** aucfree returned 0 rows on every query; aucview/aucfan
   returned HTTP 429. All Yahoo data came from `closedsearch` pages directly, so the
   auction coverage is shallower than intended.
3. **Year ambiguity on Yahoo closedsearch rows** — see the DATE CAVEAT at the top.
   Bare `M/D` dates should not be assumed to be 2026.
4. **Sold-out pages that zero the price** cost several would-be rows (P5 ×3, P7 ×1,
   P9 ×2, P10 ×1, P12 ×1, P15 ×1, P17 ×1). Those listings are real but unpriced.
5. **JDM dealer asks are almost all "sold out — last ask"**, i.e. asking prices that
   may or may not have been achieved. Only the P6 ¥1,980,000 and P12 ¥6,348,000 rows
   were in stock at fetch time.
6. **Polishing is endemic in this channel.** `外装仕上げ` (exterior refinishing) is
   stated outright on P4 ×2, P9 ×1, P10 ×2, P13 ×1, P17 ×1 and is done *by the
   dealer as a selling point*. For the vintage entries (P1–P4) that materially
   separates a JDM ask from an honest-case Western comp.
7. **Pages that blocked or 404'd** (no price captured): gmt-j.com (403 ×2),
   udedokeitoushi.com (403), plusone-watch (404), wowma (404), ribero (404),
   e-bigmoon (no product), jubilee.co.jp (DNS failure), rakuten jw-hata (no content),
   7masakiya (no content), allu (title only), firekids Futurematic (404),
   store.shopping.yahoo.co.jp/gmt and /houseki-h mirrors (404).
8. **Snippet-only figures are tagged as such** in every row and should be weighted
   below fetched-page figures. One snippet figure (P20 ¥594,000) was actively
   contradicted by fetching the page and is marked do-not-use; one (P10 Mercari
   ¥1,783,000) is rejected as implausible.
