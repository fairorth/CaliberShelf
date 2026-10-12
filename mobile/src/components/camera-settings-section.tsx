import { Minus, Plus } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native"
import {
  DEFAULT_CAMERA_SETTINGS,
  FOCUS_WAIT_MS,
  STEP_CHOICES,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
  useCameraSettings,
} from "../lib/camera-settings"
import { color, radius, text, TOUCH } from "../theme"

/**
 * More → Camera: the levers for the viewfinder's sharpness ring and the
 * focus-aware shutter. Watch the live "Sharpness" number in the camera, then
 * set the line here.
 */
export function CameraSettingsSection() {
  const { settings, loaded, update } = useCameraSettings()
  if (!loaded) return null

  const isDefault =
    settings.sharpAt === DEFAULT_CAMERA_SETTINGS.sharpAt &&
    settings.softBelow === DEFAULT_CAMERA_SETTINGS.softBelow &&
    settings.step === DEFAULT_CAMERA_SETTINGS.step &&
    settings.focusAwareShutter === DEFAULT_CAMERA_SETTINGS.focusAwareShutter

  return (
    <View style={styles.card}>
      <Text style={styles.section}>CAMERA</Text>

      <ThresholdRow
        label="Sharp at"
        hint="The ring turns white at this sharpness or above."
        value={settings.sharpAt}
        step={settings.step}
        onChange={(v) => void update({ sharpAt: v })}
      />
      <View style={styles.divider} />
      <ThresholdRow
        label="Soft below"
        hint="The ring turns amber again below this. Always under “Sharp at”."
        value={settings.softBelow}
        step={settings.step}
        onChange={(v) => void update({ softBelow: v })}
      />
      <View style={styles.divider} />

      <View style={styles.rowStack}>
        <Text style={styles.label}>Step size</Text>
        <Text style={styles.hint}>How far one tap of − or + moves a number.</Text>
        <View style={styles.segment}>
          {STEP_CHOICES.map((c) => (
            <Pressable
              key={c}
              onPress={() => void update({ step: c })}
              style={[styles.segmentItem, settings.step === c && styles.segmentItemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.step === c }}
            >
              <Text style={[styles.segmentText, settings.step === c && styles.segmentTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Focus-aware shutter</Text>
          <Text style={styles.hint}>
            Pressed while the ring is amber, wait up to {(FOCUS_WAIT_MS / 1000).toFixed(1)} s for focus,
            then shoot the instant it turns white.
          </Text>
        </View>
        <Switch
          value={settings.focusAwareShutter}
          onValueChange={(v) => void update({ focusAwareShutter: v })}
          trackColor={{ true: color.brass, false: color.muted }}
        />
      </View>

      {!isDefault && (
        <>
          <View style={styles.divider} />
          <Pressable style={styles.resetRow} onPress={() => void update(DEFAULT_CAMERA_SETTINGS)}>
            <Text style={styles.reset}>
              Reset to defaults ({DEFAULT_CAMERA_SETTINGS.sharpAt} / {DEFAULT_CAMERA_SETTINGS.softBelow}, step{" "}
              {DEFAULT_CAMERA_SETTINGS.step})
            </Text>
          </Pressable>
        </>
      )}
    </View>
  )
}

function ThresholdRow({
  label,
  hint,
  value,
  step,
  onChange,
}: {
  label: string
  hint: string
  value: number
  step: number
  onChange: (v: number) => void
}) {
  // Typing edits a draft; it commits on blur/submit, so a half-typed number
  // never saves (and "Soft below" can't be pushed over "Sharp at" mid-typing).
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const n = parseInt(draft, 10)
    if (Number.isFinite(n)) onChange(n)
    else setDraft(String(value))
  }

  return (
    <View style={styles.rowStack}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(Math.max(THRESHOLD_MIN, value - step))}
          accessibilityLabel={`${label}: decrease by ${step}`}
          hitSlop={4}
        >
          <Minus color={color.foreground} size={18} aria-hidden />
        </Pressable>
        <TextInput
          style={styles.value}
          value={draft}
          onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ""))}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={String(THRESHOLD_MAX).length}
          selectTextOnFocus
          accessibilityLabel={label}
        />
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(Math.min(THRESHOLD_MAX, value + step))}
          accessibilityLabel={`${label}: increase by ${step}`}
          hitSlop={4}
        >
          <Plus color={color.foreground} size={18} aria-hidden />
        </Pressable>
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
  rowStack: { paddingVertical: 12, gap: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.border },
  label: { fontSize: text.sm, color: color.foreground },
  hint: { fontSize: text.xs, color: color.mutedForeground },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  stepButton: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.background,
  },
  value: {
    flex: 1,
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    textAlign: "center",
    fontSize: 16, // ≥16: iOS zooms smaller fields
    fontVariant: ["tabular-nums"],
    color: color.foreground,
    backgroundColor: color.background,
  },
  segment: {
    flexDirection: "row",
    marginTop: 8,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center" },
  segmentItemActive: { backgroundColor: color.brass },
  segmentText: { fontSize: text.sm, color: color.foreground, fontVariant: ["tabular-nums"] },
  segmentTextActive: { color: color.brassForeground, fontWeight: "600" },
  resetRow: { minHeight: TOUCH, justifyContent: "center" },
  reset: { fontSize: text.sm, color: color.brass, fontWeight: "600" },
})
