import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { getRequestAuth } from "@/lib/supabase/request"
import {
  identifyRequestSchema,
  identifyResultSchema,
} from "@/lib/validations/identify"
import type { IdentifyResponse } from "@/lib/validations/identify"

// "Which watch is this?" — one photo against the caller's own collection
// (docs/iphone-app.md §3). Called by the iPhone app's camera button with a
// bearer token; works from a web session too. One request, no tools: a vision
// call is seconds, not the minutes the web-search agents take.
export const maxDuration = 60

// Model + cost knobs live here (same convention as spec-fetch/route.ts).
// Opus 5.5 at low effort; Sonnet 5.5 ($2/$10) is the cheaper lever if the
// per-photo cost ever matters more than telling look-alikes apart.
const MODEL = "claude-opus-5-5"
const FALLBACK_MODEL = "claude-opus-4-8" // only runs if Opus 5.5 declines
const PRICE_PER_MTOK = { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 }

const SYSTEM_PROMPT = `You identify wristwatches in photos for a personal collection app.

You are given one photo and the owner's ROSTER: every watch they own, have on
order, or want, one per line as
  id | brand | model | reference | nickname | dial | case material | diameter mm | status

Decide which roster watches the photo could show.
- Return up to 3 matches, best first, using roster ids EXACTLY as written.
  Return none if no roster watch is plausible.
- Confidence: "high" only when the visible details (dial colour and layout,
  hands, bezel, logo text, case shape) single out that watch over every other
  roster line; "medium" when it is that model but a near-identical sibling is
  also in the roster; "low" for a plausible but uncertain match.
- The same model often appears more than once (different dials or metals).
  Use the dial colour and material columns to separate them, and list the
  sibling as a further match rather than guessing.
- "reason" is one short phrase naming what decided it, e.g. "green dial, date
  at 3, fluted bezel".
- Separately, fill "guess" with what the watch in the photo IS, from the photo
  alone: brand, model, reference if legible or certain, dial colour. Null any
  part you cannot tell. This is used to add a watch that is not in the roster,
  so never copy a roster line into it unless the photo supports it.
- "watch_visible" is false if there is no watch, or nothing legible, in the
  photo; then return no matches and a null guess.
- "notes": one sentence at most, only if something matters (e.g. "dial
  obscured by glare"), else null.`

type RosterRow = {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  dial_color: string | null
  case_material: string | null
  case_diameter_mm: number | null
  is_wishlist: boolean
  is_coming_soon: boolean
  sale_status: string
  brands: { name: string } | null
}

function rosterLine(w: RosterRow): string {
  const status = w.is_wishlist
    ? "wish list"
    : w.is_coming_soon
      ? "coming soon"
      : w.sale_status === "sold"
        ? "sold"
        : "owned"
  return [
    w.id,
    w.brands?.name ?? "",
    w.model,
    w.reference_number ?? "",
    w.nickname ?? "",
    w.dial_color ?? "",
    w.case_material ?? "",
    w.case_diameter_mm ?? "",
    status,
  ].join(" | ")
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  // Cookie (web) or bearer token (iPhone app). Only signed-in users may spend
  // API tokens.
  const { supabase, user } = await getRequestAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = identifyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data: rows, error: rosterError } = await supabase
    .from("watches")
    .select(
      "id, model, nickname, reference_number, dial_color, case_material, case_diameter_mm, is_wishlist, is_coming_soon, sale_status, brands(name)"
    )
    .eq("user_id", user.id)
    // Deterministic order: the roster is the cached prefix, and a reshuffle
    // would miss the cache on every call.
    .order("id")
  if (rosterError) {
    return NextResponse.json({ error: "Could not load your collection." }, { status: 500 })
  }
  // Nested joins infer as arrays — cast to the real single-row shape.
  const roster = (rows ?? []) as unknown as RosterRow[]
  const rosterIds = new Set(roster.map((w) => w.id))
  const rosterText =
    roster.length > 0 ? roster.map(rosterLine).join("\n") : "(the roster is empty)"

  const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: {
        effort: "low",
        format: betaZodOutputFormat(identifyResultSchema),
      },
      // Server-side fallback: if the model declines, the same request re-runs
      // on FALLBACK_MODEL inside this call rather than failing the photo.
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: FALLBACK_MODEL }],
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        // The roster changes only when the collection does, so it is cached;
        // the photo, which changes every call, comes after it.
        {
          type: "text",
          text: `ROSTER (${roster.length} watches)\n${rosterText}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.data.media_type,
                data: parsed.data.image_base64,
              },
            },
            { type: "text", text: "Which watch is this?" },
          ],
        },
      ],
    })

    const result = response.parsed_output
    if (response.stop_reason === "refusal" || !result) {
      return NextResponse.json(
        { error: "Couldn't read that photo — try again, or pick the watch yourself." },
        { status: 502 }
      )
    }

    const u = response.usage
    const uncached = u.input_tokens
    const cacheWrite = u.cache_creation_input_tokens ?? 0
    const cacheRead = u.cache_read_input_tokens ?? 0
    const costUsd =
      (uncached * PRICE_PER_MTOK.input +
        cacheWrite * PRICE_PER_MTOK.cacheWrite +
        cacheRead * PRICE_PER_MTOK.cacheRead +
        u.output_tokens * PRICE_PER_MTOK.output) /
      1_000_000

    // Never trust an id we did not send.
    const matches = result.matches.filter((m) => rosterIds.has(m.watch_id))

    const payload: IdentifyResponse = {
      matches,
      guess: result.watch_visible ? result.guess : null,
      watch_visible: result.watch_visible,
      notes: result.notes,
      usage: {
        input_tokens: uncached + cacheWrite + cacheRead,
        output_tokens: u.output_tokens,
        cost_usd: Math.round(costUsd * 1000) / 1000,
      },
      model: response.model,
    }

    // Best-effort run log, written ONCE (agent_runs has no UPDATE policy —
    // see CLAUDE.md). Never blocks the response.
    try {
      await supabase.from("agent_runs").insert({
        user_id: user.id,
        agent: "identify",
        trigger: "ui-click",
        status: "success",
        started_at: new Date(startedAt).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        model: response.model,
        items_processed: 1,
        items_updated: matches.length > 0 ? 1 : 0,
        input_tokens: uncached + cacheWrite + cacheRead,
        output_tokens: u.output_tokens,
        web_searches: 0,
        cost_usd_micros: Math.round(costUsd * 1_000_000),
        notes: matches[0]
          ? `match ${matches[0].confidence}`
          : result.guess?.brand
            ? `guess ${[result.guess.brand, result.guess.model].filter(Boolean).join(" ")}`
            : "no match",
      })
    } catch {
      // logging is optional; ignore failures
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Anthropic rate limit hit — try again in a minute." },
        { status: 429 }
      )
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error: ${error.message}` }, { status: 502 })
    }
    throw error
  }
}
