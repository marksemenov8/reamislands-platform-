import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"
import { generatePassword } from "@/lib/password"

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  const { id } = await params
  if (!id) return bad("missing user id")

  const { data: target, error: fetchErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", id)
    .single()
  if (fetchErr || !target) return bad("user not found", 404)

  const password = generatePassword(16)

  const updateRes = await supabaseAdmin.auth.admin.updateUserById(id, {
    password,
  })
  if (updateRes.error) {
    return bad(`reset failed: ${updateRes.error.message}`)
  }

  await supabaseAdmin
    .from("profiles")
    .update({ password_set_by_admin: true })
    .eq("id", id)

  await supabaseAdmin.from("partner_password_resets").insert({
    user_id: id,
    reset_by: me.id,
    was_invite: false,
  })

  return NextResponse.json({ success: true, password })
}
