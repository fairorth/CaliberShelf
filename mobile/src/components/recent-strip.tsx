import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { PhoneWatch } from "../lib/watches"
import { color, radius, text } from "../theme"

/** Recently worn watches as one-tap photos — the quickest way to log a wear. */
export function RecentStrip({
  watches,
  onPick,
  title = "RECENT",
}: {
  watches: PhoneWatch[]
  onPick: (watch: PhoneWatch) => void
  title?: string
}) {
  if (watches.length === 0) return null
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.eyebrow}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {watches.map((w) => (
          <Pressable
            key={w.id}
            onPress={() => onPick(w)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
            accessibilityLabel={`${w.brand} ${w.nickname || w.model}`}
          >
            {w.thumbUrl ? (
              <Image source={{ uri: w.thumbUrl }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.noThumb]} />
            )}
            <Text style={styles.name} numberOfLines={1}>
              {w.nickname || w.model}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  row: { gap: 10 },
  item: { width: 76, gap: 4 },
  thumb: { width: 76, height: 76, borderRadius: radius.control, backgroundColor: color.surfacePhoto },
  noThumb: { borderWidth: StyleSheet.hairlineWidth, borderColor: color.border },
  name: { fontSize: text.xxs, color: color.mutedForeground },
})
