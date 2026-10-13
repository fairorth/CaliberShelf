import * as Haptics from "expo-haptics"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { localDateIso } from "@/lib/dates"
import { WatchGrid } from "../../components/watch-grid"
import { useApp } from "../../lib/app-context"
import { dayLabel, logWear } from "../../lib/wear"
import type { PhoneWatch } from "../../lib/watches"
import { color } from "../../theme"

/**
 * /wear/pick?date=YYYY-MM-DD — choose the watch worn on a day (today by
 * default, or a day being filled in from the week strip). A photo grid, never
 * a text list; one tap logs it and returns.
 */
export default function PickWearScreen() {
  const insets = useSafeAreaInsets()
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>()
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : localDateIso()
  const { watches, watchesLoading, watchesError, reloadWatches } = useApp()
  const [saving, setSaving] = useState(false)

  async function choose(watch: PhoneWatch) {
    if (saving) return
    setSaving(true)
    try {
      await logWear(watch.id, date)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (e) {
      setSaving(false)
      Alert.alert("Couldn't log that wear", (e as Error).message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <Stack.Screen options={{ title: `Worn ${dayLabel(date).toLowerCase() === "today" ? "today" : `on ${dayLabel(date)}`}` }} />
      <WatchGrid
        watches={watches}
        loading={watchesLoading}
        error={watchesError}
        onRefresh={() => void reloadWatches()}
        onPick={(w) => void choose(w)}
        searchPlaceholder="Which watch?"
        bottomInset={insets.bottom}
      />
      {saving && (
        <View style={[StyleSheet.absoluteFill, styles.saving]}>
          <ActivityIndicator color={color.brass} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  saving: { alignItems: "center", justifyContent: "center", backgroundColor: color.scrim },
})
