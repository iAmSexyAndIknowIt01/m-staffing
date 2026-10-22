// Компанийн профайл хэр бүрэн бөглөгдсөнийг тооцно (эзэмшигчид зөвлөмж харуулахад)

export interface CompletenessInput {
  logo_url?: string | null
  tagline?: string | null
  description?: string | null
  industry?: string | null
  company_size?: string | null
  phone?: string | null
  website?: string | null
}

const CHECKS: { key: keyof CompletenessInput; label: string }[] = [
  { key: "logo_url", label: "Лого" },
  { key: "tagline", label: "Товч уриа" },
  { key: "description", label: "Байгууллагын танилцуулга" },
  { key: "industry", label: "Үйл ажиллагааны чиглэл" },
  { key: "company_size", label: "Ажилтны тоо" },
  { key: "phone", label: "Утасны дугаар" },
  { key: "website", label: "Цахим хуудас" },
]

export function getProfileCompleteness(profile: CompletenessInput) {
  const missing = CHECKS.filter(({ key }) => !profile[key]?.toString().trim()).map(({ label }) => label)
  const percent = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100)
  return { percent, missing }
}
