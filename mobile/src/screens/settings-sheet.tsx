import Constants from "expo-constants"
import { useEffect, useState } from "react"
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { canUseBiometrics, isLockEnabled, setLockEnabled, unlock } from "../lib/app-lock"
import { supabase } from "../lib/supabase"
import type { UpdateState } from "../lib/use-app-update"
import { color, radius, text, TOUCH } from "../theme"

interface SettingsSheetProps {
  visible: boolean
  email: string
  update: { state: UpdateState; check: () => void; restart: () => void; label: string }
  onClose: () => void
}

/**
 * Settings: the Face ID lock, updates, and Sign out — which lives HERE, off
 * the home screen, behind a confirmation, because signing out is rare and an
 * accidental tap costs a full sign-in.
 */
export function SettingsSheet({ visible, email, update, onClose }: SettingsSheetProps) {
  const insets = useSafeAreaInsets()
  const [lockOn, setLockOn] = useState(false)
  const [biometrics, setBiometrics] = useState<boolean | null>(null)

  useEffect(() => {
    if (!visible) return
    void isLockEnabled().then(setLockOn)
    void canUseBiometrics().then(setBiometrics)
  }, [visible])

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
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          onClose()
          void supabase.auth.signOut()
        },
      },
    ])
  }

  const version = Constants.expoConfig?.version ?? "?"

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.headerButton}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Face ID lock</Text>
              <Text style={styles.rowHint}>
                {biometrics === false
                  ? "Set up Face ID or a passcode on this iPhone first."
                  : "Ask for Face ID when TenTen opens or returns after a minute away."}
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
        </View>

        <View style={{ flex: 1 }} />

        <Text style={styles.email}>Signed in as {email}</Text>
        <Pressable style={styles.signOut} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  title: { fontSize: text.md, fontWeight: "600", color: color.foreground },
  headerButton: { minHeight: TOUCH, justifyContent: "center" },
  done: { fontSize: text.sm, fontWeight: "600", color: color.brass },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingHorizontal: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10 },
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
  email: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center" },
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
