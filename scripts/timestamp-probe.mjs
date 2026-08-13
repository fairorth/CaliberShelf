// timestamp-probe.mjs — answers one question before Phase 4 is built on it:
// does EOS Utility stamp a transferred file with the WORKSTATION clock (when it
// wrote the file) or the CAMERA clock (when the shutter fired)?
//
// It matters because the capture-pipeline watcher binds each frame to a photo
// session by comparing the file's mtime against the session's start/end window.
// If mtime carries the camera's clock and that clock has drifted, every frame
// binds to the wrong session or to none.
//
// Usage:
//   npm run timestamp-probe -- --dir "c:\WatchImages\_inbox"
//   npm run timestamp-probe -- --dir "c:\WatchImages\_inbox" --limit 5
//
// Reads only. Moves nothing, writes nothing, touches no database.
//
// IMPORTANT — set the camera clock deliberately WRONG before shooting the test
// frame (30 minutes is plenty). If the camera and the PC agree, both answers
// look identical and the probe proves nothing.

import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import { exiftool } from "exiftool-vendored"

const args = process.argv.slice(2)

const KNOWN_FLAGS = new Set(["--dir", "--limit"])
for (const a of args) {
  if (a.startsWith("--") && !KNOWN_FLAGS.has(a)) {
    console.error(`Unknown flag: ${a}`)
    console.error(`Known flags: ${[...KNOWN_FLAGS].join(", ")}`)
    process.exit(1)
  }
}

const dirIdx = args.indexOf("--dir")
const dir = dirIdx >= 0 ? args[dirIdx + 1] : null
const limitIdx = args.indexOf("--limit")
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 10

if (!dir) {
  console.error('Pass a folder: --dir "c:\\WatchImages\\_inbox"')
  process.exit(1)
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".cr3", ".heif", ".heic", ".png", ".tif", ".tiff"])

/** Local ISO-ish, so the three timestamps are directly comparable by eye. */
function fmt(d) {
  if (!d) return "—"
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return String(d)
  const p = (n) => String(n).padStart(2, "0")
  return (
    `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())} ` +
    `${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
  )
}

function deltaLabel(a, b) {
  if (!a || !b) return "—"
  const secs = Math.round((a.getTime() - b.getTime()) / 1000)
  const sign = secs >= 0 ? "+" : "-"
  const s = Math.abs(secs)
  if (s < 90) return `${sign}${s}s`
  if (s < 5400) return `${sign}${Math.round(s / 60)}m`
  return `${sign}${(s / 3600).toFixed(1)}h`
}

async function main() {
  const now = new Date()
  console.log(`\nWorkstation clock right now : ${fmt(now)}`)
  console.log(`Folder                      : ${dir}\n`)

  let names
  try {
    names = await readdir(dir)
  } catch (err) {
    console.error(`Cannot read ${dir}: ${err.message}`)
    process.exit(1)
  }

  const files = names.filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
  if (files.length === 0) {
    console.error("No image files found there.")
    process.exit(1)
  }

  // Newest first — the test frame is the one just shot.
  const withStats = []
  for (const name of files) {
    const abs = path.join(dir, name)
    const st = await stat(abs)
    withStats.push({ name, abs, st })
  }
  withStats.sort((a, b) => b.st.mtime - a.st.mtime)

  const rows = []
  for (const f of withStats.slice(0, limit)) {
    let captured = null
    try {
      const tags = await exiftool.read(f.abs)
      const raw = tags.DateTimeOriginal ?? tags.CreateDate ?? null
      // exiftool-vendored returns its own date objects; toDate() when present.
      captured = raw ? (typeof raw.toDate === "function" ? raw.toDate() : new Date(String(raw))) : null
    } catch {
      // Unreadable EXIF is itself a useful result — leave it null.
    }
    rows.push({
      name: f.name,
      mtime: f.st.mtime,
      birth: f.st.birthtime,
      captured,
    })
  }

  const pad = (s, n) => String(s).padEnd(n)
  console.log(
    pad("FILE", 26) + pad("mtime (Date modified)", 22) + pad("EXIF taken", 22) + pad("created", 22) + "mtime−EXIF"
  )
  console.log("-".repeat(104))
  for (const r of rows) {
    console.log(
      pad(r.name.slice(0, 25), 26) +
        pad(fmt(r.mtime), 22) +
        pad(fmt(r.captured), 22) +
        pad(fmt(r.birth), 22) +
        deltaLabel(r.mtime, r.captured)
    )
  }

  // The verdict only means something if the two clocks actually differ.
  const newest = rows[0]
  console.log("\nReading of the newest file:")
  if (!newest.captured) {
    console.log("  No EXIF capture time — cannot compare. Try a JPEG straight off the camera.")
  } else {
    const drift = Math.abs(newest.mtime.getTime() - newest.captured.getTime()) / 1000
    if (drift < 90) {
      console.log(
        "  mtime MATCHES the camera's capture time.\n" +
          "  If you set the camera clock deliberately wrong, this means EOS Utility\n" +
          "  PRESERVES the camera timestamp — session binding cannot trust mtime alone.\n" +
          "  If you did NOT offset the camera clock, this result proves nothing: re-run\n" +
          "  the test with the camera clock 30 minutes out."
      )
    } else {
      console.log(
        `  mtime DIFFERS from the camera's capture time by ${deltaLabel(newest.mtime, newest.captured)}.\n` +
          "  That is the answer we want: EOS Utility stamps the workstation clock at\n" +
          "  write time, so mtime is safe to bind sessions on."
      )
    }
  }
  console.log("")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => exiftool.end())
