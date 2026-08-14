# TenTenLoupe

A personal watch collection tracking app built with Next.js 16 (App Router), Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack
- Next.js 16 with App Router and TypeScript (strict mode)
- Supabase (Postgres, Auth with @supabase/ssr, Storage for photos)
- Tailwind CSS v4 + shadcn/ui component library
- React Hook Form + Zod for form validation
- Recharts for valuation charts
- SWR for client-side data fetching (used sparingly)

## Project Structure
- `src/app/` - Next.js routes using App Router (see src/app/CLAUDE.md)
- `src/components/` - Shared UI components (see src/components/CLAUDE.md)
- `src/lib/actions/` - Server Actions for mutations
- `src/lib/queries/` - Data fetching functions for Server Components
- `src/lib/validations/` - Zod schemas, shared between client and server
- `src/lib/types/` - TypeScript types (database.ts is generated, others are manual)
- `src/hooks/` - Client-side React hooks
- `supabase/` - Database migrations and seed data (see supabase/CLAUDE.md)

## Code Conventions
- Use named exports, not default exports (except Next.js page/layout files which use default)
- Use `import type` for type-only imports
- Prefer Server Components by default; add "use client" only when needed
- All mutations go through Server Actions in `src/lib/actions/`
- Validate all inputs with Zod schemas from `src/lib/validations/`
- Use the `cn()` utility from `src/lib/utils` for conditional class merging
- File naming: lowercase kebab-case for all files (e.g., `watch-card.tsx`)
- Store money as BIGINT cents to avoid floating-point issues
- One component per file; import directly (no barrel exports)

## Design System — see docs/design-system.md
- **Light is the only theme.** `forcedTheme="light"` in the root layout; there is
  deliberately no switcher. The `.dark` tokens remain in globals.css but are unreachable —
  do not add `dark:` variants to new work, and do not reason about dark mode.
- **Accent:** brass (`--brass`, `#8a6a2f` on light = BRAND.md brass-deep) = action/brand
  (buttons, active nav, focus, selection). Steel-blue (`--primary`) = data only (charts,
  links, info chips). Prices and totals are `--foreground` + `font-mono tabular-nums` —
  never colored. Brass is NEVER decoration (no colored card borders or header washes).
- **Badges, pills, chips and status dots go through `<StatusPill>`** (`ui/status-pill.tsx`):
  solid brass, outline brass, neutral, `--warning` amber for staleness/aging, and
  `--destructive` for failure only. Never a Tailwind colour literal — that is how a non-brass
  accent survived four sweeps. The user-chosen label palette in `validations/label.ts` is the
  one deliberate exception (it is data, not accent).
- **Gain/loss is the only number that takes colour** — `--chart-2` up, `--destructive` down,
  via `<GainValue>` (`components/gain-value.tsx`). Both themes are green/red: light
  `--chart-2` was a cyan-blue until Phase 5 and made a gain read as data. A null gain
  renders `—`, never 0 and never a percentage.
- **Neutral tokens must stay neutral.** `--muted-foreground`, `--accent` and
  `--accent-foreground` once carried enough blue chroma to read as system blue at 11px, which
  is why "remove the blue" kept finding new instances. Sweep the token, not the instance.
- Global `a` / `a:hover` are defined from the palette so an unstyled link cannot inherit
  browser blue.
- **Type:** six steps only — 11 / 13 / 15 / 19 / 26 / 38px. Every page `h1` is 26px.
  `font-display` (Fraunces) only at ≥19px. Mono only at 11px and 13px. Never write an
  arbitrary `text-[Npx]`.
- **Radii:** 8px controls · 14px cards · full pills. Nothing else (physical-object
  illustrations in watch-hero/display-box excepted).
- **Color:** tokens only. No hex or `white/[0.0x]` literals for surfaces, borders, fields
  or text. Never stack opacity on `--muted-foreground`.
- **Icons:** lucide-react only, `currentColor`, `aria-hidden`. No emoji in UI — the two
  exceptions are ✨ (AI autofill) and ⚠ (unverified reference).
- **Images:** `object-contain` where the photo is the subject; `object-cover` only in
  dense grids, framed by `dial_focal_x/y/zoom`. `getWatches` returns TWO cover URLs —
  `cover_photo_url` (~720px, heroes/tiles/previews) and `cover_thumb_url` (~192px, dense
  thumbnails). Use the thumb in any cell under ~100px: squeezing the big one into a 64px
  box is a ~9:1 downscale and it visibly mushes. Never serve the untransformed original.
- **Brand mark:** `components/brand/logo.tsx`. Geometry and per-ground fills come from
  `design_handoff_v2_design_remediation/brand/BRAND.md`; theme tokens only, no hex in the
  component. Hard rule: the dial indices are omitted below 26px and present at 26px and up.
- **Motion:** 150ms color / 200ms transform, ease-out. `prefers-reduced-motion` must stop
  the hero auto-advance, the ring sweep and hover scales.
- **Text hierarchy:** exactly one full-`--foreground` value per surface; everything else
  `--muted-foreground` at 13px+.

## Zod v4 Notes
- This project uses Zod v4 (package `zod@^4.x`)
- Use `.issues` not `.errors` on ZodError (e.g., `parsed.error.issues[0].message`)
- Schema inference: `z.infer<typeof schema>` works the same as v3

## Supabase Query Gotchas
- Junction table joins (e.g., `.select("watch_id, labels(*)")`) need `as unknown as` for type casting — TS infers `any[]` for the nested relation
- Direct server action calls (not form-bound) use signature `(id: string, data: {...})` — form-bound actions use `(prevState, formData)` pattern
- Always check for `error.code === "23505"` (unique constraint) and `"23503"` (FK constraint) in actions

## shadcn/ui Gotchas
- Controlled `Select` with `value` prop: `SelectValue` may render the raw value (UUID) instead of display text — render the label manually in `SelectTrigger` as a workaround
- `onValueChange` callback can pass `string | null` — guard with `if (val)` before parsing
- When `Label` from `@/components/ui/label` conflicts with an app type named `Label`, import as `FormLabel`

## Next.js / React Gotchas
- URL-as-state for client filters: use `useSearchParams()` directly in the client component, not `useState(initialFromProps)`. Soft navigation re-renders but doesn't re-mount, so useState ignores new prop values from the server.
- `react-hooks/set-state-in-effect` lint rule fires only on the **first** setState in an effect. One `eslint-disable-next-line` above the first call covers all subsequent ones — directives on later calls trigger "unused" warnings.
- localStorage hydration: read in `useEffect` (server can't access it). The first setState triggers the lint rule above; this is a legitimate exception worth disabling.
- `next/image` with `fill` positions against the nearest **positioned** ancestor. A sized box without `relative` lets the image size itself to whatever ancestor happens to be positioned — in the collection table that was the whole column, producing a letterbox strip through the middle of the watch. Always pair `fill` with `relative` on the box that defines the size.
- `table-layout: fixed` treats `<colgroup>` widths as **ratios, not pixels**, whenever the table is wider than their sum: the surplus is shared out proportionally and every column inflates together. For literal widths, size the table explicitly (`width: sum-of-columns`) rather than letting it fill. Don't "fix" this with one `width: auto` flex column — a flex column absorbs width released by any other column, which silently inverts the drag direction of every resize handle to its right.

## Sales & investment (Phase 5) — see docs/data-model.md
- **Lifecycle** is linear and one-per-watch: `owned → candidate → listed → sold`.
  Transitions are enforced in `src/lib/actions/sales.ts` against the table in the spec,
  NOT by a DB constraint. Every status write goes through `assertTransition`.
- **`cost_basis_cents` and `net_proceeds_cents` are generated columns.** Nothing in code
  re-derives them. A watch with no purchase price has basis 0 → every gain shows `—`.
- **All gain math lives in `queries/gain.ts`** (pure), re-exported by `queries/sales.ts`
  and `queries/portfolio.ts`. No component computes a gain inline; `<GainValue>` renders it.
- **Portfolio totals and the trend chart's primary series use `source='agent'` valuation
  rows only.** Manual rows (`source='manual'`, V7) plot alongside as hollow markers and
  never move a total.
- **Sold watches stay in the collection**, dimmed with a `SOLD` pill and net proceeds in
  the price cell. They are excluded from current-value totals, price-check runs, Photo Lab
  coverage targets and never-worn prompts; they stay in counts, search and every report.
- **Market section** owns `/market` (portfolio strip, value-over-time chart, pipeline,
  attention) and `/market/sold` (the archive with footer totals).
- **No `npm run …` in UI copy** — the in-app "Check price now" button is the answer
  (finding V9).

## Collection table conventions (`components/collection-table.tsx`)
- Filters, search and sort live in the **URL**, not component state, so a filtered list survives a trip out to a watch and back and is linkable. Multi-value filters repeat their key (`?category=a&category=b`). View mode, tile size and column choice are per-device preferences and stay in localStorage.
- The **Sale status** filter (`?sale=`) has view-specific defaults: an *absent* param means "Owned only" in tiles and "All" in the table, so `""` is unset and `"all"` is the explicit everything choice (clearing the chip writes `all`, otherwise the default would silently reapply). Sold watches always sort to the bottom, whatever the active sort.
- The Brand and Category **cells** filter the collection; the rest of the row opens the watch. This deliberately narrows "one row, one destination" — see DECISIONS.md §8.
- Column widths are explicit pixels, resizable, persisted per device. Any column may be resized; the table sizes itself to their sum.

## Agents — see docs/agents.md
Full fleet reference (what each agent does, how it's initiated, observed
costs, cost levers): `docs/agents.md`. Observed costs: valuation ~$1-1.5/watch
· spec autofill (Sonnet since 2026-07-21) ~$0.05-0.15/click · store-URL sweep
$0.14/brand · reference sweep $0.44/watch (`--majors-only`, `--value-limit N`
to scope) · deal-check $0 · chronoscout-sync $0. ALWAYS `--dry-run --limit N`
before a paid sweep; script cost printouts use list pricing (conservative).

## Agent scripts — quick pointers (full detail in docs/agents.md)
Shared skeleton every batch script follows: env check (never prints values),
`validateArgs` (unknown flags hard-fail), `--dry-run`, MODEL/MAX_USES cost
constants, end-of-run cost printout, and run logging via
`scripts/lib/agent-run.mjs`. Model/pricing constants live at the top of each
script (or `route.ts` for spec-fetch).
- **price-check** (`scripts/price-check.mjs`) → `watch_valuations`; needs a
  reference_number to enable (Zod refine + DB CHECK); monthly `price-check.yml`.
  The per-watch research call lives in **`scripts/lib/price-research.mjs`**,
  shared with `POST /api/price-check/[watchId]` (the "Check price now" button)
  so the prompt exists once — edit sources/method THERE. The route requires
  opt-in, refuses sold watches, and allows one run per watch per hour.
  Operator guide: `docs/price-check.md`.
- **deal-check** (`scripts/deal-check.mjs`) → `wishlist_deals` from each brand's
  Shopify `products.json`; deterministic; daily `deal-check.yml`. `best_used_*`
  reserved for Phase B.
- **find-references** (`scripts/find-references.mjs`) → `watches.reference_number`
  + `reference_unverified` (00026); `--majors-only`, `--value-limit N`.
- **find-store-urls** (`scripts/find-store-urls.mjs`) → `brands.store_url` /
  `brand_type`, NULL-only.
- **photo-score** (`scripts/photo-score.mjs`) → `watch_image_scores` (00040);
  CV triage over `\WatchImages` capture folders (stack collapse, dial-ROI
  sharpness, dup clustering) + Track A shot-card grading (Haiku,
  ~$0.0015/frame, `--no-ai` = free) + local `_photo-report.html` with
  coverage matrix/reshoot list; local-only.
- **chronoscout-sync** (`scripts/chronoscout-sync.mjs`) → `chronoscout_*` mirror
  (00027); catalog-only API (no prices/refs/alerts) — does NOT power Phase B;
  weekly `chronoscout-sync.yml`. Licensing: display in-app only, attribute
  Chronoscout, purge the mirror on revocation. `CHRONOSCOUT_API_KEY` server-only.
- **spec-fetch** (`src/app/api/spec-fetch/route.ts`, the ✨ button) → returns
  spec JSON (`src/lib/validations/spec-fetch.ts`); fills empty form fields only,
  proposes an unverified reference.
- **catalog picker** (`src/components/catalog-combobox.tsx` +
  `searchCatalogWatches`) fills 5 dimensions from the mirror; free.

## Agent run logging (agent_runs — migration 00028)
Every agent records a run — duration, cost (integer microdollars), item counts,
tokens, and a per-item audit trail — via `scripts/lib/agent-run.mjs` (scripts)
or a direct insert (the spec-fetch and price-check routes; the latter logs
`trigger = 'ui'`). Surfaced in the **Agent Execution
Review** report (`/reports/agents`). Logging is best-effort and must NEVER break
an agent (all writes are wrapped). `npm run backfill-agent-runs` imports past
valuation runs.

## Common Commands
- `npm run dev` - Start dev server (Turbopack) on port 3000
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript strict check (tsc --noEmit)
- `npx supabase db push` - Push migrations to hosted Supabase
- `npx shadcn@latest add <component>` - Add a shadcn/ui component

## Taxonomy, Tiers & Config
Three separate axes — never muddle them (full rationale in docs/data-model.md):
- **Category** = design archetype, single-select, user-managed rows in
  `categories` (NOT an enum). Currently: Dress, Sport, Chronograph, Daily,
  Horology.
- **Complications** = what the movement does, multi-select, stored
  comma-joined in `watches.complication`. `KNOWN_COMPLICATIONS` in
  `src/lib/validations/watch.ts`: Date, DTZ, Power Reserve, Annual Calendar,
  Perpetual Calendar, Moon Phase, Fancy (exotica goes in notes).
- **Tier** = price segment, DERIVED from purchase price and **user-configurable**
  (migration 00030). Per-user `profiles.tier_config` JSONB, ordered
  `[{label, max}]` where `max` is the EXCLUSIVE upper dollar bound and the last
  row's `max` is `null` (open top). `src/lib/tiers.ts` owns the pure helpers
  (`configToBands`, `tierBandForCents`, `normalizeTierConfig`);
  `src/lib/queries/tier-config.ts` reads, `src/lib/actions/tier-actions.ts`
  writes, `Config → Tiers` edits. Reports must read the user's bands live —
  never hardcode price buckets.

## Versioning — every change
Bump `package.json` "version" (usually the patch segment) as part of EVERY code
change. `next.config.ts` injects it as `NEXT_PUBLIC_APP_VERSION`,
`src/lib/version.ts` exposes `APP_VERSION`, and it renders next to the wordmark
in the nav bar and on `/about`. Edit the field directly rather than running
`npm version` (which also commits and tags). The dev server inlines the value at
boot, so a restart is needed before the badge changes.

## Important Rules
- ALWAYS validate form data with Zod on BOTH client and server
- NEVER store secrets in code; use .env.local (which is gitignored)
- RLS policies protect all data at the database level
- After creating a new migration, regenerate database types
- Use `revalidatePath()` in Server Actions after mutations
- NEVER edit `package-lock.json` or `next-env.d.ts` manually
