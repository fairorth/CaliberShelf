---
name: new-route
description: Create a new Next.js App Router page with proper data fetching
user-invocable: true
argument-hint: [route-path]
---

Create a new route at the specified path under `src/app/(dashboard)/`.

## Steps
1. Create `src/app/(dashboard)/$ARGUMENTS/page.tsx` as a Server Component
2. If the page needs data, create a query function in `src/lib/queries/`
3. Create `_components/` folder for route-specific interactive components
4. Add the route to the sidebar navigation in `src/components/layout/sidebar.tsx`

## Page Template
```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Title | WatchTracker",
}

export default async function PageName() {
  // Fetch data using query functions from src/lib/queries/
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
      {/* Page content */}
    </div>
  )
}
```

## Dynamic Route Template
```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function PageName({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Fetch data with id
  // if (!data) notFound()
  return (
    <div className="space-y-6">
      {/* Page content */}
    </div>
  )
}
```
