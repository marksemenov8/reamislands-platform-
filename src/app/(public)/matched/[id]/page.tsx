import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-server"
import MatchedView, { type MatchedProgram } from "./MatchedView"

export const dynamic = "force-dynamic"

type RawPayload = {
  wbs_version?: number
  sub_scores?: {
    movement?: number
    recovery?: number
    lifestyle_risk?: number
    emotional?: number
  }
  recommendation?: string
  flags?: { cvd?: boolean; cancer?: boolean }
}

export default async function MatchedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, wbs_score, cohort, raw_payload, source, created_at")
    .eq("id", id)
    .maybeSingle()

  if (!user) notFound()

  const { data: programs } = await supabaseAdmin
    .from("programs")
    .select(
      "id, name, slug, summary, cohort, tier, duration_days, price_usd, outcomes, is_composite, hero_image_url, " +
        "program_properties(role, properties(name, island, country, contact_wa)), " +
        "program_variants(duration_days, duration_nights, price_basic_usd, active)",
    )
    .eq("cohort", user.cohort ?? 1)
    .eq("active", true)
    .eq("status", "published")
    .order("price_usd", { ascending: true })
    .limit(3)

  const raw = (user.raw_payload ?? {}) as RawPayload

  return (
    <MatchedView
      userId={user.id}
      name={user.name ?? null}
      wbsScore={user.wbs_score}
      cohort={user.cohort ?? null}
      recommendation={raw.recommendation ?? null}
      subScores={raw.sub_scores ?? {}}
      flags={raw.flags ?? {}}
      programs={(programs ?? []) as unknown as MatchedProgram[]}
    />
  )
}
