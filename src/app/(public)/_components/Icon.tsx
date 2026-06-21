import type { SVGProps } from "react"

type P = SVGProps<SVGSVGElement>

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

export const Icon = {
  search: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  book: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
      <path d="M8 7h6M8 11h6M8 15h4" />
    </svg>
  ),
  heart: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  ),
  arrow: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  chevron: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  back: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  close: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  wa: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.1s-.8.9-.9 1.1c-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-1.4 1.5-1.1 3.3.7 5.7 2.5 3.5 4.3 4 5.3 4.3.8.2 1.5.2 2 .1.6-.1 1.6-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5C8.4 21.5 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18.2c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.5 1.1 1.1-3.4-.2-.4C3.5 14.6 3 13.3 3 12c0-5 4-9 9-9s9 4 9 9-4 9.2-9 9.2Z" />
    </svg>
  ),
  flower: (p: P) => (
    <svg viewBox="0 0 32 32" {...stroke} strokeWidth={1.4} {...p}>
      <circle cx="16" cy="16" r="14" />
      <path d="M16 9c2 2 2 4.5 0 6.5-2-2-2-4.5 0-6.5Z" />
      <path d="M22 13c-.5 2.7-2.7 4-5 3.5 1-2.6 3-3.8 5-3.5Z" />
      <path d="M22 19c-2 1.5-4.5 1.1-5.5-1 2.4-1.2 4.7-.6 5.5 1Z" />
      <path d="M10 19c.8-1.6 3.1-2.2 5.5-1-1 2.1-3.5 2.5-5.5 1Z" />
      <path d="M10 13c2-.3 4 .9 5 3.5-2.3.5-4.5-.8-5-3.5Z" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    </svg>
  ),
}
