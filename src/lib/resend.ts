// Resend REST API-аар имэйл илгээх (нэмэлт сан шаардлагагүй).
// https://resend.com/docs/api-reference/emails/send-email

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export const DEFAULT_RESEND_FROM = "noreply@mstaffing.mn"

export type MailMessage = {
  to: string
  subject: string
  html: string
}

export type ResendConfig = {
  apiKey: string
  // Resend дээр баталгаажсан домэйны хаяг (жишээ: noreply@mstaffing.mn)
  from: string
  fetchImpl?: typeof fetch
}

// RESEND_API_KEY тохируулагдаагүй бол null — дуудагч тал Gmail руу шилжинэ
export function getResendConfig(env: Record<string, string | undefined> = process.env): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  if (!apiKey) return null
  const from = env.RESEND_FROM?.trim() || DEFAULT_RESEND_FROM
  return { apiKey, from }
}

// Амжилттай бол Resend-ийн имэйлийн id-г буцаана, алдаа гарвал throw хийнэ
export async function sendViaResend(message: MailMessage, config: ResendConfig): Promise<string> {
  const fetchImpl = config.fetchImpl ?? fetch
  const res = await fetchImpl(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `MStaffing <${config.from}>`,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    }),
  })

  const data = (await res.json().catch(() => null)) as { id?: string; message?: string; name?: string } | null

  if (!res.ok || !data?.id) {
    const reason = data?.message || data?.name || res.statusText
    throw new Error(`Resend илгээлт амжилтгүй (${res.status}): ${reason}`)
  }

  return data.id
}
