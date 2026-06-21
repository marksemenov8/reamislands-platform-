import { Hanken_Grotesk, Instrument_Serif } from "next/font/google"
import TopNav from "./_components/TopNav"
import Footer from "./_components/Footer"
import WhatsAppFab from "./_components/WhatsAppFab"
import "./landing.css"

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${display.variable} ${body.variable}`} style={{ fontFamily: "var(--font-body)" }}>
      <TopNav />
      {children}
      <Footer />
      <WhatsAppFab />
    </div>
  )
}
