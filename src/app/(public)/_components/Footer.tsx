import Link from "next/link"
import Brand from "./Brand"
import { Icon } from "./Icon"

const PROGRAMS_LINKS = [
  { href: "/programs/10-day-full-reset", label: "10-Day Full Reset" },
  { href: "/programs/longevity-protocol", label: "Longevity Protocol" },
  { href: "/programs/aesthetic-reset", label: "Aesthetic Reset" },
  { href: "/programs/sleep-ns-reset", label: "Sleep & Nervous System" },
  { href: "/programs/weight-reset", label: "Weight Reset" },
]

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/start", label: "Wellness Baseline" },
  { href: "mailto:hello@dreamislands.org", label: "Press kit", external: true },
]

const CONTACT_LINKS = [
  { href: "https://wa.me/message/HOF2AFIBDYY5J1", label: "WhatsApp consult", external: true },
  { href: "mailto:hello@dreamislands.org", label: "hello@dreamislands.org", external: true },
  { href: "https://instagram.com/", label: "Instagram", external: true },
  { href: "https://t.me/", label: "Telegram", external: true },
]

const LOCATIONS: Array<[string, string]> = [
  ["🇮🇩", "Bintan"],
  ["🇮🇩", "Bali · Ubud"],
  ["🇹🇭", "Phuket"],
  ["🇹🇭", "Koh Samui"],
  ["🇸🇬", "Sentosa"],
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Brand size={36} />
          <p className="body" style={{ marginTop: 16, maxWidth: 320 }}>
            A wellness operating system for Southeast Asia. Baseline first, retreat second, real outcomes third.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <a
              href="https://wa.me/message/HOF2AFIBDYY5J1"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: "12px 18px", fontSize: 13 }}
            >
              <Icon.wa width={16} height={16} /> Message us
            </a>
            <Link
              href="/start"
              className="btn btn-ghost"
              style={{ padding: "12px 18px", fontSize: 13 }}
            >
              Take baseline
            </Link>
          </div>
        </div>

        <FooterCol title="Programs" links={PROGRAMS_LINKS} />
        <FooterCol title="Company" links={COMPANY_LINKS} />
        <FooterCol title="Stay in touch" links={CONTACT_LINKS} />
      </div>

      <div className="footer-locations">
        <div className="eyebrow" style={{ marginBottom: 10 }}>We host in</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
          {LOCATIONS.map(([flag, place]) => (
            <span key={place} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink-2)", fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>{flag}</span>
              {place}
            </span>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <div>© {new Date().getFullYear()} Dream Islands Travel · WBS v1</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
          <a href="mailto:hello@dreamislands.org" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  )
}

type Link = { href: string; label: string; external?: boolean }

function FooterCol({ title, links }: { title: string; links: Link[] }) {
  return (
    <div className="footer-col">
      <div className="eyebrow" style={{ marginBottom: 14 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noreferrer" className="footer-link">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="footer-link">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
