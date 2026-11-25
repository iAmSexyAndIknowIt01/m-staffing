// Ажилтны холбоо барих мэдээлэл (утас, имэйл) нээх дүрэм — клиент, сервер хоёул ашиглана.
// Компани «Ажиллах хүсэлт илгээх» товч дарж M токен (TOKEN_COSTS.contact_unlock) зарцуулбал CONTACT_UNLOCK_HOURS цагийн турш харна.

export const CONTACT_UNLOCK_HOURS = 10

// "96434301" → "96****01"
export function maskPhone(phone: string): string {
  const value = phone.trim()
  if (!value) return ""
  if (value.length <= 4) return "*".repeat(value.length)
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`
}

// "ochoozb@gmail.com" → "oc*****@g****.com"
export function maskEmail(email: string): string {
  const value = email.trim()
  const at = value.lastIndexOf("@")
  if (at <= 0) return value ? "*".repeat(Math.min(value.length, 8)) : ""

  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}${"*".repeat(local.length - 2)}`

  const dot = domain.lastIndexOf(".")
  const host = dot > 0 ? domain.slice(0, dot) : domain
  const tld = dot > 0 ? domain.slice(dot) : ""
  const maskedHost = host ? `${host[0]}${"*".repeat(Math.max(host.length - 1, 1))}` : ""

  return `${maskedLocal}@${maskedHost}${tld}`
}

// Үлдсэн хугацааг «9 цаг 12 мин» хэлбэрээр
export function formatRemaining(expiresAt: string, now: number = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return "0 мин"
  const totalMinutes = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} мин`
  return minutes === 0 ? `${hours} цаг` : `${hours} цаг ${minutes} мин`
}
