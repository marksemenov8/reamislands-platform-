import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, reviews: data ?? [] })
}
