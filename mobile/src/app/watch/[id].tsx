import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Camera } from "lucide-react-native"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { KEEP_DECISIONS, keepDecisionLabels } from "@/lib/validations/keep"
import type { KeepDecision } from "@/lib/validations/keep"
import { ATTACHMENT_LEVELS, attachmentLabels } from "@/lib/validations/watch"
import type { KeepFields } from "@/lib/validations/watch"
import { useApp } from "../../lib/app-context"
import { formatPrice, useShowPersonalSettings, useShowPurchasePrice } from "../../lib/price-visibility"
import { fetchWatchDetail, setKeepFields } from "../../lib/watch-detail"
import type { WatchDetail } from "../../lib/watch-detail"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

const STATUS_LABEL: Record<PhoneWatch["status"], string> = {
  owned: "Owned",
  coming: "Coming soon",
  wish: "Wish list",
  sold: "Sold",
}

const GUTTER = 16

/**
 * The watch card: every photo (swipe, "2 / 5" on the photo), what it is, and
 * — each only if More allows — the purchase price and the keep judgements
 * (attachment, keep / maybe / sell, sentimental: the fields The Edit reads).
 * The rest lives on the web.
 */
export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { watches } = useApp()
  const showPrice = useShowPurchasePrice()
  const showPersonal = useShowPersonalSettings()
  const watch = watches?.find((w) => w.id === id)

  const [detail, setDetail] = useState<WatchDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Reload on focus: photos shot from this card show up on return.
  useFocusEffect(
    useCallback(() => {
      let alive = true
      fetchWatchDetail(id)
        .then((d) => alive && setDetail(d))
        .catch((e: Error) => alive && setLoadError(e.message))
      return () => {
        alive = false
      }
    }, [id])
  )

  /** Optimistic: the control answers at once; a failed save puts it back. */
  async function save(patch: KeepFields, optimistic: Partial<WatchDetail>) {
    if (!detail) return
    const before = detail
    setDetail({ ...detail, ...optimistic })
    void Haptics.selectionAsync()
    try {
      await setKeepFields(id, patch)
    } catch (e) {
      setDetail(before)
      Alert.alert("Couldn't save that", (e as Error).message)
    }
  }

  if (!watch) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This watch isn&rsquo;t in your collection.</Text>
      </View>
    )
  }

  const photoWidth = width - GUTTER * 2
  const photos = detail?.photos ?? []
  const price = formatPrice(watch.purchasePriceCents)
  const canJudge = watch.status !== "wish" // a wish-list watch isn't yours to keep or sell

  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
    >
      {/* Photos — swipe through them, cover first. */}
      {photos.length > 0 ? (
        <View>
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / photoWidth))}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{ width: photoWidth, aspectRatio: 1, borderRadius: radius.card, backgroundColor: color.surfacePhoto }}
                contentFit="contain"
                transition={150}
              />
            )}
          />
          {photos.length > 1 && (
            <>
              {/* On the photo, where the eye already is — under it, beside
                  the dots, it was easy to miss that there were more. */}
              <View style={styles.counter} pointerEvents="none" accessibilityLabel={`Photo ${page + 1} of ${photos.length}, swipe for more`}>
                <Text style={styles.counterText}>
                  {page + 1} / {photos.length}
                </Text>
              </View>
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {photos.map((p, i) => (
                  <View key={p.id} style={[styles.dot, i === page && styles.dotActive]} />
                ))}
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          {detail || loadError ? (
            <Text style={styles.noPhotoText}>No photo yet</Text>
          ) : (
            <ActivityIndicator color={color.brass} />
          )}
        </View>
      )}

      {/* What it is */}
      <View style={{ gap: 2 }}>
        <Text style={styles.brand}>{watch.brand}</Text>
        <Text style={styles.model}>{watch.nickname || watch.model}</Text>
        <Text style={styles.meta}>
          {[watch.nickname ? watch.model : null, watch.reference, STATUS_LABEL[watch.status]]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {showPrice && price && (
          <Text style={styles.price}>
            <Text style={styles.priceLabel}>{watch.status === "wish" ? "Expected  " : "Paid  "}</Text>
            {price}
          </Text>
        )}
      </View>

      {loadError && <Text style={styles.error}>{loadError}</Text>}

      {/* Keep judgements — the fields The Edit reads. Hidden entirely when
          More → "Show personal settings" is off (someone else is browsing). */}
      {detail && canJudge && showPersonal && (
        <View style={styles.card}>
          <Text style={styles.section}>ATTACHMENT</Text>
          <View style={styles.segment}>
            {ATTACHMENT_LEVELS.map((a) => {
              const on = detail.attachment === a
              return (
                <Pressable
                  key={a}
                  onPress={() => void save({ attachment: on ? null : a }, { attachment: on ? null : a })}
                  style={[styles.segItem, on && styles.segItemActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.segText, on && styles.segTextActive]}>{attachmentLabels[a]}</Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={[styles.section, { marginTop: 14 }]}>KEEP OR SELL</Text>
          <View style={styles.segment}>
            {KEEP_DECISIONS.map((k: KeepDecision) => {
              const on = detail.keepDecision === k
              return (
                <Pressable
                  key={k}
                  onPress={() => void save({ keep_decision: on ? null : k }, { keepDecision: on ? null : k })}
                  style={[styles.segItem, on && styles.segItemActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.segText, on && styles.segTextActive]}>{keepDecisionLabels[k]}</Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Sentimental</Text>
              <Text style={styles.rowHint}>Locks it in — The Edit never suggests selling it.</Text>
            </View>
            <Switch
              value={detail.sentimental}
              onValueChange={(v) => void save({ sentimental: v }, { sentimental: v })}
              trackColor={{ true: color.brass, false: color.muted }}
            />
          </View>
          <Text style={styles.hintSmall}>Tap a chosen value again to clear it.</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
        onPress={() => router.push({ pathname: "/camera", params: { watchId: watch.id } })}
      >
        <Camera color={color.brassForeground} size={20} aria-hidden />
        <Text style={styles.actionText}>Photograph this watch</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: { padding: GUTTER, gap: 16 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: radius.card, backgroundColor: color.surfacePhoto },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  noPhotoText: { fontSize: text.sm, color: color.mutedForeground },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.border },
  dotActive: { backgroundColor: color.foreground },
  counter: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
  },
  counterText: { fontSize: text.xs, fontWeight: "600", color: color.foreground, fontVariant: ["tabular-nums"] },
  brand: { fontSize: text.sm, color: color.mutedForeground },
  model: { fontSize: text.lg, fontWeight: "600", color: color.foreground },
  meta: { fontSize: text.xs, color: color.mutedForeground },
  price: { fontSize: text.sm, color: color.foreground, fontVariant: ["tabular-nums"], marginTop: 4 },
  priceLabel: { fontSize: text.xs, color: color.mutedForeground },
  error: { fontSize: text.xs, color: color.destructive },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 14,
  },
  section: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground, marginBottom: 8 },
  segment: {
    flexDirection: "row",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  segItem: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center", backgroundColor: color.card },
  segItemActive: { backgroundColor: color.brass },
  segText: { fontSize: text.xs, color: color.foreground },
  segTextActive: { color: color.brassForeground, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, marginTop: 10 },
  rowLabel: { fontSize: text.sm, color: color.foreground },
  rowHint: { fontSize: text.xs, color: color.mutedForeground, marginTop: 2 },
  hintSmall: { fontSize: text.xxs, color: color.mutedForeground, marginTop: 4 },
  action: {
    minHeight: TOUCH + 12,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.background },
  missingText: { fontSize: text.sm, color: color.mutedForeground },
})
