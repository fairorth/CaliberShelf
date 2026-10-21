import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AppProvider, useApp } from "../lib/app-context"
import { color, radius, text, TOUCH } from "../theme"

/**
 * The app shell. Signed out, the only reachable screen is sign-in
 * (Stack.Protected); signed in, the tabs plus two full-screen routes — the
 * camera and a watch. The optional Face ID lock covers everything.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function Shell() {
  const { session, locked, tryUnlock } = useApp()

  if (session === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.brass} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.background } }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="camera" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          {/* Rate My Watches is LOCKED while a friend plays: full screen, no
              swipe-back — the only way out is Face ID (rate-game.tsx). */}
          <Stack.Screen name="rate-game" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
          <Stack.Screen
            name="add"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Add a watch",
              headerTintColor: color.brass,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.background },
            }}
          />
          <Stack.Screen
            name="wear/pick"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Worn today",
              headerTintColor: color.brass,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.background },
            }}
          />
          <Stack.Screen
            name="watch/[id]"
            options={{
              headerShown: true,
              title: "",
              headerBackTitle: "Back",
              headerTintColor: color.brass,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.background },
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>

      {locked && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.lockTitle}>TenTen is locked</Text>
          <Pressable style={styles.lockButton} onPress={() => void tryUnlock()}>
            <Text style={styles.lockButtonText}>Unlock with Face ID</Text>
          </Pressable>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: color.background,
  },
  lockTitle: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  lockButton: {
    minHeight: TOUCH,
    paddingHorizontal: 20,
    borderRadius: radius.control,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
  },
  lockButtonText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
