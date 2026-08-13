// One-time migration of browser storage from CaliberShelf-era key names to
// TenTenLoupe ones. A rename must never cost a user their saved state.
//
// Two shapes are handled:
//   - explicit renames, for keys whose name carried the old brand
//   - any residual `calibershelf:` / `calibershelf-` / `calibershelf_` prefixed
//     key, rewritten under the matching tentenloupe prefix
//
// Unbranded keys (collection-view, collection-sort, home-hero-dwell-seconds, …)
// are deliberately untouched: their names did not change, so there is nothing to
// migrate and renaming them now would be the very data loss this guards against.

/** Keys whose full name changed with the rebrand. */
const RENAMES: Record<string, string> = {
  "calibershelf-ios-install-dismissed": "tentenloupe-ios-install-dismissed",
}

/** Prefix rewrites, applied to anything the explicit map missed. */
const PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["calibershelf:", "tentenloupe:"],
  ["calibershelf-", "tentenloupe-"],
  ["calibershelf_", "tentenloupe_"],
]

/** Marks the migration done so it costs one getItem on later loads. */
const DONE_KEY = "tentenloupe-storage-migrated"

function move(store: Storage, oldKey: string, newKey: string): void {
  const value = store.getItem(oldKey)
  if (value === null) return
  // Never clobber a value already written under the new name — a fresh write
  // from this build is newer than anything left behind by the old one.
  if (store.getItem(newKey) === null) store.setItem(newKey, value)
  store.removeItem(oldKey)
}

function migrateStore(store: Storage): void {
  for (const [oldKey, newKey] of Object.entries(RENAMES)) {
    move(store, oldKey, newKey)
  }

  // Snapshot the key list first: removing entries mid-iteration reindexes the
  // store and would silently skip keys.
  const keys: string[] = []
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i)
    if (k !== null) keys.push(k)
  }

  for (const key of keys) {
    for (const [from, to] of PREFIXES) {
      if (key.startsWith(from)) {
        move(store, key, to + key.slice(from.length))
        break
      }
    }
  }
}

/**
 * Idempotent and safe to call on every load. No-ops on the server and wherever
 * storage is unavailable (private mode, blocked cookies) — a failed migration
 * must never take the app down with it.
 */
export function migrateBrandStorageKeys(): void {
  if (typeof window === "undefined") return
  try {
    if (window.localStorage.getItem(DONE_KEY) === "1") return
    migrateStore(window.localStorage)
    migrateStore(window.sessionStorage)
    window.localStorage.setItem(DONE_KEY, "1")
  } catch {
    // Storage disabled — there is nothing to migrate and nothing to report.
  }
}
