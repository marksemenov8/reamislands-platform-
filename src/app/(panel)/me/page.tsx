import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import MeView, { type MeBooking, type MeProfile } from "./MeView"

export const dynamic = "force-dynamic"

type DbBooking = {
  id: string
  user_id: string
  program_id: string | null
  arrival: string | null
  departure: string | null
  pax: number | null
  status: string
  pre_wbs: number | null
  post_wbs: number | null
  created_at: string
}

type DbProgram = {
  id: string
  name: string
  tier: string | null
  duration_days: number | null
  price_usd: number | null
}

export default async function MePage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role === "admin") redirect("/admin")
  if (user.role === "partner") redirect("/partner")

  // If logged in but no public.users row linked yet — show empty state
  let profile: MeProfile | null = null
  let bookings: MeBooking[] = []

  if (user.guest_user_id) {
    const [guestRes, bookingsRes] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, name, email, whatsapp, country, wbs_score, cohort, source, created_at")
        .eq("id", user.guest_user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("bookings")
        .select("id, user_id, program_id, arrival, departure, pax, status, pre_wbs, post_wbs, created_at")
        .eq("user_id", user.guest_user_id)
        .order("arrival", { ascending: false }),
    ])

    if (guestRes.data) {
      profile = {
        id: guestRes.data.id,
        name: guestRes.data.name,
        email: guestRes.data.email,
        whatsapp: guestRes.data.whatsapp,
        country: guestRes.data.country,
        wbs_score: guestRes.data.wbs_score,
        cohort: guestRes.data.cohort,
        source: guestRes.data.source,
        created_at: guestRes.data.created_at,
      }
    }

    const rawBookings = (bookingsRes.data ?? []) as DbBooking[]
    const programIds = Array.from(new Set(rawBookings.map((b) => b.program_id).filter((x): x is string => !!x)))
    let programsById = new Map<string, DbProgram>()
    if (programIds.length > 0) {
      const { data: programs } = await supabaseAdmin
        .from("programs")
        .select("id, name, tier, duration_days, price_usd")
        .in("id", programIds)
      programsById = new Map(((programs ?? []) as DbProgram[]).map((p) => [p.id, p]))
    }
    bookings = rawBookings.map((b) => {
      const p = b.program_id ? programsById.get(b.program_id) : null
      return {
        id: b.id,
        program_id: b.program_id,
        program_name: p?.name ?? null,
        program_tier: p?.tier ?? null,
        duration_days: p?.duration_days ?? null,
        arrival: b.arrival,
        departure: b.departure,
        pax: b.pax,
        status: b.status,
        pre_wbs: b.pre_wbs,
        post_wbs: b.post_wbs,
      }
    })
  }

  return <MeView email={user.email} profile={profile} bookings={bookings} />
}
