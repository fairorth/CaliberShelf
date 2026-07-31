# Using CaliberShelf

A quick tour of what CaliberShelf does. The collection basics — adding watches,
photos, categories, labels, wear logging, and timegrapher records — are meant to
be self-explanatory as you click around. This guide focuses on the parts that
work *for* you in the background: the automated agents and the reports that
surface their results.

## The everyday basics (in one breath)

Add a watch with **+ Add**, giving it at least a brand, model, and category
(photos and full specs can follow on the Edit page). Your collection lives under
**Collection**, where you can search, filter (by category, label, and more),
sort, and switch between table and gallery views. Mark watches **Coming soon** (ordered,
not yet arrived) or **Wish list** (wanted, not owned — kept out of your counts
and totals). Log what you wear, record timegrapher runs, and organize with
categories and colored labels.

**Where each watch lives.** Every watch has a **Box** field — free text, on the
Edit page under Ownership — for the case or box in the safe that holds it
("Safe box 3", "travel roll", whatever you call them). It shows on the table,
the gallery tiles, and the dashboard cards, and it's searchable. Sort the table
by **Box** and anything unassigned drops to the bottom, so the column doubles as
a "what haven't I filed yet" list.

**Categories and tiers.** Categories are the design archetype — Dress, Sport,
Chronograph, Daily, and Horology out of the box — and they're rows you own, not
a fixed list, so add or rename them as your collection changes. Tiers are
different: they're derived from what you paid, and you set the price bands
yourself under **Config → Tiers**. Change a band and every report re-reads it
live. Complications (Date, DTZ, Power Reserve, Annual Calendar, Perpetual
Calendar, Moon Phase, Fancy) are the third axis, and a watch can carry several.

## The automated agents

CaliberShelf runs a small fleet of agents so you don't have to hunt down specs,
values, or deals by hand. Some are free and deterministic; some use AI web
search and cost a few cents. You're always in control — the AI agents fill only
empty fields and flag anything uncertain for you to confirm.

**✨ Auto-fill specs** — on the watch form, this searches the web for the
official specifications of your exact watch (dimensions, movement, materials,
and a suggested reference number) and fills the blanks. It never overwrites what
you've already entered, highlights what it added, and shows its sources and cost.

**🔍 Find in catalog** — right next to ✨, this searches a large mirrored watch
catalog (from ChronoScout) and instantly fills the five case dimensions —
diameter, lug width, lug-to-lug, thickness, and weight — for free. Use it first;
fall back to ✨ for everything the catalog doesn't cover. (Catalog data is
provided by Chronoscout.)

**Market Valuation** — for watches you flag with "Perform price checking,"
this researches the current secondary-market value each month and records an
estimate with a confidence rating and the evidence behind it. See it on each
watch and in the **Watch Valuations** report.

**Deal Scanner** — for wish-list watches, this checks each brand's online store
daily and tells you when one is available and at what price. It's free. Results
appear on the **Deals** page.

**Behind-the-scenes helpers** — a reference-number finder and a brand
store-URL/type classifier keep your data complete and the Deal Scanner fed.
Anything they're unsure about lands in the **Attention Needed** report for you
to confirm.

## Reports

Find these under **Reports**:

- **Collection Summary** — counts and total value at a glance.
- **Watches by Category** — every category with its watches and a price
  subtotal, plus the collection total.
- **Wear Summary** — how often and how recently you wear each watch.
- **Collection Map** — where your collection is dense and where the gaps are:
  a size × dial-color grid, distribution charts, and a diameter/thickness
  scatter that shows your comfort zone. Spot "too many small blues, no small
  greens" at a glance.
- **Watch Valuations** — each monthly valuation run, with drill-down to the
  market evidence behind every estimate.
- **Attention Needed** — watches, movements, and brands missing key information,
  each linking straight to the fix (references to verify, specs to fill).
- **Agent Execution Review** — every agent run: how long it took, what it cost,
  and exactly what it changed, with a full audit trail you can drill into. This
  is where you see what the automation has been doing and what it's costing.

## Good to know

The AI agents are designed to be safe: they fill only empty fields, never
overwrite your entries, flag low-confidence results for review, and any
agent-suggested reference number is marked "needs verification" until you
confirm it (a wrong reference would throw off valuations). Costs are always
shown, and the Agent Execution Review report keeps a running tally.

The **About** page (in the app, under your account) is the short version of all
of this: what the agents do, what the app is built on, and how the collection is
organized. It also shows the running app version, which ticks up with every
change — handy when you want to know whether you're looking at the newest build.
