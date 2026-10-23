import { router, useFocusEffect } from "expo-router"
import { Camera, Trophy } from "lucide-react-native"
import { useCallback, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ScreenHeader } from "../../components/screen-header"
import { useApp } from "../../lib/app-context"
import { startCasebackRun, watchesMissingCaseback } from "../../lib/caseback-run"
import { discardSavedGame, listSavedGames } from "../../lib/rate-game"
import type { SavedGame } from "../../lib/rate-game"
import { supabase } from "../../lib/supabase"
import { color, radius, text, TOUCH } from "../../theme"

interface RaterSummary {
  id: string
  name: string
  isOwner: boolean
  segments: number
}

/**
 * Rate — RATE MY WATCHES' home: start a game (it locks the phone to the game
 * for a friend), and who has played. Their full rankings live on the web
 * (Reports → Ratings).
 */
export default function RateScreen() {
  const insets = useSafeAreaInsets()
  const [raters, setRaters] = useState<RaterSummary[] | null>(null)
  const { watches } = useApp()
  // Owned watches with no Caseback photo — the game shows front AND back.
  // Coming-soon watches aren't in hand, so they're left out of the run.
  const [missingBack, setMissingBack] = useState<string[] | null>(null)
  const ownedKey = (watches ?? [])
    .filter((w) => w.status === "owned")
    .map((w) => w.id)
    .join(",")

  useFocusEffect(
    useCallback(() => {
      supabase
        .from("raters")
        .select("id, name, is_owner, rating_sessions(id, kind)")
        .order("name")
        .then(({ data }) => {
          setRaters(
            ((data ?? []) as unknown as Array<{
              id: string
              name: string
              is_owner: boolean
              rating_sessions: Array<{ id: string; kind: string }> | null
            }>).map((r) => ({
              id: r.id,
              name: r.name,
              isOwner: r.is_owner,
              segments: (r.rating_sessions ?? []).filter((s) => s.kind === "segment").length,
            }))
          )
        })
    }, [])
  )
  // Games left part-way on this phone — each resumes where it stopped.
  const [unfinished, setUnfinished] = useState<SavedGame[]>([])
  useFocusEffect(
    useCallback(() => {
      void listSavedGames().then(setUnfinished)
    }, [])
  )
  useFocusEffect(
    useCallback(() => {
      if (!ownedKey) return
      watchesMissingCaseback(ownedKey.split(","))
        .then(setMissingBack)
        .catch(() => setMissingBack(null))
    }, [ownedKey])
  )

  function startRun() {
    if (!missingBack?.length) return
    startCasebackRun(missingBack)
    router.push({ pathname: "/camera", params: { watchId: missingBack[0], run: "caseback" } })
  }

  const owner = raters?.find((r) => r.isOwner)
  const nameOf = (id: string) => raters?.find((r) => r.id === id)?.name ?? null

  function discard(game: SavedGame, name: string) {
    Alert.alert(
      `Discard ${name}'s game?`,
      "Finished segments stay saved. Any half-played segment is lost.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            void discardSavedGame(game.raterId).then(() => listSavedGames().then(setUnfinished))
          },
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="Rate" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <Trophy color={color.brass} size={26} aria-hidden />
          <Text style={styles.title}>Rate My Watches</Text>
          <Text style={styles.body2}>
            Hand the phone to a friend. They see two of your watches at a time and tap the one they prefer, one
            segment at a time — then get their podium, how much they agree with you, and a Best in Show. The phone
            stays locked to the game until you unlock it with Face ID.
          </Text>
          <Pressable style={styles.primary} onPress={() => router.push("/rate-game")}>
            <Text style={styles.primaryText}>Start a game</Text>
          </Pressable>
          {raters && !owner && (
            <Text style={styles.hint}>
              Tip: play first yourself (choose &ldquo;This is me — the owner&rdquo;) — your ranking becomes the yardstick
              for everyone&rsquo;s &ldquo;you agree with …&rdquo;.
            </Text>
          )}
        </View>

        {raters && unfinished.some((g) => nameOf(g.raterId)) && (
          <View style={{ gap: 8 }}>
            <Text style={styles.eyebrow}>UNFINISHED GAMES</Text>
            {unfinished.map((g) => {
              const name = nameOf(g.raterId)
              if (!name) return null
              const partial = Object.values(g.inProgress)
              const parts = [
                g.done.length > 0 ? `${g.done.length} segment${g.done.length === 1 ? "" : "s"} done` : null,
                ...partial.map((p) => `${p.name} in progress`),
              ].filter(Boolean)
              return (
                <View key={g.raterId} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{name}</Text>
                    <Text style={styles.rowMeta}>{parts.join(" · ")}</Text>
                  </View>
                  <Pressable
                    hitSlop={6}
                    style={styles.rowAction}
                    accessibilityLabel={`Discard ${name}'s game`}
                    onPress={() => discard(g, name)}
                  >
                    <Text style={styles.rowMeta}>Discard</Text>
                  </Pressable>
                  <Pressable
                    style={styles.resume}
                    accessibilityLabel={`Resume ${name}'s game`}
                    onPress={() => router.push({ pathname: "/rate-game", params: { rater: g.raterId } })}
                  >
                    <Text style={styles.resumeText}>Resume</Text>
                  </Pressable>
                </View>
              )
            })}
          </View>
        )}

        {missingBack && missingBack.length > 0 && (
          <Pressable style={styles.card} onPress={startRun} accessibilityRole="button">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Camera color={color.brass} size={20} aria-hidden />
              <Text style={styles.title}>Shoot missing casebacks</Text>
            </View>
            <Text style={styles.body2}>
              {missingBack.length} owned watch{missingBack.length === 1 ? " has" : "es have"} no caseback photo, so the
              game shows only the front. One after another, Caseback already chosen — tap Next to move on.
            </Text>
          </Pressable>
        )}

        {raters && raters.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.eyebrow}>WHO HAS PLAYED</Text>
            {raters.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.rowName}>
                  {r.name}
                  {r.isOwner ? " (you)" : ""}
                </Text>
                <Text style={styles.rowMeta}>
                  {r.segments} segment{r.segments === 1 ? "" : "s"}
                </Text>
              </View>
            ))}
            <Text style={styles.hint}>Their full rankings are on the web: Reports → Ratings.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  body2: { fontSize: text.sm, color: color.mutedForeground, lineHeight: 21 },
  primary: { minHeight: 52, borderRadius: radius.card, backgroundColor: color.brass, alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  hint: { fontSize: text.xs, color: color.mutedForeground },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  rowName: { fontSize: text.sm, color: color.foreground },
  rowMeta: { fontSize: text.xs, color: color.mutedForeground },
  rowAction: { minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 10 },
  resume: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: color.brass,
    justifyContent: "center",
  },
  resumeText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
