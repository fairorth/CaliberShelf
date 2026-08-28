# Photo Lab Session Startup

Context primer for a Claude session on the **PhotoLab workstation**. Paste-in
prompt: *"Read PHOTOLAB-STARTUP.md and follow it — I just pulled master and
I'm starting a photo session."*

## Machine context (read first)

- This is the **PhotoLab workstation** (two-machine workflow: office ms-02-ultra
  is primary dev; this machine owns tethered capture). **Git is the sync;
  Claude memory is per-machine and may be stale here — repo docs win on any
  conflict.** Read `CLAUDE.md` before acting; `docs/photo-lab-app.md` is the
  source of truth for the capture software, `docs/photo-lab.md` for the craft,
  `docs/photo-lab-game-plan.md` for the campaign plan and tutorial.
- The database is hosted Supabase — shared by both machines. Migrations run
  once, from anywhere, by hand in the SQL Editor. **Never assume a pending
  migration was applied; ask.**

## Post-pull checklist

1. `git pull` happened? Confirm `package.json` version matches the latest
   release the user mentions (don't trust the nav badge until the dev server
   restarts — the version is inlined at boot).
2. `npm install` (cheap insurance after a pull).
3. Tethered work is gated on `profiles.watch_images_path` (Config → Settings)
   pointing at this machine's `\WatchImages` capture root. If Coverage/Session/
   Review look empty, check that first.
4. EOS Utility must be running for tethered capture (Canon R10 + RF 100mm L
   Macro); captures land in per-watch folders — `watchFolderName()` in
   `lib/photo-lab.ts` must stay byte-identical to `scripts/sync-watch-folders.mjs`.

## Typical lab-session flow

1. Pick targets from the Photo Lab **Coverage** matrix (driven entirely by
   `watch_photos.angle`, set by hand in Review or the watch-page lightbox —
   scored frames do NOT feed coverage; Track B was never built).
2. Shoot tethered per the game plan's shot cards.
3. `npm run photo-score` — CV triage + Track A grading (Haiku,
   ~$0.0015/frame; `--no-ai` is free). Local `_photo-report.html` has the
   coverage matrix and reshoot list.
4. **Review → Accept** publishes a frame (re-encode to 2000px JPEG, upload,
   thumbnail, angle tag, optional cover). Accept only works on THIS machine —
   it reads originals from local disk.
5. The five `PHOTO_ANGLES` and the scorer's four `SHOT_CARDS` are different
   vocabularies with no mapping — don't "fix" that in passing.

## Don'ts

- Don't touch price-check/valuation config from this machine mid-photo-session;
  the office machine owns that work.
- Don't run paid agent sweeps without `--dry-run --limit N` first
  (`docs/agents.md` has the fleet + costs).
- Don't edit capture folders by hand while the scorer or sync is running.
