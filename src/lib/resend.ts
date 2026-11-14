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

const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch"
// Resend batch API нэг хүсэлтэд 100 хүртэл имэйл хүлээж авна
export const RESEND_BATCH_LIMIT = 100

// Олон хүлээн авагчид тус тусад нь (хүн бүр зөвхөн өөрийн хаягийг харна) нэг хүсэлтээр илгээнэ.
// messages нь RESEND_BATCH_LIMIT-ээс ихгүй байх ёстой. Алдаа гарвал throw хийнэ.
export async function sendBatchViaResend(messages: MailMessage[], config: ResendConfig): Promise<void> {
  if (messages.length === 0) return
  if (messages.length > RESEND_BATCH_LIMIT) throw new Error(`Resend batch хязгаар ${RESEND_BATCH_LIMIT}`)
  const fetchImpl = config.fetchImpl ?? fetch
  const res = await fetchImpl(RESEND_BATCH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      messages.map((m) => ({ from: `MStaffing <${config.from}>`, to: [m.to], subject: m.subject, html: m.html }))
    ),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string; name?: string } | null
    const reason = data?.message || data?.name || res.statusText
    throw new Error(`Resend batch илгээлт амжилтгүй (${res.status}): ${reason}`)
  }
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
