import Link from "next/link"
import type { LandingProgram } from "../_lib/programMapping"
import { Icon } from "./Icon"
import ProgramImage from "./ProgramImage"

type Variant = "rail" | "wide" | "featured"

export default function ProgramCard({
  program: p,
  variant = "rail",
}: {
  program: LandingProgram
  variant?: Variant
}) {
  const href = p.slug ? `/programs/${p.slug}` : "#"

  if (variant === "featured") {
    return (
      <article className="card" style={{ display: "flex", flexDirection: "column" }}>
        <Link href={href} style={{ position: "relative", display: "block" }}>
          <ProgramImage url={p.hero_image_url} cohort={p.cohort} alt={p.name} aspect="16 / 10" />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.55) 100%)",
            }}
          />
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6 }}>
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink)" }}>
              {p.track}
            </span>
            <span className="tag" style={{ background: "rgba(255,255,255,.92)", color: "var(--ink-2)" }}>
              {p.type}
            </span>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: "white" }}>
            <div className="body-sm" style={{ color: "rgba(255,255,255,.85)", marginBottom: 4 }}>
              {p.flag} {p.location}
            </div>
            <div className="display" style={{ fontSize: 28, color: "white" }}>{p.name}</div>
          </div>
        </Link>
        <div style={{ padding: "18px 18px 20px" }}>
          {p.blurb && <p className="body" style={{ margin: "0 0 14px" }}>{p.blurb}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="body-sm">{p.duration}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>{p.price}</div>
            </div>
            <Link href={href} className="btn btn-soft">
              Explore <Icon.arrow width={16} height={16} />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  const wide = variant === "wide"
  return (
    <article className="card" style={{ width: wide ? "100%" : 260 }}>
      <Link href={href} style={{ display: "block", position: "relative" }}>
        <ProgramImage url={p.hero_image_url} cohort={p.cohort} alt={p.name} aspect={wide ? "16 / 9" : "4 / 3"} />
        <span
          className="tag"
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(255,255,255,.92)",
            color: "var(--ink)",
            fontSize: 11,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.trackColor }} /> {p.track}
        </span>
      </Link>
      <div style={{ padding: "14px 16px 16px" }}>
        <Link href={href}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            {p.name}
          </h3>
        </Link>
        <div className="body-sm" style={{ marginBottom: 8 }}>
          {p.flag} {p.location}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="body-sm" style={{ color: "var(--ink-2)" }}>{p.duration}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{p.price}</span>
        </div>
      </div>
    </article>
  )
}
