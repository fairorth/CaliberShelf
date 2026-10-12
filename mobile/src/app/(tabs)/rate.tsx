import { StyleSheet, Text, View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { color, radius, text } from "../../theme"

/** Rate — the swipe deck, "rate this one" and side-by-side head-to-head
 *  (docs/iphone-app.md §5) come after Add a watch and wear logging. */
export default function RateScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="Rate" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>COMING LATER</Text>
        <Text style={styles.title}>Keep, maybe or sell</Text>
        <Text style={styles.body}>
          Swipe through your watches — right to keep, left to sell, up for maybe — and rate the one in your
          hand. It feeds The Edit on the web.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 16,
    gap: 6,
  },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  title: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  body: { fontSize: text.sm, color: color.mutedForeground, lineHeight: 21 },
})
