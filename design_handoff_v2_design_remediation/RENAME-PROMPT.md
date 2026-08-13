# Instruction for Claude Code — brand rename to TenTenLoupe

Paste the block below into Claude Code **after the current phase branch is committed**. Do not run
this concurrently with an in-flight phase — it touches nearly every file and will conflict.

---

## Prompt to paste

You are renaming this project from **CaliberShelf** to **TenTenLoupe**. Work on a dedicated branch
`chore/rename-tentenloupe`, branched from the latest merged phase branch — do NOT branch from an
in-progress phase.

Read `design_handoff_v2_design_remediation/brand/BRAND.md` first. It is the source of truth for
the name, wordmark, mark geometry, colours and size rules. Everything below defers to it.

### 1. Assets

Copy every file from `design_handoff_v2_design_remediation/brand/` into the app:

- SVG logos and marks → `apps/web/public/brand/`
- `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png`, `icon-192.png`,
  `icon-512.png` → `apps/web/public/`

Delete `calibershelf-mark.png` and any other CaliberShelf-era logo, favicon or OG image. Do not
leave orphaned references.

### 2. Code rename

Replace across the repo, respecting case:

| Find | Replace |
|---|---|
| `CaliberShelf` | `TenTenLoupe` |
| `calibershelf` | `tentenloupe` |
| `CALIBERSHELF` | `TENTENLOUPE` |
| `caliber-shelf` | `tentenloupe` |

Cover: `package.json` name and description, README, `app/layout.tsx` metadata (title, description,
openGraph, icons), the PWA manifest, `.env.example` comments, DB seed/fixture strings, test
snapshots, the Electron/Tauri app name if present, and any local-storage or IndexedDB key
prefixes. **Migrate storage keys** — write a one-time shim that reads the old `calibershelf:*`
keys, rewrites them under `tentenloupe:*`, and removes the originals, so no user state is lost.

Do NOT rename the git repo, the directory `c:\\Projects\\CaliberShelf`, or any database table or
column. Those are out of scope for this pass.

### 3. The mark component

Create `apps/web/components/brand/logo.tsx` exporting:

- `<Mark size />` — inline SVG, reads the geometry from `BRAND.md`. When `size < 26` it must omit
  the dial indices; at 26 and above it includes them. This is a hard requirement, not a nicety.
- `<Logo orientation="horizontal" | "stacked" />` — mark + wordmark. The wordmark is real text,
  not an image: `Ten`, a `<span>` colon in `text-primary`, `Ten`, a hairline rule, then `LOUPE` in
  the mono face at `tracking-[0.46em]`.

Both must use theme tokens (`--primary`, `--foreground`, `--background`) — **no hard-coded hex**.
The brass in `BRAND.md` is already the `--primary` value; if it is not, fix the token, not the
component.

### 4. Replace every logo usage

Nav rail header, mobile header, the 56px icon-only rail, login/empty states, PDF and report
headers, and the photo watermark if one is implemented. In the collapsed 56px rail use the mark
alone at 32px. In the expanded rail use the horizontal lockup.

Reference mockup: `screens/CaliberShelf v2 Screens.dc.html` in the design project, whose nav
headers already show the intended treatment at real size.

### 5. Verify

- `grep -ri "calibershelf" .` returns nothing outside `design_handoff_v2_design_remediation/`
  and git history
- lint, typecheck and build all pass
- the favicon, apple-touch icon and manifest icons resolve (no 404s in the network tab)
- the mark renders correctly at 16, 20, 26, 32 and 88px — indices absent below 26, present at and
  above it
- no layout shift in the nav rail at any breakpoint

Commit in three commits: assets, code rename + storage shim, logo component + usages. Then stop
and report — do not merge.

---

## After Claude Code reports back

Check by eye: the nav rail at all three breakpoints, the browser tab favicon, and the mark at
20px against the 26px rule. If the small mark still shows indices, that is the one bug most
likely to slip through.
