export type Review = {
  id: string
  guest_name: string
  guest_title: string | null
  country: string | null
  text_en: string
  rating: number
  featured: boolean
}

function enOnly(s: string | null | undefined): string | null {
  if (!s) return null
  const parts = s.split(" / ")
  return parts.length > 1 ? (parts[1].trim() || parts[0].trim()) : s.trim()
}

export function ReviewCard({ review: r }: { review: Review }) {
  const name = enOnly(r.guest_name) ?? r.guest_name
  const title = enOnly(r.guest_title)

  return (
    <article
      style={{
        background: "#2C3336",
        borderRadius: 16,
        padding: "22px 22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <Stars rating={r.rating} />
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.88)" }}>
        &ldquo;{r.text_en}&rdquo;
      </p>
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{name}</div>
        {(title || r.country) && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>
            {[title, r.country].filter(Boolean).join(" ? ")}
          </div>
        )}
      </div>
    </article>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={16} height={16} viewBox="0 0 16 16"
          fill={i <= rating ? "#AEE1C0" : "rgba(255,255,255,.2)"}>
          <path d="M8 1.5l1.74 3.52 3.89.57-2.82 2.74.67 3.88L8 10.27l-3.48 1.94.67-3.88-2.82-2.74 3.89-.57z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const shown = reviews.filter((r) => r.featured).slice(0, 6)
  if (shown.length === 0) return null

  return (
    <section style={{ padding: "64px 0", background: "#1C262A" }}>
      <div className="shell">
        <div className="section-head" style={{ marginBottom: 32 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8, color: "#AEE1C0" }}>
              Guest reviews
            </div>
            <h2 style={{ color: "#fff", margin: 0 }}>
              Real stays,{" "}
              <span className="display-italic">real results</span>.
            </h2>
          </div>
          <a
            href="/reviews"
            style={{
              fontSize: 14,
              color: "#AEE1C0",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              alignSelf: "flex-end",
            }}
          >
            Read all stories ?
          </a>
        </div>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {shown.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </section>
  )
}
