"use client"

import { migrateBrandStorageKeys } from "@/lib/storage-migration"

// Module scope, deliberately not an effect. Every consumer reads storage inside
// useEffect, and React runs effects only after the initial client modules have
// evaluated — so calling it here guarantees the migration finishes before the
// first read. An effect on a root provider would run *after* its children's
// effects, which is exactly backwards for this.
migrateBrandStorageKeys()

/** Renders nothing; exists so the root layout pulls the module in. */
export function StorageMigration() {
  return null
}
