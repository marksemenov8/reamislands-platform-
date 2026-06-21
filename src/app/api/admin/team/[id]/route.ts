import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type UpdatePayload = {
  role?: "admin" | "partner" | "user"
  partner_property_id?: string | null
  full_name?: string | null
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  const { id } = await params
  if (!id) return bad("missing user id")

  let body: UpdatePayload
  try {
    body = (await req.json()) as UpdatePayload
  } catch {
    return bad("invalid JSON body")
  }

  if (id === me.id && body.role && body.role !== me.role) {
    return bad("you cannot change your own role")
  }

  const { data: target, error: fetchErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role, partner_property_id, full_name")
    .eq("id", id)
    .single()
  if (fetchErr || !target) return bad("user not found", 404)

  const nextRole = body.role ?? target.role
  if (!["admin", "partner", "user"].includes(nextRole)) {
    return bad("role must be admin, partner or user")
  }

  if (target.role === "admin" && nextRole !== "admin") {
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return bad("cannot demote the last admin")
    }
  }

  const nextPropertyId =
    nextRole === "partner"
      ? body.partner_property_id ?? target.partner_property_id
      : null

  if (nextRole === "partner" && !nextPropertyId) {
    return bad("partner_property_id required when role=partner")
  }

  const update: Record<string, unknown> = {
    role: nextRole,
    partner_property_id: nextPropertyId,
  }
  if (body.full_name !== undefined) {
    update.full_name = body.full_name?.trim() || null
  }

  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", id)

  if (updateErr) return bad(`update failed: ${updateErr.message}`)

  return NextResponse.json({ success: true })
}
