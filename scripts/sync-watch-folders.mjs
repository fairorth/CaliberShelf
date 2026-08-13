// Create one image folder per watch under the configured "Watch Images" parent,
// named "<Brand> <Model> [<8-char-id>]". Idempotent — run it anytime; it only
// creates folders for watches that don't have one (matched by the [id] token,
// so renaming the readable part won't create duplicates).
//
// The web app cannot touch the local filesystem, so this local utility is how
// TenTenLoupe keeps the photo-lab folders in sync with the collection.
//
// Usage:
//   npm run sync-watch-folders                 # create missing folders
//   npm run sync-watch-folders -- --dry-run    # report only, no changes
//   npm run sync-watch-folders -- --prune      # also move orphaned folders to _removed (asks first)
//   npm run sync-watch-folders -- --dir "D:\Path"  # override the parent folder
//
// Parent folder resolution: --dir  >  WATCH_IMAGES_DIR env  >  profiles.watch_images_path (Config → Settings).
// Required in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

loadEnvConfig(process.cwd())

const args = process.argv.slice(2)
const DRY = args.includes("--dry-run")
const PRUNE = args.includes("--prune")
const dirIdx = args.indexOf("--dir")
const dirArg = dirIdx >= 0 ? args[dirIdx + 1] : null

const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
  (k) => !process.env[k]
)
if (missing.length) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function sanitize(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "-") // Windows-illegal characters
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[ .]+$/, "") // no trailing space/dot on Windows
}

function folderName(w) {
  const brand = w.brands?.name ?? ""
  const base = `${brand} ${w.model ?? ""}`.trim() || "Watch"
  return `${sanitize(base)} [${w.id.slice(0, 8)}]`
}

function idTokenOf(folder) {
  const m = folder.match(/\[([0-9a-fA-F]{8})\]$/)
  return m ? m[1].toLowerCase() : null
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (ans) => {
      rl.close()
      resolve(/^y(es)?$/i.test(ans.trim()))
    })
  })
}

async function resolveParent() {
  if (dirArg) return dirArg
  if (process.env.WATCH_IMAGES_DIR) return process.env.WATCH_IMAGES_DIR
  const { data } = await supabase
    .from("profiles")
    .select("watch_images_path")
    .not("watch_images_path", "is", null)
    .limit(1)
    .maybeSingle()
  return data?.watch_images_path ?? null
}

async function main() {
  const parent = await resolveParent()
  if (!parent) {
    console.error(
      "No Watch Images folder configured. Set it in Config → Settings, or pass --dir <path>, or set WATCH_IMAGES_DIR."
    )
    process.exit(1)
  }
  console.log(`Watch Images parent: ${parent}${DRY ? "  (dry run)" : ""}`)
  if (!DRY) fs.mkdirSync(parent, { recursive: true })

  const { data: watches, error } = await supabase
    .from("watches")
    .select("id, model, brands(name)")
    .order("model")
  if (error) {
    console.error("Failed to fetch watches:", error.message)
    process.exit(1)
  }

  const existing = fs.existsSync(parent)
    ? fs.readdirSync(parent, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : []
  const existingIds = new Set(existing.map(idTokenOf).filter(Boolean))

  let created = 0
  for (const w of watches ?? []) {
    const short = w.id.slice(0, 8).toLowerCase()
    if (existingIds.has(short)) continue
    const name = folderName(w)
    if (DRY) {
      console.log(`  would create: ${name}`)
    } else {
      fs.mkdirSync(path.join(parent, name), { recursive: true })
      console.log(`  created: ${name}`)
    }
    created++
  }
  console.log(
    `\n${DRY ? "Would create" : "Created"} ${created} folder(s). ` +
      `${(watches ?? []).length} watches, ${existing.length} existing folder(s).`
  )

  if (PRUNE) {
    const validIds = new Set((watches ?? []).map((w) => w.id.slice(0, 8).toLowerCase()))
    const orphans = existing.filter((f) => {
      const t = idTokenOf(f)
      return t && !validIds.has(t)
    })
    if (orphans.length === 0) {
      console.log("\nNo orphaned folders.")
      return
    }
    console.log(`\nOrphaned folders (no matching watch): ${orphans.length}`)
    orphans.forEach((o) => console.log(`  ${o}`))
    if (DRY) {
      console.log("(dry run — nothing moved)")
      return
    }
    const ok = await confirm(`\nMove these ${orphans.length} folder(s) into "_removed"? [y/N] `)
    if (!ok) {
      console.log("Skipped — orphans left in place.")
      return
    }
    const removedDir = path.join(parent, "_removed")
    fs.mkdirSync(removedDir, { recursive: true })
    for (const o of orphans) {
      fs.renameSync(path.join(parent, o), path.join(removedDir, o))
      console.log(`  moved: ${o}  ->  _removed/`)
    }
  }
}

main().catch((err) => {
  console.error("sync-watch-folders failed:", err.message ?? err)
  process.exit(1)
})
