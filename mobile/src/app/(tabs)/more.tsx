import Constants from "expo-constants"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import { ScreenHeader } from "../../components/screen-header"
import { useApp } from "../../lib/app-context"
import { canUseBiometrics, isLockEnabled, setLockEnabled, unlock } from "../../lib/app-lock"
import { API_BASE } from "../../lib/config"
import { supabase } from "../../lib/supabase"
import { color, radius, text, TOUCH } from "../../theme"

/**
 * More: the Face ID lock, updates, the web app, and Sign out — which lives
 * HERE, at the bottom, behind a confirmation, because signing out is rare and
 * an accidental tap costs a full sign-in.
 */
export default function MoreScreen() {
  const { session, update } = useApp()
  const [lockOn, setLockOn] = useState(false)
  const [biometrics, setBiometrics] = useState<boolean | null>(null)

  useFocusEffect(
    useCallback(() => {
      void isLockEnabled().then(setLockOn)
      void canUseBiometrics().then(setBiometrics)
    }, [])
  )

  async function toggleLock(next: boolean) {
    // Turning it on proves Face ID works first, so you can't lock yourself
    // behind a lock that won't open.
    if (next && !(await unlock("Turn on Face ID lock"))) return
    await setLockEnabled(next)
    setLockOn(next)
  }

  function confirmSignOut() {
    Alert.alert("Sign out of TenTen?", "You'll need your email and password to sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void supabase.auth.signOut() },
    ])
  }

  const version = Constants.expoConfig?.version ?? "?"

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Face ID lock</Text>
              <Text style={styles.rowHint}>
                {biometrics === false
                  ? "Set up Face ID or a passcode on this iPhone first."
                  : "Ask for Face ID when TenTen opens, or returns after a minute away."}
              </Text>
            </View>
            <Switch
              value={lockOn}
              onValueChange={(v) => void toggleLock(v)}
              disabled={biometrics === false}
              trackColor={{ true: color.brass, false: color.muted }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Version {version}</Text>
              <Text style={styles.rowHint}>{update.label}</Text>
            </View>
            {update.state === "ready" ? (
              <Pressable onPress={update.restart} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Restart to update</Text>
              </Pressable>
            ) : (
              <Pressable onPress={update.check} style={styles.smallButton} disabled={update.state === "checking"}>
                <Text style={styles.smallButtonText}>
                  {update.state === "checking" ? "Checking…" : update.state === "current" ? "Up to date" : "Check"}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={() => void Linking.openURL(API_BASE)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Open TenTenLoupe on the web</Text>
              <Text style={styles.rowHint}>Reports, Market, The Edit and everything else</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.email}>Signed in as {session?.user.email ?? ""}</Text>
        <Pressable style={styles.signOut} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingHorizontal: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.border },
  rowLabel: { fontSize: text.sm, color: color.foreground },
  rowHint: { fontSize: text.xs, color: color.mutedForeground, marginTop: 2 },
  smallButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    justifyContent: "center",
  },
  smallButtonText: { fontSize: text.xs, color: color.foreground },
  email: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center", marginTop: 24 },
  signOut: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.card,
  },
  signOutText: { fontSize: text.sm, fontWeight: "600", color: color.destructive },
})
