import OverviewView from "../_components/OverviewView"
import { supabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

async function safeCount(table: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
  return count ?? 0
}

export default async function Overview() {
  const [propCount, progCount, userCount, bookCount] = await Promise.all([
    safeCount("properties").catch(() => 0),
    safeCount("programs").catch(() => 0),
    safeCount("users").catch(() => 0),
    safeCount("bookings").catch(() => 0),
  ])

  const stats = [
    { label: "Properties", value: propCount, hint: "wellness venues" },
    { label: "Programs", value: progCount, hint: "wellness packages" },
    { label: "Guests", value: userCount, hint: "intake leads" },
    { label: "Bookings", value: bookCount, hint: "scheduled stays" },
  ]

  const endpoints = [
    { method: "GET", path: "/rest/v1/properties" },
    { method: "GET", path: "/rest/v1/programs?cohort=eq.1" },
    { method: "POST", path: "/api/intake" },
    { method: "POST", path: "/rest/v1/bookings" },
  ]

  return <OverviewView stats={stats} endpoints={endpoints} />
}
