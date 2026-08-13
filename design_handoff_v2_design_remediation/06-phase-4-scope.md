# 06 — Phase 4 scope: capture pipeline

Implementation scope for `05-phase-4-capture-pipeline.md`, written after reading the existing
code. Branch `feat/capture-pipeline`, off the current tip once the three review branches merge.

**Status: for review. Nothing here is built.**

---

## 1. Decisions taken

| Question (05 §Open questions) | Decision |
|---|---|
| Where does the watcher live? | **Standalone.** Its own script, talking to Supabase directly like the other agents. Not inside `photo-score.mjs` — scoring is a batch job you run deliberately, the watcher is long-running during a shoot, and restarting one must not disturb the other. |
| How does a session end? | **All three.** An explicit *End session* button, an inactivity timeout as a backstop, and starting a session for a different watch implicitly ends the open one. An open-ended window is what swallows frames that do not belong to it. |
| Does the watcher run when the app is closed? | **Independent of the browser and of Next: yes.** Running 24/7 as a Windows service: **not initially** — see §5. |

### Why "independent" is not the same as "always on"

Frames bind to a session **by file timestamp against session windows persisted in the DB**, not
by what happened to be open when the watcher noticed the file. That makes watcher uptime a
*latency* property, not a correctness one: a watcher that was down for an entire shoot can start
afterwards, read the windows, and file everything correctly.

So the watcher gets a `--reconcile` mode from day one, and uptime stays optional. Start it for a
photo day in a terminal you can see. Promote it to a service later, once it has earned trust,
without changing the design.

---

## 2. What already exists — and where it contradicts 05

This is the part worth reviewing closely. The folder model is **already half-built**, and 05 was
written without it.

| 05 specifies | Reality in the repo | Resolution |
|---|---|---|
| `[<first 12 hex chars>]` folder token | **8 chars**, in two places: `src/lib/photo-lab.ts:watchFolderName` and `scripts/sync-watch-folders.mjs:folderName` | **Keep 8.** Folders already exist on disk at the Photo Lab machine. Changing to 12 means renaming every one of them on a machine we cannot test from. 8 hex is ample for 161 watches — collisions become likely around 77k rows, and creation-time uniqueness is checked anyway. |
| Deleted watches → `_archive\` | `sync-watch-folders --prune` already moves orphans to `_removed\` | **Keep `_removed`.** Same reasoning: it is what is on disk. One name, not two. |
| — | Folder naming is **duplicated** between the app (TS) and the script (mjs) | The watcher would be a third copy. Extract one plain-JS module both can import; the TS side re-exports it. Scripts are `.mjs` and cannot import from `src/lib/*.ts`. |

Also already present and reusable: `profiles.watch_images_path` (migration 00035, wired through
Config → Settings), the `scripts/lib/agent-run.mjs` run-logging skeleton, and `exiftool-vendored`
as a dependency — which matters if we ever need EXIF to tell a composite from its sources.

**Latest migration is 00042.** New work starts at 00043.

---

## 3. Data model

### 00043 — `photo_sessions`

```
id            uuid pk
user_id       uuid not null
watch_id      uuid not null references watches(id) on delete cascade
started_at    timestamptz not null default now()
ended_at      timestamptz null
end_reason    text null            -- 'explicit' | 'timeout' | 'superseded'
expected_frames int null           -- set by the stack toggle; null = not a bracket
created_at    timestamptz default now()
```

- **Partial unique index** on `user_id where ended_at is null` — at most one open session per user.
  Overlapping windows make frame ownership ambiguous, so the database refuses them rather than
  the application remembering to.
- RLS on `user_id`, matching every other table.
- Index on `(user_id, started_at desc)` for window lookup.

### Session state moves out of `localStorage`

`SESSION_WATCH_KEY` (`photo-lab-session-watch`) is read today by both
`photo-lab/session/_components/session-view.tsx` and `capture/_components/quick-capture.tsx`.
A standalone Node process cannot read browser storage, so this becomes a DB read for both.
This is forced by the standalone-watcher decision, independent of the uptime question.

### How a filed frame becomes visible — decision needed

05 says the filmstrip shows frames "as the watcher files them", which means the watcher must
write a DB row at file time rather than waiting for `photo-score.mjs`.

`watch_image_scores` (00040) can already carry an unscored row: `rel_path`, `content_hash`,
`source_kind`, `stack_seq`, `stack_role` are the identity fields and every metric column is
nullable. **Proposal: the watcher inserts an unscored row per filed frame; `photo-score.mjs`
enriches it later by `content_hash`.** One table, one filmstrip source, no new concept.

*To confirm before building: whether `content_hash` is `NOT NULL`. If it is, the watcher hashes
on file (cheap, the bytes are already being read to move them).*

---

## 4. The watcher

`scripts/watch-inbox.mjs`, following the existing agent skeleton: env check that never prints
values, `validateArgs` that hard-fails unknown flags, `--dry-run`, and run logging.

```
npm run watch-inbox                 # follow the inbox until stopped
npm run watch-inbox -- --reconcile  # one pass over _inbox, then exit
npm run watch-inbox -- --dry-run    # report what it would do, touch nothing
```

### Detection

- `chokidar` on `_inbox` with `awaitWriteFinish` (size stable ~2s). **Never act on the raw create
  event** — a 25MB CR3 arriving over USB is still being written when it fires.
- A full directory sweep every 30s as a safety net, because `fs.watch` drops events under load
  and a 40-frame burst is load.
- `chokidar` is the one new dependency.

### Binding

Resolve each file's owner from its timestamp against the persisted session windows. A file whose
timestamp falls inside no window is **unassigned**: it stays in `_inbox`, is surfaced in the tray,
and is **never** claimed by a later session.

### Singles (RAW + JPEG)

JPEG to the watch folder root, CR3 to `<watch folder>\_raw\`, **neither renamed** — the shared
basename is the permanent link between a photo and its negative. Store the RAW filename on the
row so the watch view can offer "RAW available".

### Brackets

Move the composite to the folder root; delete the source CR3s **only after confirming a composite
for that burst actually arrived**. No composite means keep everything, leave it in `_inbox`, and
raise a failed-composite flag in the Session view with the DPP fallback.

Discriminating composite from sources: **shoot brackets RAW-only** (surfaced in the Session UI
when the stack toggle is on) so the single JPEG in the burst is unambiguously the composite. The
source JPEGs were being discarded anyway. EXIF discrimination is the fallback, and needs a real
bracket to test against before it is trusted.

Burst detection is both the explicit Session-view toggle (with expected frame count) and an 8+
frames-in-rapid-succession heuristic for when the toggle is forgotten.

---

## 5. The timestamp risk

The sharpest technical risk in the phase, and 05 understates it.

Binding on mtime assumes mtime is the **write** time on the workstation clock. If EOS Utility
preserves the camera's capture timestamp instead, and the camera clock has drifted, every frame
binds to the wrong window or to none.

"When the watcher first saw it" cannot substitute: it would break reconcile-after-downtime, since
a file from session A first seen during session B would bind to B. Reconcile needs a timestamp
intrinsic to the file.

**Actions:**

1. On the Photo Lab machine, before building on it: shoot one frame and check what EOS Utility
   writes to mtime, and whether it tracks the workstation clock or the camera's.
2. Guard regardless — a timestamp outside every known window, or in the future, goes to the
   unassigned tray rather than being guessed at.
3. Camera-clock sync goes on the shoot checklist.

---

## 6. App-side changes

1. `photo_sessions` actions: start (creates the folder if absent, ends any open session as
   `superseded`), end (`explicit`), and a timeout sweep (`timeout`).
2. Session view reads the open session from the DB instead of `localStorage`; Quick Capture
   follows the same source.
3. **Stack toggle** with expected frame count, plus the RAW-only reminder when it is on.
4. **Unassigned frames tray** in Photo Lab, with bulk assign to a watch. 05 calls this not
   optional and it is right — it turns a forgotten session from silent corruption into a two-click
   cleanup.
5. **Live filmstrip** fed by the watcher's rows.
6. **Failed-composite flag** surfaced in the Session view.
7. Remove "copy folder path"; keep a "reveal in Explorer" action.
8. README note: this mechanism requires Next and the images on the same machine, and goes dark
   if the app is ever hosted elsewhere.

---

## 7. Build order

Each step is useful on its own and verifiable without a camera except where noted.

1. 00043 + session actions + move both components off `localStorage`. **No watcher yet** — the app
   still works exactly as today.
2. Extract shared folder naming to one module; point app, `sync-watch-folders` and the watcher at it.
3. Watcher: detection, binding, singles only. `--dry-run` and `--reconcile` from the start.
4. Unassigned tray + live filmstrip.
5. Brackets: burst detection, composite confirmation, source deletion. **Needs the camera.**
6. Timeout sweep, failed-composite flag, remove the copy-path affordance.

Steps 1–4 can be built and tested on this workstation with synthetic files dropped into a fake
inbox. Step 5 cannot be honestly verified anywhere but the Photo Lab machine.

---

## 8. Deliberately deferred

- Promoting the watcher to a Windows service. Revisit once it has run a few real shoots.
- Any change to how `watch_photos` (Supabase Storage) relates to capture-folder frames. The two
  worlds stay as they are; this phase does not merge them.
- Renaming existing folders to a 12-char token. Not worth the risk (§2).

---

## 9. Exit checks

Inherits 05's checklist, plus:

- [ ] At most one open session per user, enforced by the database, not by the app
- [ ] Killing the watcher mid-shoot and running `--reconcile` files everything correctly
- [ ] A frame timestamped outside every window lands in the tray and is never auto-claimed
- [ ] Folder resolution still works after renaming a brand, a model, or a folder's readable prefix
- [ ] `--dry-run` moves and deletes nothing, and says what it would have done
- [ ] EOS Utility's destination is never changed after setup
- [ ] `npm run lint && npm run typecheck && npm run build` clean
