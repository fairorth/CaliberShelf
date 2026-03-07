---
name: new-component
description: Create a new React component following CaliberShelf conventions
user-invocable: true
argument-hint: [ComponentName] [client|server]
---

Create a new component. First argument is the name, second is "client" or "server" (default: server).

## Steps
1. Determine if this is a shared component (`src/components/`) or route-specific (`_components/`)
2. Create the file using kebab-case naming: `my-component.tsx`
3. If client component, add "use client" directive at top
4. Define a Props interface above the component
5. Use named export (not default)
6. Use Tailwind classes and shadcn/ui tokens for styling
7. If this component needs a form, use React Hook Form + Zod schema from `src/lib/validations/`

## Template (Server Component)
```tsx
import { cn } from "@/lib/utils"

interface MyComponentProps {
  className?: string
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <div className={cn("", className)}>
      {/* Implementation */}
    </div>
  )
}
```

## Template (Client Component)
```tsx
"use client"

import { cn } from "@/lib/utils"

interface MyComponentProps {
  className?: string
}

export function MyComponent({ className }: MyComponentProps) {
  return (
    <div className={cn("", className)}>
      {/* Implementation */}
    </div>
  )
}
```
