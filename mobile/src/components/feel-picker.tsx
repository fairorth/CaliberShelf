import * as Haptics from "expo-haptics"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { WEAR_FEELS, wearFeelLabels } from "@/lib/validations/keep"
import type { WearFeel } from "@/lib/validations/keep"
import { color, radius, text, TOUCH } from "../theme"

/**
 * Loved · Fine · Meh — how a wear felt (wear_logs.feel), the signal The Edit
 * counts from the first rating. Tapping the chosen one again clears it.
 * Labels and order come from the web's validations/keep.ts.
 */
export function FeelPicker({
  value,
  onChange,
  disabled,
}: {
  value: WearFeel | null
  onChange: (feel: WearFeel | null) => void
  disabled?: boolean
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="How did it feel?">
      {WEAR_FEELS.map((f) => {
        const active = value === f
        return (
          <Pressable
            key={f}
            disabled={disabled}
            onPress={() => {
              void Haptics.selectionAsync()
              onChange(active ? null : f)
            }}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{wearFeelLabels[f]}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  item: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center", backgroundColor: color.card },
  itemActive: { backgroundColor: color.brass },
  label: { fontSize: text.sm, color: color.foreground },
  labelActive: { color: color.brassForeground, fontWeight: "600" },
})
