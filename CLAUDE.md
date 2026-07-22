# CaliberShelf

A personal watch collection tracking app built with Next.js 15 (App Router), Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack
- Next.js 15 with App Router and TypeScript (strict mode)
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
to scope) · deal-check $0. ALWAYS `--dry-run --limit N` before a paid sweep;
script cost printouts use list pricing (conservative).

## Price-Check Valuation Agent
- `scripts/price-check.mjs` (`npm run price-check`) values watches with
  `price_check_enabled = true` via the Claude API (web search/fetch server
  tools) and inserts into `watch_valuations`. Full docs: `docs/price-check.md`
- Flags: `--dry-run`, `--limit N`, `--watch <uuid>`, `--max-uses N` (default 6)
- Scheduled monthly by `.github/workflows/price-check.yml` (also manual
  dispatch); needs SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY repo secrets
- Enabling price checking requires a reference_number (Zod refine + DB CHECK)
- Model/cost decisions live in the script's MODEL and MAX_USES constants

## Deal Scanner (Phase A)
- `scripts/deal-check.mjs` (`npm run deal-check`) checks wish-list watches
  against each brand's Shopify `products.json` (via `brands.store_url`) and
  upserts availability + retail price into `wishlist_deals` (one row per
  watch). Deterministic — no LLM. Flags: `--dry-run`, `--watch <uuid>`
- Daily via `.github/workflows/deal-check.yml` (needs only
  SUPABASE_SERVICE_ROLE_KEY); surfaced on the `/deals` page
- `best_used_*` columns are reserved for Phase B (gray-market agent)
- `scripts/find-store-urls.mjs` (`npm run find-store-urls`) is the one-sweep
  enrichment agent: web-searches each brand's official store URL + classifies
  brand_type, verifies Shopify via products.json, fills only NULL columns
  (never overwrites manual edits). Flags: `--dry-run`, `--limit N`, `--brand`

## Spec Autofill Agent
- "✨ Auto-fill specs" button on the watch form calls `POST /api/spec-fetch`
  (`src/app/api/spec-fetch/route.ts`): Claude API + web search/fetch server
  tools + structured output (`zodOutputFormat`), returns spec JSON validated by
  `src/lib/validations/spec-fetch.ts`
- Human-in-the-loop: fills only empty fields (edit page never overwrites DB
  values), highlights applied fields, user reviews then saves; needs
  ANTHROPIC_API_KEY (server env — local .env.local AND Vercel)
- MODEL/pricing constants at top of route.ts; cost shown in the result panel
- Also proposes a reference_number: applied only to an empty field and flagged
  `watches.reference_unverified` (00026) — amber badge + "Mark verified" on
  the form; human edit clears the flag; "Verify reference" chip in the
  Attention Needed report
- `scripts/find-references.mjs` (`npm run find-references`) batch-sweeps
  watches missing a reference (writes ref + unverified flag; `--dry-run`,
  `--limit`, `--watch`)

## Common Commands
- `npm run dev` - Start dev server (Turbopack) on port 3000
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript strict check (tsc --noEmit)
- `npx supabase db push` - Push migrations to hosted Supabase
- `npx shadcn@latest add <component>` - Add a shadcn/ui component

## Important Rules
- ALWAYS validate form data with Zod on BOTH client and server
- NEVER store secrets in code; use .env.local (which is gitignored)
- RLS policies protect all data at the database level
- After creating a new migration, regenerate database types
- Use `revalidatePath()` in Server Actions after mutations
- NEVER edit `package-lock.json` or `next-env.d.ts` manually
