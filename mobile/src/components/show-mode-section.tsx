import { useEffect, useState } from "react"
import { StyleSheet, Switch, Text, TextInput, View } from "react-native"
import { DEFAULT_SHOW_EVENT, setShowMode, useShowMode } from "../lib/show-mode"
import { color, radius, text, TOUCH } from "../theme"

/**
 * More → Show mode. While on, the camera button opens Admired capture and
 * every admired watch is stamped with the event below.
 */
export function ShowModeSection() {
  const show = useShowMode()
  const [event, setEvent] = useState(show.event)
  useEffect(() => setEvent(show.event), [show.event])

  function commitEvent() {
    const v = event.trim() || DEFAULT_SHOW_EVENT
    setEvent(v)
    if (v !== show.event) void setShowMode({ event: v })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.section}>SHOW MODE</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>At a watch show</Text>
          <Text style={styles.hint}>
            The camera button opens Admired: watches you admire but won&rsquo;t own, with their placards. Kept
            off the wish list.
          </Text>
        </View>
        <Switch
          value={show.on}
          onValueChange={(on) => void setShowMode({ on })}
          trackColor={{ true: color.brass, false: color.muted }}
        />
      </View>
      <View style={styles.divider} />
      <View style={styles.rowStack}>
        <Text style={styles.label}>Event</Text>
        <TextInput
          style={styles.input}
          value={event}
          onChangeText={setEvent}
          onBlur={commitEvent}
          onSubmitEditing={commitEvent}
          returnKeyType="done"
          maxLength={120}
          placeholder={DEFAULT_SHOW_EVENT}
          placeholderTextColor={color.mutedForeground}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingHorizontal: 14,
  },
  section: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground, paddingTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10 },
  rowStack: { paddingVertical: 12, gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.border },
  label: { fontSize: text.sm, color: color.foreground },
  hint: { fontSize: text.xs, color: color.mutedForeground, marginTop: 2 },
  input: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    fontSize: 16, // ≥16: iOS zooms smaller fields
    color: color.foreground,
    backgroundColor: color.background,
  },
})
