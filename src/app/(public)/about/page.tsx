import Link from "next/link"
import { Icon } from "../_components/Icon"

export const dynamic = "force-dynamic"

const WHAT_WE_DO: Array<[string, string]> = [
  ["Baseline first", "Every guest starts with a 22-question wellness score. No assumptions."],
  ["Composite & focused", "Choose a multi-system reset or zero in on sleep, weight, or longevity."],
  ["Human handoff", "A real coordinator on WhatsApp from inquiry through arrival and beyond."],
  ["No upsell loop", "One transparent price, full inclusions, and a clear protocol on paper."],
]

const LOCATIONS: Array<{ flag: string; place: string; note: string }> = [
  { flag: "🇮🇩", place: "Bintan", note: "Sea-facing villas" },
  { flag: "🇮🇩", place: "Bali · Ubud", note: "Jungle, springs" },
  { flag: "🇹🇭", place: "Phuket", note: "Coastal compound" },
  { flag: "🇹🇭", place: "Koh Samui", note: "Quiet north shore" },
  { flag: "🇸🇬", place: "Sentosa", note: "Urban edge" },
]

export default function AboutPage() {
  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <section className="shell" style={{ paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>About Dream Islands</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px, 10vw, 72px)", margin: "0 0 24px", color: "var(--ink)" }}
        >
          A wellness <span className="display-italic">operating system</span>.
        </h1>
        <p className="body-lg" style={{ marginBottom: 32, maxWidth: 760 }}>
          We are a small team building retreats and protocols across Indonesia, Thailand and
          Singapore. Our work sits between travel and clinical practice — measurable inputs,
          restorative environments, real outcomes.
        </p>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>What we do differently</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
            {WHAT_WE_DO.map(([t, b]) => (
              <li key={t} style={{ display: "flex", gap: 14 }}>
                <span
                  style={{
                    minWidth: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "var(--accent)",
                    marginTop: 8,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{t}</div>
                  <div className="body-sm">{b}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Where we host</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {LOCATIONS.map((l) => (
              <div
                key={l.place}
                style={{ padding: "12px 14px", borderRadius: 14, background: "var(--surface)" }}
              >
                <div style={{ fontSize: 22 }}>{l.flag}</div>
                <div style={{ fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{l.place}</div>
                <div className="body-sm">{l.note}</div>
              </div>
            ))}
          </div>
        </div>

        <h2
          style={{
            margin: "48px 0 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 36,
            letterSpacing: "-.02em",
            color: "var(--ink)",
          }}
        >
          Talk to us <span className="display-italic">directly</span>.
        </h2>
        <p className="body" style={{ marginBottom: 20 }}>
          We&apos;ll WhatsApp you within one business day. No spam, no list resale.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 380 }}>
          <a
            className="btn btn-primary btn-lg btn-block"
            href="https://wa.me/message/HOF2AFIBDYY5J1"
            target="_blank"
            rel="noreferrer"
          >
            <Icon.wa width={18} height={18} /> Message on WhatsApp
          </a>
          <a className="btn btn-ghost btn-lg btn-block" href="mailto:hello@dreamislands.org">
            hello@dreamislands.org
          </a>
          <Link className="btn btn-soft btn-block" href="/start">
            Or take the 5-minute baseline <Icon.arrow width={16} height={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
