import { Image } from "expo-image"
import { Trophy } from "lucide-react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { RankedWatch } from "@/lib/rating"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

export interface RevealData {
  segmentName: string
  isFinal: boolean
  ranking: RankedWatch[]
  /** null when there's no yardstick (or the owner is the one playing). */
  agreement: { pct: number; approximate: boolean } | null
  hotTake: { watchId: string; raterRank: number; referenceRank: number } | null
}

/**
 * The reveal — the friend's reward: their podium, how far they agree with
 * the owner, their hottest take, and the full ranking.
 */
export function Reveal({
  data,
  raterName,
  ownerName,
  raterIsOwner,
  byId,
  saveState,
  primary,
  secondary,
}: {
  data: RevealData
  raterName: string
  ownerName: string
  raterIsOwner: boolean
  byId: Map<string, PhoneWatch>
  saveState: "saving" | "saved" | "queued"
  primary: { label: string; onPress: () => void }
  secondary?: { label: string; onPress: () => void }
}) {
  const insets = useSafeAreaInsets()
  const [first, second, third] = data.ranking.slice(0, 3).map((r) => byId.get(r.watchId))
  const hot = data.hotTake ? byId.get(data.hotTake.watchId) : undefined

  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <Text style={styles.eyebrow}>
        {(data.isFinal ? "BEST IN SHOW" : data.segmentName.toUpperCase()) + ` · ${raterName.toUpperCase()}`}
      </Text>

      {data.isFinal && first ? (
        <View style={styles.champion}>
          <Trophy color={color.brass} size={30} aria-hidden />
          <Text style={styles.championLabel}>{raterName}&rsquo;s best in show</Text>
          {first.thumbUrl && <Image source={{ uri: first.thumbUrl }} style={styles.championPhoto} contentFit="cover" />}
          <Text style={styles.championName}>
            {first.brand} {first.model}
          </Text>
        </View>
      ) : (
        <View style={styles.podium}>
          <Step watch={second} place={2} height={64} />
          <Step watch={first} place={1} height={92} />
          <Step watch={third} place={3} height={46} />
        </View>
      )}

      {data.agreement && !raterIsOwner && (
        <View style={styles.agree}>
          <Text style={styles.agreePct}>{Math.round(data.agreement.pct * 100)}%</Text>
          <Text style={styles.agreeLabel}>
            you agree with {ownerName}
            {data.agreement.approximate ? ` (approximate — from ${ownerName}'s attachment ratings)` : ""}
          </Text>
        </View>
      )}
      {raterIsOwner && (
        <Text style={styles.note}>Your ranking is now the yardstick for everyone else&rsquo;s &ldquo;you agree with {ownerName}&rdquo;.</Text>
      )}

      {hot && data.hotTake && !raterIsOwner && (
        <View style={styles.hot}>
          <Text style={styles.hotText}>
            Hot take: you put the {hot.brand} {hot.model} #{data.hotTake.raterRank} — {ownerName} has it #
            {data.hotTake.referenceRank}.
          </Text>
        </View>
      )}

      <Text style={styles.listTitle}>FULL RANKING</Text>
      {data.ranking.map((r) => {
        const w = byId.get(r.watchId)
        return (
          <View key={r.watchId} style={styles.row}>
            <Text style={styles.rank}>{r.rank}</Text>
            {w?.thumbUrl ? (
              <Image source={{ uri: w.thumbUrl }} style={styles.rowThumb} contentFit="cover" />
            ) : (
              <View style={[styles.rowThumb, { backgroundColor: color.surfacePhoto }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowBrand} numberOfLines={1}>
                {w?.brand ?? ""}
              </Text>
              <Text style={styles.rowModel} numberOfLines={1}>
                {w?.model ?? ""}
              </Text>
            </View>
          </View>
        )
      })}

      <Text style={styles.saved}>
        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Saved on the phone — it will upload when there's signal"}
      </Text>
      <Pressable style={styles.primary} onPress={primary.onPress}>
        <Text style={styles.primaryText}>{primary.label}</Text>
      </Pressable>
      {secondary && (
        <Pressable style={styles.secondary} onPress={secondary.onPress}>
          <Text style={styles.secondaryText}>{secondary.label}</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

function Step({ watch, place, height }: { watch: PhoneWatch | undefined; place: number; height: number }) {
  if (!watch) return <View style={{ flex: 1 }} />
  return (
    <View style={styles.step}>
      {watch.thumbUrl ? (
        <Image source={{ uri: watch.thumbUrl }} style={styles.stepPhoto} contentFit="cover" />
      ) : (
        <View style={[styles.stepPhoto, { backgroundColor: color.surfacePhoto }]} />
      )}
      <Text style={styles.stepName} numberOfLines={2}>
        {watch.brand} {watch.model}
      </Text>
      <View style={[styles.block, { height }, place === 1 && styles.blockFirst]}>
        <Text style={[styles.place, place === 1 && styles.placeFirst]}>{place}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, gap: 14 },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  podium: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 4 },
  step: { flex: 1, alignItems: "center", gap: 6 },
  stepPhoto: { width: "86%", aspectRatio: 1, borderRadius: radius.control },
  stepName: { fontSize: text.xxs, color: color.mutedForeground, textAlign: "center", minHeight: 28 },
  block: {
    alignSelf: "stretch",
    borderTopLeftRadius: radius.control,
    borderTopRightRadius: radius.control,
    backgroundColor: color.muted,
    alignItems: "center",
    paddingTop: 6,
  },
  blockFirst: { backgroundColor: color.brass },
  place: { fontSize: text.md, fontWeight: "700", color: color.foreground },
  placeFirst: { color: color.brassForeground },
  champion: { alignItems: "center", gap: 8, paddingVertical: 8 },
  championLabel: { fontSize: text.sm, color: color.mutedForeground },
  championPhoto: { width: "70%", aspectRatio: 1, borderRadius: radius.card },
  championName: { fontSize: text.md, fontWeight: "600", color: color.foreground, textAlign: "center" },
  agree: { alignItems: "center", gap: 2, marginTop: 4 },
  agreePct: { fontSize: text.xl, fontWeight: "600", color: color.foreground, fontVariant: ["tabular-nums"] },
  agreeLabel: { fontSize: text.sm, color: color.mutedForeground, textAlign: "center" },
  note: { fontSize: text.sm, color: color.mutedForeground, textAlign: "center" },
  hot: { backgroundColor: color.card, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: color.border, padding: 12 },
  hotText: { fontSize: text.sm, color: color.foreground },
  listTitle: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52 },
  rank: { width: 26, fontSize: text.sm, color: color.mutedForeground, fontVariant: ["tabular-nums"], textAlign: "right" },
  rowThumb: { width: 44, height: 44, borderRadius: radius.control },
  rowBrand: { fontSize: text.xs, color: color.mutedForeground },
  rowModel: { fontSize: text.sm, color: color.foreground },
  saved: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center", marginTop: 8 },
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
