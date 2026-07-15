# CaliberShelf

A personal watch-collection tracker built with Next.js 15, Supabase, Tailwind
CSS v4, and shadcn/ui — collection management, photos, wear logging,
timegrapher records, reports, and an AI market-valuation agent.

Production: https://caliber-shelf.vercel.app (auto-deploys from `master`).

## Documentation

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
npm run price-check  # AI market-valuation run (see docs/price-check.md)
```
