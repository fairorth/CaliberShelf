import { router, useFocusEffect } from "expo-router"
import { Trophy } from "lucide-react-native"
import { useCallback, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ScreenHeader } from "../../components/screen-header"
import { supabase } from "../../lib/supabase"
import { color, radius, text } from "../../theme"

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

  const owner = raters?.find((r) => r.isOwner)

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
})
