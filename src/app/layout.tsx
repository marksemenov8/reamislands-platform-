import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dream Islands — Wellness Travel for Southeast Asia",
  description: "We score your wellbeing then match you to a retreat that actually moves the number.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
