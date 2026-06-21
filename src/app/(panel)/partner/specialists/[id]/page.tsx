import { notFound } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import SpecialistCardView, {
  type SpecialistDetail,
  type SpecialistGuestRow,
} from "./SpecialistCardView"

export const dynamic = "force-dynamic"

export default async function SpecialistCard({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await supabaseServer()

  const [specialistRes, guestsRes] = await Promise.all([
    sb
      .from("specialists")
      .select("id, name, role, cohort_focus, active, property_id, created_at")
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("specialist_guests")
      .select(
        "specialist_id, specialist_role_on_booking, user_id, guest_name, country, booking_id, pre_wbs, post_wbs, status, arrival, departure",
      )
      .eq("specialist_id", id)
      .order("arrival", { ascending: false }),
  ])

  if (!specialistRes.data) notFound()

  let propertyName: string | null = null
  if (specialistRes.data.property_id) {
    const { data: prop } = await sb
      .from("properties")
      .select("name, island, country")
      .eq("id", specialistRes.data.property_id)
      .maybeSingle()
    if (prop) propertyName = `${prop.name} — ${prop.island ?? ""}`.trim().replace(/—\s*$/, "")
  }

  return (
    <SpecialistCardView
      specialist={specialistRes.data as SpecialistDetail}
      propertyName={propertyName}
      guests={(guestsRes.data ?? []) as SpecialistGuestRow[]}
    />
  )
}
