// Хэрэглэгчийн оруулсан холбоосыг шалгаж цэвэрлэнэ.
// Хоосон бол null, буруу бол undefined, зөв бол http(s) URL буцаана.
// Схемгүй ("example.mn") бол https:// нэмнэ. javascript:, data: г.м. схемийг зөвшөөрөхгүй.

const MAX_URL_LENGTH = 500

export function normalizeHttpUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_URL_LENGTH) return undefined

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

// Имэйл дэх линкийн үндсэн хаяг. Host header-ийг хуурч phishing линк явуулахаас сэргийлж
// production-д зөвхөн APP_URL-ийг ашиглана. Тохируулаагүй бол null (линкгүй мэйл явна).
export function getAppOrigin(req: Request): string | null {
  const configured = normalizeHttpUrl(process.env.APP_URL)
  if (configured) return new URL(configured).origin
  if (process.env.NODE_ENV !== "production") return new URL(req.url).origin
  return null
}
