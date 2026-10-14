import { Image } from "expo-image"
import { useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"
import { sortWatches } from "../lib/collection-sort"
import { formatPrice, useShowPurchasePrice } from "../lib/price-visibility"
import type { CollectionSort } from "../lib/collection-sort"
import type { PhoneWatch } from "../lib/watches"
import { color, radius, text, TOUCH } from "../theme"

/** Which statuses a grid shows. Wish list is hidden until asked for — the
 *  web collection's default too. */
export type GridScope = "in-hand" | "all"

interface WatchGridProps {
  watches: PhoneWatch[] | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onPick: (watch: PhoneWatch) => void
  scope?: GridScope
  /** Order of the grid; omitted = the collection's default (status, brand, model). */
  sort?: CollectionSort
  searchPlaceholder?: string
  /** Rendered above the search box (scrolls with the grid). */
  header?: React.ReactElement
  bottomInset?: number
}

/**
 * A photo grid of watches with search — never a text dropdown: the thing in
 * your hand is a watch, not a name.
 */
export function WatchGrid({
  watches,
  loading,
  error,
  onRefresh,
  onPick,
  scope = "in-hand",
  sort,
  searchPlaceholder = "Search brand, model, nickname or ref",
  header,
  bottomInset = 0,
}: WatchGridProps) {
  const [query, setQuery] = useState("")
  // Prices only when More → "Show watch purchase price" is on.
  const showPrice = useShowPurchasePrice()

  const shown = useMemo(() => {
    const list = (watches ?? []).filter(
      (w) => scope === "all" || w.status === "owned" || w.status === "coming"
    )
    const q = query.trim().toLowerCase()
    const found = !q
      ? list
      : list.filter((w) =>
          [w.brand, w.model, w.nickname ?? "", w.reference ?? ""].some((s) => s.toLowerCase().includes(q))
        )
    return sort ? sortWatches(found, sort) : found
  }, [watches, query, scope, sort])

  return (
    <FlatList
      data={shown}
      keyExtractor={(w) => w.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 10 }}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: bottomInset + 24 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View>
          {header}
          <TextInput
            style={styles.search}
            placeholder={searchPlaceholder}
            placeholderTextColor={color.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          {loading && !watches && <ActivityIndicator style={{ marginVertical: 24 }} color={color.brass} />}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]} onPress={() => onPick(item)}>
          {item.thumbUrl ? (
            <Image source={{ uri: item.thumbUrl }} style={styles.thumb} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.thumb, styles.noThumb]}>
              <Text style={styles.noThumbText}>No photo</Text>
            </View>
          )}
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
          <Text style={styles.model} numberOfLines={1}>
            {item.nickname || item.model}
          </Text>
          {showPrice && item.purchasePriceCents != null && (
            <Text style={styles.price}>{formatPrice(item.purchasePriceCents)}</Text>
          )}
        </Pressable>
      )}
      ListEmptyComponent={watches && !loading ? <Text style={styles.empty}>No watches match.</Text> : null}
    />
  )
}

const styles = StyleSheet.create({
  search: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    fontSize: 16, // ≥16: iOS zooms smaller fields
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
  // Prices are foreground + tabular figures, never coloured (design system).
  price: { fontSize: text.xs, color: color.foreground, fontVariant: ["tabular-nums"], marginTop: 2 },
  empty: { fontSize: text.sm, color: color.mutedForeground, textAlign: "center", marginTop: 32 },
})
