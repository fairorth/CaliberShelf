# Photo Lab Game Plan

A tutorial and a campaign plan for getting the whole collection through the
Photo Lab — written for someone opening it for the first time.

Read alongside [`photo-lab.md`](photo-lab.md) (the craft) and
[`photo-lab-app.md`](photo-lab-app.md) (the software). Where those two
disagree with this file, they win — this is the working plan, they are the
reference.

**Where you stand today:** 124 shootable watches. 168 photos already uploaded,
**none of them tagged with an angle**. No frame has ever been scored. The
Watch Images folder is not configured yet, so the tethered half of Photo Lab
cannot run at all.

---

## Part 0 — Before the first frame

Three things, once. Nothing else in this document works until they are done.

### 0.1 Point the app at your photo drive

**Config → Settings → Watch Images folder location.** Enter the parent folder,
e.g. `D:\WatchImages`. Save.

This writes `profiles.watch_images_path`, and it is the single setting that
gates the scorer, the folder sync, Review's ability to display a frame, and
Accept's ability to publish one. It is currently **null**.

### 0.2 Create the per-watch folders

On the machine holding that drive:

```bash
npm run sync-watch-folders -- --dry-run
```

Read the list, then run it for real:

```bash
npm run sync-watch-folders
```

You get one folder per watch, named `<Brand> <Model> [<8-char id>]`. The
`[id]` token is the linkage — you can rename the readable half freely, but
never touch the bracket.

### 0.3 Decide what to do about the 168 untagged photos

Every existing photo has `angle = NULL`, which is why Coverage shows its empty
state instead of a matrix. You have two options, and you do not have to choose
now:

- **Leave them.** They still display, still act as covers. They just do not
  count toward coverage. As you reshoot properly, the new frames take over.
- **Tag the good ones.** Open a watch, click a photo to open the lightbox,
  press `1`–`5`. There is no bulk tool, so this is one photo at a time.

**Recommendation: leave them.** Tagging 168 photos by hand to describe frames
you are about to replace is work that expires. Tag *as you go* — when you
publish a new hero for a watch, spend ten seconds tagging whatever else that
watch already has.

---

## Part 1 — The rig

### 1.1 Canon EOS R10 — load C1 and leave it alone

Everything in the lab runs from the **C1 custom mode**, which holds:

| Setting | Value | Why |
|---|---|---|
| Mode | **M** | Nothing may drift between frames of a stack |
| ISO | **100** | Base ISO; the tripod buys you all the shutter you need |
| Aperture | **f/8** | Sharpest part of the lens before diffraction bites on APS-C |
| Shutter | to taste | Set against the histogram until polished-steel highlights are controlled |
| White balance | **fixed** | Never auto — two frames of one stack must match |
| Quality | **RAW (.CR3)** | C-RAW only if storage ever hurts |
| AF | **One-Shot, 1-point** | Subject detection, tracking, eye AF, Preview AF all **OFF** |
| AF trigger | **back-button** | Half-press = metering only; `AF-ON` = metering + AF |
| Shutter mode | electronic first curtain | Kills shutter shock at macro magnification |
| Drive | single | |
| Lens operation when AF unavailable | **Continue focus search** | Lab-verified fix for the RF100 refusing AF after a big focus jump |

Auto-update on C1 is **OFF** deliberately, so an experiment cannot quietly
rewrite your known-good preset. To improve the recipe: switch to a normal
creative mode, change it there, verify, then re-register C1 via
**MENU → Set-up → Custom shooting mode → Register settings**.

### 1.2 RF 100mm F2.8 L Macro IS USM — the four switches

Before every session, physically check:

1. **AF/MF → AF**
2. **Focus limiter → FULL.** The lab works across the whole range; a limiter
   set to the near band is the classic "why won't it focus" ten minutes.
3. **IS → OFF.** On a tripod, image stabilisation fights itself and softens
   frames. This matters more at macro magnification than anywhere else.
4. **SA (spherical aberration) control ring → neutral, and locked.** It is
   easy to knock. A nudged SA ring reads as a mysteriously soft or oddly
   glowing frame that no amount of refocusing fixes.

### 1.3 The distance table — the part that is not in the old doc

This is the working geometry for a 100mm lens on APS-C, computed for a
0.019 mm circle of confusion. **Distance is sensor plane to watch.**

| Distance | Frame width | Depth of field @ f/8 | @ f/11 | Use for |
|---|---|---|---|---|
| 16″ | 29 mm | 0.9 mm | 1.2 mm | Macro detail only |
| 18″ | 47 mm | 2.0 mm | 2.7 mm | Flat dial-on, tight |
| 20″ | 60 mm | 3.1 mm | 4.2 mm | Flat dial-on, comfortable |
| 24″ | 86 mm | 5.6 mm | 7.8 mm | Profile, caseback |
| 28″ | 109 mm | 8.8 mm | 12.1 mm | **Laid-down hero, tight** |
| 32″ | 133 mm | 12.6 mm | 17.3 mm | **Laid-down hero, standard** |
| 36″ | 156 mm | 17.0 mm | 23.4 mm | Hero with a long strap sweep |

Three things fall out of this table:

- **16″ cannot frame a whole watch.** The field is 29 mm wide; a 40 mm head
  does not fit. `photo-lab.md` says "16–20″" for full-watch work — in practice
  **18–20″** is the range, and 16″ is macro territory. A 40 mm watch fills 85%
  of the frame at 18″ and 67% at 20″.
- **Depth of field at the dial-shot distance is about two millimetres.** A
  watch head is roughly twelve millimetres thick. This is why stacking is not
  optional for anything angled — and why even a "flat" dial-on shot can lose
  the bezel edge or the hand tips if you are careless about parallelism.
- **The hero shot is taken from much further back than the dial shot**, and
  the depth-of-field problem largely solves itself there: 12.6 mm at 32″ is
  enough for a watch head and a modest strap arc in one frame.

---

## Part 2 — EOS Utility

### 2.1 Session setup, once per watch

1. Connect the R10 over USB-C. EOS Utility → **Remote Shooting**.
2. **Preferences → Destination Folder.** Paste the path for tonight's watch.
   Photo Lab gives you this: open **Photo Lab → Session**, pick the watch, and
   the path is displayed with a **Copy** button.
3. **Record to PC + card.** The PC copy is for immediate inspection, the card
   is your backup against a USB drop mid-stack.
4. Fire one test frame and confirm it lands in the right folder. Every session,
   every time — a mis-pointed destination is only discoverable after the fact.

> **This is the main friction in the whole workflow.** You re-point the
> destination for each of 124 watches. It is about fifteen seconds each if you
> keep the Session screen open on a second monitor and copy-paste. Batch by
> box so the watches come out of one drawer in one run.

### 2.2 Focusing remotely

Two rectangles on the live view, and confusing them wastes real time:

- **Inner square = the AF point.** Toggle with *AF Point Disp*, which must be
  **ON** for remote AF to work at all.
- **Outer frame = the magnification frame only.** It does not focus anything.

**Double-click behaviour:**

- Double-click **inside the inner AF point** → runs One-Shot AF. Green = success.
- Double-click **elsewhere** → *moves* the AF point there and opens 5×. It has
  not focused yet. A second double-click on the relocated point runs AF.

**AF point colours:** green = One-Shot success · blue = Servo success ·
orange = failure. Read the colour against the AF mode you are actually in.

**Fine focus nudges** (keyboard, lab-verified on this R10 + EOS Utility 3.20):

| Size | Closer | Farther |
|---|---|---|
| Large | `I` | `O` |
| Medium | `K` | `L` |
| Small | `,` | `.` |

The fastest reliable flow is **AF → 10× → tiny nudge → shoot**. The small
nudges keep working while the capture window stays in AF mode.

### 2.3 Focus bracketing for stacks

In-camera Focus Bracketing, starting point:

- **30 shots · increment 3 · exposure smoothing ON · Depth Composite ON · crop ON**

Start focus on the **nearest** plane that must be sharp; the camera walks focus
away from you. Trigger once and **touch nothing** until the sequence finishes.

Then inspect the composite *and* the first, middle and last source frames:

| Symptom | Fix |
|---|---|
| Stack ran out before the far edge was sharp | More shots |
| Soft bands between sharp zones | Smaller increment |
| Halos or edge artefacts on the composite | More framing margin, crop ON, or stack externally |
| Composite is a JPEG despite RAW sources | Normal — Canon never composites to RAW |

RAW sources are retained alongside the composite. You do **not** need RAW+JPEG
mode for stacking.

`photo-score.mjs` understands all of this: it groups CR3s shot less than two
seconds apart into runs, treats runs of five or more as bracket sequences,
collapses each to its composite, and marks the thirty sources `stack_role =
'source'` so they never reach Review or cost you an AI call.

---

## Part 3 — The shot list

Five angles. The app's canonical order is also the `1`–`5` key mapping in
Review and the lightbox.

| Key | Angle | Distance | Stack? | What it is for |
|---|---|---|---|---|
| `1` | **Flat dial-on** | 18–20″ | Short, or none | The reference shot. Dial parallel to the sensor |
| `2` | **Hero ¾** | 28–32″ | **Yes** | The cover. See Part 4 |
| `3` | **Profile** | 24″ | Yes | Case flank, crown, thickness |
| `4` | **Caseback** | 20–24″ | Short | Engraving or movement |
| `5` | **Macro** | 16″ | Yes | One detail: a logo, a hand tip, a texture |

### On the flat dial-on shot

Dial parallel to the sensor is the whole game. Two millimetres of depth of
field at 18″ means that if the watch is tilted by even a couple of degrees, one
side of the dial goes soft. A small spirit level or a hard look at the live
view at 10× is worth the ten seconds. The hands sit two to four millimetres
above the dial, so if you want the hand tips *and* the dial printing crisp,
a five-frame stack is cheap insurance.

---

## Part 4 — The laid-down hero shot

This is the new one, and it is the most important shot in the collection.

### 4.1 Why it matters more than the others

The app is built to reward a wide frame, and your collection currently has
almost none:

- The **watch page hero** renders `object-contain` at a fixed 460 px height.
  A 3:2 landscape frame fills 690 × 460. A portrait frame at the same height is
  a narrow column with dead space either side.
- The **home Light Table** picks its landing frame by **widest aspect ratio**,
  with the hero angle only breaking ties. A landscape hero wins that slot
  automatically.
- Of the 169 photos measured when image dimensions were backfilled: **114
  portrait, 31 square, 20 landscape, 4 wide.** Almost every watch currently
  lands on a portrait frame in a layout that wants a wide one.

One good landscape hero per watch changes how both the home page and the watch
page look, more than any other single frame.

### 4.2 The setup

**Distance:** 30–32″ sensor to watch. Frame width at 32″ is 133 mm — a 40 mm
head occupies about 30% of the width, which leaves room for the strap to do
the work of filling a landscape frame.

**Camera orientation:** landscape. This is the one shot that is not shot
square-on-overhead in portrait.

**Camera angle:** 20–30° off vertical, not straight down. Straight down is the
flat dial-on shot. The tilt is what gives the case side, the crown and the
crystal edge something to catch light on, and what makes it read as a
photograph rather than a scan.

**The watch:** laid on its caseback on the surface. Not on a stand, not
propped. The point of "laid down" is that it looks at rest.

**The strap or bracelet is the composition.** A watch head alone is roughly
square and will never fill a landscape frame. Arrange the strap in a **lazy S**
or a shallow arc that extends to both sides of the head:

```
        ╭──────╮
   ~~~~─┤ DIAL ├─~~~~~
        ╰──────╯
   strap sweeps left      and right, filling the width
```

- **Leather:** curls naturally. Coax it into a gentle S; do not flatten it.
- **Bracelet:** lay it out with a shallow curve and let the links fan slightly.
  A dead-straight bracelet looks like a hardware catalogue.
- **Rubber:** stiffest, wants to spring flat — a light weight hidden under the
  far end, or shoot it slightly curled with the tail out of frame.

**Composition:**

- Head at roughly one third in from the left or right, strap sweeping toward
  the opposite corner.
- Watch and strap together fill **75–85% of the frame width**, with margin all
  round for straightening and for the composite's crop.
- **Crown side toward the camera** — it is the most identifying feature of a
  case profile.
- **Hands at 10:10.** The classic watch-photography convention: the hands
  frame the logo, clear the date window, and read as a slight smile. Set the
  time roughly; nobody is checking the seconds.

**Exposure:** the same C1 recipe. f/8 at 32″ gives 12.6 mm of depth of field,
which covers the head; stack anyway if the strap sweep runs toward or away
from you, because the far end of an arc can easily sit 30 mm off the near end.

### 4.3 Where it lands in the system

Tag it **`2` / hero** in Review, and press **`C`** to accept it as the cover.
Because it is your widest frame, it will also become the home page's landing
frame for that watch.

> **Known gap:** the scorer has no shot card for the hero ¾. Its four cards are
> `overhead_dial`, `caseback`, `crown_side` and `lug_low`, so a hero frame
> comes back labelled `creative` with no pass/fail. It is still scored by the
> CV layer — sharpness, glare, duplicates — and it still promotes normally.
> You just do not get an automated verdict on it. See
> [`photo-lab-app.md`](photo-lab-app.md) §7.2.

---

## Part 5 — Tutorial: one watch, end to end

Do this once, on a watch you like, before planning anything bigger. Budget an
hour; it will take twenty minutes the second time.

1. **Config → Settings** — set the Watch Images folder if you have not.
2. **`npm run sync-watch-folders`** — create the folders.
3. **Photo Lab → Session** — pick the watch. Copy the destination path.
4. **EOS Utility** — set the destination, record to PC + card, fire a test
   frame, confirm it lands.
5. **Clean everything.** Watch, crystal, background. Dust now beats retouching
   later, and at this magnification you will see every particle.
6. **Shoot the laid-down hero** (Part 4). One stacked sequence.
7. **Shoot flat dial-on and caseback.** Two more sequences, or singles.
8. **Score it:**
   ```bash
   npm run photo-score -- --watch <uuid> --dry-run
   ```
   Read the output. Then for real:
   ```bash
   npm run photo-score -- --watch <uuid>
   ```
   The watch id is the 8 characters in the folder name — the full uuid is in
   the watch page URL.
9. **Open the folder report.** `_photo-report.html` in the watch folder: frames
   ranked, stacks collapsed, duplicates grouped, reshoot list at the top. This
   is the fastest way to see whether the session worked.
10. **Photo Lab → Review.** For each frame: `Z` to check it at 100%, `1`–`5`
    to tag the angle, then `A` to accept or `R` to reject. On the hero, press
    `C` instead of `A` to make it the cover.
11. **Open the watch page.** The hero should fill the frame horizontally, and
    the film strip should show your tagged angles instead of `UNTAGGED`.
12. **Open the home page.** That watch should now land on the wide frame.

If step 11 or 12 disappoints, fix the shot before you scale it up to 124
watches. That is the entire reason for doing one first.

---

## Part 6 — The campaign

### 6.1 Do not shoot five angles on the first pass

124 watches × 5 angles, each stacked, is somewhere north of thirty hours of
shooting plus review. You will lose interest around watch forty and the
collection will sit half-done, which is worse than any single shot being
imperfect.

**Shoot in passes, widest value first.**

| Pass | Scope | Watches | Per watch | Total |
|---|---|---|---|---|
| **1** | **Laid-down hero only** | 124 | ~8 min | **~17 h** |
| 2 | Flat dial-on + caseback | 124 | ~7 min | ~15 h |
| 3 | Profile + macro | top ~40 only | ~8 min | ~5 h |

Pass 1 alone gets every watch a proper cover, fixes the home stage, and takes
Coverage from 0/5 everywhere to 1/5 everywhere. That is the pass that changes
how the app feels. Passes 2 and 3 are refinements you can do at leisure, or
never, for watches that do not warrant it.

### 6.2 Batch by box

Boxes are already how the collection is physically organised, and Coverage
filters by box. One box per session means one drawer open, one set of watches
staged, and no hunting.

A realistic session is **12–15 watches in two hours** at pass-1 pace. That is
about **9 sessions** to finish pass 1.

Per session:

1. Filter Coverage by the box. Sort by worst coverage first.
2. Stage the whole box: clean everything up front, set every watch to 10:10.
   Batching the fiddly bits beats interleaving them.
3. For each watch: Session → copy path → EOS destination → test frame → shoot
   → next.
4. At the end of the session, score the whole batch in one run:
   ```bash
   npm run photo-score -- --dry-run --limit 3
   npm run photo-score
   ```
5. Review the batch in one sitting. It is keyboard-only and goes fast:
   `Z`, `2`, `C`, next.

### 6.3 Cost

Scoring is nearly free. Track A grades roughly $0.0015 per surviving frame on
Haiku, and stack sources and duplicate losers never reach the model. A pass-1
session of 15 watches with one stacked hero each is about 15 graded frames —
**around two cents.** The CV layer is $0 and `--no-ai` makes the whole run free
if you want it.

The rule from `agents.md` still applies: **always `--dry-run --limit N` before
a real run.**

### 6.4 Tag as you go

When you accept a new hero for a watch, spend the extra ten seconds opening
that watch's lightbox and tagging whatever old photos are worth keeping. By
the end of pass 1 the untagged backlog will have largely sorted itself, without
ever being a project of its own.

---

## Part 7 — When something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| Session shows "No Watch Images folder configured" | `watch_images_path` is null | Config → Settings |
| Review says "run the photo-score pass" and there is nothing | No score rows | Run `npm run photo-score` on the capture machine |
| Review shows a broken image | Frame API cannot reach the file | You are not on the machine holding `\WatchImages` |
| Accept fails with "only works on the machine that holds the capture folders" | Same | Do Review on the tether workstation |
| Coverage still shows the empty-state panel | No photo anywhere has an angle | Tag one photo; the matrix returns immediately |
| Coverage cells stay empty after scoring | `angle_class` is never computed — Track B is unbuilt | Tag the angle by hand in Review; see app doc §7.1 |
| Hero frame does not fill the watch page | It is portrait | Reshoot landscape — Part 4 |
| AF does nothing after a big distance change | *Continue focus search* is off | C1 setting; re-register if needed |
| Double-click only magnifies | AF Point Disp off, or the click was outside the inner point | Toggle AF Point Disp |
| Camera refocuses on its own after One-Shot | Preview AF is on | Disable it |
| Whole frame mysteriously soft | SA control ring knocked off neutral, or IS left on | Check the lens switches |
| Frames land in the wrong watch folder | EOS destination not re-pointed | Test frame at every watch change |
| A stack has no composite | Depth Composite off, or the sequence was interrupted | The scorer flags it `unstacked`; reshoot |
