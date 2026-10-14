import { Image } from "expo-image"
import { router } from "expo-router"
import { LayoutGrid, Plus, ScanEye, X } from "lucide-react-native"
import { useMemo, useState } from "react"
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { FeelPicker } from "../../components/feel-picker"
import { RecentStrip } from "../../components/recent-strip"
import { ScreenHeader } from "../../components/screen-header"
import { ShowModeCard } from "../../components/show-mode-card"
import { UpdateBanner } from "../../components/update-banner"
import { useApp } from "../../lib/app-context"
import { useWears } from "../../lib/use-wears"
import { dayLabel, lastSevenDays, logWear } from "../../lib/wear"
import type { WearEntry } from "../../lib/wear"
import type { PhoneWatch } from "../../lib/watches"
import { color, radius, text, TOUCH } from "../../theme"

/**
 * Today — the home tab (docs/iphone-app.md §2): what's on the wrist and how
 * it feels, the quickest ways to log a wear (camera, recent, collection),
 * and the last seven days, where a missed day is one tap to fill in.
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const { watches } = useApp()
  const w = useWears()
  const [openDay, setOpenDay] = useState<string | null>(null)

  const byId = useMemo(() => new Map((watches ?? []).map((x) => [x.id, x])), [watches])
  const todays = w.byDate.get(w.today) ?? []
  const recent = useMemo(
    () =>
      w.recentWatchIds
        .map((id) => byId.get(id))
        .filter((x): x is PhoneWatch => !!x && (x.status === "owned" || x.status === "coming"))
        .filter((x) => !todays.some((t) => t.watchId === x.id))
        .slice(0, 12),
    [w.recentWatchIds, byId, todays]
  )
  const days = lastSevenDays().reverse() // oldest left, today right

  async function wearNow(watch: PhoneWatch, date = w.today) {
    try {
      await logWear(watch.id, date)
      await w.reload()
    } catch (e) {
      Alert.alert("Couldn't log that wear", (e as Error).message)
    }
  }

  function pick(date: string) {
    router.push({ pathname: "/wear/pick", params: { date } })
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="Today" />
      <UpdateBanner />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void w.reload()} />}
      >
        {w.error && <Text style={styles.error}>{w.error}</Text>}

        <ShowModeCard />

        {/* On the wrist */}
        {todays.map((entry) => (
          <WearCard
            key={entry.id}
            entry={entry}
            watch={byId.get(entry.watchId)}
            onFeel={(f) => void w.changeFeel(entry.id, f)}
            onRemove={() => confirmRemove(entry, byId.get(entry.watchId), () => void w.remove(entry.id))}
          />
        ))}

        {todays.length === 0 && !w.loading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What are you wearing?</Text>
            <Text style={styles.cardBody}>Point the camera at it, or tap one you wore recently.</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: "/camera", params: { mode: "identify", intent: "wear" } })}
          >
            <ScanEye color={color.brassForeground} size={20} aria-hidden />
            <Text style={styles.actionText}>{todays.length ? "Wearing another" : "Identify it"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionOutline, pressed && { opacity: 0.85 }]}
            onPress={() => pick(w.today)}
          >
            <LayoutGrid color={color.foreground} size={20} aria-hidden />
            <Text style={styles.actionOutlineText}>Choose</Text>
          </Pressable>
        </View>

        <RecentStrip watches={recent} onPick={(watch) => void wearNow(watch)} title="WORN RECENTLY · TAP TO LOG TODAY" />

        {/* The last seven days */}
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text style={styles.eyebrow}>THIS WEEK</Text>
          <View style={styles.week}>
            {days.map((d) => {
              const entries = w.byDate.get(d) ?? []
              const first = entries[0] ? byId.get(entries[0].watchId) : undefined
              return (
                <Pressable
                  key={d}
                  style={styles.day}
                  onPress={() => (entries.length ? setOpenDay(d) : pick(d))}
                  accessibilityLabel={`${dayLabel(d, w.today)}: ${entries.length ? `${entries.length} worn` : "nothing logged"}`}
                >
                  <Text style={[styles.dayLabel, d === w.today && styles.dayLabelToday]}>
                    {dayLabel(d, w.today).slice(0, 3)}
                  </Text>
                  {first?.thumbUrl ? (
                    <Image source={{ uri: first.thumbUrl }} style={styles.dayThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.dayThumb, styles.dayEmpty]}>
                      {entries.length ? null : <Plus color={color.mutedForeground} size={16} aria-hidden />}
                    </View>
                  )}
                  {entries.length > 1 && <Text style={styles.dayCount}>+{entries.length - 1}</Text>}
                </Pressable>
              )
            })}
          </View>
        </View>
      </ScrollView>

      <DaySheet
        date={openDay}
        today={w.today}
        entries={openDay ? (w.byDate.get(openDay) ?? []) : []}
        byId={byId}
        onClose={() => setOpenDay(null)}
        onFeel={(id, f) => void w.changeFeel(id, f)}
        onRemove={(entry) => confirmRemove(entry, byId.get(entry.watchId), () => void w.remove(entry.id))}
        onAdd={(date) => {
          setOpenDay(null)
          pick(date)
        }}
      />
    </View>
  )
}

function confirmRemove(entry: WearEntry, watch: PhoneWatch | undefined, run: () => void) {
  Alert.alert(
    "Remove this wear?",
    `${watch ? `${watch.brand} ${watch.nickname || watch.model}` : "This watch"} on ${dayLabel(entry.date).toLowerCase()}.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: run },
    ]
  )
}

function WearCard({
  entry,
  watch,
  onFeel,
  onRemove,
}: {
  entry: WearEntry
  watch: PhoneWatch | undefined
  onFeel: (f: WearEntry["feel"]) => void
  onRemove: () => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.wearRow}>
        {watch?.thumbUrl ? (
          <Image source={{ uri: watch.thumbUrl }} style={styles.wearThumb} contentFit="cover" />
        ) : (
          <View style={[styles.wearThumb, { backgroundColor: color.surfacePhoto }]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ON THE WRIST</Text>
          <Text style={styles.brand}>{watch?.brand ?? ""}</Text>
          <Text style={styles.model} numberOfLines={2}>
            {watch ? watch.nickname || watch.model : "A watch no longer in your collection"}
          </Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel="Remove this wear" style={styles.removeButton}>
          <X color={color.mutedForeground} size={18} aria-hidden />
        </Pressable>
      </View>
      <Text style={styles.feelPrompt}>How does it feel?</Text>
      <FeelPicker value={entry.feel} onChange={onFeel} />
    </View>
  )
}

function DaySheet({
  date,
  today,
  entries,
  byId,
  onClose,
  onFeel,
  onRemove,
  onAdd,
}: {
  date: string | null
  today: string
  entries: WearEntry[]
  byId: Map<string, PhoneWatch>
  onClose: () => void
  onFeel: (id: string, f: WearEntry["feel"]) => void
  onRemove: (entry: WearEntry) => void
  onAdd: (date: string) => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={date != null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{date ? dayLabel(date, today) : ""}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={{ minHeight: TOUCH, justifyContent: "center" }}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          {entries.map((entry) => {
            const watch = byId.get(entry.watchId)
            return (
              <View key={entry.id} style={styles.card}>
                <View style={styles.wearRow}>
                  {watch?.thumbUrl ? (
                    <Image source={{ uri: watch.thumbUrl }} style={styles.sheetThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.sheetThumb, { backgroundColor: color.surfacePhoto }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brand}>{watch?.brand ?? ""}</Text>
                    <Text style={styles.model} numberOfLines={1}>
                      {watch ? watch.nickname || watch.model : "Removed watch"}
                    </Text>
                  </View>
                  <Pressable onPress={() => onRemove(entry)} hitSlop={10} accessibilityLabel="Remove this wear" style={styles.removeButton}>
                    <X color={color.mutedForeground} size={18} aria-hidden />
                  </Pressable>
                </View>
                <FeelPicker value={entry.feel} onChange={(f) => onFeel(entry.id, f)} />
              </View>
            )
          })}
          {date && (
            <Pressable style={styles.addAnother} onPress={() => onAdd(date)}>
              <Plus color={color.foreground} size={18} aria-hidden />
              <Text style={styles.actionOutlineText}>Add another watch</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  error: { fontSize: text.xs, color: color.destructive },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  cardBody: { fontSize: text.sm, color: color.mutedForeground },
  eyebrow: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  wearRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  wearThumb: { width: 88, height: 88, borderRadius: radius.control },
  brand: { fontSize: text.xs, color: color.mutedForeground, marginTop: 2 },
  model: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  removeButton: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  feelPrompt: { fontSize: text.xs, color: color.mutedForeground },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  actionOutline: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionOutlineText: { fontSize: text.sm, fontWeight: "600", color: color.foreground },
  week: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 4, minWidth: TOUCH },
  dayLabel: { fontSize: text.xxs, color: color.mutedForeground },
  dayLabelToday: { color: color.foreground, fontWeight: "700" },
  dayThumb: { width: 44, height: 44, borderRadius: radius.control },
  dayEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCount: { fontSize: text.xxs, color: color.mutedForeground },
  sheet: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  sheetTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  sheetThumb: { width: 56, height: 56, borderRadius: radius.control },
  done: { fontSize: text.sm, fontWeight: "600", color: color.brass },
  addAnother: {
    minHeight: TOUCH + 4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
})
