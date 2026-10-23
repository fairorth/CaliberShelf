import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { router, Stack } from "expo-router"
import { Camera, ChevronRight, CloudUpload } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as admiredQueue from "../../lib/admired-queue"
import { vendorTitle } from "../../lib/show-data"
import type { ReviewVendor } from "../../lib/show-data"
import { nextVendor, useShowSession } from "../../lib/show-session"
import { useShowMode } from "../../lib/show-mode"
import { useShowReview } from "../../screens/show/use-show-review"
import { color, radius, text, TOUCH } from "../../theme"

/**
 * VENDORS — Show mode's review: every vendor visited at this event, in visit
 * order, with a thumbnail, its name (or "Vendor 3" until one is read or
 * typed), its watches and photos, and what is still waiting to send. Tap one
 * to check its photos, fix them, or shoot more there; "Start next vendor"
 * goes back to the camera on a fresh booth.
 */
export default function VendorsScreen() {
  const insets = useSafeAreaInsets()
  const show = useShowMode()
  const session = useShowSession()
  const { vendors, offline, loading, refresh } = useShowReview(show.event)
  const [, tick] = useState(0)
  useEffect(() => admiredQueue.subscribe(() => tick((t) => t + 1)), [])
  const q = admiredQueue.getStatus()

  function startNext() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    nextVendor()
    router.dismissTo({ pathname: "/camera", params: { mode: "admired" } })
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <Stack.Screen options={{ title: show.event }} />
      <FlatList
        data={vendors}
        keyExtractor={(v) => v.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refresh()} tintColor={color.brass} />}
        ListHeaderComponent={
          <Text style={styles.status}>
            {offline ? "No signal — showing what's on this phone. " : ""}
            {q.pendingFrames === 0
              ? "Every photo is on the server."
              : `${q.pendingFrames} photo${q.pendingFrames === 1 ? "" : "s"} waiting to send${q.online ? "…" : " — they go when you have signal."}`}
          </Text>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={color.brass} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>No vendors yet at {show.event}. Start shooting at a booth.</Text>
          )
        }
        renderItem={({ item }) => (
          <VendorRow vendor={item} current={item.id === session.currentVendorId} />
        )}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]} onPress={startNext}>
          <Camera color={color.brassForeground} size={20} aria-hidden />
          <Text style={styles.primaryText}>Start next vendor</Text>
        </Pressable>
      </View>
    </View>
  )
}

function VendorRow({ vendor, current }: { vendor: ReviewVendor; current: boolean }) {
  const cover = vendor.photos.find((p) => p.kind === "watch") ?? vendor.photos[0]
  const watchCount = vendor.reviewWatches.length
  const meta = [
    `${watchCount} watch${watchCount === 1 ? "" : "es"}`,
    `${vendor.photos.length} photo${vendor.photos.length === 1 ? "" : "s"}`,
    current ? "shooting now" : null,
  ].filter(Boolean)
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/show/[vendorId]", params: { vendorId: vendor.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${vendorTitle(vendor)}, ${meta.join(", ")}`}
    >
      <View style={styles.thumb}>
        {cover?.thumbUri && <Image source={{ uri: cover.thumbUri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.name, !vendor.name && styles.nameMuted]} numberOfLines={1}>
          {vendorTitle(vendor)}
        </Text>
        {!vendor.name && (
          <Text style={styles.meta}>{vendor.namePending ? "Reading their name…" : "No name yet — tap to add one"}</Text>
        )}
        <Text style={styles.meta}>{meta.join(" · ")}</Text>
      </View>
      {vendor.pendingCount > 0 && (
        <View style={styles.pending} accessibilityLabel={`${vendor.pendingCount} waiting to send`}>
          <CloudUpload color={color.mutedForeground} size={14} aria-hidden />
          <Text style={styles.meta}>{vendor.pendingCount}</Text>
        </View>
      )}
      <ChevronRight color={color.mutedForeground} size={18} aria-hidden />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  status: { fontSize: text.xs, color: color.mutedForeground, marginBottom: 4 },
  empty: { fontSize: text.sm, color: color.mutedForeground, textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    padding: 10,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.control, overflow: "hidden", backgroundColor: color.surfacePhoto },
  name: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
  nameMuted: { color: color.mutedForeground },
  meta: { fontSize: text.xs, color: color.mutedForeground },
  pending: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: color.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  primary: {
    minHeight: TOUCH + 8,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
