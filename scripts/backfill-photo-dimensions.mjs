// One-time backfill for watch_photos.image_width / image_height (00048).
//
// Phase 8 §2.1 sizes the home stage from a photograph's stored aspect, and
// §1.2 / Phase 9 §1.1 pick WHICH frame to show by comparing aspects — both
// server-side, before any image is loaded. Photos uploaded before 00048 have
// no dimensions, so they would all take the 3:2 fallback and sit out those
// comparisons. This resolves them once.
//
// Reads each stored object from Supabase Storage and measures it with sharp,
// applying EXIF orientation (5–8 transpose the grid) so a portrait shot is
// recorded portrait. Deliberately measures the STORED composite — the file
// being displayed — never a source RAW.
//
// Rows it cannot resolve are left NULL and reported. That is a supported
// state, not a failure: NULL means "3:2 fallback box, excluded from aspect
// comparison". Legacy rows whose object has since been deleted will simply
// stay NULL forever, and everything downstream copes.
//
// Idempotent: only touches rows where either dimension is NULL. Safe to re-run.
//
// Usage:
//   node scripts/backfill-photo-dimensions.mjs [--dry-run] [--limit N]
//
// Required in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

loadEnvConfig(process.cwd())

const BUCKET = "watch-photos"
/** Storage reads are the slow part; a dozen at a time is plenty. */
const CONCURRENCY = 8

const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
let LIMIT = Infinity
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === "--dry-run") continue
  if (a === "--limit") {
    LIMIT = Number(args[++i])
    if (!Number.isFinite(LIMIT) || LIMIT <= 0) {
      console.error("--limit needs a positive number")
      process.exit(1)
    }
    continue
  }
  console.error(`Unknown argument: "${a}". Valid: --dry-run, --limit N`)
  process.exit(1)
}

const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
  (k) => !process.env[k]
)
if (missing.length > 0) {
  console.error(`Missing env vars in .env.local: ${missing.join(", ")}`)
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

/** Dimensions after EXIF orientation, or null when unreadable. */
async function measure(buffer) {
  try {
    const meta = await sharp(buffer).metadata()
    if (!meta.width || !meta.height) return null
    const transposed =
      typeof meta.orientation === "number" &&
      meta.orientation >= 5 &&
      meta.orientation <= 8
    return transposed
      ? { width: meta.height, height: meta.width }
      : { width: meta.width, height: meta.height }
  } catch {
    return null
  }
}

async function run() {
  const { data, error } = await supabase
    .from("watch_photos")
    .select("id, storage_path, image_width, image_height")
    .or("image_width.is.null,image_height.is.null")
    .order("created_at", { ascending: true })

  if (error) {
    console.error(`Could not read watch_photos: ${error.message}`)
    process.exit(1)
  }

  const rows = (data ?? []).slice(0, LIMIT === Infinity ? undefined : LIMIT)
  console.log(`${rows.length} photo${rows.length === 1 ? "" : "s"} without dimensions.`)
  if (rows.length === 0) return { resolved: 0, unresolved: [], total: 0 }
  if (DRY_RUN) {
    console.log("--dry-run: nothing written.")
    return { resolved: 0, unresolved: [], total: rows.length, dryRun: true }
  }

  let resolved = 0
  const unresolved = []
  let cursor = 0

  async function worker() {
    for (;;) {
      const i = cursor++
      if (i >= rows.length) return
      const row = rows[i]

      const { data: blob, error: dlError } = await supabase.storage
        .from(BUCKET)
        .download(row.storage_path)
      if (dlError || !blob) {
        unresolved.push({ id: row.id, path: row.storage_path, why: "object missing" })
        continue
      }

      const dims = await measure(Buffer.from(await blob.arrayBuffer()))
      if (!dims) {
        unresolved.push({ id: row.id, path: row.storage_path, why: "undecodable" })
        continue
      }

      const { error: upError } = await supabase
        .from("watch_photos")
        .update({ image_width: dims.width, image_height: dims.height })
        .eq("id", row.id)
      if (upError) {
        unresolved.push({ id: row.id, path: row.storage_path, why: upError.message })
        continue
      }

      resolved++
      if (resolved % 25 === 0) console.log(`  …${resolved}/${rows.length}`)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker)
  )
  return { resolved, unresolved, total: rows.length }
}

const result = await run()

if (!result.dryRun && result.total > 0) {
  console.log("")
  console.log(`Resolved:   ${result.resolved}`)
  console.log(`Unresolved: ${result.unresolved.length}`)
  if (result.unresolved.length > 0) {
    console.log("")
    console.log("These rows keep NULL dimensions — they will use the 3:2")
    console.log("fallback box and sit out aspect comparison, which is a")
    console.log("supported state, not a bug:")
    for (const u of result.unresolved.slice(0, 40)) {
      console.log(`  ${u.id}  ${u.why}  ${u.path}`)
    }
    if (result.unresolved.length > 40) {
      console.log(`  …and ${result.unresolved.length - 40} more`)
    }
  }
}
