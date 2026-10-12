import { Pressable, StyleSheet, Text } from "react-native"
import { useApp } from "../lib/app-context"
import { color, radius, text, TOUCH } from "../theme"

/** "An update is ready · Restart" — shown once an over-the-air update has downloaded. */
export function UpdateBanner() {
  const { update } = useApp()
  if (update.state !== "ready") return null
  return (
    <Pressable style={styles.root} onPress={update.restart}>
      <Text style={styles.text}>An update is ready · Restart</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    minHeight: TOUCH,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: text.sm, fontWeight: "600", color: color.brass },
})
