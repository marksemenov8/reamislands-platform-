"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Brand from "./Brand"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/start", label: "Assessment" },
  { href: "/about", label: "About" },
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Brand size={36} />
        <nav className="topnav-links">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} className={active ? "active" : ""}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <Link href="/start" className="btn btn-primary topnav-cta">
          Take Assessment
        </Link>
      </div>
    </header>
  )
}
