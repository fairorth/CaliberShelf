# CaliberShelf

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
  sharpness, dup clustering) + local `_photo-report.html`; local-only, free.
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
or a direct insert (spec-fetch route). Surfaced in the **Agent Execution
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
