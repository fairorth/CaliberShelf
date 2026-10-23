import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { useEffect, useRef, useState } from "react"
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native"
import type { LayoutChangeEvent } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isSegmentComplete, nextPair, pairKey, segmentProgress } from "@/lib/rating"
import type { RatingPick } from "@/lib/rating"
import type { PlayedPick, SegmentInProgress } from "../../lib/rate-game"
import { fetchWatchPhotos } from "../../lib/watch-detail"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

type Photo = { id: string; url: string; angle: string | null }
/** A watch's photos split for the card: the front slot and the caseback slot. */
type Slots = { front: Photo[]; back: Photo[] }

/** Front = the cover first, then every other non-caseback shot; back = the
 *  photos tagged Caseback (the exhibition back is half of a watch's case for
 *  many collectors). */
function splitPhotos(photos: Photo[]): Slots {
  return {
    front: photos.filter((p) => p.angle !== "caseback"),
    back: photos.filter((p) => p.angle === "caseback"),
  }
}

/**
 * The head-to-head: two watches side by side, FRONT above BACK, tap the one
 * you prefer. Swipe a photo to see that watch's other shots in place. The
 * pair comes from the model (lib/rating.ts nextPair); the segment ends when
 * it says the ranking has settled. NO prices — the friend judges the watch.
 *
 * Equal  = a tie (half a win each).
 * Skip   = "I can't judge these" — records nothing, and the pair isn't
 *          offered again while any other is left.
 *
 * A segment can be left and picked up later: `resume` restores the picks and
 * skips so far, and `onProgress` reports them after every change so the game
 * can keep them on the phone (lib/rate-game.ts, unfinished games).
 */
export function Duel({
  raterName,
  segmentName,
  watches,
  resume,
  onProgress,
  onComplete,
  onQuit,
}: {
  raterName: string
  segmentName: string
  watches: PhoneWatch[]
  resume?: SegmentInProgress
  onProgress: (state: SegmentInProgress) => void
  onComplete: (picks: PlayedPick[], startedAt: string) => void
  onQuit: () => void
}) {
  const insets = useSafeAreaInsets()
  const ids = watches.map((w) => w.id)
  const byId = new Map(watches.map((w) => [w.id, w]))
  const asModel = (list: PlayedPick[]): RatingPick[] => list.map((p) => ({ a: p.left, b: p.right, winner: p.winner }))

  // Restored picks keep only watches still in the segment — one sold or
  // re-categorised since the last sitting drops out with its picks.
  const [picks, setPicks] = useState<PlayedPick[]>(() => {
    const here = new Set(ids)
    return (resume?.picks ?? []).filter(
      (p) => here.has(p.left) && here.has(p.right) && (p.winner === null || here.has(p.winner))
    )
  })
  const skipped = useRef(new Set<string>(resume?.skipped ?? []))
  const [pair, setPair] = useState<[string, string] | null>(() =>
    nextPair(ids, asModel(picks), Math.random, skipped.current)
  )
  const [chosen, setChosen] = useState<string | null>(null)
  const shownAt = useRef(Date.now())
  const startedAt = useRef(resume?.startedAt ?? new Date().toISOString())
  const photoCache = useRef(new Map<string, Slots>())
  const [, bump] = useState(0)

  function report(list: PlayedPick[]) {
    onProgress({ name: segmentName, picks: list, skipped: [...skipped.current], startedAt: startedAt.current })
  }

  // A resumed segment whose watches changed may already be settled.
  useEffect(() => {
    if (picks.length > 0 && isSegmentComplete(ids, asModel(picks))) onComplete(picks, startedAt.current)
    // Once, on mount — later picks go through advance().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The pair's photo sets, fetched in the background (the cover thumbnail
  // shows until they arrive).
  useEffect(() => {
    if (!pair) return
    for (const id of pair) {
      if (photoCache.current.has(id)) continue
      fetchWatchPhotos(id)
        .then((p) => {
          photoCache.current.set(id, splitPhotos(p))
          bump((n) => n + 1)
        })
        .catch(() => photoCache.current.set(id, { front: [], back: [] }))
    }
    shownAt.current = Date.now()
  }, [pair])

  function advance(next: PlayedPick[]) {
    if (isSegmentComplete(ids, asModel(next))) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onComplete(next, startedAt.current)
    } else {
      report(next)
      setPair(nextPair(ids, asModel(next), Math.random, skipped.current))
    }
  }

  function choose(winner: string | null) {
    if (!pair || chosen) return
    void Haptics.impactAsync(winner ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light)
    const pick: PlayedPick = { left: pair[0], right: pair[1], winner, decidedMs: Date.now() - shownAt.current }
    const next = [...picks, pick]
    setChosen(winner ?? "equal")
    // A beat to see the choice land, then the next pair.
    setTimeout(() => {
      setChosen(null)
      setPicks(next)
      advance(next)
    }, 220)
  }

  function skip() {
    if (!pair || chosen) return
    void Haptics.selectionAsync()
    skipped.current.add(pairKey(pair[0], pair[1]))
    report(picks)
    setPair(nextPair(ids, asModel(picks), Math.random, skipped.current))
  }

  function undo() {
    const last = picks[picks.length - 1]
    if (!last) return
    const next = picks.slice(0, -1)
    setPicks(next)
    report(next)
    setPair([last.left, last.right])
  }

  const progress = segmentProgress(ids, asModel(picks))
  const anyMore =
    !!pair &&
    pair.some((id) => {
      const s = photoCache.current.get(id)
      return !!s && (s.front.length > 1 || s.back.length > 1)
    })

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.headerText} numberOfLines={1}>
          {raterName} · {segmentName}
        </Text>
        {/* Leaving keeps the picks — the segment resumes where it stopped. */}
        <Pressable onPress={onQuit} hitSlop={10} accessibilityHint="Your picks so far are kept">
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
            const slots = photoCache.current.get(id)
            const isChosen = chosen === id
            const isLoser = !!chosen && chosen !== "equal" && chosen !== id
            return (
              <View
                key={id}
                style={[styles.card, isChosen && styles.cardChosen, isLoser && { opacity: 0.35 }]}
                accessibilityLabel={`${w.brand} ${w.model}`}
              >
                <WatchPhotos watch={w} slots={slots} onPick={() => choose(id)} />
                <Pressable onPress={() => choose(id)} accessibilityRole="button" accessibilityLabel={`Prefer ${w.brand} ${w.model}`}>
                  <Text style={styles.brand} numberOfLines={1}>
                    {w.brand}
                  </Text>
                  <Text style={styles.model} numberOfLines={2}>
                    {w.model}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      <Text style={styles.hint}>
        Tap the one you&rsquo;d rather wear{anyMore ? " · swipe a photo for more" : ""}
      </Text>

      <View style={{ flex: 1 }} />
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => choose(null)} accessibilityHint="Counts as a tie">
          <Text style={styles.actionText}>Equal</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={skip} accessibilityHint="Records nothing for this pair">
          <Text style={styles.actionText}>Skip</Text>
        </Pressable>
      </View>
      <Pressable onPress={undo} disabled={picks.length === 0} hitSlop={8} style={{ minHeight: TOUCH, justifyContent: "center" }}>
        <Text style={[styles.undo, picks.length === 0 && { opacity: 0.4 }]}>Undo last pick</Text>
      </Pressable>
    </View>
  )
}

/** The front slot over the caseback slot; each swipes through its photos. */
function WatchPhotos({ watch, slots, onPick }: { watch: PhoneWatch; slots: Slots | undefined; onPick: () => void }) {
  const [width, setWidth] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)
  // Until the full set arrives, the cover thumbnail stands in for the front.
  const front: Photo[] = slots?.front.length
    ? slots.front
    : watch.thumbUrl
      ? [{ id: "thumb", url: watch.thumbUrl, angle: null }]
      : []
  const back = slots?.back ?? []
  return (
    <View onLayout={onLayout} style={{ gap: 6 }}>
      {width > 0 && (
        <>
          <Pager photos={front} size={width} onPick={onPick} emptyLabel="No photo" />
          {slots && back.length > 0 ? (
            <Pager photos={back} size={width} onPick={onPick} label="Caseback" />
          ) : slots ? (
            <View style={[styles.noBack, { width }]}>
              <Text style={styles.noBackText}>No caseback photo</Text>
            </View>
          ) : (
            <View style={[styles.photoBox, { width, height: width }]} />
          )}
        </>
      )}
    </View>
  )
}

function Pager({
  photos,
  size,
  onPick,
  label,
  emptyLabel,
}: {
  photos: Photo[]
  size: number
  onPick: () => void
  label?: string
  emptyLabel?: string
}) {
  const [page, setPage] = useState(0)
  if (photos.length === 0) {
    return (
      <Pressable onPress={onPick} style={[styles.photoBox, styles.center, { width: size, height: size }]}>
        <Text style={styles.noBackText}>{emptyLabel ?? ""}</Text>
      </Pressable>
    )
  }
  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: size, height: size, borderRadius: radius.control }}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / size))}
        renderItem={({ item }) => (
          // Tapping a photo picks the watch; swiping it pages through.
          <Pressable onPress={onPick}>
            <Image
              source={{ uri: item.url }}
              style={[styles.photoBox, { width: size, height: size }]}
              contentFit="cover"
              transition={120}
            />
          </Pressable>
        )}
      />
      {label && (
        <View style={styles.label} pointerEvents="none">
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
      {photos.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((p, i) => (
            <View key={p.id} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: TOUCH, gap: 12 },
  headerText: { flex: 1, fontSize: text.xs, color: color.mutedForeground },
  headerLink: { fontSize: text.sm, color: color.brass, fontWeight: "600" },
  track: { height: 4, borderRadius: 2, backgroundColor: color.muted, overflow: "hidden" },
  fill: { height: 4, backgroundColor: color.brass },
  prompt: { fontSize: text.md, fontWeight: "600", color: color.foreground, textAlign: "center" },
  pair: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: color.border,
    padding: 8,
    gap: 6,
  },
  cardChosen: { borderColor: color.brass },
  photoBox: { borderRadius: radius.control, backgroundColor: color.surfacePhoto },
  center: { alignItems: "center", justifyContent: "center" },
  noBack: {
    height: 36,
    borderRadius: radius.control,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  noBackText: { fontSize: text.xxs, color: color.mutedForeground },
  label: {
    position: "absolute",
    left: 6,
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
  },
  labelText: { fontSize: text.xxs, color: color.foreground },
  dots: { position: "absolute", bottom: 6, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.scrim },
  dotActive: { backgroundColor: color.brassForeground },
  brand: { fontSize: text.xs, color: color.mutedForeground },
  model: { fontSize: text.sm, color: color.foreground, fontWeight: "600" },
  hint: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    minHeight: TOUCH + 4,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
  undo: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
})
