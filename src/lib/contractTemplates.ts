import { SALARY_TYPE_LABELS, addDaysISO, isValidDate } from "@/lib/contracts"
import type { ContractSalaryType, ContractTemplateInput, ContractTerms } from "@/types/contract"

// Гэрээний загвар — оролтын шалгалт, гэрээнд хэрэглэх дүрэм (DB-гүй цэвэр логик)

export const MAX_TEMPLATES_PER_COMPANY = 30
export const MIN_TEMPLATE_TERMS = 20

export const TEMPLATE_COLUMNS = `
  id, name, is_default, position, salary, salary_type, duration_months,
  work_hours, location, terms, created_at, updated_at
`

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed || null
}

export type TemplateValidation = { ok: true; data: ContractTemplateInput } | { ok: false; error: string }

export function validateTemplate(input: unknown): TemplateValidation {
  if (!input || typeof input !== "object") return { ok: false, error: "Мэдээлэл дутуу байна." }
  const body = input as Record<string, unknown>

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 100) return { ok: false, error: "Загварын нэрийг оруулна уу (100 тэмдэгтээс ихгүй)." }

  const position = optionalText(body.position, 200)
  if (position === undefined) return { ok: false, error: "Албан тушаал хэт урт байна." }

  let salary: number | null = null
  if (body.salary !== undefined && body.salary !== null && body.salary !== "") {
    const n = typeof body.salary === "string" ? Number(body.salary) : body.salary
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e12) {
      return { ok: false, error: "Цалингийн дүн буруу байна." }
    }
    salary = Math.round(n * 100) / 100
  }

  const salaryType = body.salary_type ?? "monthly"
  if (typeof salaryType !== "string" || !Object.hasOwn(SALARY_TYPE_LABELS, salaryType)) {
    return { ok: false, error: "Цалингийн төрөл буруу байна." }
  }

  let durationMonths: number | null = null
  if (body.duration_months !== undefined && body.duration_months !== null && body.duration_months !== "") {
    const n = Number(body.duration_months)
    if (!Number.isInteger(n) || n < 1 || n > 120) return { ok: false, error: "Гэрээний хугацаа 1-120 сар байна." }
    durationMonths = n
  }

  const workHours = optionalText(body.work_hours, 200)
  if (workHours === undefined) return { ok: false, error: "Ажлын цагийн мэдээлэл хэт урт байна." }

  const location = optionalText(body.location, 200)
  if (location === undefined) return { ok: false, error: "Ажлын байршил хэт урт байна." }

  const terms = typeof body.terms === "string" ? body.terms.trim() : ""
  if (terms.length < MIN_TEMPLATE_TERMS) return { ok: false, error: "Гэрээний нөхцлийг дэлгэрэнгүй бичнэ үү." }
  if (terms.length > 20000) return { ok: false, error: "Гэрээний нөхцөл хэт урт байна." }

  return {
    ok: true,
    data: {
      name,
      is_default: body.is_default === true,
      position,
      salary,
      salary_type: salaryType as ContractSalaryType,
      duration_months: durationMonths,
      work_hours: workHours,
      location,
      terms,
    },
  }
}

// Эхлэх огнооноос N сарын дараах өмнөх өдөр (2026-10-15 + 12 сар → 2027-10-14).
// Тухайн сард ийм өдөр байхгүй бол сарын сүүлийн өдөр дуусна (01-31 + 1 сар → 02-28).
export function contractEndDate(startDate: string, months: number): string | null {
  if (!isValidDate(startDate)) return null
  const [y, m, d] = startDate.split("-").map(Number)
  const total = m - 1 + months
  const year = y + Math.floor(total / 12)
  const month = total % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const target = `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`
  return d > lastDay ? target : addDaysISO(target, -1)
}

// Загварыг гэрээний нөхцөлд хэрэглэнэ. Загварт хоосон (null) талбар одоогийн утгаараа үлдэнэ
// (жишээ нь албан тушаал, цалин нь ажлын зараас авсан утгаараа).
export function applyTemplate(terms: ContractTerms, template: ContractTemplateInput): ContractTerms {
  const endDate = template.duration_months ? contractEndDate(terms.start_date, template.duration_months) : null
  return {
    ...terms,
    position: template.position ?? terms.position,
    salary: template.salary ?? terms.salary,
    salary_type: template.salary !== null ? template.salary_type : terms.salary_type,
    end_date: endDate ?? terms.end_date,
    work_hours: template.work_hours ?? terms.work_hours,
    location: template.location ?? terms.location,
    terms: template.terms,
  }
}

// Гэрээний нөхцлөөс загварын анхны утга ("Загвар болгож хадгалах").
// Тодорхой огнооноос сарын тоо гаргахгүй — хугацааг хэрэглэгч өөрөө сонгоно.
export function templateFromTerms(name: string, terms: ContractTerms): ContractTemplateInput {
  return {
    name,
    is_default: false,
    position: terms.position || null,
    salary: terms.salary > 0 ? terms.salary : null,
    salary_type: terms.salary_type,
    duration_months: null,
    work_hours: terms.work_hours,
    location: terms.location,
    terms: terms.terms,
  }
}

// numeric багана string-ээр ирж болно
export function normalizeTemplate<T extends { salary: unknown }>(row: T): T & { salary: number | null } {
  return { ...row, salary: row.salary === null || row.salary === undefined ? null : Number(row.salary) }
}
