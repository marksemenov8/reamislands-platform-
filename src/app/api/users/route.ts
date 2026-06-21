import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

type CreateUserPayload = {
  name?: string
  country?: string
  email?: string
  whatsapp?: string
  wbs_score?: number
  cohort?: number
  source?: string
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403, headers: cors }
    )
  }
  let payload: CreateUserPayload
  try {
    payload = (await req.json()) as CreateUserPayload
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid JSON body" },
      { status: 400, headers: cors }
    )
  }

  const name = payload.name?.trim()
  if (!name) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400, headers: cors }
    )
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      name,
      country: payload.country?.trim() || null,
      email: payload.email?.trim() || null,
      whatsapp: payload.whatsapp?.trim() || null,
      wbs_score: payload.wbs_score ?? null,
      cohort: payload.cohort ?? null,
      source: payload.source ?? "manual",
    })
    .select("id, name, country")
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400, headers: cors }
    )
  }

  return NextResponse.json({ success: true, user: data }, { headers: cors })
}
