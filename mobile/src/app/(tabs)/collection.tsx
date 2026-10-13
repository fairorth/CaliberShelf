import { router } from "expo-router"
import { Plus } from "lucide-react-native"
import { Pressable, View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { WatchGrid } from "../../components/watch-grid"
import { useApp } from "../../lib/app-context"
import { color, TOUCH } from "../../theme"

/**
 * Collection (lite). Owned + coming soon for now; filters, sort and the wish
 * list come with step 5 (docs/iphone-app.md §6).
 */
export default function CollectionScreen() {
  const { watches, watchesLoading, watchesError, reloadWatches } = useApp()
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
      />
    </View>
  )
}
