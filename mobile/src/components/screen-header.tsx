import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { color, text } from "../theme"

/** A tab's title, under the status bar. Every page title is 26px (design system). */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: color.background,
  },
  title: { fontSize: text.lg, fontWeight: "600", color: color.foreground },
})
