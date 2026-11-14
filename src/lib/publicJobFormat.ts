// Нийтэд харагдах зарын хуудас (/jobs/[id]) болон Facebook-ийн урьдчилсан зурагт (OG image)
// ашиглах цэвэр (DB-гүй) туслах функцууд.

import { SALARY_NEGOTIABLE } from "./jobPost"

const SALARY_PERIOD: Record<string, string> = {
  hourly: "цаг",
  monthly: "сар",
  yearly: "жил",
}

// "8000", "hourly" → "8,000₮/цаг"; хоосон, «Тохиролцоно» → "Тохиролцоно"
export function publicSalaryText(salary: string | null | undefined, salaryType: string | null | undefined): string {
  if (!salary || salary.trim() === SALARY_NEGOTIABLE || salaryType === "negotiable") return SALARY_NEGOTIABLE
  const digits = salary.replace(/\D/g, "")
  if (!digits) return salary.trim()
  const amount = `${Number(digits).toLocaleString("en-US")}₮`
  const period = salaryType ? SALARY_PERIOD[salaryType] : undefined
  return period ? `${amount}/${period}` : amount
}

// Тайлбараас OG description-д тохирох богино бичвэр (мөр, илүү зайг цэвэрлэнэ)
export function shortDescription(text: string | null | undefined, max = 160): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

// Хадгалсан лого (бүтэн URL эсвэл storage доторх зам) → нийтийн URL
export function companyLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null
  if (/^https?:\/\//.test(logo)) return logo
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return base ? `${base}/storage/v1/object/public/company-logos/${logo}` : null
}
