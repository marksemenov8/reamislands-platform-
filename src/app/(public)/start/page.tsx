import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import AssessmentView from "./AssessmentView"

export const dynamic = "force-dynamic"

export default async function StartPage() {
  const user = await getSessionUser()
  if (user?.role === "admin") redirect("/admin")
  if (user?.role === "partner") redirect("/partner")
  if (user?.role === "user") redirect("/me")

  return <AssessmentView />
}
