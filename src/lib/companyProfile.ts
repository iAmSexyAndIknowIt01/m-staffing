import { normalizeHttpUrl } from "@/lib/url"
import { isCompanyCover } from "@/lib/companyCovers"

// Компанийн профайл засах оролтыг шалгаж, mt_company-д бичих утгыг буцаана.
// /api/company/profile болон /api/company/profile/[id] хоёулаа үүнийг ашиглана.

export interface CompanyProfileUpdate {
  company_name: string
  phone: string | null
  website: string | null
  tagline: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  facebook_url: string | null
  linkedin_url: string | null
  logo_url: string | null
  // Cover загвар (src/lib/companyCovers.ts). Илгээгээгүй бол хадгалсан утгад хүрэхгүй.
  cover_style?: string
}

type Result = { ok: true; data: CompanyProfileUpdate } | { ok: false; error: string }

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed || null
}

const TEXT_FIELDS = [
  ["phone", 30, "Утасны дугаар"],
  ["tagline", 200, "Уриа үг"],
  ["description", 5000, "Тайлбар"],
  ["industry", 100, "Салбар"],
  ["company_size", 50, "Компанийн хэмжээ"],
] as const

const URL_FIELDS = [
  ["website", "Вэбсайтын"],
  ["facebook_url", "Facebook-ийн"],
  ["linkedin_url", "LinkedIn-ий"],
  ["logo_url", "Логоны"],
] as const

export function parseCompanyProfile(input: unknown): Result {
  if (!input || typeof input !== "object") return { ok: false, error: "Мэдээлэл дутуу байна." }
  const body = input as Record<string, unknown>

  const companyName = optionalText(body.company_name, 200)
  if (!companyName) return { ok: false, error: "Компанийн нэрийг заавал бөглөнө үү." }

  const data: Partial<CompanyProfileUpdate> = { company_name: companyName }

  for (const [field, max, label] of TEXT_FIELDS) {
    const value = optionalText(body[field], max)
    if (value === undefined) return { ok: false, error: `${label} хэт урт эсвэл буруу байна.` }
    data[field] = value
  }

  // javascript: г.м. аюултай холбоос хадгалахаас сэргийлж зөвхөн http(s) зөвшөөрнө
  for (const [field, label] of URL_FIELDS) {
    const value = normalizeHttpUrl(body[field])
    if (value === undefined) return { ok: false, error: `${label} холбоос буруу байна.` }
    data[field] = value
  }

  if ("cover_style" in body) {
    if (!isCompanyCover(body.cover_style)) return { ok: false, error: "Cover загвар буруу байна." }
    data.cover_style = body.cover_style
  }

  return { ok: true, data: data as CompanyProfileUpdate }
}
