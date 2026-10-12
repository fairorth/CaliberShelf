import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import { AppState } from "react-native"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config"

/**
 * The phone's Supabase client: signs in as the owner, keeps the session on
 * the device, and runs every query AS THE USER — RLS protects the data
 * exactly as it does for the web. No service-role key ever ships here.
 */
export const supabase = createClient(SUPABASE_URL || "http://invalid.local", SUPABASE_ANON_KEY || "missing", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Refresh the session only while the app is in the foreground (the
// recommended React Native pattern — timers don't run reliably in background).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})

/** The current access token, for `Authorization: Bearer` on /api calls. */
export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
