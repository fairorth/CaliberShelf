import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { Camera, Check, ImagePlus, X } from "lucide-react-native"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { localDateIso } from "@/lib/dates"
import type { PhoneOwnership } from "@/lib/validations/phone-watch"
import { addWatch } from "../lib/api"
import { useApp } from "../lib/app-context"
import { fetchAddFormData, matchBrand } from "../lib/catalog"
import type { AddFormData } from "../lib/catalog"
import { prepareFrame } from "../lib/images"
import { color, radius, text, TOUCH } from "../theme"

/** Upload size for the cover: the same 2000px every phone frame uses. */
const COVER_LONG_EDGE = 2000

const OWNERSHIP: Array<{ value: PhoneOwnership; label: string }> = [
  { value: "owned", label: "Owned" },
  { value: "coming", label: "Coming soon" },
  { value: "wish", label: "Wish list" },
]

/**
 * /add — Add a watch (docs/iphone-app.md §4). Usually reached from Identify's
 * "Not in your collection", arriving with the photo and the guess
 * pre-filled; also from Collection's +. Deliberately the web's quick-add
 * fields plus reference and box: measurements, movement, complications and
 * labels stay on the web's edit form. Target: under a minute.
 */
export default function AddWatchScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    photoUri?: string
    brand?: string
    model?: string
    reference?: string
    ownership?: string
  }>()
  const { reloadWatches } = useApp()

  const [form, setForm] = useState<AddFormData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(params.photoUri ?? null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [newBrand, setNewBrand] = useState<string | null>(null)
  const [brandPickerOpen, setBrandPickerOpen] = useState(false)
  const [model, setModel] = useState(params.model ?? "")
  const [reference, setReference] = useState(params.reference ?? "")
  // A reference that came from the photo is a GUESS until the owner touches
  // it — saved flagged ⚠ unverified, exactly like the web's spec autofill.
  const [referenceFromPhoto, setReferenceFromPhoto] = useState(!!params.reference)
  const [ownership, setOwnership] = useState<PhoneOwnership>(
    params.ownership === "wish" || params.ownership === "coming" ? params.ownership : "owned"
  )
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [price, setPrice] = useState("")
  // Defaults to today (the phone's local day): adding from the phone is
  // usually the day it arrives. Editable; not sent for wish list.
  const [purchaseDate, setPurchaseDate] = useState(localDateIso())
  const [box, setBox] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAddFormData()
      .then((data) => {
        setForm(data)
        // Pre-fill the brand from the guess: an existing brand by name, or
        // offered as a new one.
        const match = matchBrand(data.brands, params.brand)
        if (match) setBrandId(match.id)
        else if (params.brand) setNewBrand(params.brand.trim())
      })
      .catch((e: Error) => setLoadError(e.message))
    // Params are read once, at arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const brandName = useMemo(() => {
    if (brandId) return form?.brands.find((b) => b.id === brandId)?.name ?? null
    return newBrand
  }, [brandId, newBrand, form])

  const dateValid = ownership === "wish" || purchaseDate === "" || isRealDate(purchaseDate)
  const missing = [
    !brandName && "brand",
    !model.trim() && "model",
    !categoryId && "category",
    !dateValid && "a valid purchase date",
  ].filter(Boolean) as string[]

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 })
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri)
  }
  async function choosePhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 })
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri)
  }

  async function save() {
    if (missing.length || saving) return
    setSaving(true)
    try {
      let image_base64: string | undefined
      if (photoUri) {
        const prepared = await prepareFrame(photoUri, COVER_LONG_EDGE, { compress: 0.9, base64: true })
        image_base64 = prepared.base64
      }
      const cents = price.trim() ? Math.round(parseFloat(price.replace(/[^0-9.]/g, "")) * 100) : null
      const res = await addWatch({
        ...(brandId ? { brand_id: brandId } : { new_brand_name: newBrand ?? "" }),
        model: model.trim(),
        reference_number: reference.trim() || null,
        reference_unverified: !!reference.trim() && referenceFromPhoto,
        category_id: categoryId!,
        ownership,
        purchase_price_cents: cents != null && Number.isFinite(cents) ? cents : null,
        box: ownership === "wish" ? null : box,
        purchase_date: ownership === "wish" || !purchaseDate ? null : purchaseDate,
        ...(image_base64 ? { image_base64, media_type: "image/jpeg" as const } : {}),
      })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await reloadWatches()
      if (res.photoError) {
        Alert.alert("Watch added — photo didn't upload", `${res.photoError} Add it from the watch page.`)
      }
      router.replace({ pathname: "/watch/[id]", params: { id: res.watchId } })
    } catch (e) {
      setSaving(false)
      Alert.alert("Couldn't add the watch", (e as Error).message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <Stack.Screen options={{ title: ownership === "wish" ? "Add to wish list" : "Add a watch" }} />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {loadError && <Text style={styles.error}>{loadError}</Text>}

        {/* Photo */}
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="contain" />
            <Pressable style={styles.photoClear} onPress={() => setPhotoUri(null)} accessibilityLabel="Remove photo">
              <X color={color.foreground} size={18} aria-hidden />
            </Pressable>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <Pressable style={styles.photoButton} onPress={() => void takePhoto()}>
              <Camera color={color.foreground} size={22} aria-hidden />
              <Text style={styles.photoButtonText}>Take photo</Text>
            </Pressable>
            <Pressable style={styles.photoButton} onPress={() => void choosePhoto()}>
              <ImagePlus color={color.foreground} size={22} aria-hidden />
              <Text style={styles.photoButtonText}>Choose photo</Text>
            </Pressable>
          </View>
        )}

        {/* Ownership */}
        <Field label="Ownership">
          <Segmented
            options={OWNERSHIP}
            value={ownership}
            onChange={(v) => setOwnership(v)}
          />
        </Field>

        {/* Brand */}
        <Field label="Brand">
          <Pressable style={styles.input} onPress={() => setBrandPickerOpen(true)} disabled={!form}>
            <Text style={brandName ? styles.inputText : styles.placeholder}>
              {brandName ?? (form ? "Choose a brand" : "Loading…")}
              {newBrand && !brandId ? "  · new brand" : ""}
            </Text>
          </Pressable>
        </Field>

        {/* Model */}
        <Field label="Model">
          <TextInput
            style={[styles.input, styles.inputText]}
            value={model}
            onChangeText={setModel}
            placeholder="e.g. Black Bay 58"
            placeholderTextColor={color.mutedForeground}
            autoCorrect={false}
          />
        </Field>

        {/* Reference */}
        <Field
          label="Reference"
          note={referenceFromPhoto && reference.trim() ? "⚠ From the photo — saved as unverified" : "Optional"}
        >
          <TextInput
            style={[styles.input, styles.inputText]}
            value={reference}
            onChangeText={(t) => {
              setReference(t)
              setReferenceFromPhoto(false) // the owner has spoken
            }}
            placeholder="e.g. 79030B"
            placeholderTextColor={color.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </Field>

        {/* Category */}
        <Field label="Category">
          <View style={styles.chips}>
            {(form?.categories ?? []).map((c) => (
              <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </View>
        </Field>

        {/* Price */}
        <Field label={ownership === "wish" ? "Expected price" : "Purchase price"} note="Optional · USD">
          <TextInput
            style={[styles.input, styles.inputText]}
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            placeholderTextColor={color.mutedForeground}
            keyboardType="decimal-pad"
          />
        </Field>

        {/* Purchase date — not for wish list: it hasn't been bought */}
        {ownership !== "wish" && (
          <Field label="Purchase date" note={dateValid ? "YYYY-MM-DD" : "Use YYYY-MM-DD"}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[styles.input, styles.inputText, { flex: 1 }, !dateValid && styles.inputInvalid]}
                value={purchaseDate}
                onChangeText={(t) => setPurchaseDate(t.replace(/[^0-9-]/g, "").slice(0, 10))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={color.mutedForeground}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
              />
              <Chip label="Today" active={purchaseDate === localDateIso()} onPress={() => setPurchaseDate(localDateIso())} />
            </View>
          </Field>
        )}

        {/* Box — not for wish list: it isn't here to be stored */}
        {ownership !== "wish" && (form?.boxes.length ?? 0) > 0 && (
          <Field label="Box" note="Optional">
            <View style={styles.chips}>
              {form!.boxes.map((b) => (
                <Chip
                  key={b.label}
                  label={b.description ? `${b.label} · ${b.description}` : b.label}
                  active={box === b.label}
                  onPress={() => setBox(box === b.label ? null : b.label)}
                />
              ))}
            </View>
          </Field>
        )}

        <Pressable
          style={({ pressed }) => [styles.save, (missing.length > 0 || saving) && styles.saveDisabled, pressed && { opacity: 0.85 }]}
          onPress={() => void save()}
          disabled={missing.length > 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color={color.brassForeground} />
          ) : (
            <Text style={[styles.saveText, missing.length > 0 && styles.saveTextDisabled]}>
              {missing.length ? `Needs ${missing.join(", ")}` : ownership === "wish" ? "Add to wish list" : "Add watch"}
            </Text>
          )}
        </Pressable>
        <Text style={styles.footnote}>
          Measurements, movement, complications and labels: on the web&rsquo;s edit form, or ✨ Fill specs there.
        </Text>
      </ScrollView>

      <BrandPicker
        visible={brandPickerOpen}
        brands={form?.brands ?? []}
        selectedId={brandId}
        initialQuery={newBrand ?? ""}
        onClose={() => setBrandPickerOpen(false)}
        onPick={(b) => {
          if ("id" in b) {
            setBrandId(b.id)
            setNewBrand(null)
          } else {
            setBrandId(null)
            setNewBrand(b.newName)
          }
          setBrandPickerOpen(false)
        }}
      />
    </View>
  )
}

/** A real calendar day as YYYY-MM-DD (rejects 2026-02-31 and the like). */
function isRealDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.label}>{label}</Text>
        {note && <Text style={styles.note}>{note}</Text>}
      </View>
      {children}
    </View>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segmentItem, value === o.value && styles.segmentItemActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.value }}
        >
          <Text style={[styles.segmentText, value === o.value && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} hitSlop={4}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function BrandPicker({
  visible,
  brands,
  selectedId,
  initialQuery,
  onClose,
  onPick,
}: {
  visible: boolean
  brands: AddFormData["brands"]
  selectedId: string | null
  initialQuery: string
  onClose: () => void
  onPick: (b: { id: string } | { newName: string }) => void
}) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState(initialQuery)
  useEffect(() => {
    if (visible) setQuery(initialQuery)
  }, [visible, initialQuery])

  const q = query.trim().toLowerCase()
  const shown = q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands
  const exact = brands.some((b) => b.name.toLowerCase() === q)

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Brand</Text>
          <Pressable onPress={onClose} hitSlop={12} style={{ minHeight: TOUCH, justifyContent: "center" }}>
            <Text style={styles.done}>Cancel</Text>
          </Pressable>
        </View>
        <TextInput
          style={[styles.input, styles.inputText]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search or type a new brand"
          placeholderTextColor={color.mutedForeground}
          autoFocus
          autoCorrect={false}
        />
        <FlatList
          data={shown}
          keyExtractor={(b) => b.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            q && !exact ? (
              <Pressable style={styles.brandRow} onPress={() => onPick({ newName: query.trim() })}>
                <Text style={styles.brandNew}>Add “{query.trim()}” as a new brand</Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.brandRow} onPress={() => onPick({ id: item.id })}>
              <Text style={styles.inputText}>{item.name}</Text>
              {item.id === selectedId && <Check color={color.brass} size={18} aria-hidden />}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  error: { fontSize: text.xs, color: color.destructive },
  photo: { width: "100%", aspectRatio: 1, borderRadius: radius.card, backgroundColor: color.surfacePhoto },
  photoClear: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoButton: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.border,
    backgroundColor: color.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoButtonText: { fontSize: text.sm, color: color.foreground },
  label: { fontSize: text.xs, color: color.mutedForeground, fontWeight: "600" },
  note: { fontSize: text.xs, color: color.mutedForeground },
  input: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: color.card,
  },
  inputText: { fontSize: 16, color: color.foreground }, // ≥16: iOS zooms smaller fields
  inputInvalid: { borderColor: color.destructive },
  placeholder: { fontSize: 16, color: color.mutedForeground },
  segment: {
    flexDirection: "row",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center", backgroundColor: color.card },
  segmentItemActive: { backgroundColor: color.brass },
  segmentText: { fontSize: text.sm, color: color.foreground },
  segmentTextActive: { color: color.brassForeground, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: color.brass, borderColor: color.brass },
  chipText: { fontSize: text.xs, color: color.foreground },
  chipTextActive: { color: color.brassForeground, fontWeight: "600" },
  save: {
    minHeight: 52,
    borderRadius: radius.card,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveDisabled: { backgroundColor: color.muted },
  saveText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
  saveTextDisabled: { color: color.mutedForeground },
  footnote: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
  sheet: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  sheetTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  done: { fontSize: text.sm, fontWeight: "600", color: color.brass },
  brandRow: {
    minHeight: TOUCH + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  brandNew: { fontSize: 16, color: color.brass, fontWeight: "600" },
})
