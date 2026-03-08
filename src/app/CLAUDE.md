# Route Conventions

## Server vs Client Components
- Pages (`page.tsx`) and layouts (`layout.tsx`) are Server Components by default
- Fetch data in Server Components using functions from `src/lib/queries/`
- Interactive UI (forms, charts, dropdowns) uses Client Components in `_components/`
- Pass server-fetched data down to Client Components as props

## Data Fetching Pattern
```tsx
// page.tsx (Server Component)
import { getWatchById } from "@/lib/queries/watches"
import { WatchDetail } from "./_components/watch-detail-header"

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) notFound()
  return <WatchDetail watch={watch} />
}
```

## Build Cache
- After deleting a route, stale `.next/types` may cause phantom TS errors — delete `.next/types` and `.next/dev/types`
- `npm run build` always compiles from scratch; `npm run dev` uses incremental cache

## Mutations Pattern
- All mutations use Server Actions from `src/lib/actions/`
- Server Actions call `revalidatePath()` to refresh data after mutations
- Forms use `useActionState` (React 19) for Server Action integration:
```tsx
"use client"
import { useActionState } from "react"
import { myAction } from "@/lib/actions/my-actions"
import type { MyState } from "@/lib/actions/my-actions"

const [state, formAction, isPending] = useActionState<MyState, FormData>(myAction, {})
// Use: <form action={formAction}>
```
- NOTE: `useActionState` replaces the deprecated `useFormState` from `react-dom`

## Route Groups
- `(auth)` - Unauthenticated pages (login, signup). No sidebar or nav.
- `(dashboard)` - Authenticated pages. Layout includes sidebar nav and auth check.

## Private Folders
- `_components/` inside each route holds route-specific components
- The underscore prefix opts them out of the routing system
- Only truly shared components go in `src/components/`
