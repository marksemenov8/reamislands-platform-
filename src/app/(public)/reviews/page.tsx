import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase-server"
import { ReviewCard, type Review } from "../_components/ReviewsSection"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("status", "published")
    .in("visibility", ["both", "en"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  const reviews = (data ?? []) as Review[]

  return (
    <div style={{ background: "#1C262A", minHeight: "100vh", paddingBottom: 80 }}>
      <div className="shell" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="eyebrow" style={{ color: "#AEE1C0", marginBottom: 12 }}>
          Guest reviews
        </div>
        <h1 className="display" style={{ color: "#fff", margin: "0 0 48px" }}>
          Guest Stories
        </h1>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {reviews.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", gridColumn: "1 / -1" }}>
              No reviews yet.
            </p>
          )}
        </div>
        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ color: "#AEE1C0", fontSize: 14 }}>
            ? Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
