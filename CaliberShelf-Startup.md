# TenTenLoupe — Session Startup

Context primer for a Claude session on **either** workstation. Paste-in prompt:

> *"Read CaliberShelf-Startup.md and follow it."*

Add what you're here to do — *"…I just pulled master and I'm starting a photo
session"* or *"…I'm on the dev machine, let's build"* — and Claude will take the
right lane below.

---

## 0. Which machine is this?

Run `hostname`:

| hostname | Machine | Owns |
| --- | --- | --- |
| `MS-02-Ultra` | **Office dev workstation** (downstairs) | All dev work, agent sweeps, migrations, releases |
| anything else | **PhotoLab workstation** (upstairs) | Tethered Canon rig, the real `\WatchImages` capture folders, Review → Accept |

The repo directory and git repo are still named **CaliberShelf** while the app
is **TenTenLoupe** — that's deliberate, don't "fix" it. On the office machine
the repo is `C:\Projects\CaliberShelf`; confirm the path on the lab machine
rather than assuming.

**This is a LOCAL session** — Read/Edit/shell tools act directly on real files.
No cloud workspace, no staging: edit in place.

## 1. What syncs, what doesn't

- **Git is THE sync.** The user pushes by hand before leaving a machine and
  pulls on arrival. Repo docs deliberately carry all load-bearing project
  state so a cold session on either machine can rebuild context.
- **Claude Code sessions and the memory directory are PER-MACHINE and diverge.**
  Where memory disagrees with the repo (CLAUDE.md files, `docs/`, git history),
  **THE REPO WINS** — and fix this machine's memory when drift is caught.
- **Hosted Supabase is shared** by both machines and by the dev server. There is
  one database; there is no local Postgres.
- **`.env.local` is gitignored** and maintained by hand on each machine. If a
  key is missing here, say so — never invent or relocate secrets.

## 2. Boot sequence (both machines)

1. **Read project memory** — `MEMORY.md`'s index first, then `project_status.md`
   (version, latest migration, what shipped, what's next, outstanding manual
   steps). Read the topic files the index points to as they become relevant, and
   handle any follow-ups memory flags.
2. **Read `CLAUDE.md`** at the repo root, plus the scoped ones:
   `supabase/CLAUDE.md`, `src/app/CLAUDE.md`, `src/components/CLAUDE.md`.
3. **Skim `docs/` as needed** — `data-model.md` and `using-tentenloupe.md` for
   most work; the photo-lab trio for lab work (§4).
4. **`git fetch`, then `git log --oneline -10` and `git status --short`.**
   - **Behind `origin/master`** → the user probably switched machines without
     pulling. Remind them to `git pull` (and `npm install` if `package-lock.json`
     changed) and wait for the go-ahead before touching anything.
   - **Ahead of `origin/master`** → that's just an unpushed by-hand push. Never
     "fix" it; track it as a count of unpushed commits.
5. **Confirm `package.json` "version"** matches the latest release the user
   mentions. Don't trust the nav badge until the dev server restarts — the
   version is inlined at boot.
6. **Never assume a pending migration was applied.** Migrations live in
   `supabase/migrations/` but the user runs them BY HAND in the Supabase SQL
   Editor. Always name the exact file to run, and ask.

## 3. Lane A — office dev workstation

- `npm run dev` (Turbopack, port 3000) · `npm run typecheck` · `npm run lint` ·
  `npm run build`. Run typecheck and lint as **separate** calls after every
  change; build when the change warrants it.
- The dev server talks to the **real** hosted database. Browser preview is fine
  for looking — don't click anything that mutates real data (logging wears,
  deleting, regenerating) without asking first.
- This machine owns **price-check / valuation config** and paid agent sweeps.
  Always `--dry-run --limit N` first; `docs/agents.md` has the fleet and costs.
- Photo-lab scripts CAN run here, but the capture folders can't. Resolution
  order is `--dir` > `WATCH_IMAGES_DIR` (`.env.local`) > `profiles.watch_images_path`.
  Use the overrides here; **never repoint the shared DB value casually** — it
  belongs to the lab machine.
- For small, clearly-specified changes: grep the touch points, edit, typecheck,
  lint, commit. Skip the exploratory tour.

## 4. Lane B — PhotoLab workstation

Sources of truth: **`docs/photo-lab-app.md`** (the software),
**`docs/photo-lab.md`** (the craft), **`docs/photo-lab-game-plan.md`** (campaign
plan and tutorial).

1. `npm install` after a pull (cheap insurance), then check the gate: the entire
   tethered half hangs on `profiles.watch_images_path` (Config → Settings)
   pointing at **this machine's** `\WatchImages` capture root. If
   Coverage/Session/Review look empty, that's the first thing to check.
2. **EOS Utility must be running** for tethered capture (Canon R10 + RF 100mm L
   Macro). Captures land in per-watch folders — `watchFolderName()` in
   `lib/photo-lab.ts` must stay byte-identical to `scripts/sync-watch-folders.mjs`.
3. Pick targets from the Photo Lab **Coverage** matrix. Coverage is driven
   *entirely* by `watch_photos.angle`, set by hand in Review or the watch-page
   lightbox — scored frames do NOT feed it (Track B was never built).
4. Shoot tethered per the game plan's shot cards.
5. `npm run photo-score` — CV triage + Track A grading (Haiku, ~$0.0015/frame;
   `--no-ai` is free). Writes a local `_photo-report.html` with the coverage
   matrix and reshoot list.
6. **Review → Accept** publishes a frame: re-encode to 2000px JPEG, upload,
   thumbnail, angle tag, optional cover. It reads originals from local disk, so
   it only works on THIS machine.
7. The five `PHOTO_ANGLES` and the scorer's four `SHOT_CARDS` are different
   vocabularies with no mapping between them — don't "fix" that in passing.

## 5. Ground rules that trip people up

- **Every code change bumps `"version"` in `package.json`** (usually the patch
  segment) — edit the field directly, never `npm version`. Docs/config-only
  changes don't need a bump.
- **The user pushes to GitHub by hand.** Remind them to `git push` when work is
  committed, keep a running count of unpushed commits, and before they leave a
  machine remind them: **push first — that IS the sync.**
- **Permission hygiene** (the user hates prompts):
  - Use the dedicated Grep/Glob/Read tools — not shell `grep`/`find`/`cat`.
  - Run npm/npx/node/git through the Bash tool plain and undecorated: no pipes,
    no `2>&1 | tail`, no chained `&&`, no preambles.
  - If something prompts anyway, treat it as a bug — diagnose the rule gap in
    `.claude/settings.json` and fix it with `Tool(prefix:*)` syntax.
- Don't edit capture folders by hand while the scorer or folder sync is running.
- Don't start cross-machine work in the wrong lane: valuation/agent config is the
  office machine's, Accept-and-publish is the lab machine's.

## 6. Then report

Give a one-paragraph confirmation of where things stand — **which machine**,
version, latest migration and whether anything still needs running, and what
`project_status.md` lists as the likely next builds. Flag anything outstanding:
unrun migrations, unpushed or unpulled commits, memory follow-ups, and any
memory-vs-repo drift corrected. Then wait for direction.
