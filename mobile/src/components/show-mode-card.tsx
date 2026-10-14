import { router } from "expo-router"
import { Camera } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import * as admiredQueue from "../lib/admired-queue"
import { useShowMode } from "../lib/show-mode"
import { color, radius, text } from "../theme"

/**
 * Today, while Show mode is on: the event, the way into Admired capture, and
 * the offline queue's state — so "is that shot safe?" is answerable at a
 * glance on a show floor with no signal.
 */
export function ShowModeCard() {
  const show = useShowMode()
  const [, tick] = useState(0)
  useEffect(() => admiredQueue.subscribe(() => tick((t) => t + 1)), [])
  if (!show.on) return null
  const q = admiredQueue.getStatus()

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>SHOW MODE</Text>
      <Text style={styles.title}>{show.event}</Text>
      <Text style={styles.body}>
        {q.pendingFrames === 0
          ? "Every frame is on the server."
          : q.online
            ? `${q.pendingFrames} frame${q.pendingFrames === 1 ? "" : "s"} sending…`
            : `${q.pendingFrames} frame${q.pendingFrames === 1 ? "" : "s"} saved on the phone — they send when you have signal.`}
        {q.lastError && q.pendingFrames > 0 ? ` (${q.lastError})` : ""}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
        onPress={() => router.push({ pathname: "/camera", params: { mode: "admired" } })}
      >
        <Camera color={color.brassForeground} size={20} aria-hidden />
        <Text style={styles.actionText}>Admire a watch</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 14,
    gap: 6,
  },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  title: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  body: { fontSize: text.xs, color: color.mutedForeground },
  action: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
