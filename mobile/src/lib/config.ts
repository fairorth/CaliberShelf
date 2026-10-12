/**
 * Build-time configuration. EXPO_PUBLIC_* values are inlined into the bundle
 * by Expo; they are set as EAS environment variables (`eas env:create`), not
 * committed. The Supabase anon key is public by design — the web app ships
 * the same key to every browser; RLS is what protects the data.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""

/** The deployed web app, whose /api routes the phone calls. */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE ?? "https://tentenloupe.vercel.app"
).replace(/\/$/, "")

export const configProblem: string | null =
  !SUPABASE_URL || !SUPABASE_ANON_KEY
    ? "This build is missing its Supabase settings (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)."
    : null
