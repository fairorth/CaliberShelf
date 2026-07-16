# price-check.mjs — Engineering Walkthrough

A line-by-line companion to [scripts/price-check.mjs](../scripts/price-check.mjs),
written for a software engineer who wants to understand how an AI agent is
actually built. Read it with the source open; section headings follow the
file top to bottom. Operational docs (how to run it, costs, scheduling) live
in [price-check.md](price-check.md) — this document is about *how it works*.

## The mental model: what makes this an "agent"?

A plain LLM call is `prompt in → text out`. An **agent** is an LLM given
*tools* and run in a *loop*: the model decides to use a tool, the tool
executes, the result goes back into the model's context, and the model
decides what to do next — search again, read a page, or conclude. The loop
ends when the model stops requesting tools and produces its final answer.

The entire agent in this file is one function, `researchWatch()`, and it's
~55 lines. Everything else is ordinary plumbing: CLI parsing, database I/O,
validation, logging. That ratio is representative of real agent systems —
the "AI part" is small; the engineering around it (contracts, error
handling, cost control, observability) is most of the work.

One architectural choice defines this script: it uses **server-side tools**.
Anthropic hosts the web-search and web-fetch tools and runs the
tool-use loop on their infrastructure, inside a single API request. Our code
never sees "the model wants to search for X" — it sends one request and
receives the finished research. The alternative, **client-side tools**, is
where your code implements each tool and drives the loop yourself
(`while stop_reason == "tool_use": run tool, append result, call again`).
Server tools were the right fit here because web search/fetch are exactly
what Anthropic hosts; you'd go client-side when the tools touch *your*
systems (a database query tool, an eBay-API tool).

---

## Imports and environment (lines 18–24)

```js
import nextEnv from "@next/env"
const { loadEnvConfig } = nextEnv
```

Reuses Next.js's own env loader so the script reads the same `.env.local`
the app uses — no duplicated secrets, no extra dotenv dependency. The
awkward two-step import is deliberate: `@next/env` is a CommonJS module, and
Node's ESM loader can't always see named exports in CJS — you import the
default object and destructure. (Try the one-line named import; it throws
`SyntaxError: Named export not found`.)

`loadEnvConfig(process.cwd())` merges `.env.local` into `process.env`. In
GitHub Actions there is no `.env.local` — the workflow injects the same
variables directly into the environment, and this call is a harmless no-op.
That's why the identical script runs unmodified in both places.

## Constants and CLI parsing (lines 26–42)

```js
const MODEL = "claude-sonnet-5"
const MAX_TOKENS = 32000
```

`MODEL` is the cost/quality dial (see the operational doc). `MAX_TOKENS`
caps a single response's *output* — thinking plus text. 32k is generous
headroom; the final JSON is ~1k tokens, but the model also "thinks" between
tool results, and starving it truncates mid-answer.

The CLI parsing is intentionally dependency-free — `process.argv.slice(2)`
and `indexOf` — because four flags don't justify a library. Note the
pattern: `--dry-run` is presence-tested, value-flags read
`args[indexOf(flag) + 1]`.

## Fail-fast env guard (lines 44–53)

```js
const missing = [...].filter((k) => !process.env[k])
```

Checks all three required keys *by name* and exits before any network call.
Two practices worth copying: report **every** missing key at once (not just
the first), and **never print values** — logs end up in CI output.

## The two clients (lines 55–60)

```js
const supabase = createClient(url, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic()
```

The Supabase client uses the **service-role key**, which bypasses Row Level
Security — necessary because a headless script has no logged-in user for
RLS to authorize. That's also why this key must never reach a browser and
why the script explicitly writes `user_id` on every insert (nothing infers
it). `persistSession: false` disables browser-oriented session storage that
makes no sense in a one-shot process.

`new Anthropic()` with no arguments reads `ANTHROPIC_API_KEY` from the
environment — the SDK's credential-resolution default. It also silently
provides retry behavior: transient HTTP failures (429 rate limits, 5xx) are
retried twice with backoff before you ever see an error.

## The output contract: Zod schema (lines 62–82)

```js
const valuationSchema = z.object({ ... })
```

The single most important engineering pattern in the file. **LLM output is
untrusted input.** The model was *asked* for a specific JSON shape, and it
complies nearly always — but "nearly" corrupts databases. So the schema is
declared in executable form and every response is validated before insert:
wrong types, missing fields, or an invented `confidence: "very high"` fail
loudly instead of landing in `watch_valuations`.

This schema is one corner of a **three-way contract**:
prompt's JSON example (what the model is told) ↔ this Zod schema (what we
accept) ↔ the `watch_valuations` columns (what we store). Change one,
change all three.

## The system prompt (lines 84–106)

Anatomy, top to bottom:

1. **Role** — one sentence ("You are a watch market analyst…"). Sets domain
   and register; the "for a collection-tracking database" clause quietly
   explains *why* structured output matters.
2. **Method** — five numbered points of *judgment*, not procedure: which
   evidence ranks higher (sold > asking), known source biases (Chrono24
   +10–20%, eBay best-offer shows list price), scope (4–8 points, last 6
   months), outlier rules, and the one hard negative that matters:
   *NEVER fabricate data points*. Honest low confidence is the designed
   failure mode — for agents that write to databases, you must give the
   model a truthful way to say "I couldn't find much."
3. **Output contract** — the exact JSON shape, mirroring the Zod schema,
   with inline semantics (`mid = realistic private-sale value, not dealer
   retail`).

Why `system` and not part of the user message? The system prompt is the
stable, reusable specification — same for every watch; the user message
carries the per-watch variables. This separation also mirrors how prompt
caching works (stable prefix first), though this prompt is too short to
qualify for caching.

## The per-watch prompt (lines 108–122)

```js
`Today's date: ${new Date().toISOString().slice(0, 10)}.`
```

Models don't reliably know today's date — and "recent sales" is meaningless
without it, so it's injected.

The interesting line is the last one:

```
Owner's purchase price: $17900 (context only — do not anchor your estimate to it)
```

Purchase price genuinely helps (it disambiguates variants — a $17,900
Breguet is not the steel-bracelet base model), but naming a number invites
**anchoring bias** — the tendency to gravitate toward a stated figure. The
parenthetical is a direct counter-instruction. This tension — useful context
vs. biasing context — comes up constantly in prompt design; the pattern here
(include it, label its epistemic role) is a good default.

Also note the graceful degradation: a missing reference number becomes an
*instruction* ("not recorded — infer the variant and state your assumption")
rather than an empty field.

## The agent core: researchWatch() (lines 125–182)

### Tool declaration (127–130)

```js
const tools = [
  { type: "web_search_20260209", name: "web_search", max_uses: MAX_USES },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: MAX_USES },
]
```

Declaring these types is the *entire* integration — no implementations,
because Anthropic executes them server-side. The version-suffixed `type`
strings pin exact tool behavior (the `20260209` versions add server-side
result filtering). `max_uses` is a hard per-request cap and therefore the
script's main cost lever: the model budgets its research to fit.

### Streaming and the request (137–148)

```js
const stream = anthropic.messages.stream({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  thinking: { type: "adaptive" },
  system: SYSTEM_PROMPT,
  tools,
  messages,
})
response = await stream.finalMessage()
```

A research turn can run for many minutes while the server loop searches,
fetches, and reasons. A non-streaming HTTP request that long risks timeouts
at every hop; streaming keeps bytes flowing so nothing gives up. We don't
render the stream — `finalMessage()` just collects it into one complete
response. Streaming here is a transport decision, not a UX one.

`thinking: { type: "adaptive" }` lets the model reason privately between
tool results, deciding for itself how much deliberation each step needs.
For multi-step research this measurably improves judgment (which comps to
trust, when to stop searching).

### The pause_turn loop (132–155)

The server-side tool loop has an iteration budget (~10 tool cycles per
request). If research needs more, the API returns a complete-looking
response with `stop_reason: "pause_turn"` — meaning "not done, call me
again to continue." The resume protocol is exactly two moves:

```js
if (response.stop_reason !== "pause_turn") break
messages.push({ role: "assistant", content: response.content })
```

Append the paused turn's full content (which embeds the server's loop
state) and re-send. **No extra user message** — the API recognizes the
trailing tool state and resumes. The `continuations > 5` guard is a circuit
breaker: five resumes means something is pathological, and unbounded loops
against a paid API are a bill, not a bug.

Usage is accumulated across every continuation (147–148) so the logged
token count reflects the true cost of the watch, not just the last request.

### Refusal handling (157–159)

`stop_reason: "refusal"` is a real terminal state on current models (safety
classifiers). It arrives as HTTP 200 — code that only checks for exceptions
would sail past it and then fail confusingly at JSON parsing. Convert it to
an explicit error naming the cause.

### Extracting the answer (161–173)

```js
const text = response.content.filter((b) => b.type === "text")...
```

A response's `content` is an array of typed blocks — `thinking` blocks,
`server_tool_use` blocks, `web_search_tool_result` blocks, and `text`
blocks. Only the text blocks are the model's answer; everything else is
scaffolding from the research process.

Then two layers of defensive parsing *before* Zod even sees it:

```js
const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
const start = jsonText.indexOf("{")
const end = jsonText.lastIndexOf("}")
```

Strip a markdown fence if one appears (the model was told not to, but
belt-and-braces), then slice from first `{` to last `}` to shed any stray
prose. The philosophy: **prompt for the ideal, parse for the real.** Each
recovery layer is cheap; a failed run isn't.

`safeParse` (175–180) is Zod's non-throwing variant — it returns a result
object so the error message can quote exactly which field failed, which
becomes the per-watch FAILED log line.

## toCents and money (line 184)

```js
const toCents = (usd) => Math.round(usd * 100)
```

The app stores money as BIGINT cents (floating-point dollars accumulate
rounding errors). The agent thinks in whole USD; the boundary converts.

## main(): orchestration (lines 187–259)

### The work queue (188–207)

```js
.eq("price_check_enabled", true)
.order("purchase_price_cents", { ascending: false, nullsFirst: false })
```

The opt-in flag *is* the work queue — no separate job table. Ordering by
price descending makes `--limit N` mean "the N most valuable watches,"
which is the right semantics for both testing and cost-capped partial runs.
The `select` pulls only what the prompt needs, with joined brand and
movement names.

### Sequential, isolated processing (214–251)

Watches run **one at a time**, deliberately:

- **Rate limits** — parallel multi-minute research requests compound
  token-per-minute pressure for no benefit on a scheduled batch job.
- **Cost visibility** — one `→ label ... result [tokens]` line at a time
  makes the log a readable per-watch ledger.
- **Simplicity** — no concurrency bookkeeping. A monthly job has no
  latency requirement.

Each watch gets its own try/catch: one failure prints `FAILED: <reason>`
and the loop continues. A batch job that dies on item 3 of 32 wastes the
other 29 — isolate failures, then report them.

### The insert and provenance (220–240)

Straight mapping from validated fields to columns, plus two provenance
fields the model never produced: `agent_model` (which model researched
this — invaluable when comparing quality across model changes) and the
explicit `user_id` (service-role inserts must say whose row this is;
nothing infers it).

`--dry-run` short-circuits only this block — the research is identical,
which is what makes it a truthful test of prompt changes.

### Exit codes (256)

```js
if (failed > 0) process.exitCode = 1
```

The script's contract with its scheduler. GitHub Actions marks the run
red on non-zero exit — this line is the entire integration between
"a watch failed" and "the Actions badge tells you so." Note
`process.exitCode = 1` (set and finish) rather than `process.exit(1)`
(terminate immediately) — the summary line still prints.

---

## The patterns, generalized

If you take one section into your next agent project, take this table:

| Pattern | Where in this file | The rule |
|---|---|---|
| Validate LLM output | Zod schema + safeParse | Model output is untrusted input; contract it like an API |
| Three-way contract | prompt JSON ↔ schema ↔ table | Output shape changes touch all three, atomically |
| Prompt for ideal, parse for real | fence-strip + brace-slice | Cheap recovery layers before hard failure |
| Design the honest failure | "NEVER fabricate… report low confidence" | Give the model a truthful way to underdeliver |
| Label context's epistemic role | "context only — do not anchor" | Useful-but-biasing info gets an explicit role |
| Cap everything | max_uses, MAX_TOKENS, continuation guard | Every loop near a paid API needs a circuit breaker |
| Isolate batch failures | per-watch try/catch | One bad item must not kill the run |
| Record provenance | agent_model column | Future you will ask "which model said this?" |
| Fail fast, leak nothing | env guard | Name missing keys; never print values |
| Exit codes are the scheduler API | process.exitCode | CI can only see what you encode in the exit status |

## Extension sketches

- **New output field** (e.g. `market_trend`): add to the prompt's JSON
  example → add to `valuationSchema` → migration for the column → add to
  the insert. Four edits, one commit.
- **Client-side tool** (e.g. query eBay's API directly): add a tool with an
  `input_schema` to `tools`, then extend the loop — on
  `stop_reason: "tool_use"`, execute the call yourself, append a
  `tool_result` block, and re-send. That's the other half of agent
  architecture this script currently delegates to Anthropic.
- **Concurrency**: wrap the queue in a small worker pool (2–3 wide) if the
  collection grows enough that wall-clock matters; keep per-watch isolation.
- **Retry a schema failure**: on `safeParse` failure, re-send with the Zod
  error appended ("your last reply failed validation: …, reply again with
  corrected JSON") — one retry recovers most formatting misses. Omitted
  here because the failure rate has been zero and each retry costs tokens.
