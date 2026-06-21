import Providers from "./providers"

export default function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Providers>{children}</Providers>
}
