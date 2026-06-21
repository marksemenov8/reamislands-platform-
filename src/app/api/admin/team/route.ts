import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { generatePassword } from "@/lib/password"

type InvitePayload = {
  email?: string
  role?: "admin" | "partner" | "user"
  partner_property_id?: string | null
  full_name?: string | null
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  let body: InvitePayload
  try {
    body = (await req.json()) as InvitePayload
  } catch {
    return bad("invalid JSON body")
  }

  const email = (body.email ?? "").trim().toLowerCase()
  const role: "admin" | "partner" | "user" = body.role ?? "partner"
  const propertyId = body.partner_property_id ?? null
  const fullName = body.full_name?.trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("valid email required")
  }
  if (!["admin", "partner", "user"].includes(role)) {
    return bad("role must be admin, partner or user")
  }
  if (role === "partner" && !propertyId) {
    return bad("partner_property_id required when role=partner")
  }

  const password = generatePassword(16)

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  })
  if (created.error || !created.data.user) {
    return bad(created.error?.message ?? "failed to create user")
  }
  const userId = created.data.user.id

  const profileUpdate: Record<string, unknown> = {
    role,
    partner_property_id: role === "partner" ? propertyId : null,
    full_name: fullName,
    password_set_by_admin: true,
  }

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)

  if (profileErr) {
    return bad(`profile update failed: ${profileErr.message}`)
  }

  await supabaseAdmin.from("partner_password_resets").insert({
    user_id: userId,
    reset_by: me.id,
    was_invite: true,
  })

  return NextResponse.json({
    success: true,
    user: { id: userId, email, role, partner_property_id: propertyId, full_name: fullName },
    password,
  })
}
