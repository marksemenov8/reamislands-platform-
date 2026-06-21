import Link from "next/link"
import Logo from "@/components/Logo"

export default function Brand({ size = 40, href = "/" }: { size?: number; href?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--font-display)",
        fontSize: 22,
        letterSpacing: "-.01em",
        color: "var(--ink)",
      }}
    >
      <Logo size={size} style={{ color: "var(--accent)" }} />
      <span>Dream Islands</span>
    </Link>
  )
}
