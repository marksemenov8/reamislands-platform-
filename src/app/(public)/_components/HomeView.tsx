import Link from "next/link"
import { COHORT_LABELS, HOW_IT_WORKS, TRACKS, type LandingProgram } from "../_lib/programMapping"
import { Icon } from "./Icon"
import ProgramCard from "./ProgramCard"
import ProgramImage from "./ProgramImage"
import ReviewsSection, { type Review } from "./ReviewsSection"

export default function HomeView({ programs, reviews }: { programs: LandingProgram[]; reviews: Review[] }) {
  const featured = programs[0]
  const firstWa = programs.find((p) => p.contact_wa)?.contact_wa ?? null
  const waHref = firstWa ? `https://wa.me/${firstWa.replace(/[^0-9]/g, "")}` : "https://wa.me/"

  return (
    <div className="page" style={{ paddingBottom: 120, position: "relative", overflow: "hidden" }}>
      <div className="blob" style={{ width: 380, height: 380, background: "var(--accent-soft)", top: -120, right: -120 }} />
      <div className="blob" style={{ width: 320, height: 320, background: "var(--accent)", opacity: 0.12, top: 320, left: -160 }} />

      {/* HERO */}
      <section className="shell rise" style={{ position: "relative", zIndex: 1, paddingTop: 12 }}>
        <div style={{ display: "grid", gap: 28 }} className="hero-grid">
          <div className="rise rise-1">
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Wellness travel ? Southeast Asia
            </div>
            <h1
              className="display"
              style={{ margin: 0, fontSize: "clamp(48px, 13vw, 96px)", color: "var(--ink)" }}
            >
              Reset, rebuilt as{" "}
              <span className="display-italic" style={{ color: "var(--accent)" }}>a place</span>.
            </h1>
            <p className="body-lg" style={{ marginTop: 22, maxWidth: 460 }}>
              We score your wellbeing across movement, recovery, lifestyle and emotional health ?
              then match you to a retreat that actually moves the number.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link href="/start" className="btn btn-primary btn-lg">
                Take the Wellness Baseline
                <Icon.arrow width={18} height={18} />
              </Link>
              <Link href="/programs" className="btn btn-ghost btn-lg">
                Browse programs
              </Link>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 32, color: "var(--ink-3)", fontSize: 13 }}>
              <Stat n="22" sub="questions ? 5 min" />
              <Stat n={String(programs.length)} sub="matched programs" />
              <Stat n="0" sub="sales pressure" />
            </div>
          </div>

          {featured && (
            <div className="rise rise-2">
              <div className="hero-image">
                <ProgramImage
                  url={featured.hero_image_url}
                  cohort={featured.cohort}
                  alt={featured.name}
                  aspect="4 / 5"
                />
              </div>
              <div
                className="card"
                style={{
                  marginTop: -42,
                  marginLeft: 16,
                  marginRight: 16,
                  padding: 16,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 6 }}>This week&apos;s pick</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                      {featured.name}
                    </div>
                    <div className="body-sm">
                      {featured.flag} {featured.location} ? {featured.duration}
                    </div>
                  </div>
                  {featured.slug && (
                    <Link href={`/programs/${featured.slug}`} className="btn btn-soft" aria-label="Open program">
                      <Icon.arrow width={16} height={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="shell rise rise-3" style={{ position: "relative", zIndex: 1 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>How it works</div>
            <h2>
              Three steps to <span className="display-italic">your match</span>.
            </h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }} className="hiw-grid">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.n}
              className="card"
              style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span
                  className="display display-italic"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    color: "var(--accent)",
                    lineHeight: 0.9,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {step.n}
                </span>
                <span aria-hidden="true" style={{ flex: 1, marginLeft: 14, height: 1, background: "var(--line)" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--ink)" }}>
                {step.title}
              </h3>
              <p className="body" style={{ margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKS */}
      <section className="shell">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Four tracks</div>
            <h2>
              Pick a <span className="display-italic">direction</span>.
            </h2>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }} className="track-grid">
          {TRACKS.map((t, i) => {
            const color = COHORT_LABELS[t.cohort]?.color ?? "var(--accent)"
            const num = String(i + 1).padStart(2, "0")
            return (
              <Link
                key={t.id}
                href={`/programs?track=${t.id}`}
                className="card"
                style={{
                  padding: "22px 22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 22,
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 200,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -42,
                    right: -42,
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: color,
                    opacity: 0.16,
                  }}
                />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <span
                    className="display display-italic"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 56,
                      lineHeight: 0.8,
                      color: "var(--ink-3)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {num}
                  </span>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 12 }} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 400,
                      letterSpacing: "-.01em",
                      color: "var(--ink)",
                      marginBottom: 6,
                      lineHeight: 1.05,
                    }}
                  >
                    {t.label}
                  </div>
                  <div className="body-sm" style={{ color: "var(--ink-2)", marginBottom: 14 }}>
                    {t.desc}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--ink-2)",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Explore <Icon.arrow width={14} height={14} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* REVIEWS */}
      <ReviewsSection reviews={reviews} />

      {/* PROGRAMS RAIL */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Featured retreats</div>
              <h2>
                Curated for <span className="display-italic">this season</span>.
              </h2>
            </div>
            <Link href="/programs" className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }}>
              See all
            </Link>
          </div>
        </div>
        <div className="shell">
          <div className="rail">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} variant="rail" />
            ))}
            {programs.length === 0 && (
              <div className="card" style={{ padding: 20, width: 260 }}>
                <div className="body-sm">No programs published yet.</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="shell">
        <div
          className="card"
          style={{
            padding: "40px 28px",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            borderRadius: "var(--r-xl)",
            border: 0,
            position: "relative",
            overflow: "hidden",
            marginTop: 48,
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, opacity: 0.25, pointerEvents: "none" }}>
            <Icon.flower width={200} height={200} />
          </div>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>
            The Dream Islands promise
          </div>
          <p
            className="display"
            style={{ fontSize: "clamp(28px, 6vw, 44px)", margin: "16px 0 22px", maxWidth: 560 }}
          >
            <span className="display-italic">No guesswork.</span> A clear baseline, a matched stay, a measurable shift.
          </p>
          <Link
            href="/start"
            className="btn"
            style={{ background: "var(--accent-ink)", color: "var(--accent-deep)" }}
          >
            Start the assessment <Icon.arrow width={16} height={16} />
          </Link>
          {firstWa && (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{ background: "transparent", color: "var(--accent-ink)", marginLeft: 8, border: "1px solid rgba(255,255,255,.4)" }}
            >
              Or chat now <Icon.wa width={14} height={14} />
            </a>
          )}
        </div>
      </section>

      <style>{`
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1.1fr 1fr; align-items: center; gap: 64px; min-height: 70vh; padding-top: 40px; }
          .hiw-grid  { grid-template-columns: repeat(3, 1fr); }
          .track-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        }
      `}</style>
    </div>
  )
}

function Stat({ n, sub }: { n: string; sub: string }) {
  return (
    <div>
      <strong style={{ color: "var(--ink)", fontSize: 22, fontWeight: 500, fontFamily: "var(--font-display)" }}>
        {n}
      </strong>
      <br />
      {sub}
    </div>
  )
}
