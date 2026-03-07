---
name: verify
description: Run the full quality gate — typecheck, lint, and build
user-invocable: true
---

Run all verification checks in sequence to ensure the project is in a clean state.

## Steps
1. Run `npm run typecheck` — catch TypeScript errors
2. Run `npm run lint` — catch ESLint issues
3. Run `npm run build` — verify production build succeeds

## When to Use
- After completing any feature or significant code change
- Before committing code
- After resolving merge conflicts
- When something feels "off" and you want a full check

## Error Handling
- If typecheck fails: fix type errors before proceeding
- If lint fails: fix lint issues (often auto-fixable)
- If build fails: check for runtime errors, missing imports, or SSR issues
