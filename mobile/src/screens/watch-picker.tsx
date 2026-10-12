import { Image } from "expo-image"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { PhoneWatch } from "../lib/watches"
import { supabase } from "../lib/supabase"
import { color, radius, text, TOUCH } from "../theme"

interface WatchPickerProps {
  watches: PhoneWatch[] | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onPick: (watch: PhoneWatch) => void
  onIdentify: () => void
}

/**
 * Trial home: identify with the camera, or pick the watch to shoot. A photo
 * grid, never a text dropdown — the thing in your hand is a watch, not a name.
 */
export function WatchPicker({ watches, loading, error, onRefresh, onPick, onIdentify }: WatchPickerProps) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState("")

  const shown = useMemo(() => {
    const list = (watches ?? []).filter((w) => w.status === "owned" || w.status === "coming")
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((w) =>
      [w.brand, w.model, w.nickname ?? "", w.reference ?? ""].some((s) => s.toLowerCase().includes(q))
    )
  }, [watches, query])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera trial</Text>
        <Pressable onPress={() => void supabase.auth.signOut()} hitSlop={12}>
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.identify, pressed && { opacity: 0.85 }]}
        onPress={onIdentify}
      >
        <Text style={styles.identifyText}>Identify a watch with the camera</Text>
      </Pressable>

      <TextInput
        style={styles.search}
        placeholder="…or find the watch to shoot"
        placeholderTextColor={color.mutedForeground}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {loading && !watches && <ActivityIndicator style={{ marginTop: 32 }} color={color.brass} />}

      <FlatList
        data={shown}
        keyExtractor={(w) => w.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}
            onPress={() => onPick(item)}
          >
            {item.thumbUrl ? (
              <Image source={{ uri: item.thumbUrl }} style={styles.thumb} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.thumb, styles.noThumb]}>
                <Text style={styles.noThumbText}>No photo</Text>
              </View>
            )}
            <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
            <Text style={styles.model} numberOfLines={1}>{item.nickname || item.model}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          watches && !loading ? <Text style={styles.empty}>No watches match.</Text> : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: TOUCH,
    marginTop: 8,
  },
  title: { fontSize: text.lg, fontWeight: "600", color: color.foreground },
  link: { fontSize: text.sm, color: color.mutedForeground },
  identify: {
    minHeight: 56,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  identifyText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  search: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    fontSize: 16,
    color: color.foreground,
    backgroundColor: color.card,
    marginVertical: 12,
  },
  error: { fontSize: text.xs, color: color.destructive, marginBottom: 8 },
  tile: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 8,
  },
  thumb: { width: "100%", aspectRatio: 1, borderRadius: radius.control, backgroundColor: color.surfacePhoto },
  noThumb: { alignItems: "center", justifyContent: "center" },
  noThumbText: { fontSize: text.xs, color: color.mutedForeground },
  brand: { fontSize: text.xs, color: color.mutedForeground, marginTop: 6 },
  model: { fontSize: text.sm, color: color.foreground },
  empty: { fontSize: text.sm, color: color.mutedForeground, textAlign: "center", marginTop: 32 },
})
