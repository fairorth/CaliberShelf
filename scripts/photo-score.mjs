// Photo-scoring agent for TenTenLoupe.
//   Layer 1 — CV triage (free, deterministic): stack collapse, dial-ROI
//     sharpness / brightness / glare, perceptual-hash duplicate clustering.
//   Layer 2, Track A — shot-card evaluation (Haiku vision): matches each CV
//     survivor against the standard shot list and returns pass/fail with a
//     named defect. Output per watch is a coverage matrix + reshoot list.
//
// Scores land in watch_image_scores (00040); each watch folder also gets a
// self-contained _photo-report.html culling report.
// Plan: docs/photo-scoring-agent.md. Operator guide: docs/agents.md.
//
// Usage:
//   npm run photo-score                        # score all watches with folders
//   npm run photo-score -- --dry-run           # compute + print, write nothing
//   npm run photo-score -- --no-ai             # Layer 1 only, $0
//   npm run photo-score -- --limit 2           # only the first N watches
//   npm run photo-score -- --watch <uuid>      # a single watch
//   npm run photo-score -- --force             # re-score already-scored frames
//   npm run photo-score -- --model <id>        # override the card-grader model
//   npm run photo-score -- --dir "D:\Path"     # override the WatchImages parent
//
// Parent folder resolution: --dir > WATCH_IMAGES_DIR env > profiles.watch_images_path.
// Required in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// and ANTHROPIC_API_KEY unless --no-ai.

import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { exiftool } from "exiftool-vendored"
import sharp from "sharp"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { startRun, finishRun, usdToMicros } from "./lib/agent-run.mjs"

loadEnvConfig(process.cwd())

// ── Tunables ─────────────────────────────────────────────────────
const IMAGE_EXTS = new Set([".cr3", ".jpg", ".jpeg", ".heif", ".heic"])
const STACK_GAP_MS = 2000 // frames closer than this are one bracket run
const STACK_MIN_FRAMES = 5 // shorter bursts count as singles, not stacks
const COMPOSITE_WINDOW_MS = 120_000 // composite lands within 2 min of its run
const HAMMING_MAX = 10 // phash distance for near-duplicate clustering
const ROI_FRACTION = 0.6 // center crop treated as the dial ROI (plan 3.3)
const DECODE_LONG_EDGE = 768 // grayscale working size for CV metrics
const GLARE_LUMA = 250 // ROI pixels above this count as clipped
const WEAK_SHARP_PCTL = 0.2 // bottom slice per watch flagged as cull candidates
const GLARE_FLAG = 0.1 // ROI clipped fraction that earns a glare flag (lenient)
const BRIGHT_LOW = 40
const BRIGHT_HIGH = 220
const PREVIEW_DIR = "_previews" // regenerable thumbs for the HTML report
const PREVIEW_LONG_EDGE = 640
const REPORT_NAME = "_photo-report.html"

// ── Track A model + pricing (fleet convention: constants up top) ─
const DEFAULT_MODEL = "claude-haiku-4-5"
const MAX_TOKENS = 512
// List pricing for the run-cost printout (Haiku 4.5: $1/$5 per MTok).
const PRICE_PER_MTOK = { input: 1, output: 5 }
const AI_LONG_EDGE = 1024 // card-grader input size (≈1k image tokens)
const AI_JPEG_QUALITY = 82

// The standard shot list every watch gets (plan 3.6). Each card carries the
// expected subject/angle and objective pass criteria — the grader returns
// pass/fail with a named defect, never an aesthetic score. Frames matching no
// card route to Track B ("creative") for the Phase 3 rubric.
const SHOT_CARDS = [
  {
    key: "overhead_dial",
    label: "Overhead dial",
    spec:
      "Straight overhead shot, dial parallel to the camera, whole watch head in frame with margin. " +
      "Pass only if the dial is in sharp focus, dial text is legible, and no blown highlight patch hides dial detail.",
  },
  {
    key: "caseback",
    label: "Caseback",
    spec:
      "The case back (engraved solid back or exhibition movement view). " +
      "Pass only if the caseback is roughly centered, in focus, and engravings or movement details are legible.",
  },
  {
    key: "crown_side",
    label: "Crown side",
    spec:
      "Side profile showing the crown and case flank. " +
      "Pass only if the crown is in focus and the case side profile is clearly visible.",
  },
  {
    key: "lug_low",
    label: "Low lug angle",
    spec:
      "Deliberate low-angle shot of the lug/case junction. " +
      "Pass only if the lug junction is in focus and the low angle is clearly intentional (not a crooked overhead).",
  },
]

// ── CLI args ─────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const FORCE = args.includes("--force")
const LIMIT = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1], 10)
  : Infinity
const ONLY_WATCH = args.includes("--watch")
  ? args[args.indexOf("--watch") + 1]
  : null
const DIR_OVERRIDE = args.includes("--dir")
  ? args[args.indexOf("--dir") + 1]
  : null
const NO_AI = args.includes("--no-ai")
const MODEL = args.includes("--model")
  ? args[args.indexOf("--model") + 1]
  : DEFAULT_MODEL

// Reject anything unrecognized — a mistyped flag must never silently change
// what a run does (agents.md foot-gun rule).
validateArgs(args, {
  "--dry-run": false,
  "--force": false,
  "--no-ai": false,
  "--limit": true,
  "--watch": true,
  "--dir": true,
  "--model": true,
})
function validateArgs(argv, known) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a in known) {
      if (known[a]) i++
      continue
    }
    console.error(
      `Unknown argument: "${a}" — did you mean "--${a.replace(/^-+/, "")}"?\n` +
        `Valid flags: ${Object.keys(known).join(", ")}`
    )
    process.exit(1)
  }
}

// ── Env checks (values are never printed) ────────────────────────
const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
if (!NO_AI) requiredEnv.push("ANTHROPIC_API_KEY")
const missing = requiredEnv.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(
    `Missing env vars in .env.local: ${missing.join(", ")}` +
      (missing.includes("ANTHROPIC_API_KEY") ? " (or pass --no-ai for the free CV layer only)" : "")
  )
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const anthropic = NO_AI ? null : new Anthropic() // reads ANTHROPIC_API_KEY

// ── Folder resolution (same chain as sync-watch-folders) ─────────
async function resolveParent() {
  if (DIR_OVERRIDE) return DIR_OVERRIDE
  if (process.env.WATCH_IMAGES_DIR) return process.env.WATCH_IMAGES_DIR
  const { data } = await supabase
    .from("profiles")
    .select("watch_images_path")
    .not("watch_images_path", "is", null)
    .limit(1)
    .maybeSingle()
  return data?.watch_images_path ?? null
}

function idTokenOf(folder) {
  const m = folder.match(/\[([0-9a-fA-F]{8})\]$/)
  return m ? m[1].toLowerCase() : null
}

// ── Small utilities ──────────────────────────────────────────────
function hashFile(absPath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256")
    fs.createReadStream(absPath)
      .on("data", (chunk) => h.update(chunk))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject)
  })
}

function listImageFiles(dir, base = dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listImageFiles(abs, base))
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      out.push({
        absPath: abs,
        relPath: path.relative(base, abs).split(path.sep).join("/"),
        fileName: entry.name,
      })
    }
  }
  return out
}

const CANON_NAME = /^(img|mvi)_\d{4}/i

function classifyKind(fileName, cr3Basenames) {
  const ext = path.extname(fileName).toLowerCase()
  const base = path.basename(fileName, path.extname(fileName)).toLowerCase()
  if (ext === ".cr3") return "cr3"
  const inCamera = CANON_NAME.test(fileName) || cr3Basenames.has(base)
  if (ext === ".heif" || ext === ".heic") return inCamera ? "heif" : "export"
  return inCamera ? "jpeg" : "export"
}

// ── CV metrics ───────────────────────────────────────────────────
// One grayscale decode per frame at working size; the dial ROI is a center
// crop — reliable because the lab rig frames the watch at 70-80% of frame
// (photo-lab.md). dial_focal_x/y do NOT apply to capture-folder frames.
async function computeMetrics(buffer) {
  const { data, info } = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .greyscale()
    .resize(DECODE_LONG_EDGE, DECODE_LONG_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const roiW = Math.max(3, Math.round(width * ROI_FRACTION))
  const roiH = Math.max(3, Math.round(height * ROI_FRACTION))
  const roiX = Math.floor((width - roiW) / 2)
  const roiY = Math.floor((height - roiH) / 2)

  // Laplacian variance (3x3 kernel [0,1,0,1,-4,1,0,1,0]) over the ROI.
  let sum = 0
  let sumSq = 0
  let n = 0
  let lumaSum = 0
  let clipped = 0
  for (let y = roiY + 1; y < roiY + roiH - 1; y++) {
    const row = y * width
    for (let x = roiX + 1; x < roiX + roiW - 1; x++) {
      const i = row + x
      const lap =
        data[i - width] + data[i - 1] + data[i + 1] + data[i + width] - 4 * data[i]
      sum += lap
      sumSq += lap * lap
      n++
      lumaSum += data[i]
      if (data[i] > GLARE_LUMA) clipped++
    }
  }
  const mean = sum / n
  return {
    sharpness: sumSq / n - mean * mean,
    brightness: lumaSum / n,
    glare: clipped / n,
    phash: await dHash(buffer),
  }
}

// 9x8 grayscale difference hash -> 64 bits -> 16-char hex.
async function dHash(buffer) {
  const raw = await sharp(buffer)
    .rotate()
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer()
  let bits = 0n
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits = (bits << 1n) | (raw[y * 9 + x] < raw[y * 9 + x + 1] ? 1n : 0n)
    }
  }
  return bits.toString(16).padStart(16, "0")
}

function hamming(hexA, hexB) {
  let x = BigInt("0x" + hexA) ^ BigInt("0x" + hexB)
  let count = 0
  while (x) {
    x &= x - 1n
    count++
  }
  return count
}

// Union-find over phashes with distance <= HAMMING_MAX.
function clusterDuplicates(frames) {
  const parent = frames.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      if (hamming(frames[i].phash, frames[j].phash) <= HAMMING_MAX) {
        parent[find(i)] = find(j)
      }
    }
  }
  const groups = new Map()
  frames.forEach((f, i) => {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(f)
  })
  let groupNo = 0
  for (const members of groups.values()) {
    if (members.length < 2) continue
    groupNo++
    const best = members.reduce((a, b) =>
      (b.sharpness ?? -1) > (a.sharpness ?? -1) ? b : a
    )
    for (const m of members) {
      m.dupGroup = groupNo
      m.dupBest = m === best
    }
  }
  return groupNo
}

// ── Stack-sequence collapse (plan 3.7) ───────────────────────────
// Sort CR3s by DateTimeOriginal; consecutive frames closer than STACK_GAP_MS
// form a run; runs of >= STACK_MIN_FRAMES are bracket sequences. Each gets
// collapsed to its in-camera composite (nearest canon-named JPG/HEIF landing
// within COMPOSITE_WINDOW_MS after the run). A sequence with no composite is
// flagged "unstacked" in the report.
function detectStacks(records) {
  const cr3s = records
    .filter((r) => r.kind === "cr3" && r.timestampMs != null)
    .sort((a, b) => a.timestampMs - b.timestampMs)
  const composites = records.filter(
    (r) => (r.kind === "jpeg" || r.kind === "heif") && r.timestampMs != null
  )

  let seq = 0
  let i = 0
  const sequences = []
  while (i < cr3s.length) {
    let j = i
    while (
      j + 1 < cr3s.length &&
      cr3s[j + 1].timestampMs - cr3s[j].timestampMs <= STACK_GAP_MS
    ) {
      j++
    }
    const run = cr3s.slice(i, j + 1)
    if (run.length >= STACK_MIN_FRAMES) {
      seq++
      const start = run[0].timestampMs
      const end = run[run.length - 1].timestampMs
      for (const r of run) {
        r.stackSeq = seq
        r.stackRole = "source"
      }
      let comp = null
      for (const c of composites) {
        if (c.stackSeq != null) continue
        if (c.timestampMs >= start && c.timestampMs <= end + COMPOSITE_WINDOW_MS) {
          if (!comp || Math.abs(c.timestampMs - end) < Math.abs(comp.timestampMs - end)) {
            comp = c
          }
        }
      }
      if (comp) {
        comp.stackSeq = seq
        comp.stackRole = "composite"
      }
      sequences.push({ seq, frames: run.length, composite: comp })
    }
    i = j + 1
  }
  return sequences
}

// ── Decode helpers ───────────────────────────────────────────────
let previewResolutionChecked = false

async function decodeFrame(record, tags) {
  if (record.kind === "cr3") {
    let buffer
    try {
      buffer = await exiftool.extractBinaryTagToBuffer("JpgFromRaw", record.absPath)
    } catch {
      try {
        buffer = await exiftool.extractBinaryTagToBuffer("PreviewImage", record.absPath)
      } catch {
        console.warn(`    (no embedded preview in ${record.fileName} — skipped)`)
        return null
      }
    }
    // Build-time check from the plan: confirm the embedded preview is
    // full-resolution on this camera before trusting ROI sharpness.
    if (!previewResolutionChecked && tags?.ImageWidth) {
      previewResolutionChecked = true
      const meta = await sharp(buffer).metadata()
      if (meta.width < tags.ImageWidth * 0.9) {
        console.warn(
          `  WARNING: CR3 embedded preview is ${meta.width}px vs raw ${tags.ImageWidth}px — ` +
            `sharpness values will be soft. Consider the LibRaw fallback (plan 3.1).`
        )
      }
    }
    return buffer
  }
  try {
    const buffer = fs.readFileSync(record.absPath)
    await sharp(buffer).metadata() // throws if sharp can't decode (e.g. HEVC HEIF)
    return buffer
  } catch {
    console.warn(`    (cannot decode ${record.fileName} — skipped)`)
    return null
  }
}

// ── Track A: shot-card evaluation (Haiku vision) ─────────────────
const verdictSchema = z.object({
  matched_card: z.enum([...SHOT_CARDS.map((c) => c.key), "none"]),
  pass: z.boolean(),
  defect: z.string(),
})

const CARD_SYSTEM_PROMPT = `You are the shot-card grader for a watch photography lab. Every watch gets a fixed list of standard shots ("cards"). Given ONE photograph of a known watch, decide which card it matches (or none) and whether it passes that card's criteria.

Be objective: right subject, in focus where the card demands it, legible detail. Deliberate shallow depth of field and controlled specular highlights on polished case edges are technique, not defects. A blown highlight patch that hides dial detail IS a defect.

Shot cards:
${SHOT_CARDS.map((c) => `- ${c.key}: ${c.spec}`).join("\n")}

Reply with RAW JSON ONLY — no markdown fences, no prose:
{"matched_card": ${SHOT_CARDS.map((c) => `"${c.key}"`).join(" | ")} | "none", "pass": true | false, "defect": "<= 6 words, or NONE"}

A frame that matches no card (props, flat-lays, artistic angles, wrist shots) is "none" — set pass to false and defect to NONE; it is not a failure, it just routes to the creative track.`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function evaluateCard(buffer, watch, record) {
  const image = await sharp(buffer)
    .rotate()
    .resize(AI_LONG_EDGE, AI_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: AI_JPEG_QUALITY })
    .toBuffer()

  const grounding =
    `Watch: ${watch.brands?.name ?? "unknown"} ${watch.model ?? ""}` +
    `${watch.reference_number ? ` (ref ${watch.reference_number})` : ""}. ` +
    `Source: ${record.kind}${record.stackRole === "composite" ? ", focus-stacked composite (sharp everywhere by design)" : ""}. ` +
    `Grade this frame.`

  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: CARD_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image.toString("base64"),
                },
              },
              { type: "text", text: grounding },
            ],
          },
        ],
      })
      const usage = {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      }
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")
      if (start === -1 || end === -1) throw new Error(`no JSON in verdict: ${text.slice(0, 120)}`)
      const parsed = verdictSchema.safeParse(JSON.parse(text.slice(start, end + 1)))
      if (!parsed.success) throw new Error(`verdict schema: ${parsed.error.issues[0].message}`)
      return { verdict: parsed.data, usage }
    } catch (err) {
      lastErr = err
      const status = err?.status ?? 0
      if (status === 429 || status >= 500) {
        await sleep(2000 * 2 ** attempt)
        continue
      }
      throw err
    }
  }
  throw lastErr
}

// ── HTML report ──────────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
const href = (relPath) => relPath.split("/").map(encodeURIComponent).join("/")

function frameCard(f) {
  const flags = []
  if (f.weakSharp) flags.push('<span class="flag bad">soft</span>')
  if (f.glare != null && f.glare > GLARE_FLAG) flags.push('<span class="flag bad">glare</span>')
  if (f.brightness != null && (f.brightness < BRIGHT_LOW || f.brightness > BRIGHT_HIGH))
    flags.push('<span class="flag bad">exposure</span>')
  if (f.dupGroup != null)
    flags.push(
      `<span class="flag ${f.dupBest ? "good" : ""}">dup #${f.dupGroup}${f.dupBest ? " · best" : ""}</span>`
    )
  if (f.shotCard === "creative") flags.push('<span class="flag">creative</span>')
  else if (f.shotCard != null)
    flags.push(
      `<span class="flag ${f.cardPass ? "pass" : "fail"}">${esc(f.shotCard)} ${f.cardPass ? "✓" : "✗"}${
        !f.cardPass && f.aiDefect ? " — " + esc(f.aiDefect) : ""
      }</span>`
    )
  const img = f.previewName
    ? `<a href="${href(f.relPath)}"><img loading="lazy" src="${PREVIEW_DIR}/${esc(f.previewName)}" alt=""></a>`
    : `<a href="${href(f.relPath)}" class="noimg">${esc(f.fileName)}</a>`
  const metrics =
    f.sharpness != null
      ? `sharp ${Math.round(f.sharpness)} · bright ${Math.round(f.brightness)} · glare ${(f.glare * 100).toFixed(1)}%`
      : "not scored"
  return `<div class="card${f.weakSharp ? " weak" : ""}">
  ${img}
  <div class="meta"><span class="name">${esc(f.fileName)}</span><span class="kind">${esc(f.kind)}</span></div>
  <div class="metrics">${metrics}</div>
  <div class="flags">${flags.join(" ")}</div>
</div>`
}

// Coverage matrix + reshoot list (Track A output). A card is covered when at
// least one frame matched it AND passed; the keeper is the sharpest passer.
function coverageHtml(records) {
  const carded = records.filter((r) => r.shotCard != null && r.stackRole !== "source")
  if (carded.length === 0) return ""
  const reshoots = []
  const rows = SHOT_CARDS.map((card) => {
    const matches = carded.filter((r) => r.shotCard === card.key)
    const passing = matches
      .filter((r) => r.cardPass)
      .sort((a, b) => (b.sharpness ?? -1) - (a.sharpness ?? -1))
    if (passing.length > 0) {
      const keeper = passing[0]
      return `<tr><td>${esc(card.label)}</td><td><span class="flag pass">PASS</span> keeper: <a href="${href(keeper.relPath)}">${esc(keeper.fileName)}</a> (${passing.length}/${matches.length} passing)</td></tr>`
    }
    reshoots.push(card.label)
    const defects = [...new Set(matches.map((m) => m.aiDefect).filter(Boolean))]
    const why =
      matches.length === 0
        ? "no matching frame"
        : `all ${matches.length} failed${defects.length > 0 ? ": " + esc(defects.join("; ")) : ""}`
    return `<tr><td>${esc(card.label)}</td><td><span class="flag fail">RESHOOT</span> ${why}</td></tr>`
  }).join("\n")
  const creative = carded.filter((r) => r.shotCard === "creative").length
  return `<h2>Standard-shot coverage</h2>
<table><tr><th>Card</th><th>Status</th></tr>${rows}</table>
<p class="note">${
    reshoots.length > 0
      ? `Reshoot list: <strong>${reshoots.map(esc).join(", ")}</strong>.`
      : "All standard shots covered."
  } ${creative} frame(s) routed to the creative track.</p>`
}

function buildReport(watchLabel, frames, sequences, coverage) {
  const singles = frames
    .filter((f) => f.stackRole !== "source" && f.stackRole !== "composite")
    .sort((a, b) => (b.sharpness ?? -1) - (a.sharpness ?? -1))
  const culls = frames.filter(
    (f) =>
      f.stackRole !== "source" &&
      (f.weakSharp || (f.dupGroup != null && !f.dupBest))
  )

  const seqHtml = sequences
    .map((s) => {
      const comp = s.composite
      const sources = frames
        .filter((f) => f.stackSeq === s.seq && f.stackRole === "source")
        .map((f) => `<li>${esc(f.fileName)}</li>`)
        .join("")
      return `<div class="seq">
  <h3>Stack sequence ${s.seq} — ${s.frames} source frames ${comp ? "" : '<span class="flag bad">unstacked — needs composite</span>'}</h3>
  ${comp ? frameCard(comp) : ""}
  <details><summary>source frames (raw material — not keep candidates)</summary><ul>${sources}</ul></details>
</div>`
    })
    .join("\n")

  return `<!doctype html>
<meta charset="utf-8">
<title>Photo report — ${esc(watchLabel)}</title>
<style>
  body { font: 14px/1.45 system-ui, sans-serif; margin: 24px; background: #14161a; color: #e8e6e3; }
  h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 28px; border-bottom: 1px solid #333; padding-bottom: 4px; }
  h3 { font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .card { background: #1d2025; border: 1px solid #2a2e35; border-radius: 8px; padding: 8px; }
  .card.weak { border-color: #7a3b3b; }
  .card img { width: 100%; border-radius: 4px; display: block; }
  .meta { display: flex; justify-content: space-between; margin-top: 6px; gap: 8px; }
  .name { overflow-wrap: anywhere; } .kind { color: #8b93a1; }
  .metrics { color: #8b93a1; font-size: 12px; margin-top: 2px; }
  .flag { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 999px; background: #2a2e35; margin-top: 4px; }
  .flag.bad { background: #4a2626; } .flag.good { background: #234a2b; }
  .flag.pass { background: #234a2b; } .flag.fail { background: #4a2626; }
  .noimg { display: block; padding: 40px 8px; text-align: center; color: #8b93a1; }
  details { margin-top: 6px; color: #8b93a1; } ul { margin: 4px 0 0 18px; }
  table { border-collapse: collapse; } td, th { border: 1px solid #2a2e35; padding: 5px 10px; text-align: left; }
  a { color: #7fb2ff; }
  .note { color: #8b93a1; font-size: 12px; }
</style>
<h1>${esc(watchLabel)}</h1>
<p class="note">Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} by photo-score.
Thumbnails live in <code>${PREVIEW_DIR}/</code> (regenerable — safe to delete). Click any image for the original file.</p>
${coverage ?? ""}
<h2>Cull suggestions (${culls.length})</h2>
<p class="note">Bottom-percentile sharpness within this watch, or non-best near-duplicates. Suggestions only — nothing is deleted.</p>
<div class="grid">${culls.map(frameCard).join("\n")}</div>
<h2>Singles &amp; exports (${singles.length})</h2>
<div class="grid">${singles.map(frameCard).join("\n")}</div>
<h2>Focus-stack sequences (${sequences.length})</h2>
${seqHtml || '<p class="note">none detected</p>'}
`
}

let missingTableWarned = false
function warnMissingTable() {
  if (missingTableWarned) return
  missingTableWarned = true
  console.warn(
    "\n  NOTE: watch_image_scores table not found — run supabase/migrations/" +
      "00040_create_watch_image_scores.sql in the Supabase SQL Editor. " +
      "Treating all frames as unscored; DB write-back will fail until applied.\n"
  )
}

// ── Per-watch pipeline ───────────────────────────────────────────
// `totals` is accumulated the moment tokens are spent — a later per-watch
// failure (e.g. DB write) must never lose paid usage from the run accounting.
async function processWatch(watch, folderAbs, totals) {
  const files = listImageFiles(folderAbs)
  if (files.length === 0) return null

  const cr3Basenames = new Set(
    files
      .filter((f) => path.extname(f.fileName).toLowerCase() === ".cr3")
      .map((f) => path.basename(f.fileName, path.extname(f.fileName)).toLowerCase())
  )

  // Existing scores for idempotency (fill-only-new unless --force).
  const { data: existingRows, error: exErr } = await supabase
    .from("watch_image_scores")
    .select("*")
    .eq("watch_id", watch.id)
  if (exErr) {
    if (exErr.message.includes("watch_image_scores")) {
      warnMissingTable()
    } else {
      throw new Error(`fetch existing scores failed: ${exErr.message}`)
    }
  }
  const existingByHash = new Map((existingRows ?? []).map((r) => [r.content_hash, r]))

  // Hash + EXIF pass over every file.
  const records = []
  for (const f of files) {
    const record = {
      ...f,
      ext: path.extname(f.fileName).toLowerCase(),
      kind: classifyKind(f.fileName, cr3Basenames),
      hash: await hashFile(f.absPath),
      timestampMs: null,
      tags: null,
      stackSeq: null,
      stackRole: null,
      dupGroup: null,
      dupBest: false,
      sharpness: null,
      brightness: null,
      glare: null,
      phash: null,
      previewName: null,
    }
    try {
      const tags = await exiftool.read(f.absPath)
      record.tags = tags
      const dt = tags.SubSecDateTimeOriginal ?? tags.DateTimeOriginal
      if (dt && typeof dt.toMillis === "function") record.timestampMs = dt.toMillis()
    } catch {
      // no EXIF — treated as a single frame
    }
    record.existing = existingByHash.get(record.hash) ?? null
    records.push(record)
  }

  const sequences = detectStacks(records)

  // Decode + CV for scoreable frames (everything except stack sources).
  const previewsAbs = path.join(folderAbs, PREVIEW_DIR)
  let scoredNew = 0
  let reused = 0
  for (const r of records) {
    if (r.stackRole === "source") continue
    const useExisting = r.existing && r.existing.sharpness_roi != null && !FORCE
    if (useExisting) {
      r.sharpness = r.existing.sharpness_roi
      r.brightness = r.existing.brightness
      r.glare = r.existing.glare_fraction
      r.phash = r.existing.phash
      reused++
    }
    const previewName = `${r.hash.slice(0, 16)}.jpg`
    const previewPath = path.join(previewsAbs, previewName)
    const needPreview = !DRY_RUN && !fs.existsSync(previewPath)
    if (useExisting && !needPreview) {
      r.previewName = previewName
      continue
    }
    const buffer = await decodeFrame(r, r.tags)
    if (!buffer) continue
    if (!useExisting) {
      const m = await computeMetrics(buffer)
      r.sharpness = m.sharpness
      r.brightness = m.brightness
      r.glare = m.glare
      r.phash = m.phash
      scoredNew++
    }
    if (!DRY_RUN) {
      fs.mkdirSync(previewsAbs, { recursive: true })
      await sharp(buffer)
        .rotate()
        .resize(PREVIEW_LONG_EDGE, PREVIEW_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toFile(previewPath)
    }
    r.previewName = previewName
  }

  // Duplicate clustering across every frame with a phash.
  const hashed = records.filter((r) => r.phash != null && r.stackRole !== "source")
  const dupGroups = clusterDuplicates(hashed)

  // Per-watch relative weak flag (report-side only).
  const sharpValues = hashed
    .map((r) => r.sharpness)
    .filter((v) => v != null)
    .sort((a, b) => a - b)
  const cutoff =
    sharpValues.length >= 5
      ? sharpValues[Math.floor(sharpValues.length * WEAK_SHARP_PCTL)]
      : -Infinity
  for (const r of hashed) {
    r.weakSharp = r.sharpness != null && r.sharpness <= cutoff
  }

  // Track A: card-match the CV survivors. Stack sources and non-best
  // duplicates never reach the model — that's the "cheap CV in bulk, AI on
  // the survivors" economy. Already-carded frames are skipped unless --force.
  const aiUsage = { input: 0, output: 0, evaluated: 0, failed: 0 }
  if (!NO_AI) {
    const candidates = records.filter(
      (r) =>
        r.stackRole !== "source" &&
        (r.dupGroup == null || r.dupBest) &&
        (FORCE || r.existing?.shot_card == null)
    )
    for (const r of candidates) {
      const buffer = await decodeFrame(r, r.tags)
      if (!buffer) continue
      try {
        const { verdict, usage } = await evaluateCard(buffer, watch, r)
        aiUsage.input += usage.input
        aiUsage.output += usage.output
        aiUsage.evaluated++
        r.aiEvaluated = true
        r.shotCard = verdict.matched_card === "none" ? "creative" : verdict.matched_card
        r.cardPass = verdict.matched_card === "none" ? null : verdict.pass
        r.aiDefect =
          verdict.defect && verdict.defect.trim().toUpperCase() !== "NONE"
            ? verdict.defect.trim()
            : null
      } catch (err) {
        aiUsage.failed++
        console.warn(`\n    (card grading failed for ${r.fileName}: ${err.message})`)
      }
    }
    totals.input += aiUsage.input
    totals.output += aiUsage.output
    totals.evaluated += aiUsage.evaluated
    totals.aiFailed += aiUsage.failed
  }
  // Merged card view (fresh verdicts win, else what the DB already knew).
  for (const r of records) {
    if (!r.aiEvaluated) {
      r.shotCard = r.existing?.shot_card ?? null
      r.cardPass = r.existing?.card_pass ?? null
      r.aiDefect = r.existing?.ai_primary_defect ?? null
    }
  }

  const label = `${watch.brands?.name ?? "?"} ${watch.model ?? ""}`.trim()

  // The report is pure local value — write it before the DB round-trip so a
  // DB failure (e.g. migration not applied yet) still leaves a usable report.
  if (!DRY_RUN) {
    fs.writeFileSync(
      path.join(folderAbs, REPORT_NAME),
      buildReport(label, records, sequences, coverageHtml(records))
    )
  }

  // Write-back: upsert one row per file, preserving AI columns on old rows.
  const nowIso = new Date().toISOString()
  const rows = records.map((r) => ({
    watch_id: watch.id,
    user_id: watch.user_id,
    watch_photo_id: r.existing?.watch_photo_id ?? null,
    source_kind: r.kind,
    rel_path: r.relPath,
    content_hash: r.hash,
    stack_seq: r.stackSeq,
    stack_role: r.stackRole,
    sharpness_roi: r.sharpness,
    brightness: r.brightness,
    glare_fraction: r.glare,
    phash: r.phash,
    dup_group: r.dupGroup,
    dup_best: r.dupBest,
    shot_card: r.shotCard ?? null,
    card_pass: r.cardPass ?? null,
    angle_class: r.existing?.angle_class ?? null,
    ai_dial_focus: r.existing?.ai_dial_focus ?? null,
    ai_framing: r.existing?.ai_framing ?? null,
    ai_reflections: r.existing?.ai_reflections ?? null,
    ai_background: r.existing?.ai_background ?? null,
    ai_lighting: r.existing?.ai_lighting ?? null,
    ai_color: r.existing?.ai_color ?? null,
    ai_detail: r.existing?.ai_detail ?? null,
    ai_primary_defect: r.aiDefect ?? null,
    ai_unusable: r.existing?.ai_unusable ?? false,
    ai_model: r.aiEvaluated ? MODEL : (r.existing?.ai_model ?? null),
    composite_score: r.existing?.composite_score ?? null,
    hero_for_class: r.existing?.hero_for_class ?? false,
    scored_at: nowIso,
  }))
  if (!DRY_RUN && rows.length > 0) {
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from("watch_image_scores")
        .upsert(rows.slice(i, i + 500), { onConflict: "watch_id,content_hash" })
      if (error) throw new Error(`score upsert failed: ${error.message}`)
    }
  }

  if (DRY_RUN) {
    for (const r of records) {
      const m =
        r.sharpness != null
          ? `sharp ${Math.round(r.sharpness)} bright ${Math.round(r.brightness)} glare ${(r.glare * 100).toFixed(1)}% phash ${r.phash}`
          : "(not scored)"
      const stack = r.stackSeq != null ? ` stack#${r.stackSeq}/${r.stackRole}` : ""
      const dup = r.dupGroup != null ? ` dup#${r.dupGroup}${r.dupBest ? "*" : ""}` : ""
      const card =
        r.shotCard != null
          ? ` card:${r.shotCard}${r.cardPass != null ? (r.cardPass ? "/pass" : "/FAIL") : ""}${
              r.aiDefect ? ` (${r.aiDefect})` : ""
            }`
          : ""
      console.log(`    ${r.fileName} [${r.kind}]${stack}${dup}${card} ${m}`)
    }
  }

  const stackSources = records.filter((r) => r.stackRole === "source").length
  return {
    label,
    files: records.length,
    scoredNew,
    reused,
    stackSources,
    sequences: sequences.length,
    unstacked: sequences.filter((s) => !s.composite).length,
    dupGroups,
    aiUsage,
    reshoots: NO_AI
      ? []
      : SHOT_CARDS.filter(
          (card) => !records.some((r) => r.shotCard === card.key && r.cardPass)
        ).map((c) => c.label),
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const parent = await resolveParent()
  if (!parent || !fs.existsSync(parent)) {
    console.error(
      "No Watch Images folder found. Set it in Config → Settings, pass --dir <path>, or set WATCH_IMAGES_DIR."
    )
    process.exit(1)
  }

  let query = supabase
    .from("watches")
    .select("id, user_id, model, reference_number, brands(name)")
    .order("model")
  if (ONLY_WATCH) query = query.eq("id", ONLY_WATCH)
  const { data: watches, error } = await query
  if (error) {
    console.error(`Failed to fetch watches: ${error.message}`)
    process.exit(1)
  }

  const folders = fs
    .readdirSync(parent, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
  const folderById = new Map(
    folders.map((f) => [idTokenOf(f), f]).filter(([t]) => t)
  )

  const queue = (watches ?? [])
    .map((w) => ({ watch: w, folder: folderById.get(w.id.slice(0, 8).toLowerCase()) }))
    .filter((q) => q.folder)
    .slice(0, LIMIT)

  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Photo-scoring ${queue.length} watch folder(s) under ${parent}` +
      `${NO_AI ? " (CV only, --no-ai)" : ` (card grading with ${MODEL})`}\n`
  )

  const run = await startRun(supabase, {
    agent: "photo-score",
    trigger: process.env.AGENT_RUN_TRIGGER,
    model: NO_AI ? null : MODEL,
    dryRun: DRY_RUN,
  })
  const runItems = []
  const totals = { input: 0, output: 0, evaluated: 0, aiFailed: 0 }
  let ok = 0
  let failed = 0
  let skippedEmpty = 0

  for (const { watch, folder } of queue) {
    const shortLabel = `${watch.brands?.name ?? "?"} ${watch.model ?? ""}`.trim()
    process.stdout.write(`→ ${shortLabel} ... `)
    try {
      const result = await processWatch(watch, path.join(parent, folder), totals)
      if (!result) {
        skippedEmpty++
        console.log("no images, skipped")
        continue
      }
      ok++
      console.log(
        `${result.files} files: ${result.scoredNew} newly scored, ${result.reused} reused, ` +
          `${result.stackSources} stack sources in ${result.sequences} sequence(s)` +
          `${result.unstacked > 0 ? ` (${result.unstacked} unstacked!)` : ""}, ` +
          `${result.dupGroups} dup group(s)` +
          `${NO_AI ? "" : `, ${result.aiUsage.evaluated} card-graded`}` +
          `${result.reshoots.length > 0 ? ` — RESHOOT: ${result.reshoots.join(", ")}` : ""}` +
          `${DRY_RUN ? "" : " [report written]"}`
      )
      runItems.push({
        entityType: "watch",
        entityId: watch.id,
        label: shortLabel,
        action: "updated",
        field: "image_scores",
        detail:
          `${result.scoredNew} new frames scored, ${result.stackSources} stack sources collapsed, ` +
          `${result.dupGroups} dup groups` +
          `${NO_AI ? "" : `, ${result.aiUsage.evaluated} card-graded, reshoot: ${result.reshoots.join("/") || "none"}`}`,
      })
    } catch (err) {
      failed++
      console.log(`FAILED: ${err.message}`)
      runItems.push({
        entityType: "watch",
        entityId: watch.id,
        label: shortLabel,
        action: "failed",
        field: "image_scores",
        detail: err.message,
      })
    }
  }

  const cost =
    (totals.input * PRICE_PER_MTOK.input) / 1e6 +
    (totals.output * PRICE_PER_MTOK.output) / 1e6
  console.log(
    `\nDone. ${ok} watch(es) scored, ${failed} failed, ${skippedEmpty} empty` +
      `${DRY_RUN ? " (dry run — nothing written)" : ""}.` +
      (NO_AI
        ? " Cost: $0.00 (CV layer is free)."
        : ` ${totals.evaluated} frames card-graded` +
          `${totals.aiFailed > 0 ? ` (${totals.aiFailed} grading failures)` : ""} — ` +
          `${totals.input + totals.output} tokens ≈ $${cost.toFixed(4)} (${MODEL}, list pricing).`)
  )

  await finishRun(run, {
    status: failed > 0 ? (ok > 0 ? "partial" : "failed") : "success",
    itemsProcessed: queue.length,
    itemsUpdated: DRY_RUN ? 0 : ok,
    itemsSkipped: skippedEmpty,
    itemsFailed: failed,
    inputTokens: totals.input,
    outputTokens: totals.output,
    costUsdMicros: usdToMicros(cost),
    notes:
      `${ok} scored, ${failed} failed, ${skippedEmpty} empty` +
      `${NO_AI ? " (no-ai)" : `, ${totals.evaluated} card-graded`}`,
    items: runItems,
  })

  if (failed > 0) process.exitCode = 1
}

main()
  .catch((err) => {
    console.error("photo-score failed:", err.message ?? err)
    process.exitCode = 1
  })
  .finally(() => exiftool.end())
