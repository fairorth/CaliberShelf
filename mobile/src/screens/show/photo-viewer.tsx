import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { useEffect, useRef, useState } from "react"
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { admiredPhotoKindLabels } from "@/lib/validations/admired"
import * as admiredQueue from "../../lib/admired-queue"
import { fullFrameUrl } from "../../lib/show-data"
import type { ReviewPhoto, ReviewVendor } from "../../lib/show-data"
import { moveFrame, removeFrame } from "../../lib/show-session"
import { color, radius, text, TOUCH } from "../../theme"

/** Pinch up to 5× — past 1:1 on a 2000px frame, enough to judge a dial's sharpness. */
const MAX_ZOOM = 5

/**
 * The photo, full screen: swipe between the vendor's photos, PINCH IN to
 * check sharpness (while zoomed, a drag pans the photo instead of turning
 * the page), and fix it — move it to another watch, make it a Booth or Name
 * photo (a Name photo is read for the vendor's name), or delete it.
 */
export function PhotoViewer({
  vendor,
  photos,
  initialIndex,
  onClose,
}: {
  vendor: ReviewVendor
  photos: ReviewPhoto[]
  initialIndex: number
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const list = useRef<FlatList<ReviewPhoto>>(null)

  // A delete or move re-sorts the list under us: stay in range, close when empty.
  useEffect(() => {
    if (photos.length === 0) onClose()
    else if (index > photos.length - 1) setIndex(photos.length - 1)
  }, [photos.length, index, onClose])

  const photo = photos[Math.min(index, photos.length - 1)]
  if (!photo) return null
  const watchNumber = vendor.reviewWatches.find((w) => w.id === photo.watchId)?.number

  function move() {
    const targets: Array<{ label: string; to: Parameters<typeof moveFrame>[0]["to"] }> = []
    if (photo.kind !== "booth") targets.push({ label: "Booth photo", to: { kind: "booth" } })
    if (photo.kind !== "name") targets.push({ label: "Name photo (reads their name)", to: { kind: "name" } })
    for (const w of vendor.reviewWatches) {
      if (w.id !== photo.watchId) targets.push({ label: `Watch ${w.number}`, to: { kind: "watch", watchId: w.id } })
    }
    targets.push({ label: "A new watch", to: { kind: "watch", watchId: "new" } })
    ActionSheetIOS.showActionSheetWithOptions(
      { title: "Move this photo to…", options: [...targets.map((t) => t.label), "Cancel"], cancelButtonIndex: targets.length },
      (i) => {
        const t = targets[i]
        if (!t) return
        void Haptics.selectionAsync()
        moveFrame({ vendor, photoId: photo.photoId, to: t.to }).catch((e: Error) =>
          Alert.alert("Couldn't move it", e.message)
        )
      }
    )
  }

  function remove() {
    Alert.alert("Delete this photo?", "From this phone and the server.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeFrame(vendor.id, photo.photoId).catch((e: Error) => Alert.alert("Couldn't delete it", e.message))
        },
      },
    ])
  }

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.root}>
        <FlatList
          ref={list}
          data={photos}
          keyExtractor={(p) => p.photoId}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          initialScrollIndex={Math.min(initialIndex, photos.length - 1)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <ZoomablePhoto photo={item} width={width} height={height} onZoomChange={setZoomed} />
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.barButton}>
            <Text style={styles.barText}>Done</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.barText}>
              {index + 1} / {photos.length}
            </Text>
            <Text style={styles.barSub}>
              {photo.watchId ? `Watch ${watchNumber ?? ""}` : admiredPhotoKindLabels[photo.kind]}
              {photo.pending ? " · waiting to send" : ""}
            </Text>
          </View>
          <View style={styles.barButton} />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {photo.soft && <Text style={styles.soft}>Looked soft when it was shot — pinch in on the dial to check.</Text>}
          <View style={styles.actions}>
            <Pressable onPress={move} style={styles.action} accessibilityRole="button">
              <Text style={styles.barText}>Move…</Text>
            </Pressable>
            <Pressable onPress={remove} style={styles.action} accessibilityRole="button">
              <Text style={[styles.barText, { color: color.viewfinderError }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

/**
 * One page: the frame in a zooming ScrollView (iOS pinch-zoom, no native
 * module needed). The phone's own copy first — instant, and there with no
 * signal; if iOS has cleared it, the original from the server, or the bytes
 * still waiting in the upload queue.
 */
function ZoomablePhoto({
  photo,
  width,
  height,
  onZoomChange,
}: {
  photo: ReviewPhoto
  width: number
  height: number
  onZoomChange: (zoomed: boolean) => void
}) {
  const [uri, setUri] = useState<string | null>(photo.localUri)
  const [failed, setFailed] = useState(false)
  const triedLocal = useRef(false)
  const zoomedRef = useRef(false)

  async function fallback() {
    if (photo.storagePath) {
      const url = await fullFrameUrl(photo.storagePath)
      if (url) return setUri(url)
    }
    const queued = await admiredQueue.queuedImageUri(photo.photoId)
    if (queued) return setUri(queued)
    setFailed(true)
  }

  useEffect(() => {
    if (!photo.localUri) void fallback()
    // Resolve once per photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.photoId])

  return (
    <ScrollView
      style={{ width, height }}
      contentContainerStyle={{ width, height }}
      maximumZoomScale={MAX_ZOOM}
      minimumZoomScale={1}
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bouncesZoom
      scrollEventThrottle={64}
      onScroll={(e) => {
        const z = (e.nativeEvent.zoomScale ?? 1) > 1.01
        if (z !== zoomedRef.current) {
          zoomedRef.current = z
          onZoomChange(z)
        }
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          transition={100}
          onError={() => {
            if (!triedLocal.current && uri === photo.localUri) {
              triedLocal.current = true
              void fallback()
            } else setFailed(true)
          }}
        />
      ) : (
        <View style={[styles.center, { width, height }]}>
          <Text style={styles.barSub}>{failed ? "This photo couldn't be loaded." : "Loading…"}</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.viewfinder },
  center: { alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  barButton: { minWidth: 64, minHeight: TOUCH, justifyContent: "center" },
  barText: { color: color.viewfinderText, fontSize: text.sm, fontWeight: "600" },
  barSub: { color: "rgba(255,255,255,0.75)", fontSize: text.xxs, marginTop: 2 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  soft: { color: color.warning, fontSize: text.xs, textAlign: "center" },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
})
