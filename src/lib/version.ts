/**
 * Human-facing app version shown next to the CaliberShelf wordmark.
 *
 * Single source of truth is package.json's "version" field, injected at build
 * time via NEXT_PUBLIC_APP_VERSION (see next.config.ts). Bump it with:
 *   npm version patch   # every deploy        (1.2.0 → 1.2.1)
 *   npm version minor   # feature batch        (1.2.0 → 1.3.0)
 *   npm version major   # big release          (1.2.0 → 2.0.0)
 * which also commits and git-tags the release.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"
