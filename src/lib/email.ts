import "server-only"
import { Resend } from "resend"

let cached: Resend | null = null
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!cached) cached = new Resend(key)
  return cached
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  tag?: string
}

/**
 * sendEmail — fire-and-forget transactional send via Resend.
 * If RESEND_API_KEY is missing (local dev), logs a warning and returns.
 * Always resolves; failures are logged but never thrown so they cannot abort
 * an HTTP handler.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const c = client()
  const recipients = Array.isArray(input.to) ? input.to : [input.to]
  if (!c) {
    console.warn(
      `[email] RESEND_API_KEY not set — would send "${input.subject}" to ${recipients.join(",")}`,
    )
    return
  }
  const from = process.env.EMAIL_FROM ?? "Dream Islands Travel <hello@dreamislands.org>"
  const replyTo = process.env.EMAIL_REPLY_TO
  try {
    const res = await c.emails.send({
      from,
      to: recipients,
      replyTo: replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tag ? [{ name: "kind", value: input.tag }] : undefined,
    })
    if (res.error) {
      console.error(`[email] send failed (${input.tag ?? "untagged"}):`, res.error.message)
    }
  } catch (err) {
    console.error(`[email] send threw (${input.tag ?? "untagged"}):`, err)
  }
}

export function adminInbox(): string[] {
  const raw = process.env.EMAIL_ADMIN_INBOX ?? ""
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
