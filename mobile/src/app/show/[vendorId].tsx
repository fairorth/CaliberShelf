import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { Camera, CloudUpload } from "lucide-react-native"
import { useState } from "react"
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { admiredPhotoKindLabels } from "@/lib/validations/admired"
import { vendorSections, vendorTitle } from "../../lib/show-data"
import { removeVendor, renameVendor, resumeVendor } from "../../lib/show-session"
import { useShowMode } from "../../lib/show-mode"
import { PhotoViewer } from "../../screens/show/photo-viewer"
import { useShowReview } from "../../screens/show/use-show-review"
import { color, radius, text, TOUCH } from "../../theme"

const GUTTER = 16
const GAP = 6
const COLUMNS = 3

/**
 * ONE VENDOR — check the photos (tap one, pinch in: is the dial sharp?),
 * fix them (move to another watch, change Watch ↔ Booth ↔ Name, delete),
 * name the vendor, or go back to shooting there. Works with no signal: the
 * phone's own copies stand in for anything not yet sent.
 */
export default function VendorScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const show = useShowMode()
  const { vendors, loading, refresh } = useShowReview(show.event)
  const vendor = vendors.find((v) => v.id === vendorId)
  const [viewing, setViewing] = useState<number | null>(null)

  if (!vendor) {
    return (
      <View style={styles.missing}>
        <Text style={styles.meta}>{loading ? "Loading…" : "This vendor isn't here any more."}</Text>
      </View>
    )
  }
  const v = vendor
  const sections = vendorSections(v)
  const ordered = sections.flatMap((s) => s.photos)
  const tile = Math.floor((width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS)

  function rename() {
    Alert.prompt(
      "Vendor name",
      "As it should appear on the web — the brand or the watchmaker.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: (value?: string) => renameVendor(v, value ?? "") },
      ],
      "plain-text",
      v.name ?? ""
    )
  }

  function shootMore() {
    void Haptics.selectionAsync()
    resumeVendor(v)
    router.dismissTo({ pathname: "/camera", params: { mode: "admired" } })
  }

  function confirmDelete() {
    const watches = v.reviewWatches.length
    Alert.alert(
      `Delete ${vendorTitle(v)}?`,
      `Deletes the vendor, ${watches} watch${watches === 1 ? "" : "es"} and all ${v.photos.length} photo${v.photos.length === 1 ? "" : "s"}, on this phone and on the server. This can't be undone.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void removeVendor(
              v.id,
              v.reviewWatches.map((w) => w.id),
              v.photos.map((p) => p.photoId)
            )
            router.back()
          },
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <Stack.Screen
        options={{
          title: vendorTitle(v),
          headerRight: () => (
            <Pressable onPress={rename} hitSlop={10} accessibilityLabel="Rename this vendor">
              <Text style={styles.headerLink}>{v.name ? "Rename" : "Name"}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 96 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refresh()} tintColor={color.brass} />}
      >
        {!v.name && (
          <Text style={styles.meta}>
            {v.namePending
              ? "Their Name photo is on its way — the name fills in once it's read."
              : "No name yet. Tap Name, or shoot their sign with the Name shot."}
          </Text>
        )}

        {sections.map((s) => (
          <View key={s.key} style={{ gap: 8 }}>
            <Text style={styles.section}>{s.title.toUpperCase()}</Text>
            <View style={styles.grid}>
              {s.photos.map((p) => (
                <Pressable
                  key={p.photoId}
                  onPress={() => setViewing(ordered.indexOf(p))}
                  style={[styles.tile, { width: tile, height: tile }]}
                  accessibilityLabel={`${admiredPhotoKindLabels[p.kind]} photo${p.soft ? ", looked soft when shot" : ""}${p.pending ? ", waiting to send" : ""}`}
                >
                  {p.thumbUri && <Image source={{ uri: p.thumbUri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                  {p.soft && <View style={styles.softDot} />}
                  {p.pending && (
                    <View style={styles.pendingBadge}>
                      <CloudUpload color={color.foreground} size={12} aria-hidden />
                    </View>
                  )}
                  {(p.kind === "name" || p.kind === "placard") && (
                    <Text style={styles.kindLabel}>{admiredPhotoKindLabels[p.kind]}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {sections.length === 0 && <Text style={styles.meta}>No photos here yet.</Text>}

        <Pressable onPress={confirmDelete} style={styles.danger} accessibilityRole="button">
          <Text style={styles.dangerText}>Delete this vendor</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]} onPress={shootMore}>
          <Camera color={color.brassForeground} size={20} aria-hidden />
          <Text style={styles.primaryText}>Shoot more here</Text>
        </Pressable>
      </View>

      {viewing !== null && (
        <PhotoViewer vendor={v} photos={ordered} initialIndex={viewing} onClose={() => setViewing(null)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { padding: GUTTER, gap: 18 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.background },
  headerLink: { fontSize: text.sm, fontWeight: "600", color: color.brass },
  meta: { fontSize: text.xs, color: color.mutedForeground },
  section: { fontSize: text.xxs, letterSpacing: 1.4, color: color.mutedForeground },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: { borderRadius: radius.control, overflow: "hidden", backgroundColor: color.surfacePhoto },
  softDot: {
    position: "absolute",
    left: 6,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: color.warning,
    borderWidth: 1.5,
    borderColor: color.card,
  },
  pendingBadge: {
    position: "absolute",
    right: 6,
    top: 6,
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: color.scrim,
  },
  kindLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 2,
    fontSize: text.xxs,
    textAlign: "center",
    color: color.foreground,
    backgroundColor: color.scrim,
  },
  danger: { minHeight: TOUCH, alignItems: "center", justifyContent: "center", marginTop: 8 },
  dangerText: { fontSize: text.sm, color: color.destructive },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: color.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  primary: {
    minHeight: TOUCH + 8,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
