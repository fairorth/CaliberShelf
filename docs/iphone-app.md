# TenTen for iPhone — feature overview (Expo / React Native)

Status: **DECIDED 2026-10-11 — build it with Expo, camera-first.** Marc chose
Expo over the `/m` web route, and **dropped Siri, widgets, NFC and the Share
sheet** (§9–§11 below are kept for the record, marked dropped). With them gone
the app needs no Swift at all — it is TypeScript end to end, built in Expo's
cloud, no Mac. The deciding feature is deep camera integration (§3, §4, §8).
See §19 for the plan and where it stands.

Companion to `docs/mobile-app.md`, which holds the phone audit and the
"what is the phone for" analysis.

Scope rule carried over from `mobile-app.md` §3: the phone does five jobs —
**Wear, Identify, Add, Rate, Look up** — plus the things only a native app can
do. Everything analytical stays on the web.

Legend for each feature:
- **Native-only?** — could the `/m` web route do it too? (Yes / Partly / No)
- **Swift needed?** — Expo is TypeScript, but a few iOS features (widgets, Siri,
  Share sheet) must be written as small Swift add-ons inside the Expo project.
- **Size** — S (days), M (a week or two), L (several weeks), for one developer
  working with Claude.
- **Release** — v1 (first usable app) or Later.

---

## 1. The shape of the app

Five tabs along the bottom, as in the `/m` design, with the camera in the middle:

**Today · Collection · ◉ Camera · Rate · More**

Plus things that live *outside* the app: a Lock Screen and Home Screen widget,
Siri phrases, a TenTen entry in the Share sheet, and NFC tags in the boxes.
Those are the parts the web cannot reach, and in daily use they may matter more
than the tabs — the best wear log is the one you fill in without opening anything.

Sign-in is your existing Supabase account, once, then **Face ID** to unlock.
All data is the same database the web app uses; a wear logged on the phone is on
the desktop Wear Log instantly, and vice versa.

---

## 2. Today — the home tab

The screen the app opens to. It answers "what am I wearing, and how does it feel?"

- **On the wrist.** Today's watch as a large card: cover photo, brand · model,
  and the feel buttons — **Loved · Fine · Meh** — big enough to hit without
  looking. Several watches in a day are allowed (the database already permits it).
- **Nothing logged yet?** One prompt: *"What are you wearing?"* with three ways to
  answer — point the camera (§3), tap a **Recent** strip (last ~10 worn, by
  photo), or search.
- **This week.** A 7-day strip of small photos. Tap an empty day to back-fill
  ("forgot yesterday" is the commonest fix); long-press a day to change or delete.
- **One nudge at a time**, never a list: *"The Omega 3888 has never been worn"*,
  *"3 wears this week without a feel"*, or *"14 days since anything from Box 4"*.
- **Dates are your phone's local date.** (The web app currently uses UTC and logs
  US evenings as tomorrow — bug B1 in `mobile-app.md`; fixed on the web in M0
  regardless.)

Native extras: a soft haptic tick on logging; works with no signal (§12).

Native-only? Partly (the layout is web-able; haptics/offline are better native) ·
Swift? No · Size M · **v1**

---

## 3. Identify — "which watch is this?"

The centre camera button. Point at a watch (on the wrist, in the box, in someone
else's hand) and the app tells you what it is.

**What you see**
1. A live camera view with a circle guide. Tap the shutter (or just hold steady —
   auto-capture is possible).
2. Within a couple of seconds, a result card:
   - **It's yours:** your cover photo large, two look-alike runners-up beneath
     (two blue Speedmasters *will* happen — one tap settles it), and actions:
     **Wearing it · Rate it · Open · Add photo**.
   - **Not in your collection:** *"Looks like a Tudor Black Bay 58, ref 79030B"*
     with **Add to collection** and **Add to wish list**, both pre-filled (§4).
3. **Wrong?** "Pick it myself" opens the photo grid. That choice is remembered as a
   correction, which makes the next identify of that watch better.

**How it works — two engines, in order**
- **v1: Claude vision on the server.** The photo plus a compact text list of your
  ~170 watches (brand, model, ref, dial colour, case material, size) goes to a new
  web endpoint, which asks Claude for the best matches. Estimated **2–3¢ per
  identify**, a few seconds, needs a connection. Logged to `agent_runs` like every
  other agent.
- **Later: on-device matching.** iOS can turn each of your photos into a compact
  "fingerprint" and compare a new photo against them on the phone — free, instant,
  offline. It is only as good as your reference photos (a studio cover shot vs. a
  dim box shot), so it starts as a first guess with Claude as the fallback, and
  improves as the Photo Lab coverage grows.

Native-only? Partly (v1 works on the web; the live viewfinder, auto-capture and
on-device matching are native) · Swift? v1 No; on-device matching Yes (small) ·
Size v1 M, on-device L · **v1** (Claude), **Later** (on-device)

---

## 4. Add a watch — camera first

**Starting points:** Identify said "not in your collection"; or **+** on the
Collection tab; or a shared photo or link (§9).

**Flow**
1. **Shoot.** The native camera stays open: shoot several frames — dial, side,
   caseback — without leaving the screen. Tap-to-focus and close-up (macro on
   recent iPhones) work properly. The first frame is the cover; drag to reorder.
2. **Confirm what it is.** Brand / model / reference arrive pre-filled from the
   photo (reference marked ⚠ unverified, exactly as spec autofill does today).
   Brand is a picker over your existing brands, with "new brand" inline.
3. **Where it sits:** Owned · Coming soon · Wish list (one control), Category,
   purchase price, Box.
4. **Save.** Photos upload in the background — you can put the phone away. Then
   *"Fill specs ✨?"* runs the existing spec autofill on the server and fills only
   empty fields.

**Already own it?** Identify ran first, so the duplicate warning appears *before*
the form, not after you've typed.

Everything else (measurements, complications, movement, labels, timegrapher)
stays on the desktop edit form. Target: **under a minute** from box to saved.

Native-only? Partly (multi-frame camera, background upload) · Swift? No ·
Size M · **v1**

---

## 5. Rate — feeding The Edit

Three ways in, all writing the same fields the web Rate / Sort / Head-to-head
screens write (`attachment`, `keep_decision`, face-offs).

- **The deck.** Full-screen cards in random order, **no prices on screen** (the
  web Rate rule). Attachment is five big stops — Max · High · Medium · Low · None.
  Then the keep decision by gesture: **swipe right = Keep, left = Sell, up =
  Maybe**, with a haptic bump at the decision point and an undo. Replaceability is
  written out in words, not hidden in a tooltip.
- **Rate this one.** From Identify or the watch card — the watch in your hand.
  The best moment to judge a watch is while holding it, and today there's no way
  to do that.
- **Head-to-head.** Two watches **side by side** on one screen, tap the keeper.
  "Can't choose" and Undo are real buttons.

The Edit's ranking, the sliders and the To Sell goal stay on the web: the phone
feeds the algorithm, it doesn't run the meeting.

Native-only? Partly (gestures and haptics feel much better native) · Swift? No ·
Size M · **v1**

---

## 6. Collection

- **Search** at the top, always (by brand, model, reference or nickname).
- **Filter chips:** Owned · Coming · Wish (wish list hidden until asked, as on the
  web), Category, Box, Keep decision, Guide watch.
- **Sort:** Recently worn · Brand · Least worn · Newest.
- **List or grid**, with small thumbnails, scrolling smoothly through all 170+.
- Kept on the phone after the first load, so it opens instantly and works offline.

Native-only? No · Swift? No · Size S–M · **v1**

---

## 7. The watch card

One screen per watch, top to bottom:

1. **Photos** — swipe through, pinch to zoom, natural shape (no letterboxing).
2. **Name** — brand · model · reference, and one status line: Owned / Coming / Wish
   · Box · strap.
3. **Actions** — **Wearing it · Rate · Add photo · Strap**.
4. **Wear** — last worn, times worn, feel tally (Loved / Fine / Meh).
5. **Money, one line** — paid and current value with the gain in green/red, using
   the same valuation rule as the web (one value per watch, from `valuation.ts`).
   Can be hidden. *(Decision open — see §15.)*
6. **"Open on the web"** for everything else.

**Strap** opens a list of straps that fit (matching lug width first) and swaps
with one tap. **Add photo** opens the capture screen (§8) with this watch already
chosen.

Native-only? No · Swift? No · Size M · **v1**

---

## 8. Photo capture (Quick Capture, native)

The phone counterpart to Photo Lab — not a replacement for the R10 rig.

- Choose the watch once (or arrive from its card), then shoot frame after frame.
- **Guided angles:** the five Photo Lab angles (flat, hero, profile, caseback,
  macro) as a row of chips; tap one before shooting and the frame is **tagged with
  that angle**, so phone shots count in the Photo Lab coverage matrix — they don't
  today.
- A filmstrip with undo per frame; uploads continue in the background.
- Optional overlays: a dial-centring circle and a level, so phone shots are
  consistent with each other.

Native-only? Mostly (the live camera with overlays and background upload) ·
Swift? No · Size M · **Later** (v1 has "Add photo" with the basic camera)

---

## 9. Share into TenTen — DROPPED 2026-10-11

TenTen appears in the iPhone Share sheet.

- **Share a listing** — Chrono24, eBay, a dealer site, a Reddit post — and TenTen
  offers **Add to wish list**. A server endpoint reads the page and pre-fills
  brand, model, reference, asking price and a photo; you confirm. The link is kept
  on the watch.
- **Share a photo** — from Photos, Instagram, Messages — and TenTen offers
  **Identify** or **Add**.

This matches how watches are actually found, and the web app can't do it at all.

Native-only? **Yes** · Swift? Yes (small Share extension) · Size M ·
**Later** (strong candidate for v1.1)

---

## 10. Widgets — DROPPED 2026-10-11

- **Lock Screen** (small): the watch on your wrist today, or *"Log today's watch"*.
  Tap → the app opens on Today.
- **Home Screen, small:** today's watch photo + feel.
- **Home Screen, medium:** today's watch plus **Recent** — the last four worn as
  buttons. Tap one to log it **without opening the app** (iOS 17 interactive
  widgets), then Loved / Fine / Meh right in the widget.

For daily logging, this is the single most valuable native feature: two taps on
the Home Screen and the day is recorded.

Native-only? **Yes** · Swift? Yes (widgets are SwiftUI; the data comes from the
app) · Size M · **v1.1**

---

## 11. Siri, Shortcuts and NFC box tags — DROPPED 2026-10-11

**Siri / Shortcuts**
- *"Hey Siri, I'm wearing the Speedmaster"* → logged, with a spoken confirmation.
  Nicknames work, which matters with 170 watches.
- *"Hey Siri, what did I wear yesterday?"*
- Shortcuts actions — **Log wear**, **Ask what I'm wearing** — for automations
  like "every weekday at 8:00, ask me".

**NFC tags in the boxes** (a few cents each)
- In the app, hold the phone to a tag and choose the watch: the tag is now that
  watch's slot.
- From then on, **tap the phone on the slot as you take the watch out** → logged
  as today's wear, with the feel prompt. No unlock-and-navigate, no camera.
- Works from the Lock Screen: iPhones read these tags in the background and show
  a "TenTen: log wear" banner.
- The tag can also open the watch card instead ("what's in this slot?").

Native-only? **Yes** · Swift? Siri yes (small); NFC no · Size Siri M, NFC S ·
**Later**

---

## 12. Works with no signal

- Your collection (names, details, thumbnails) is kept on the phone, so browsing,
  searching and the watch card work in the safe room, a basement or a show hall.
- **Wears, feels, ratings and strap swaps** made offline go into a queue and send
  themselves when the signal returns. A small *"2 waiting to sync"* shows until then.
- Photos shot offline upload later in the background.
- Identify (v1), spec autofill and wish-list link reading need a connection and
  say so plainly.

Native-only? Partly (the web can do a weaker version) · Swift? No · Size M ·
**v1** for the collection copy and the wear/rate queue

---

## 13. Notifications

All optional, each with its own switch:

- **Evening reminder** — at a time you pick, only if nothing was logged today.
- **Feel reminder** — the morning after a wear with no feel.
- **Deal alert** — a wish-list watch came into stock (from the daily deal-check).
- **Price check finished** — when a "Check price now" you started has a result.

Native-only? No (web apps on the Home Screen can get notifications too, but
native ones are more reliable and support action buttons — *Log Speedmaster* right
from the reminder) · Swift? No · Size S–M · **Later**

---

## 14. More

- **Deals** — the wish-list availability list, read-only.
- **Box lookup** — what's in each box, with photos.
- **Guides** — opens the existing guide pages.
- **NFC tags** — set up and manage box tags (§11).
- **Settings** — notifications, Face ID, show/hide money, sign out, version.
- **Open TenTenLoupe on the web.**

---

## 15. Deliberately NOT in the iPhone app

Reports (all of them) · Market overview · The Edit ranking and sliders · To Sell ·
Sold archive · recording, editing or undoing a sale; listing for sale · price-check
setup and research switches · Watch Values · valuations history · Photo Lab
coverage, session and review · full spec editing, timegrapher entry · brands,
movements, categories, labels, tiers, boxes and all Config · batch import ·
inspiration board · agent run review.

Each of these is a desk job. "Open on the web" is always one tap away.

---

## 16. What has to be built behind it

The phone can't call the web app's server actions (the code behind every Save
button today), so:

- **Plain reads and writes go straight to Supabase** with your login. The
  database's row-level security already makes that safe; no new server code.
- **New web endpoints** for anything that needs a secret key or heavy work:
  identify, read-a-listing, spec autofill (exists — needs to accept the phone's
  login), photo upload processing (thumbnails), price check (exists).
- **Small database additions:** push-notification tokens, NFC tag ↔ watch
  mapping, the per-wear "logged from" source (optional).
- **Shared logic stays single-sourced.** The rules that must never disagree —
  current value (`valuation.ts`), gain math (`gain.ts`), tiers, the Zod
  validation — are imported by the phone app, not copied. This means arranging
  the repository so both apps can import one copy (a `mobile/` folder in this same
  repo, with the shared files moved somewhere both can reach).

**Tools and costs**
- Apple Developer account: $99/year.
- Expo's cloud builds (EAS) build the iPhone app without a Mac; the free tier
  covers a few builds a month — check current limits before committing.
- Small updates (most screen changes) can be sent to your phone over the air
  without a new build; anything touching the Swift parts needs a build.
- Install via TestFlight (builds last 90 days) — no public App Store needed.
- **Testing is on your phone, not mine.** I can't run an iPhone simulator on this
  Windows machine, so each build is checked by you on the device — unlike the web
  app, where I verify before handing over.

---

## 17. Release plan at a glance

| Release | Contents | Rough size |
|---|---|---|
| **Groundwork** (needed by either route) | Web bug fixes (M0); endpoints that accept the phone's login; identify endpoint; shared-code arrangement | 1–2 weeks |
| **v1** | Today · Identify (Claude) · Add (camera-first) · Rate (deck, rate-this-one, head-to-head) · Collection · Watch card · Strap swap · offline copy + wear/rate queue · Face ID | 4–6 weeks |
| **v1.1** | Widgets (incl. interactive Recent) · Share sheet (wish list from a link) | 2–3 weeks |
| **Later** | Guided photo capture with angle tags · Siri & Shortcuts · NFC box tags · notifications · on-device identify | 1–2 weeks each |

For comparison, the `/m` web route covers roughly the v1 row (without true
offline, the multi-frame camera and the haptics) in about a third of the time,
and none of the v1.1 / Later rows except notifications.

---

## 18. Decisions this overview is meant to support

1. **Expo app or `/m` web pages?** The deciding features are §9–§11 (Share sheet,
   widgets, Siri, NFC) — they exist only in the native app.
2. Money on the watch card: shown, hidden by default, or absent?
3. Which "Later" items matter most — that sets the order after v1.1.

---

## 19. The plan as decided (2026-10-11)

1. **Groundwork — DONE in v1.11.2** (needed whichever route; nothing wasted):
   - The M0 phone bug fixes from `mobile-app.md` §2.1 (B1–B6), shipped to the
     existing web app.
   - **Bearer-token auth for API routes** — `getRequestAuth()` in
     `src/lib/supabase/request.ts` accepts the web cookie or
     `Authorization: Bearer <supabase access token>`; the middleware passes
     bearer requests to `/api/*` through instead of redirecting them to
     /login. spec-fetch and price-check use it. Queries run as the user, so
     RLS applies exactly as on the web.
   - **`POST /api/identify`** — photo + roster → matches + guess
     (`docs/agents.md` §2b). Contract in `src/lib/validations/identify.ts`.
   - **Shared code stays where it is.** The pure files (dates, valuation,
     gain, tiers, the-edit, validations, types/watch) are imported by the
     phone through the same `@/lib/...` paths; an ESLint rule in
     `eslint.config.mjs` fails the build if one of them imports Next.js,
     Supabase, React or server code.
   - **Not yet exercised with a real token or a real photo** — the first
     end-to-end call happens in the camera trial (the endpoints were checked
     for the unauthenticated and forged-token paths only).
2. **Camera trial (~1 week)** — a bare Expo app on Marc's iPhone:
   viewfinder (react-native-vision-camera), tap-to-focus, macro, multi-shot,
   the five angle chips, a live dial-sharpness warning, and upload to a real
   watch; plus one call to `/api/identify`. **Decision gate:** if it does not
   clearly beat the iOS camera sheet, stop and build the `/m` web pages
   instead. Needs: the $99/yr Apple Developer account, an Expo account, and
   Marc's iPhone registered for development builds.
3. **v1 (4–6 weeks)** — camera-centred: Identify, Add, Quick Capture with
   angle tags; then Today + feel, Rate, Collection lite, the watch card,
   strap swap, offline queue, Face ID.
