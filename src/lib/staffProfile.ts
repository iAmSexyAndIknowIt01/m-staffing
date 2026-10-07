import { isValidDate } from "@/lib/contracts"

// Ажилтны профайлын туршлага, боловсролын оролтыг DB-д бичихээс ӨМНӨ шалгана.
// Ингэснээр хадгалах явцад буруу утгаас болж DB алдаа гарч, мэдээлэл дутуу үлдэхгүй.

export interface ExperienceRow {
  company: string
  position: string
  start_date: string
  end_date: string | null
  description: string
}

export interface EducationRow {
  school: string
  degree: string
  field: string
  graduation_year: number | null
  is_current: boolean
}

type Result<T> = { ok: true; rows: T[] } | { ok: false; error: string }

const MAX_EXPERIENCE = 50
const MAX_EDUCATION = 20

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : null
}

export function parseExperience(input: unknown): Result<ExperienceRow> {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Ажлын туршлагаа оруулна уу." }
  if (input.length > MAX_EXPERIENCE) return { ok: false, error: `Ажлын туршлага хамгийн ихдээ ${MAX_EXPERIENCE} байна.` }

  const rows: ExperienceRow[] = []
  for (const [index, item] of input.entries()) {
    const label = `${index + 1}-р ажлын туршлага`
    const exp = (item ?? {}) as Record<string, unknown>

    const company = text(exp.company, 200)
    const position = text(exp.position, 200)
    if (!company || !position) return { ok: false, error: `${label}: байгууллага, албан тушаалаа бөглөнө үү.` }

    const startDate = typeof exp.startDate === "string" ? exp.startDate : ""
    if (!isValidDate(startDate)) return { ok: false, error: `${label}: эхэлсэн огноо буруу байна.` }

    let endDate: string | null = null
    if (exp.endDate !== undefined && exp.endDate !== null && exp.endDate !== "") {
      if (typeof exp.endDate !== "string" || !isValidDate(exp.endDate)) {
        return { ok: false, error: `${label}: дууссан огноо буруу байна.` }
      }
      if (exp.endDate < startDate) return { ok: false, error: `${label}: дууссан огноо эхэлсэн огнооноос өмнө байна.` }
      endDate = exp.endDate
    }

    const description = exp.description === undefined || exp.description === null ? "" : text(exp.description, 2000)
    if (description === null) return { ok: false, error: `${label}: тайлбар хэт урт байна.` }

    rows.push({ company, position, start_date: startDate, end_date: endDate, description })
  }
  return { ok: true, rows }
}

export function parseEducation(input: unknown): Result<EducationRow> {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Боловсролын мэдээллээ оруулна уу." }
  if (input.length > MAX_EDUCATION) return { ok: false, error: `Боловсролын мэдээлэл хамгийн ихдээ ${MAX_EDUCATION} байна.` }

  const rows: EducationRow[] = []
  for (const [index, item] of input.entries()) {
    const label = `${index + 1}-р боловсрол`
    const edu = (item ?? {}) as Record<string, unknown>

    const school = text(edu.school, 200)
    const degree = text(edu.degree, 100)
    if (!school || !degree) return { ok: false, error: `${label}: сургууль, зэргээ бөглөнө үү.` }

    const field = edu.field === undefined || edu.field === null ? "" : text(edu.field, 200)
    if (field === null) return { ok: false, error: `${label}: мэргэжлийн чиглэл хэт урт байна.` }

    let graduationYear: number | null = null
    if (edu.graduationYear !== undefined && edu.graduationYear !== null && edu.graduationYear !== "") {
      const year = Number(edu.graduationYear)
      if (!Number.isInteger(year) || year < 1950 || year > 2100) {
        return { ok: false, error: `${label}: төгссөн он буруу байна.` }
      }
      graduationYear = year
    }

    rows.push({ school, degree, field, graduation_year: graduationYear, is_current: edu.isCurrent === true })
  }
  return { ok: true, rows }
}

// skills.technical / skills.languages — зөвхөн тэмдэгт мөрүүд
export function parseSkillNames(input: unknown): string[] | null {
  if (!input || typeof input !== "object") return null
  const skills = input as Record<string, unknown>
  const names: string[] = []
  for (const key of ["technical", "languages"]) {
    const list = skills[key]
    if (list === undefined) continue
    if (!Array.isArray(list) || list.some((s) => typeof s !== "string" || s.length > 100)) return null
    names.push(...(list as string[]))
  }
  return names.length > 200 ? null : names
}
