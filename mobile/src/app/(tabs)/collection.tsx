import { router } from "expo-router"
import { View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { WatchGrid } from "../../components/watch-grid"
import { useApp } from "../../lib/app-context"
import { color } from "../../theme"

/**
 * Collection (lite). Owned + coming soon for now; filters, sort and the wish
 * list come with step 5 (docs/iphone-app.md §6).
 */
export default function CollectionScreen() {
  const { watches, watchesLoading, watchesError, reloadWatches } = useApp()
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="Collection" />
      <WatchGrid
        watches={watches}
        loading={watchesLoading}
        error={watchesError}
        onRefresh={() => void reloadWatches()}
        onPick={(w) => router.push({ pathname: "/watch/[id]", params: { id: w.id } })}
      />
    </View>
  )
}
