# TenTenLoupe: the apps, explained
### A reference brief for the TenTen YouTube channel

*Written October 2026, from the code and design docs at web version 1.11.19 and iPhone app 0.2.0. This brief covers what the software does. It deliberately leaves out stories about any particular watch in the collection and the custom-watch project.*

---

## 1. What TenTenLoupe is, in one breath

TenTenLoupe is a collector's workbench for mechanical watches. It has two halves:

- **The web app** is the desk. You catalogue, research, value, photograph, analyse and decide here.
- **The iPhone app ("TenTen")** is the pocket. You use it with a watch in your hand: identify a watch from a photo, log what you're wearing, photograph a watch, shoot what you saw at a watch show, and hand the phone to a friend to rank your collection.

Both apps share one account and one database, and they import the same rules from the same source files. A wear logged on the phone is in the web calendar a second later.

**The name.** 10:10 is the hand position every watch photograph uses, and the loupe is the watchmaker's magnifier. Photography and close looking are in the name because they sit at the centre of the product.

**The philosophy, as seen across the code:**
- **Every fact has one home.** Each value is stored and shown in one place, so two screens can never disagree about it.
- **AI is a careful assistant, never an author.** AI fills only empty fields, flags anything it guessed, shows what it cost, and logs every run for audit.
- **Money informs; it doesn't decide.** The "what should I sell" engine deliberately does not use price as an input.
- **Photographs are never cropped where the photo is the subject.** The frame fits the photograph, not the other way round.

---

## 2. The web app: the desk

### 2.1 Look and feel
- A calm, light, editorial design with one **brass** accent for actions and steel-blue reserved for data. Headings are set in the Fraunces serif.
- Prices are plain monospaced figures. Only **gains (green) and losses (red)** get colour.
- There are no emoji, with two deliberate exceptions: ✨ marks AI autofill and ⚠ marks an unverified reference number.
- **The header clock reads like a watch:** hours and minutes large, with running seconds small "like a subsidiary register."
- **Global jump search.** Press `/` anywhere to jump to a watch, brand or storage box.
- The navigation has five groups: **Collection · Imagery · Analysis · Market · System**.

### 2.2 Home: the Light Table
The home page is a photo stage designed to be left running on a screen.
- **Rotation.** Watches rotate one at a time on a fixed-height stage. The frame takes each photograph's own shape.
- **Bloom, not crop.** The space around the photo is filled with a soft, blurred glow made from the photo itself, never by cropping. Its brightness adapts to how light or dark the photo is.
- **Loupe.** Hovering brings up a circular loupe that magnifies the watch 2.4×.
- **Film strip.** A sprocketed strip below shows the watch's shots in a fixed order: Flat · Hero · Profile · Caseback · Macro. Angles not yet photographed show as empty frames that link to the Photo Lab, so the home page doubles as a shot list.
- **Fact band.** Ownership, key specs, wear activity and last timegrapher result, and which storage box it lives in. A never-worn watch gently says "Worn: never — give it a day."
- **Rotation sets.** All watches, wish list, last 20 acquired, any collection guide, or any storage box.
- **Glance mode.** After a period of idle time the controls disappear and the photo fills the screen, like an ambient gallery. Any input brings the app back.

### 2.3 The collection
- **Two views.** A **table** with resizable columns you choose yourself (category, brand, model, reference, caliber, box, attachment, wear count, cost, value, gain and more), or **tiles** as photo cards.
- **Rich filters.** Ownership (owned / coming soon / wish list), sale status, category, brand, storage box, case material, movement, complications, coloured labels, price tier and whether the price is tracked.
- **Filters live in the web address,** so a filtered view survives a trip into a watch and back, and can be bookmarked or shared.
- **Click-to-filter.** Clicking a brand or category cell filters to it; clicking anywhere else on the row opens the watch.
- **Many sorts.** Including by wear count, attachment, value and gain. Sold watches stay in the collection, dimmed with a SOLD marker, and always sink to the bottom.
- **CSV export of exactly what is on screen** (filtered rows × chosen columns), ready for Excel.

### 2.4 The watch page
- **Left: the watch.**
  - Photo gallery with a full lightbox (zoom, pan, keyboard navigation).
  - Wear history ("last worn N days ago").
  - The strap currently fitted.
  - A **timegrapher log:** rate in seconds per day, amplitude and beat error for each run. The app shows the movement's lift angle so you can set up your timegrapher correctly before measuring.
- **Right: the record.** Identity, ownership, specifications, labels, and the **Financials** panel. The edit form uses the same layout, so nothing jumps when you click Edit.
- **One-press "Wore today"** with a quick follow-up: *Loved it · Fine · Meh*.

**The Financials panel** is a standout demo:
- **Cost basis**, itemized: price, sales tax, import fees, shipping.
- **Current value**, labelled with its source:
  - **Researched:** an AI agent studied the market.
  - **Logged:** you entered it yourself.
  - **Static:** estimated from your own price-tier rules.
- A low–high range, a confidence badge, an "as of" date, a **Stale** warning after 90 days, unrealized gain, and change since the last valuation.
- **Check price now.** About a minute of live AI market research, with an elapsed-time counter.
- **Evidence & sources.** The actual market datapoints and links the AI used.
- **Run trace.** Each search and page fetch the agent made, with timings. You can watch how it reached its number.
- **Selling, end to end.**
  - List the watch for sale with a venue and an asking price. A live helper compares your ask with the researched range.
  - Record the sale with fees to get net proceeds.
  - A recorded sale can be edited in place.

### 2.5 Adding and editing a watch
- **Quick add** needs only brand, model and category, plus an optional photo and price. "Save and add another" makes it quick to enter a batch.
- **The full edit form** covers identity (including serial), ownership and storage box, and full specifications: diameter, thickness, lug-to-lug, lug width, weight, water resistance, material, crystal, dial colour, caliber, bezel and complications.
- **🔍 Find in catalog (free).** Searches a licensed catalog of roughly 9,300 models (Chronoscout) and fills the case dimensions.
- **✨ Fill from AI.** Searches the web for the official spec sheet and fills the empty fields. It typically costs 5–15 cents, and the exact cost is shown afterwards. Filled fields are highlighted and sources are listed.
  - Any reference number it proposes is marked **⚠ unverified** until you confirm it.
  - The rule is printed on screen: *both fill empty fields only — your entries are never changed.*

### 2.6 Wear tracking
- Calendar, history and stats: this month, this year, all time, current streak, most worn and least worn.
- The **feel** rating attached to each wear (*Loved it / Fine / Meh*) becomes real data the selling engine uses later.
- Wears are dated by your **local** calendar day. That sounds trivial, but it is a real bug many apps have: logging at 9 pm in the US would otherwise land on tomorrow.

### 2.7 Market: value, sell and the money side
**Market overview.**
- A portfolio strip: cost basis, current value (and how many values come from each source), unrealized gain, and realized gain net of all fees.
- **Portfolio value over time** charted against a dashed cost-basis line.
- A pipeline of what's listed and what recently sold.
- An attention list: stale listings, stale valuations, and sales missing their fees.

**Sold Archive.** Every sale with holding period, venue, basis, fees, net and realized gain, totalled. *"The screen you export when someone asks what you've sold."*

**Deals.** Every day, the app checks each wish-list watch against the brand's own online store and badges it: *Available now! · Pre-order · Sold out*. This check is free; no AI is involved.

### 2.8 The Edit: deciding what to sell
This is perhaps the most original part of the app. It is a five-step workflow for the hardest question in collecting: *which ones go?*

1. **Sort.** Keyboard-fast "floor piles": **K**eep, **M**aybe, **S**ell. It simulates laying the whole collection out on the floor.
2. **Rate.** One watch at a time, in random order, you rate **attachment** (Max / High / Medium / Low / None), **replaceability** (Easy / Findable / Rare / Irreplaceable) and mark anything sentimental. *There are no prices on this screen, deliberately.* "None" is a meaningful rating: "I considered it and I feel nothing" is the clearest sell signal there is.
3. **Head-to-head.** "If you could keep only one of these two, which?" It only asks about look-alikes near the cut line.
4. **The Edit.** The ranking engine.
   - Two sliders: **Keep N of M**, and a **duplication penalty** that runs from "attachment only" to "variety first."
   - It shows who stays, who's *on the bubble*, and what is *suggested to sell*, with the closest calls first. Before-and-after panels show how the collection's mix of categories, functions and dials would change.
   - **How the score is built:**
     - Attachment carries the most weight (60%).
     - Then replaceability and the watch's role in a collection guide.
     - Then **wear signals that phase in as you build history**: how a watch felt counts from the first rating and reaches full weight after three; how often you wear it switches on only after 120 days of logging.
     - A similarity measure (category, function, dial, size, material, brand) penalises redundancy, and only the weaker members of a cluster pay.
     - **Money is not an input.** Value decides the order you sell in, never *whether* you sell.
5. **To Sell.**
   - Set a goal: an amount, and what it's *for* (the app's own placeholder is "e.g. the next grail").
   - A progress bar stacks money already realised from sales, money from current listings, and decided-but-not-listed watches, each counted at its true expected amount after fees.
   - It suggests which "Maybe" watches would close the gap.

### 2.9 Collection Guides
A **Master Collection Guide** is a story-driven collecting plan: "the strategic tier of wanting."
- **Chapters.** Each has a reference, its place in history, a target price band, a priority and a recommended variant. A thesis acts as the *stopping rule*, so the collection has a defined finish line.
- **The guide page.** It shows a **Collection Spine**, a timeline with each chapter marked owned, coming soon, wishing or passed. It also shows high-value gaps ranked by priority, and a one-click "promote to wish list."
- **Live status.** Chapters update automatically when you acquire the watch.
- **Guides run through the whole app.** They appear as rotation sets on the Light Table, as collection filters and badges, and as a weight in The Edit.

### 2.10 Reports
- **Collection Summary** and **Attention Needed.** The second is a to-do list of missing data (references to verify, missing calibers, sizes, lift angles, store links), each item linking straight to the fix. When everything is filled in it reads "ALL CLEAR."
- **Watch List.** A printable insurance schedule with filters, on-screen totals, CSV and Print-to-PDF.
- **Watch Values.** Every held watch's value, *which source produced it*, gain vs cost, and movement since the last valuation. The four summary cards (Total · Researched · Logged · Static) *are* the filter. Each row has a switch to enroll that watch in monthly AI research.
- **Collection Map.** A size × dial-colour heatmap, distributions, and a diameter × thickness scatter that reveals your "comfort zone." It is great for spotting gaps like *too many small blue dials, no small green ones*.
- **Watches by Category / by Box**, with subtotals.
- **Brand Wish List.** Brands you want but don't own, with catalog context and the models that best fit your usual case size.
- **Ratings.** The results of the iPhone friend game (see §3.6).
- **Watch Valuations.** Each monthly AI valuation run, with drill-down to the evidence behind every estimate.
- **Watch Sales.** Current listings, then profit and loss by year.
- **Annual Summary.** Acquisitions, sales, year-end position and fees for one year, laid out for the tax preparer. It prints on letter paper and has a copy-to-CSV button per section.
- **Agent Execution Review.** Every AI run the app has ever made, with cost, duration, tokens, searches and a full audit trail. Total transparency about what the automation spent.

### 2.11 Supporting pages
- **Brands.** Country, type (major / micro / independent), store link.
- **Straps.** Material, width, colour, maker, quick-release, micro-adjust, where it came from, and which watch it is currently mounted on.
- **Config.**
  - **Movements:** caliber, beat rate, lift angle.
  - **Categories.**
  - **Coloured labels.**
  - **Price tiers:** your own bands, each with an assumed "value %" used for Static valuations.
  - **Storage boxes:** numbered, with descriptions.
  - **Settings.**
- **Three separate ways to classify a watch, deliberately never mixed:**
  - **Category** is the design archetype: Dress, Sport, Chronograph, Tool / Field, Horology.
  - **Complications** are what the movement does: Date, Day, Dual Time Zone, Power Reserve, Annual or Perpetual Calendar, Moon Phase, and "Fancy."
  - **Tier** is the price band, derived from what you paid and defined by you.

### 2.12 The AI agents, in plain language

| Agent | What it does for you | When | Typical cost |
|---|---|---|---|
| **Market valuation** | Researches what the watch sells for on the secondary market, favouring *sold* prices over asking prices. Returns a low/mid/high range, confidence and evidence. | Monthly deep run for tracked watches; "Check price now" for a quick check | about $1–1.50 per watch (deep); the quick check is cheaper |
| **Spec autofill ✨** | Finds the official spec sheet and fills empty fields | A button on the form | 5–15¢ a click |
| **Catalog picker 🔍** | Fills case dimensions from a licensed catalog | A button on the form | free |
| **Deal scanner** | Checks brand stores for your wish-list watches | Daily | free (no AI) |
| **Reference finder** | Finds missing reference numbers, all flagged to verify | On demand | about 44¢ a watch |
| **Watch identify** (iPhone) | Recognises which of *your* watches is in a photo | On demand | a few cents |
| **Placard reader** (iPhone) | Reads the display card next to a watch at a show | On upload | about 5–8¢ |
| **Photo grader** | Grades photo shoots against a shot list | Local runs | about a tenth of a cent per frame |

A monthly spending limit acts as a backstop, and every cent is visible in Agent Execution Review.

---

## 3. The iPhone app ("TenTen"): the pocket

A native iPhone app, camera-first. Analysis stays on the web; the phone does the things you do with a watch in your hand.

### 3.1 Shape of the app
- **Tabs:** **Today · Collection · [Camera] · Rate · More.** The centre is a raised brass camera button that opens a full-screen camera over any tab.
- **Haptics everywhere:** a tap on the shutter, a buzz on a successful identification, ticks on ratings, and a bump when a duel is picked.
- **Optional Face ID lock.** It re-prompts only after more than a minute away, so a quick app switch doesn't nag you.
- **Updates.** Small updates arrive over the air with a "Restart to update" banner.

### 3.2 The camera: built for watches
Every camera mode shares these features:
- **Lenses.** Real iPhone lens stops (0.5× · 1× · telephoto), switching to the macro lens automatically when you get close.
- **Live dial-sharpness meter.** The headline demo.
  - A guide circle sits over the dial.
  - On every preview frame, the phone measures how sharp the centre of the image is, using the same mathematics as the desktop photo scorer.
  - The ring turns **solid white when the dial is sharp** and **dashed amber when it's soft**, with a live sharpness number.
- **Focus-aware shutter.** Press the shutter while the ring is amber and it *waits* for focus to land, then fires.
- **Retake warning.** Frames that were shot soft get a small amber "retake?" dot.
- **Tunable.** You can adjust the sharp/soft thresholds in More → Camera.

### 3.3 Identify: "which of my watches is this?"
1. Point the camera at a watch and take one photo.
2. The photo goes to Claude's vision model together with a text list of your collection (brand, model, reference, dial colour, material, size).
3. It returns up to three matches with a **confidence level and a one-line reason** (e.g. "green dial, date at 3"). It uses details like dial colour to tell apart sibling versions of the same model.
4. It also gives its own guess at what the watch is in general.

Results take about 7–10 seconds and cost a few cents, and **the sheet shows the exact cost and model used**.

**From the result you can:**
- **Wearing it.** Logs today's wear.
- **Photograph.** Goes straight into capture for that watch.
- **Add it.** If it's not yours, add it to the collection or the wish list, with the photo already set as the cover and the guessed brand, model and reference pre-filled. A guessed reference is marked "⚠ unverified."

### 3.4 Add a watch: "box to saved in under a minute"
- The add form takes a photo, ownership (owned / coming soon / wish list), brand (picked from your list, or added new), model, reference, category, price, sales tax, import fees, purchase date and storage box.
- Deeper specifications stay on the web.

### 3.5 Today: wear logging
- "On the wrist" cards for what you're wearing, each asking *How does it feel? Loved it · Fine · Meh*.
- **Identify it**, or **Choose** from a photo grid.
- "Worn recently": tap a photo to log it for today.
- **This Week** strip: seven days with thumbnails. Tap an empty day to back-fill it, or a filled day to edit it.
- Dated by the phone's local day, never the server's clock.

### 3.6 Rate My Watches: the party game
Hand your phone to a friend and let them rank your collection.
- **Locked mode.** The game runs full-screen with the back gesture disabled. The only way out is the owner's **Face ID or passcode**, so a friend can't wander into your prices or settings. **No prices are ever shown in the game.**
- **Who's playing.** The friend types a name or picks a "played before" chip. The owner can play too, and the owner's ranking becomes *the yardstick* everyone else is compared to.
- **Segments.** The collection is split into fair groups: by **type** (dress, sport, chronograph…), by **tier**, or both. Tiers are named neutrally ("Tier 2"), so even the grouping doesn't leak what anything cost.
- **The duel.**
  - Two watches side by side: *Which do you prefer?*
  - Each card shows the **front photo above the caseback photo**, and you can swipe through more shots of each watch in place.
  - Tap anywhere on a card to pick. **Equal** records a tie; **Skip** passes; Undo steps back.
- **The maths.**
  - A **Bradley–Terry** ranking model (the same family of statistics used to rank chess players and sports teams) chooses each next pair: least-seen watches first, then front-runners and near-equals, never a repeat, and sides randomised.
  - A segment ends automatically once every watch has had at least three comparisons and the podium has settled.
  - In simulation it reaches the same accuracy as random pairings with **3–4× fewer taps**.
- **The reveal.**
  - A podium (2–1–3, with photos).
  - **"87% — you agree with [owner]"**
  - A **Hot take:** *"you put the X at #1 — [owner] has it at #6."*
  - The full ranking.
- **Best in Show.** After two or more segments, the top three from each go into a final round that crowns one champion.
- **Hand back.** *"Thanks, [name]! Hand the phone back."* Then Face ID unlocks it.
- **Works offline,** saving results on the phone and uploading when there's signal.
- **On the web,** Reports → Ratings shows:
  - **the consensus** across every friend who has played,
  - **the most divisive watches**,
  - each friend's rankings and agreement with the owner,
  - and for every watch a score (1500 = average) plus whether its lead over the next watch is "clear" or "close."

### 3.7 Show mode and Admired: for watch fairs
- **Show mode.** Switch on "At a watch show" and name the event. The camera button changes look and now captures **Admired** watches: pieces you love seeing in the metal but don't intend to own.
- **Admired is not the wish list,** on purpose. Nothing here triggers deal alerts or wish-list totals.
- **Capture flow.** Shoot one watch at a time. Mark each frame **Watch** or **Placard**, then tap **Next watch →**.
- **Placard reading.** The AI reads the display card and pulls out the maker, model, reference, **price exactly as printed** ("CHF 48,000" or "Price on request") and details such as the movement or a limited-edition count. It fills only empty fields, so your own notes always win.
- **Built for exhibition halls with no signal.**
  - Every frame is saved on the phone first and sent in order whenever there's signal.
  - A frame is removed from the phone only once the server confirms it.
  - Retries can never create duplicates.
  - The status bar says how many are waiting.
- **On the web,** Admired watches are grouped by event for tidying up, with "why it caught my eye" tags: design, finishing, complication, photography.

### 3.8 Collection (lite) and the watch card
- A two-column photo grid with search and sort.
- **Prices are hidden by default.** This setting is meant for using the app in public at a show or a collectors' meet-up.
- **The watch card.** A swipeable photo pager plus the **keep judgements** that feed The Edit on the web: attachment, keep / maybe / sell, and a Sentimental toggle ("locks it in — The Edit never suggests selling it"). It also has a **Photograph this watch** button.

### 3.9 What the phone deliberately doesn't do
- **Dropped by design.** Siri, widgets, NFC tags and the share sheet. That keeps the app lean and fast to build.
- **Desk jobs stay on the web.** Reports, valuations, The Edit, Photo Lab review and full spec editing.
- **The split.** The phone *feeds* the web's analysis (wears and feels, attachment ratings, friends' rankings, angle-tagged photos), and the web does the thinking.

---

## 4. Photography: the heart of the system

Photography in TenTenLoupe is a complete workflow, not an upload button:
1. The app tells you **what to shoot** (Coverage).
2. It tells you **where to put it** (Session).
3. It **triages your frames** with free computer vision plus a very cheap AI grader.
4. **Accepting** a photo is the same act as publishing it.
5. It **displays every photograph uncropped**, letting the photo's real shape drive the layout.

### 4.1 The documented studio workflow
The app's documentation includes a full studio "craft" guide: the workflow the software was built around.
- **Kit:** a Canon EOS R10 with the RF 100mm f/2.8 L Macro, an overhead tripod, and the camera tethered by USB to a PC running Canon's EOS Utility. Frames land straight on the computer, and RAW files are finished in Luminar Neo.
- **A saved camera preset ("C1"):** manual exposure, ISO 100, f/8, fixed white balance, RAW, single-point back-button autofocus, electronic first curtain. It includes a lab-verified fix for the macro lens refusing to refocus after a big focus jump.
- **A four-switch pre-flight check** on the lens every session, printed as a checklist in the app's Session screen.
- **A working-distance table** that is ideal as an on-screen graphic. At f/8:

  | Distance | Frame width | Depth of field |
  |---|---|---|
  | 18″ | 47 mm | about 2 mm |
  | 32″ (the "hero" distance) | 133 mm | about 12.6 mm |

  A watch head is about 12 mm thick, so **anything shot at an angle must be focus-stacked**.
- **Focus bracketing in camera:** 30 shots with depth compositing on. Start on the nearest plane and touch nothing until it finishes.
- **The laid-down hero shot,** the cover image recipe:
  - landscape orientation, about 30″ away, camera 20–30° off vertical,
  - the watch on its caseback with the strap in a "lazy S" across the frame,
  - crown toward the camera,
  - hands at 10:10.
- **Lighting is called "the frontier"** in the docs: large diffuse light, white and black cards, one variable at a time. The docs admit it's still being worked out, which makes it an honest series of its own.

### 4.2 One folder per watch
- A script creates a capture folder for every watch, named `Brand Model [short-id]`. You can rename the readable part freely; the bracketed id is what's matched.
- **The Session screen.**
  - Pick a watch, and it shows the destination folder with a **Copy** button to paste into EOS Utility.
  - It shows the target angles still needed and the frames that have landed so far.
  - It includes the pre-flight checklist and a drop zone for phone photos.

### 4.3 Automatic triage: "cheap computer vision in bulk, AI only on the survivors"
A local scoring run goes through every capture folder in two layers.

**Layer 1: free computer vision.**
1. **Fingerprinting.** Every file is fingerprinted, so re-runs never double-count.
2. **Stack collapse.**
   - Bursts of five or more RAW frames shot within two seconds of each other are recognised as a **focus-bracket sequence**.
   - Each sequence is matched to the camera's finished composite, and the 30 source frames drop out of everything downstream.
   - A sequence with no composite is flagged *"unstacked — needs composite."*
3. **Dial-zone measurements.** The centre of each frame is treated as the dial and measured for:
   - **sharpness** (variance of the Laplacian, a standard edge-detection measure),
   - **brightness**,
   - **glare** (the share of blown-out pixels).
4. **Duplicate clustering.** A perceptual hash groups near-identical frames, and the sharpest of each group is marked best.
5. **Cull suggestions.** The weakest 20% by sharpness are flagged as cull candidates. **Nothing is ever deleted.**

**Layer 2: AI shot-card grading (Claude Haiku).**
- Only the survivors are sent: no stack source frames, no duplicates.
- Each frame is checked against a **shot list of four cards**, each with objective pass criteria:
  - dial from overhead,
  - caseback,
  - crown side,
  - low angle on the lugs.
- The result is **pass/fail plus a named defect in six words or fewer**, never an aesthetic score.
- The AI is told that deliberate shallow focus and controlled highlights are technique, not defects.
- **Cost:** about a tenth of a cent per frame, so a whole 15-watch session costs around two cents. A free, no-AI mode is also available.

**The per-folder report.** Every folder gets a self-contained HTML report:
- per shot card, a PASS with the best keeper, or RESHOOT with the reason,
- cull suggestions,
- sharpness rankings,
- stack sequences.

### 4.4 Review: accepting *is* publishing
The Review screen is a keyboard-first queue, one frame at a time:
- `←` `→` move between frames.
- `1`–`5` tag the angle.
- `A` accepts.
- `C` accepts and sets the photo as the watch's **cover**.
- `R` rejects (the file on disk is never touched).
- `Z` toggles a 100% zoom on the original.

**The side panel** shows:
- the frame's sharpness, highlight-control and grading verdict,
- its duplicate cluster with the alternatives faded,
- what the last scoring run cost,
- a standing reminder: *single frames are sharp only at their focal plane — never judge them against stacked composites.*

**Accept is a full publishing pipeline:**
1. It reads the original (including Canon RAW).
2. It corrects the rotation.
3. It produces a **2000-pixel, high-quality JPEG**.
4. It uploads it and generates a thumbnail.
5. It records the *final* image's true dimensions (which the display system depends on).
6. It tags the angle and optionally makes it the cover.

### 4.5 Coverage: the shooting to-do list
- **Five angles** form the app's photographic vocabulary: **Flat · Hero · Profile · Caseback · Macro.** They are the same everywhere: the film strip, the lightbox, the phone camera and the `1`–`5` keys.
- **The Coverage screen** is a watch × angle grid. It is **sorted worst coverage first** (*"a to-do list, not a trophy case"*).
- **One click from gap to shoot.** Click an empty cell and a Session opens, set to that watch and angle.
- **The documented campaign plan** shoots in passes: heroes first, then flat and caseback, then profile and macro for the best pieces. It is batched by storage box, about 12–15 watches per two-hour session.

### 4.6 Display: the frame fits the photograph
- **Never crop the subject.** Wherever the photo is the point, it is shown whole.
- **The watch page.** The hero image has a fixed height, and its width follows the photo's real proportions.
- **Two sizes of every cover image.** A large one for heroes and tiles, and a small one for thumbnails. Squeezing a large image into a tiny box visibly mushes it. The untouched original is never served to a page.
- **Collection tiles: the one place a crop happens.** The app picks, for each watch, *the photo whose shape is closest to square*, so the crop costs as little as possible. In the code's own words: *"choosing the right photograph is the same fix without 121 crosshairs"*. This replaced an earlier manual focal-point editor.
- **The Light Table** lands each watch on its *widest* photo. The surrounding space glows with a blurred copy of the picture (never a crop), and the glow is tuned to the photo's own brightness.
- **The lightbox:**
  - zoom with keys, scroll wheel or pinch,
  - drag to pan,
  - `1`–`5` to tag an angle,
  - `C` to set the cover,
  - drag thumbnails to reorder.
- **Inspiration → Photography.** A mood board where you paste watch photographs worth learning from, with notes on what makes them work.

### 4.7 Photography on the phone
- **The live sharpness meter** brings the desktop scorer's maths to the viewfinder. The phone runs the same Laplacian-variance measure live, on every preview frame.
- **Quick Capture.** Angle chips tag each frame *as you shoot*, so phone photos count toward Coverage immediately. Frames upload in the background at the same 2000-pixel standard as the studio pipeline.
- **The Caseback run.** The Rate tab counts watches with no caseback photo and walks you through them one by one in the camera, with Caseback pre-selected and **Next →** between watches. It exists because the friend game shows the caseback under every dial, so **the game itself creates the reason to complete your photography**.
- **Photos as data.**
  - A photo identifies a watch.
  - A photo of a placard becomes structured fields.
  - Front and caseback photos *are* the Rate My Watches game.

### 4.8 What's not built yet (say it honestly on camera)
- **"Track B" is not built.** The step that would classify each scored frame's angle automatically and give it a composite letter grade doesn't exist. Coverage is driven by angles you tag by hand (or at capture on the phone), and the letter grades and "Framing" bar in Review don't populate yet.
- **No grading card for the hero shot.** The AI grading cards don't include the hero ¾ view, so hero frames grade as "creative" with no pass/fail.
- **No bulk tagging.** Existing photos are tagged one at a time, in the lightbox.
- **Local only.** The tethered studio half runs only on the computer that holds the capture folders. Publishing from Review works only there.
- **Lighting recipes,** white balance and polariser guidance are still open questions in the craft doc.

These gaps make good material: "here's what I'm building next, and why."

---

## 5. Notes for the channel

**Features that demo best on video:**
1. **Identify.** Point the phone at a watch and have it named in about 8 seconds, with its reasoning and cost shown.
2. **The live sharpness ring** snapping from amber dashes to solid white as focus lands on a dial.
3. **Rate My Watches** with real friends: the locked phone, the duels, the reveal, the hot take, then the consensus report on the web.
4. **The Edit.** Drag the "Keep N" slider and watch the sell list re-form live, with no prices involved.
5. **Check price now.** Live AI market research, then open the evidence and the run trace to see *how* it got there.
6. **The Light Table** left running, with the loupe and glance mode, as B-roll or a background.
7. **The studio pipeline**, tethered capture → automatic triage → `A` to publish, timelapsed.
8. **Show mode at a watch fair**, with placards read automatically and the offline queue holding everything until there's signal.

**Ideas that carry an episode on their own:**
- An app that *refuses to let money decide what you sell*.
- AI that shows its receipts: cost, sources, every search.
- Photographs never cropped: the frame fits the photograph.
- Statistics from sports rankings, turned into a party game about watches.
- Every fact in one place, so the app never contradicts itself.

**Before filming, check:**
- The live state of Photo Lab coverage. Docs snapshots may be out of date.
- Which agents are enabled and what they currently cost. The figures above are typical observed costs.
- That production is up to date at caliber-shelf.vercel.app.
