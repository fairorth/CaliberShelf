import { router } from "expo-router"
import { Camera, ScanEye } from "lucide-react-native"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { UpdateBanner } from "../../components/update-banner"
import { color, radius, text, TOUCH } from "../../theme"

/**
 * Today — the home tab. Wear logging (on the wrist + feel, the 7-day strip)
 * arrives in the next release with Add a watch; until then it offers the
 * two things the camera already does.
 */
export default function TodayScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="Today" />
      <UpdateBanner />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>COMING NEXT</Text>
          <Text style={styles.cardTitle}>What are you wearing?</Text>
          <Text style={styles.cardBody}>
            Wear logging lands here with Add a watch: today&rsquo;s watch, how it felt, and the week at a
            glance.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: "/camera", params: { mode: "identify" } })}
        >
          <ScanEye color={color.brassForeground} size={20} aria-hidden />
          <Text style={styles.actionText}>Identify a watch</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionOutline, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/collection")}
        >
          <Camera color={color.foreground} size={20} aria-hidden />
          <Text style={styles.actionOutlineText}>Photograph a watch</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 16,
    gap: 6,
  },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  cardTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  cardBody: { fontSize: text.sm, color: color.mutedForeground, lineHeight: 21 },
  action: {
    minHeight: 56,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  actionOutline: {
    minHeight: TOUCH + 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionOutlineText: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
})
