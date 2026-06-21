import { supabaseServer } from "./supabase-server"

export type SessionUser = {
  id: string
  email: string
  role: "admin" | "partner" | "user"
  partner_property_id: string | null
  guest_user_id: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: guest }] = await Promise.all([
    sb
      .from("profiles")
      .select("role, partner_property_id")
      .eq("id", user.id)
      .single(),
    sb
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
  ])

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "user",
    partner_property_id: profile?.partner_property_id ?? null,
    guest_user_id: guest?.id ?? null,
  }
}

export async function requireRole(role: SessionUser["role"]): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user || user.role !== role) {
    throw new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
  return user
}
