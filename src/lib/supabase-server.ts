import "server-only"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder"

// Service-role client — bypasses RLS. Use ONLY in:
//   - /api/intake (anonymous Cura webhook)
//   - admin server pages whose access is already gated by middleware
// New user-facing code MUST use supabaseServer() so RLS is enforced.
export const supabaseAdmin = createClient(url, serviceKey)

// Server-side client bound to the current request's auth cookie.
// Use in server components, route handlers, server actions.
// Next.js 16: cookies() is async.
export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component — cookies cannot be set here.
          // Proxy refreshes the session on each request, so this is non-fatal.
        }
      },
    },
  })
}
