import { router } from "expo-router"
import { Plus } from "lucide-react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { WatchGrid } from "../../components/watch-grid"
import { useApp } from "../../lib/app-context"
import { COLLECTION_SORTS, useCollectionSort } from "../../lib/collection-sort"
import { color, radius, text, TOUCH } from "../../theme"

/**
 * Collection (lite). Owned + coming soon, newest added first by default with
 * a short sort choice (remembered on the phone). Filters and the wish list
 * come with step 5 (docs/iphone-app.md §6).
 */
export default function CollectionScreen() {
  const { watches, watchesLoading, watchesError, reloadWatches } = useApp()
  const { sort, choose } = useCollectionSort()

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader
        title="Collection"
        right={
          <Pressable
            onPress={() => router.push("/add")}
            hitSlop={8}
            accessibilityLabel="Add a watch"
            style={{ width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" }}
          >
            <Plus color={color.brass} size={26} aria-hidden />
          </Pressable>
        }
      />
      <WatchGrid
        watches={watches}
        loading={watchesLoading}
        error={watchesError}
        onRefresh={() => void reloadWatches()}
        onPick={(w) => router.push({ pathname: "/watch/[id]", params: { id: w.id } })}
        sort={sort}
        header={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sorts}
            accessibilityRole="radiogroup"
            accessibilityLabel="Sort"
          >
            {COLLECTION_SORTS.map((o) => (
              <Pressable
                key={o.key}
                onPress={() => choose(o.key)}
                style={[styles.chip, sort === o.key && styles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: sort === o.key }}
              >
                <Text style={[styles.chipText, sort === o.key && styles.chipTextActive]}>{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sorts: { gap: 8, paddingTop: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: color.brass, borderColor: color.brass },
  chipText: { fontSize: text.xs, color: color.foreground },
  chipTextActive: { color: color.brassForeground, fontWeight: "600" },
})
