import { Image } from "expo-image"
import { router, useLocalSearchParams } from "expo-router"
import { Camera } from "lucide-react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useApp } from "../../lib/app-context"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

const STATUS_LABEL: Record<PhoneWatch["status"], string> = {
  owned: "Owned",
  coming: "Coming soon",
  wish: "Wish list",
  sold: "Sold",
}

/**
 * The watch card — a minimal first version so Collection has somewhere to go.
 * The full card (swipeable photos, wear, strap, the money line) is step 5
 * (docs/iphone-app.md §7).
 */
export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { watches } = useApp()
  const watch = watches?.find((w) => w.id === id)

  if (!watch) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This watch isn&rsquo;t in your collection.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
    >
      {watch.thumbUrl ? (
        <Image source={{ uri: watch.thumbUrl }} style={styles.photo} contentFit="contain" transition={150} />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>No photo yet</Text>
        </View>
      )}

      <View style={{ gap: 2 }}>
        <Text style={styles.brand}>{watch.brand}</Text>
        <Text style={styles.model}>{watch.nickname || watch.model}</Text>
        <Text style={styles.meta}>
          {[watch.nickname ? watch.model : null, watch.reference, STATUS_LABEL[watch.status]]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>

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
  body: { padding: 16, gap: 16 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: radius.card, backgroundColor: color.surfacePhoto },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  noPhotoText: { fontSize: text.sm, color: color.mutedForeground },
  brand: { fontSize: text.sm, color: color.mutedForeground },
  model: { fontSize: text.lg, fontWeight: "600", color: color.foreground },
  meta: { fontSize: text.xs, color: color.mutedForeground },
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
