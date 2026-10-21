import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { useEffect, useRef, useState } from "react"
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isSegmentComplete, nextPair, segmentProgress } from "@/lib/rating"
import type { RatingPick } from "@/lib/rating"
import type { PlayedPick } from "../../lib/rate-game"
import { fetchWatchPhotos } from "../../lib/watch-detail"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

type Photos = Array<{ id: string; url: string }>

/**
 * The head-to-head: two watches side by side, tap the one you prefer. The
 * pair comes from the model (lib/rating.ts nextPair) after every tap; the
 * segment ends when the model says the ranking has settled. NO prices, no
 * values, nothing but the watches — the friend judges the watch.
 */
export function Duel({
  raterName,
  segmentName,
  watches,
  onComplete,
  onQuit,
}: {
  raterName: string
  segmentName: string
  watches: PhoneWatch[]
  onComplete: (picks: PlayedPick[], startedAt: string) => void
  onQuit: () => void
}) {
  const insets = useSafeAreaInsets()
  const ids = watches.map((w) => w.id)
  const byId = new Map(watches.map((w) => [w.id, w]))
  const [picks, setPicks] = useState<PlayedPick[]>([])
  const [pair, setPair] = useState<[string, string] | null>(() => nextPair(ids, []))
  const [chosen, setChosen] = useState<string | null>(null)
  const [more, setMore] = useState<PhoneWatch | null>(null)
  const shownAt = useRef(Date.now())
  const startedAt = useRef(new Date().toISOString())
  const photoCache = useRef(new Map<string, Photos>())
  const [, bump] = useState(0)

  const asModel = (list: PlayedPick[]): RatingPick[] =>
    list.map((p) => ({ a: p.left, b: p.right, winner: p.winner }))

  // Fetch the pair's photo sets in the background, for "Show me more".
  useEffect(() => {
    if (!pair) return
    for (const id of pair) {
      if (photoCache.current.has(id)) continue
      fetchWatchPhotos(id)
        .then((p) => {
          photoCache.current.set(id, p)
          bump((n) => n + 1)
        })
        .catch(() => photoCache.current.set(id, []))
    }
    shownAt.current = Date.now()
  }, [pair])

  function choose(winner: string | null) {
    if (!pair || chosen) return
    void Haptics.impactAsync(winner ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light)
    const pick: PlayedPick = { left: pair[0], right: pair[1], winner, decidedMs: Date.now() - shownAt.current }
    const next = [...picks, pick]
    setChosen(winner ?? "tie")
    // A beat to see the choice land, then the next pair.
    setTimeout(() => {
      setChosen(null)
      setPicks(next)
      if (isSegmentComplete(ids, asModel(next))) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        onComplete(next, startedAt.current)
      } else {
        setPair(nextPair(ids, asModel(next)))
      }
    }, 220)
  }

  function undo() {
    const last = picks[picks.length - 1]
    if (!last) return
    setPicks(picks.slice(0, -1))
    setPair([last.left, last.right])
  }

  function quit() {
    Alert.alert("Leave this segment?", "The picks so far in this segment won't be saved.", [
      { text: "Keep playing", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onQuit },
    ])
  }

  const progress = segmentProgress(ids, asModel(picks))

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {raterName} · {segmentName}
        </Text>
        <Pressable onPress={quit} hitSlop={10}>
          <Text style={styles.headerLink}>Segments</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <Text style={styles.prompt}>Which do you prefer?</Text>

      {pair && (
        <View style={styles.pair}>
          {pair.map((id) => {
            const w = byId.get(id)!
            const photos = photoCache.current.get(id)
            const isChosen = chosen === id
            const isLoser = !!chosen && chosen !== "tie" && chosen !== id
            return (
              <View key={id} style={[styles.side, isLoser && { opacity: 0.35 }]}>
                <Pressable
                  onPress={() => choose(id)}
                  style={({ pressed }) => [styles.card, (pressed || isChosen) && styles.cardChosen]}
                  accessibilityRole="button"
                  accessibilityLabel={`Prefer ${w.brand} ${w.model}`}
                >
                  {w.thumbUrl ? (
                    <Image source={{ uri: w.thumbUrl }} style={styles.photo} contentFit="cover" transition={120} />
                  ) : (
                    <View style={[styles.photo, styles.noPhoto]}>
                      <Text style={styles.noPhotoText}>No photo</Text>
                    </View>
                  )}
                  <Text style={styles.brand} numberOfLines={1}>
                    {w.brand}
                  </Text>
                  <Text style={styles.model} numberOfLines={2}>
                    {w.model}
                  </Text>
                </Pressable>
                {photos && photos.length > 1 ? (
                  <Pressable style={styles.more} onPress={() => setMore(w)}>
                    <Text style={styles.moreText}>Show me more · {photos.length}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.moreSpacer} />
                )}
              </View>
            )
          })}
        </View>
      )}

      <Text style={styles.hint}>Tap the one you&rsquo;d rather wear</Text>

      <View style={{ flex: 1 }} />
      <Pressable style={styles.tie} onPress={() => choose(null)}>
        <Text style={styles.tieText}>Can&rsquo;t choose</Text>
      </Pressable>
      <Pressable onPress={undo} disabled={picks.length === 0} hitSlop={8} style={{ minHeight: TOUCH, justifyContent: "center" }}>
        <Text style={[styles.undo, picks.length === 0 && { opacity: 0.4 }]}>Undo last pick</Text>
      </Pressable>

      <PhotoPager watch={more} photos={more ? (photoCache.current.get(more.id) ?? []) : []} onClose={() => setMore(null)} />
    </View>
  )
}

/** "Show me more": every photo of one watch, swipe through, then back. */
function PhotoPager({ watch, photos, onClose }: { watch: PhoneWatch | null; photos: Photos; onClose: () => void }) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [watch])
  return (
    <Modal visible={watch != null} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.pager, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.pagerTitle} numberOfLines={1}>
            {watch ? `${watch.brand} ${watch.model}` : ""}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.headerLink}>Back to the choice</Text>
          </Pressable>
        </View>
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={{ width, height: "100%" }} contentFit="contain" />
          )}
        />
        <Text style={styles.pagerCount}>
          {photos.length ? `${page + 1} / ${photos.length}` : ""}
        </Text>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: TOUCH },
  headerText: { fontSize: text.xs, color: color.mutedForeground },
  headerLink: { fontSize: text.sm, color: color.brass, fontWeight: "600" },
  track: { height: 4, borderRadius: 2, backgroundColor: color.muted, overflow: "hidden" },
  fill: { height: 4, backgroundColor: color.brass },
  prompt: { fontSize: text.md, fontWeight: "600", color: color.foreground, textAlign: "center", marginTop: 4 },
  pair: { flexDirection: "row", gap: 10 },
  side: { flex: 1, gap: 8 },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: color.border,
    padding: 8,
    gap: 4,
  },
  cardChosen: { borderColor: color.brass },
  photo: { width: "100%", aspectRatio: 1, borderRadius: radius.control, backgroundColor: color.surfacePhoto },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  noPhotoText: { fontSize: text.xs, color: color.mutedForeground },
  brand: { fontSize: text.xs, color: color.mutedForeground, marginTop: 4 },
  model: { fontSize: text.sm, color: color.foreground, fontWeight: "600" },
  more: {
    minHeight: 36,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.card,
  },
  moreText: { fontSize: text.xs, color: color.foreground },
  moreSpacer: { minHeight: 36 },
  hint: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
  tie: {
    minHeight: TOUCH + 4,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tieText: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
  undo: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
  pager: { flex: 1, backgroundColor: color.viewfinder, gap: 8 },
  pagerTitle: { flex: 1, fontSize: text.sm, color: color.viewfinderText, fontWeight: "600", paddingLeft: 16 },
  pagerCount: { fontSize: text.xs, color: color.viewfinderText, textAlign: "center" },
})
