import * as Haptics from "expo-haptics"
import { router } from "expo-router"
import { Check, Lock } from "lucide-react-native"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { estimatePicks, finalists, hotTake, pairwiseAgreement, rankWatches } from "@/lib/rating"
import type { RankedWatch } from "@/lib/rating"
import { ATTACHMENT_LEVELS } from "@/lib/validations/watch"
import { useApp } from "../lib/app-context"
import { canUseBiometrics, unlock } from "../lib/app-lock"
import {
  fetchOwnerRankings,
  fetchRaters,
  flushPendingSessions,
  getOrCreateRater,
  newId,
  saveSession,
} from "../lib/rate-game"
import type { PlayedPick, Rater } from "../lib/rate-game"
import type { PhoneWatch } from "../lib/watches"
import { Duel } from "../screens/rate-game/duel"
import { Reveal } from "../screens/rate-game/reveal"
import type { RevealData } from "../screens/rate-game/reveal"
import { color, radius, text, TOUCH } from "../theme"

interface Segment {
  /** Category id, or "final" for Best in Show. */
  key: string
  name: string
  watches: PhoneWatch[]
}

type Stage =
  | { kind: "who" }
  | { kind: "segments" }
  | { kind: "duel"; segment: Segment }
  | { kind: "reveal"; segment: Segment; data: RevealData }
  | { kind: "handback" }

/**
 * RATE MY WATCHES — the game, LOCKED: a full-screen route with no swipe-back,
 * showing nothing but the game (no prices, values, settings). The only way
 * out is Face ID (or the passcode). Flow: who's rating → pick a segment →
 * head-to-heads until the model has their ranking → the reveal → next
 * segment, or Best in Show (top three of each segment played) → hand back.
 */
export default function RateGameScreen() {
  const insets = useSafeAreaInsets()
  const { watches } = useApp()
  const [stage, setStage] = useState<Stage>({ kind: "who" })
  const [raters, setRaters] = useState<Rater[] | null>(null)
  const [rater, setRater] = useState<Rater | null>(null)
  const [ownerRankings, setOwnerRankings] = useState<Map<string, string[]>>(new Map())
  const [done, setDone] = useState<Array<{ segment: Segment; ranking: RankedWatch[] }>>([])
  const [saveState, setSaveState] = useState<"saving" | "saved" | "queued">("saving")

  useEffect(() => {
    void flushPendingSessions()
    fetchRaters().then(setRaters).catch(() => setRaters([]))
    void fetchOwnerRankings().then(setOwnerRankings)
  }, [])

  // The players: owned + coming soon — never wish list, never sold.
  const players = useMemo(
    () => (watches ?? []).filter((w) => w.status === "owned" || w.status === "coming"),
    [watches]
  )
  const byId = useMemo(() => new Map(players.map((w) => [w.id, w])), [players])
  const segments = useMemo<Segment[]>(() => {
    const m = new Map<string, Segment>()
    for (const w of players) {
      if (!w.categoryId) continue
      const s = m.get(w.categoryId) ?? { key: w.categoryId, name: w.categoryName ?? "Uncategorised", watches: [] }
      s.watches.push(w)
      m.set(w.categoryId, s)
    }
    return [...m.values()].filter((s) => s.watches.length >= 2).sort((a, b) => a.name.localeCompare(b.name))
  }, [players])

  const owner = raters?.find((r) => r.isOwner) ?? null
  const ownerName = owner?.name ?? "the owner"

  async function exitGame() {
    // A phone with no Face ID / passcode can't verify anyone — rather than
    // trap the owner in the game, the lock lets them out.
    if (!(await canUseBiometrics())) return router.back()
    if (await unlock("Hand back — unlock TenTen")) router.back()
  }

  function finishSegment(segment: Segment, picks: PlayedPick[], startedAt: string) {
    if (!rater) return
    const ids = segment.watches.map((w) => w.id)
    const ranking = rankWatches(
      ids,
      picks.map((p) => ({ a: p.left, b: p.right, winner: p.winner }))
    )
    const order = ranking.map((r) => r.watchId)

    // "You agree with Marc": against the owner's own ranking of this segment;
    // before the owner has played it, against their attachment ratings.
    let agreement: RevealData["agreement"] = null
    let take: RevealData["hotTake"] = null
    const ownerOrder = ownerRankings.get(segment.key)
    if (!rater.isOwner) {
      if (ownerOrder) {
        const a = pairwiseAgreement(order, ownerOrder)
        if (a.pairs > 0) agreement = { pct: a.pct, approximate: false }
        take = hotTake(order, ownerOrder)
      } else {
        const levels = new Map<string, number>()
        for (const w of segment.watches) if (w.attachment) levels.set(w.id, ATTACHMENT_LEVELS.indexOf(w.attachment))
        const a = pairwiseAgreement(order, levels)
        if (a.pairs >= 3) agreement = { pct: a.pct, approximate: true }
      }
    } else {
      // The owner just set the yardstick — use it for the rest of this game.
      setOwnerRankings((prev) => new Map(prev).set(segment.key, order))
    }

    const isFinal = segment.key === "final"
    if (!isFinal) setDone((prev) => [...prev.filter((d) => d.segment.key !== segment.key), { segment, ranking }])
    setStage({
      kind: "reveal",
      segment,
      data: { segmentName: segment.name, isFinal, ranking, agreement, hotTake: take },
    })

    setSaveState("saving")
    void saveSession({
      id: newId(),
      raterId: rater.id,
      kind: isFinal ? "final" : "segment",
      categoryId: isFinal ? null : segment.key,
      segmentName: isFinal ? "Best in Show" : segment.name,
      watchIds: ids,
      picks,
      ranking,
      startedAt,
      completedAt: new Date().toISOString(),
    }).then(setSaveState)
  }

  function startFinal() {
    const ids = finalists(done.map((d) => d.ranking))
    const watchesInFinal = ids.map((id) => byId.get(id)).filter((w): w is PhoneWatch => !!w)
    setStage({ kind: "duel", segment: { key: "final", name: "Best in Show", watches: watchesInFinal } })
  }

  // ── Screens ─────────────────────────────────────────────────────
  if (stage.kind === "duel" && rater) {
    return (
      <Duel
        key={stage.segment.key}
        raterName={rater.name}
        segmentName={stage.segment.name}
        watches={stage.segment.watches}
        onComplete={(picks, startedAt) => finishSegment(stage.segment, picks, startedAt)}
        onQuit={() => setStage({ kind: "segments" })}
      />
    )
  }

  if (stage.kind === "reveal" && rater) {
    const isFinal = stage.data.isFinal
    const remaining = segments.filter((s) => !done.some((d) => d.segment.key === s.key))
    const canFinal = !isFinal && done.length >= 2
    return (
      <Reveal
        data={stage.data}
        raterName={rater.name}
        ownerName={ownerName}
        raterIsOwner={rater.isOwner}
        byId={byId}
        saveState={saveState}
        primary={
          isFinal
            ? { label: "Hand back", onPress: () => setStage({ kind: "handback" }) }
            : remaining.length > 0
              ? { label: "Continue to the next segment", onPress: () => setStage({ kind: "segments" }) }
              : canFinal
                ? { label: "On to Best in Show", onPress: startFinal }
                : { label: "Hand back", onPress: () => setStage({ kind: "handback" }) }
        }
        secondary={
          isFinal
            ? undefined
            : canFinal && remaining.length > 0
              ? { label: "I've had enough — Best in Show", onPress: startFinal }
              : remaining.length > 0
                ? { label: "I've had enough — finish", onPress: () => setStage({ kind: "handback" }) }
                : undefined
        }
      />
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>RATE MY WATCHES</Text>
        <Pressable onPress={() => void exitGame()} hitSlop={10} accessibilityLabel="Hand back — unlock with Face ID" style={styles.lock}>
          <Lock color={color.mutedForeground} size={18} aria-hidden />
        </Pressable>
      </View>

      {stage.kind === "who" && (
        <WhoIsRating
          raters={raters}
          hasOwner={!!owner}
          onStart={async (name, isOwner) => {
            const r = await getOrCreateRater(name, isOwner, raters ?? [])
            setRater(r)
            setStage({ kind: "segments" })
          }}
        />
      )}

      {stage.kind === "segments" && rater && (
        <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
          <Text style={styles.title}>Pick a segment, {rater.name}</Text>
          <Text style={styles.sub}>
            You&rsquo;ll see two watches at a time — tap the one you prefer. A segment ends when your ranking is clear.
          </Text>
          {segments.map((s) => {
            const played = done.some((d) => d.segment.key === s.key)
            const minutes = Math.max(1, Math.round((estimatePicks(s.watches.length) * 4) / 60))
            return (
              <Pressable
                key={s.key}
                style={({ pressed }) => [styles.segment, pressed && { opacity: 0.85 }]}
                onPress={() => setStage({ kind: "duel", segment: s })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.segName}>{s.name}</Text>
                  <Text style={styles.segMeta}>
                    {s.watches.length} watches · about {minutes} min
                  </Text>
                </View>
                {played && <Check color={color.brass} size={20} aria-hidden />}
              </Pressable>
            )
          })}
          {done.length >= 2 && (
            <Pressable style={styles.final} onPress={startFinal}>
              <Text style={styles.finalText}>Best in Show — the top 3 of each segment you played</Text>
            </Pressable>
          )}
          {done.length > 0 && (
            <Pressable style={styles.secondary} onPress={() => setStage({ kind: "handback" })}>
              <Text style={styles.secondaryText}>Finish and hand back</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {stage.kind === "handback" && (
        <View style={styles.handback}>
          <Text style={styles.title}>Thanks, {rater?.name ?? "friend"}!</Text>
          <Text style={styles.sub}>Hand the phone back to {ownerName}.</Text>
          <Pressable style={styles.primary} onPress={() => void exitGame()}>
            <Text style={styles.primaryText}>Unlock with Face ID</Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              void Haptics.selectionAsync()
              setDone([])
              setRater(null)
              setStage({ kind: "who" })
              fetchRaters().then(setRaters).catch(() => {})
            }}
          >
            <Text style={styles.secondaryText}>Someone else wants to play</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function WhoIsRating({
  raters,
  hasOwner,
  onStart,
}: {
  raters: Rater[] | null
  hasOwner: boolean
  onStart: (name: string, isOwner: boolean) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const existing = raters?.find((r) => r.name.toLowerCase() === name.trim().toLowerCase())

  async function start(n: string, owner: boolean) {
    if (!n.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onStart(n, owner)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (raters === null) return <ActivityIndicator color={color.brass} style={{ marginTop: 40 }} />

  return (
    <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Who&rsquo;s rating?</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={color.mutedForeground}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={60}
        returnKeyType="go"
        onSubmitEditing={() => void start(name, existing ? existing.isOwner : isOwner)}
      />
      {raters.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.sub}>Played before:</Text>
          <View style={styles.chips}>
            {raters.map((r) => (
              <Pressable key={r.id} style={styles.chip} onPress={() => void start(r.name, r.isOwner)}>
                <Text style={styles.chipText}>
                  {r.name}
                  {r.isOwner ? " (owner)" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {!hasOwner && !existing && (
        <View style={styles.ownerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.segName}>This is me — the owner</Text>
            <Text style={styles.segMeta}>Your ranking becomes the yardstick for &ldquo;you agree with …&rdquo;.</Text>
          </View>
          <Switch value={isOwner} onValueChange={setIsOwner} trackColor={{ true: color.brass, false: color.muted }} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.primary, (!name.trim() || busy) && { opacity: 0.5 }]}
        disabled={!name.trim() || busy}
        onPress={() => void start(name, existing ? existing.isOwner : isOwner)}
      >
        {busy ? <ActivityIndicator color={color.brassForeground} /> : <Text style={styles.primaryText}>Let&rsquo;s play</Text>}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 12 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: TOUCH },
  lock: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  title: { fontSize: text.lg, fontWeight: "600", color: color.foreground },
  sub: { fontSize: text.sm, color: color.mutedForeground },
  input: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    fontSize: 16,
    color: color.foreground,
    backgroundColor: color.card,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    justifyContent: "center",
  },
  chipText: { fontSize: text.sm, color: color.foreground },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 12,
  },
  error: { fontSize: text.xs, color: color.destructive },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingHorizontal: 14,
  },
  segName: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
  segMeta: { fontSize: text.xs, color: color.mutedForeground, marginTop: 2 },
  final: { minHeight: 56, borderRadius: radius.card, borderWidth: 1, borderColor: color.brass, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  finalText: { fontSize: text.sm, fontWeight: "600", color: color.brass, textAlign: "center" },
  handback: { flex: 1, justifyContent: "center", gap: 14 },
  primary: { minHeight: 52, borderRadius: radius.card, backgroundColor: color.brass, alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  secondary: {
    minHeight: TOUCH + 4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
})
