import { router, Tabs } from "expo-router"
import { Camera, Ellipsis, LayoutGrid, Scale, Sun } from "lucide-react-native"
import { Pressable, StyleSheet, View } from "react-native"
import { color, text } from "../../theme"

/**
 * The five tabs (docs/iphone-app.md §1): Today · Collection · ◉ · Rate · More.
 * The centre is not a tab but the camera's front door — a raised brass button
 * that opens Identify full-screen over whatever tab you're on.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brass,
        tabBarInactiveTintColor: color.mutedForeground,
        tabBarLabelStyle: { fontSize: text.xxs, fontWeight: "600" },
        tabBarStyle: { backgroundColor: color.card, borderTopColor: color.border },
        sceneStyle: { backgroundColor: color.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: ({ color: c, size }) => <Sun color={c} size={size} aria-hidden /> }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          tabBarIcon: ({ color: c, size }) => <LayoutGrid color={c} size={size} aria-hidden />,
        }}
      />
      <Tabs.Screen
        name="camera-tab"
        options={{
          title: "",
          tabBarAccessibilityLabel: "Identify a watch with the camera",
          tabBarButton: () => (
            <View style={styles.cameraSlot}>
              <Pressable
                onPress={() => router.push({ pathname: "/camera", params: { mode: "identify" } })}
                style={({ pressed }) => [styles.cameraButton, pressed && { transform: [{ scale: 0.94 }] }]}
                accessibilityRole="button"
                accessibilityLabel="Identify a watch with the camera"
              >
                <Camera color={color.brassForeground} size={26} aria-hidden />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rate"
        options={{ title: "Rate", tabBarIcon: ({ color: c, size }) => <Scale color={c} size={size} aria-hidden /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color: c, size }) => <Ellipsis color={c} size={size} aria-hidden /> }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  cameraSlot: { flex: 1, alignItems: "center" },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -18,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: color.card,
  },
})
