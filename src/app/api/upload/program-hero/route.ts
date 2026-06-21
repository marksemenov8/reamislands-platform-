import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getSessionUser } from "@/lib/auth"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(req: Request) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") return bad("forbidden", 403)

  const formData = await req.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) return bad("file is required")
  if (!ALLOWED.has(file.type)) return bad(`unsupported type ${file.type}`)
  if (file.size > MAX_BYTES) return bad(`file too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)`)

  const programId = formData.get("program_id")
  const prefix = typeof programId === "string" && programId.length > 0 ? programId : "misc"

  const extFromName = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : null
  const extFromType = file.type.split("/")[1]
  const ext = (extFromName ?? extFromType ?? "jpg").replace(/[^a-z0-9]/g, "")

  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: upErr } = await supabaseAdmin.storage
    .from("program-heroes")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    })
  if (upErr) return bad(upErr.message, 500)

  const { data } = supabaseAdmin.storage.from("program-heroes").getPublicUrl(path)
  return NextResponse.json({ success: true, url: data.publicUrl, path })
}
