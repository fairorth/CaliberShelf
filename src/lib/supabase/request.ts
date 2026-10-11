import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createClient as createCookieClient } from "@/lib/supabase/server"

/**
 * Auth for API routes that BOTH clients call: the web app (session cookie) and
 * the iPhone app (`Authorization: Bearer <supabase access token>`). See
 * docs/iphone-app.md §16.
 *
 * The phone cannot call Server Actions, and it has no cookie jar the web's
 * @supabase/ssr helpers understand — it holds the session supabase-js gave it
 * at sign-in and sends the access token. The returned client forwards that
 * token to PostgREST, so every query runs AS THE USER and RLS applies exactly
 * as it does for the web. No service role, ever: a route that needed one
 * would be a route the phone must not reach.
 *
 * Server Actions and Server Components keep using `@/lib/supabase/server`;
 * this is only for `route.ts` handlers the phone calls.
 */
export async function getRequestAuth(
  request: Request
): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const header = request.headers.get("authorization") ?? ""
  const match = /^Bearer\s+(.+)$/i.exec(header)

  if (!match) {
    const supabase = await createCookieClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return { supabase, user }
  }

  const token = match[1].trim()
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  )
  // getUser(token) asks Supabase Auth to verify the JWT — a forged or expired
  // token comes back as no user, never as a decoded-but-unchecked one.
  const {
    data: { user },
  } = await supabase.auth.getUser(token)
  return { supabase, user }
}
