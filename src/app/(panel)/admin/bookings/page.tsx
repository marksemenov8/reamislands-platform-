import { supabaseAdmin } from "@/lib/supabase-server"
import BookingsView, {
  type BookingRow,
  type GuestOption,
  type ProgramOption,
} from "./BookingsView"

export const dynamic = "force-dynamic"

export default async function Bookings() {
  const [bookingsRes, guestsRes, programsRes] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select(
        "id, user_id, program_id, arrival, departure, pax, amount_usd, deposit_usd, status, pre_wbs, post_wbs, created_at, user:user_id(name, country), program:program_id(name, tier)"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("users")
      .select("id, name, country")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("programs")
      .select("id, name, cohort, tier, price_usd")
      .eq("active", true)
      .order("cohort")
      .order("duration_days"),
  ])

  const rows = (bookingsRes.data ?? []) as unknown as BookingRow[]
  const guests = (guestsRes.data ?? []) as GuestOption[]
  const programs = (programsRes.data ?? []) as ProgramOption[]

  return (
    <BookingsView
      rows={rows}
      guests={guests}
      programs={programs}
      errorMessage={bookingsRes.error?.message ?? null}
    />
  )
}
