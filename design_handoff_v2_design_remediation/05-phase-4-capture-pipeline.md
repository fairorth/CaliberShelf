# 05 — Phase 4: capture pipeline (inbox → watch folder)

Run after `FIXES-ROUND-1.md` and the rename. Branch `feat/capture-pipeline`.

This phase gives the Photo Lab Session view a real filesystem linkage. It is the difference
between the app knowing *about* photography and the app *running* the shoot. Read
`03-phase-3-photo-lab.md` §D1/§2 first — this replaces the "copy the folder path" interaction
described there with something better.

---

## The concept

Today the workflow is: open EOS Utility, change the destination folder to the watch you are
about to shoot, shoot, repeat next time. That manual step happens before every session and is
the one place the whole system can silently go wrong.

Instead: **EOS Utility's destination is set once, permanently, to a fixed inbox folder.** The app
knows which watch is being shot and when, so a small watcher process files every arriving frame
into the right watch folder automatically. The user never opens the EOS Utility destination
dialog again.

---

## Folder model

Root comes from `profiles.watch_images_path` (today `c:\WatchImages`).

```
c:\WatchImages\
  _inbox\                                  ← EOS Utility destination, set once, forever
  _archive\                                ← folders of deleted watches
  Omega Speedmaster [cc2d5a1b7e3f]\
    IMG_1234.JPG                           ← single frame, app-visible
    IMG_1240.JPG                           ← in-camera depth composite, app-visible
    _raw\
      IMG_1234.CR3                         ← negative for the single
```

**The governing rule: the watch folder root contains only files the app ingests. Everything else
lives in an underscore-prefixed subfolder.**

### Folder naming

`<Brand> <Model> [<first 12 hex chars of watch id>]`

- The bracketed fragment is the **identity**. Resolution matches on it alone.
- The readable prefix is **cosmetic**. If the user edits brand or model, or renames the folder by
  hand, resolution must still work as long as the bracket survives.
- Verify the 12-char fragment is unique across `watches` at creation time.
- Sanitize for Windows: strip `< > : " / \ | ? *`, strip trailing dots and spaces, and guard the
  reserved names `CON PRN AUX NUL COM1-9 LPT1-9`. Real watch models contain slashes and colons.
- Cache the resolved path on the watch row, but never treat the cache as authoritative — always
  re-resolve from the ID fragment.

### Lifecycle

- **Created lazily**, when a session starts for that watch. Not on watch creation. Most watches
  are never shot; 250 empty folders is noise.
- **Never deleted.** When a watch is deleted, **move** its folder to `_archive\`. The images cost
  hours to produce; the DB row is recreatable and they are not. No recursive delete anywhere in
  this codebase.

---

## The watcher

A Node process. Decide with the user whether it lives inside `photo-score.mjs` (which already
owns the filesystem) or runs standalone — see Open questions.

### Detection

- Primary: `chokidar` on `_inbox`, with `awaitWriteFinish` (size stable ~2s). **Do not act on the
  raw create event** — a 25MB CR3 arriving over USB is still being written when it fires, and
  moving it truncates the file.
- Safety net: a full directory sweep every 30s. `fs.watch` drops events under load, and a
  40-frame burst is load. The sweep catches what events miss.

### Session binding — the critical safety rule

**A file is bound to a session at arrival time, never at move time.**

If a frame lands while no session is active, it is marked *unassigned* and stays in `_inbox`
permanently. It must **never** be swept into whatever session opens next. Retroactive claiming
silently misfiles frames and the user may not notice for weeks.

Bind on timestamp, not on move order: persist each session's start and end, and resolve a file's
owner from its mtime against those windows. This survives the watcher being down mid-shoot — the
inbox can be reconciled after the fact from timestamps alone.

### Singles

Camera is set to RAW + JPEG. Both share a basename (`IMG_1234.CR3` / `IMG_1234.JPG`).

- Move the JPEG to the watch folder root.
- Move the CR3 to `<watch folder>\_raw\`.
- **Never rename either file.** The shared basename is the permanent link between the app's photo
  record and its negative.
- Store the RAW filename on the photo row so the watch view page can show "RAW available" with a
  copy-path action.

### Focus-bracketed stacks

The R10 does in-camera depth compositing and writes **both the composite JPEG and every source
frame**. The composite transfers over tether alongside the sources (user-confirmed).

- Detect the burst; wait for quiescence (~10s of no new arrivals) before acting.
- Move the composite JPEG to the watch folder root.
- **Delete the source CR3s.** They are not kept — decided.
- **Safety rule: only delete sources after confirming a composite for that burst actually
  arrived.** In-camera compositing fails on patterned or uniform subjects and aborts on low
  battery. If no composite appears, keep the sources, leave them in `_inbox`, and flag the burst
  in the Session view as needing a manual stack in DPP. Deleting 40 frames because the camera
  gave up is the one unrecoverable failure in this design.

**Discriminating the composite from source JPEGs:** if brackets are shot RAW+JPEG, the burst
contains 40 source JPEGs *and* the composite JPEG, indistinguishable by extension. Two options,
in order of preference:

1. **Shoot brackets RAW-only** (a documented user convention, surfaced in the Session UI when the
   stack toggle is on). The sole JPEG in the burst is then unambiguously the composite. The
   source JPEGs were being deleted anyway.
2. If the user needs RAW+JPEG for brackets, discriminate on EXIF or pixel dimensions — test a
   real bracket and find the distinguishing field before relying on it.

### Stack detection

Two mechanisms, both implemented:

- **A stack toggle in the Session view.** The user flips it before shooting a bracket. Explicit,
  one click, in the app they are already looking at. Also lets them declare the expected frame
  count so the watcher knows when the burst is complete rather than inferring from silence.
- **A fallback heuristic:** 8+ frames in rapid succession is a burst. Covers the case where the
  user forgets the toggle.

---

## App-side work

1. **Session start** creates the watch folder if absent, and records `started_at`.
2. **Session end** records `ended_at`. See Open questions for the semantics.
3. **Unassigned frames tray** in Photo Lab: inbox files with no owning session, with bulk assign
   to a watch. This is what turns a forgotten session from silent corruption into a two-click
   cleanup. It is not optional.
4. **Live filmstrip** in the Session view — frames appear as the watcher files them (D3's
   filmstrip requirement, now fed by the watcher rather than by upload).
5. **Failed-composite flag** surfaced in the Session view with the DPP fallback path.
6. Remove the "copy folder path" affordance from the Session view once this lands — it exists to
   support the manual EOS Utility step this phase eliminates. Keep a "reveal in Explorer" action.

---

## Architectural constraint

A browser cannot touch the filesystem. All of this works **only because the Next.js server runs
on the same workstation as the images.** Folder creation must live in a server action or route
handler, never client-side. If this app is ever hosted off the workstation, the entire mechanism
goes dark — note it in the README so it is not discovered the hard way.

---

## Open questions — ask the user before building

1. **Where does the watcher live?** Inside `photo-score.mjs` (already owns the filesystem, one
   process to run) or standalone (separable lifecycle, can run when scoring isn't)?
2. **How does a session end?** Explicit "end session" button, an inactivity timeout, or
   implicitly when a different watch's session starts? This defines the timestamp window that
   owns every frame, so it needs to be decided, not defaulted.
3. **Does the watcher run when the app isn't open?** If yes, session state must live in the DB
   rather than localStorage.

---

## Exit checklist

- [ ] EOS Utility destination never changes after initial setup
- [ ] Starting a session creates the watch folder; no folders exist for unshot watches
- [ ] Deleting a watch moves its folder to `_archive\`; nothing is ever recursively deleted
- [ ] Folder resolution works after renaming brand, model, or the folder's readable prefix
- [ ] A single frame files its JPEG to root and its CR3 to `_raw\`, basenames unchanged
- [ ] A bracket files the composite to root and deletes sources — only after the composite is confirmed
- [ ] A failed composite keeps its sources and raises a flag
- [ ] Frames shot with no active session land in the unassigned tray and are never auto-claimed
- [ ] Killing the watcher mid-shoot and restarting it reconciles the inbox correctly
- [ ] `npm run lint && npm run typecheck && npm run build` clean
