import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { configProblem } from "../lib/config"
import { supabase } from "../lib/supabase"
import { color, radius, text, TOUCH } from "../theme"

/** Your existing TenTenLoupe account — the same Supabase sign-in as the web. */
export function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(configProblem)

  async function submit() {
    if (configProblem) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (err) setError(err.message)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>TenTen</Text>
        <Text style={styles.sub}>Sign in with your TenTenLoupe account</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={color.mutedForeground}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={color.mutedForeground}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={() => void submit()}
          disabled={busy || !email || !password}
        >
          {busy ? (
            <ActivityIndicator color={color.brassForeground} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: color.background },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: text.lg, fontWeight: "600", color: color.foreground, textAlign: "center" },
  sub: { fontSize: text.xs, color: color.mutedForeground, textAlign: "center", marginBottom: 4 },
  input: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 12,
    fontSize: 16, // ≥16: iOS zooms smaller fields
    color: color.foreground,
    backgroundColor: color.background,
  },
  error: { fontSize: text.xs, color: color.destructive },
  button: {
    minHeight: TOUCH,
    borderRadius: radius.control,
    backgroundColor: color.brass,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: { fontSize: text.sm, fontWeight: "600", color: color.brassForeground },
})
