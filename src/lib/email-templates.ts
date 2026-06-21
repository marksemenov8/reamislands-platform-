import "server-only"

const BRAND = "Dream Islands Travel"
const BRAND_COLOR = "#1D9E75"

function layout(title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#f6f8f7;margin:0;padding:24px;color:#10221c;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <div style="display:inline-flex;align-items:center;margin-bottom:20px;">
      <div style="width:28px;height:28px;border-radius:8px;background:${BRAND_COLOR};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;margin-right:10px;">D</div>
      <strong style="font-size:15px;">${BRAND}</strong>
    </div>
    <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#10221c;">${escape(title)}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #eef1ef;margin:24px 0 12px;">
    <p style="font-size:11px;color:#9aa6a1;margin:0;">${BRAND} · wellness OS · SEA</p>
  </div>
</body></html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;">${escape(label)}</a>`
}

// ─── intake (new WBS lead) ────────────────────────────────
export function intakeReceived(args: {
  guestName: string | null
  whatsapp: string
  wbsScore: number | null
  cohort: number | null
  recommendation: string | null
  matchedUrl: string
}) {
  const subject = `🌿 New lead: ${args.guestName ?? args.whatsapp} (WBS ${args.wbsScore ?? "—"}, ${args.recommendation ?? "no reco"})`
  const html = layout(
    "New intake received",
    `<p><strong>Guest:</strong> ${escape(args.guestName ?? "—")} (${escape(args.whatsapp)})</p>
     <p><strong>WBS:</strong> ${args.wbsScore ?? "—"} / 100 · Cohort ${args.cohort ?? "—"} · ${escape(args.recommendation ?? "no recommendation")}</p>
     <p>${btn("Open matched programs", args.matchedUrl)}</p>`,
  )
  const text = `New intake — ${args.guestName ?? args.whatsapp}\nWBS ${args.wbsScore ?? "—"} / 100, cohort ${args.cohort ?? "—"}\n${args.matchedUrl}`
  return { subject, html, text }
}

// ─── public booking inquiry ──────────────────────────────
export function bookingInquiry(args: {
  guestName: string | null
  whatsapp: string
  programName: string
  propertyName: string | null
  arrival: string
  departure: string
  pax: number
  adminBookingUrl: string
}) {
  const subject = `📅 New inquiry: ${args.programName} — ${args.guestName ?? args.whatsapp}`
  const html = layout(
    "New booking inquiry",
    `<p><strong>Guest:</strong> ${escape(args.guestName ?? "—")} (${escape(args.whatsapp)})</p>
     <p><strong>Program:</strong> ${escape(args.programName)}${args.propertyName ? ` @ ${escape(args.propertyName)}` : ""}</p>
     <p><strong>Dates:</strong> ${escape(args.arrival)} → ${escape(args.departure)} · ${args.pax} pax</p>
     <p>${btn("Open in admin", args.adminBookingUrl)}</p>`,
  )
  const text = `New inquiry — ${args.programName}\n${args.guestName ?? args.whatsapp}\n${args.arrival} → ${args.departure} (${args.pax} pax)\n${args.adminBookingUrl}`
  return { subject, html, text }
}

// ─── booking status transitions (3.7) ────────────────────
export function bookingConfirmed(args: {
  guestName: string | null
  programName: string
  arrival: string
  departure: string
  meUrl: string
}) {
  const subject = `✅ Confirmed: ${args.programName} ${args.arrival} → ${args.departure}`
  const html = layout(
    "Your stay is confirmed",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Your stay at <strong>${escape(args.programName)}</strong> is confirmed for ${escape(args.arrival)} → ${escape(args.departure)}.</p>
     <p>We'll reach out by WhatsApp with arrival logistics. You can also see your bookings any time:</p>
     <p>${btn("Open my dashboard", args.meUrl)}</p>`,
  )
  const text = `Stay confirmed — ${args.programName}, ${args.arrival} → ${args.departure}\n${args.meUrl}`
  return { subject, html, text }
}

export function preWbsReminder(args: {
  guestName: string | null
  programName: string
  meUrl: string
}) {
  const subject = `🌅 Take your pre-stay WBS — ${args.programName}`
  const html = layout(
    "Pre-stay baseline",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Welcome to <strong>${escape(args.programName)}</strong>. Take a 5-minute WBS now so we can compare with your post-stay score.</p>
     <p>${btn("Take pre-stay WBS", args.meUrl)}</p>`,
  )
  const text = `Take pre-stay WBS for ${args.programName}\n${args.meUrl}`
  return { subject, html, text }
}

export function postWbsReminder(args: {
  guestName: string | null
  programName: string
  meUrl: string
}) {
  const subject = `🌇 How are you feeling? — post-stay WBS`
  const html = layout(
    "Post-stay baseline",
    `<p>Hi ${escape(args.guestName ?? "there")},</p>
     <p>Hope your stay at <strong>${escape(args.programName)}</strong> was restorative. Take your post-stay WBS so we can show you the delta.</p>
     <p>${btn("Take post-stay WBS", args.meUrl)}</p>`,
  )
  const text = `Take post-stay WBS for ${args.programName}\n${args.meUrl}`
  return { subject, html, text }
}

// ─── magic-link (3.2) ────────────────────────────────────
export function magicLink(args: { email: string; link: string }) {
  const subject = `Sign in to ${BRAND}`
  const html = layout(
    "Your sign-in link",
    `<p>Click below to sign in to ${escape(BRAND)}. The link expires in one hour.</p>
     <p>${btn("Sign in", args.link)}</p>
     <p style="font-size:12px;color:#6b7975;margin-top:16px;">If you didn't request this, ignore this email.</p>`,
  )
  const text = `Sign in: ${args.link}\nThe link expires in one hour.`
  return { subject, html, text }
}
