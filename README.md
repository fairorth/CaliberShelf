# CaliberShelf

A personal watch-collection tracker built with Next.js 15, Supabase, Tailwind
CSS v4, and shadcn/ui — collection management, photos, wear logging,
timegrapher records, reports, and an AI market-valuation agent.

Production: https://caliber-shelf.vercel.app (auto-deploys from `master`).

## Documentation

- [The Agent Fleet](docs/agents.md) — every AI agent and automated script:
  what it does, how it's initiated, observed costs, and cost levers.
- [Price Check — the Market Valuation Agent](docs/price-check.md) — how the
  AI valuation system works: opting watches in, running it (CLI + GitHub
  Actions), the monthly schedule, cost management, and troubleshooting.
- [CLAUDE.md](CLAUDE.md) — architecture, conventions, and commands.

## Getting Started

```bash
npm install
npm run dev        # dev server (Turbopack) on http://localhost:3000
```

Supabase credentials go in `.env.local` (gitignored) — see
[docs/price-check.md](docs/price-check.md) for the full key list.

## Common Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run price-check       # AI market-valuation run (see docs/price-check.md)
npm run deal-check        # wish-list availability scan (free, no LLM)
npm run find-store-urls   # brand store-URL/type enrichment agent
npm run find-references   # reference-number sweep agent (--majors-only,
                          #   --value-limit N to scope; see docs/agents.md)
```
