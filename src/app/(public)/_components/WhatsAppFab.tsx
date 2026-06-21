import { Icon } from "./Icon"

export default function WhatsAppFab({ phone }: { phone?: string | null }) {
  const href = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}` : "https://wa.me/message/HOF2AFIBDYY5J1"
  return (
    <a className="fab-wa" href={href} target="_blank" rel="noreferrer" aria-label="WhatsApp consultation">
      <Icon.wa width={26} height={26} />
    </a>
  )
}
