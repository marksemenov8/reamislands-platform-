import { createClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"

// Plain anon client — usable anywhere, no session refresh.
export const supabase = createClient(url, anonKey)

// Browser client for 'use client' components. Reads/writes cookies via document.cookie.
export function supabaseBrowser() {
  return createBrowserClient(url, anonKey)
}
