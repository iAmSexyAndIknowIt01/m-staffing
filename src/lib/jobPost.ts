// Ажлын зар (mt_openjob) үүсгэх/засах оролтын шалгалт.
// salary_type нь гэрээ үүсгэхэд хуулагддаг тул зөвхөн мэдэгдэж буй утгыг зөвшөөрнө.

export const JOB_SALARY_TYPES = ["monthly", "hourly"] as const
export const JOB_TYPES = ["fulltime", "parttime", "contract", "intern", "remote"] as const

interface JobPostInput {
  title?: unknown
  category?: unknown
  jobType?: unknown
  location?: unknown
  salary?: unknown
  salaryType?: unknown
  description?: unknown
  requirements?: unknown
}

function tooLong(value: unknown, max: number): boolean {
  return value !== undefined && value !== null && (typeof value !== "string" || value.length > max)
}

// Алдаатай бол хэрэглэгчид харуулах мессеж, зөв бол null
export function jobPostError(input: JobPostInput): string | null {
  if (tooLong(input.title, 200)) return "Гарчиг хэт урт байна."
  if (tooLong(input.category, 100)) return "Категори хэт урт байна."
  if (tooLong(input.location, 200)) return "Байршил хэт урт байна."
  if (tooLong(input.description, 10000)) return "Ажлын тайлбар хэт урт байна."
  if (tooLong(input.requirements, 10000)) return "Шаардлага хэт урт байна."
  if (input.salary !== undefined && (typeof input.salary !== "string" && typeof input.salary !== "number" || String(input.salary).length > 50)) {
    return "Цалингийн утга буруу байна."
  }
  if (input.salaryType !== undefined && !JOB_SALARY_TYPES.includes(input.salaryType as never)) {
    return "Цалингийн төрөл буруу байна."
  }
  if (input.jobType !== undefined && !JOB_TYPES.includes(input.jobType as never)) {
    return "Ажлын цагийн төрөл буруу байна."
  }
  return null
}

// ----------------------------------------------------------------------------
// Зарын формын сонголтууд, шошго, шалгалт (клиент болон серверт нийтлэг; импортгүй)
// ----------------------------------------------------------------------------

export const JOB_FIELD_LIMITS = {
  title: 200,
  location: 200,
  description: 10000,
  requirements: 10000,
} as const

// Ангилал. Утгыг DB-д хадгална; хуучин зарын "it", "finance" ... кодуудыг хэвээр үлдээсэн.
export const JOB_CATEGORIES = [
  { value: "retail", label: "Худалдаа, үйлчилгээ" },
  { value: "food", label: "Хоол үйлдвэрлэл, ресторан" },
  { value: "hospitality", label: "Зочид буудал, аялал жуулчлал" },
  { value: "logistics", label: "Тээвэр, логистик, агуулах" },
  { value: "construction", label: "Барилга, үйлдвэрлэл" },
  { value: "customer_service", label: "Харилцагчийн үйлчилгээ" },
  { value: "admin", label: "Захиргаа, оффисын ажил" },
  { value: "it", label: "Мэдээллийн технологи (IT)" },
  { value: "finance", label: "Санхүү, нягтлан бодох" },
  { value: "marketing", label: "Маркетинг, борлуулалт" },
  { value: "hr", label: "Хүний нөөц, удирдлага" },
  { value: "design", label: "Дизайн, бүтээлч ажил" },
  { value: "education", label: "Боловсрол, сургалт" },
  { value: "health", label: "Эрүүл мэнд, гоо сайхан" },
  { value: "other", label: "Бусад" },
] as const

export function isJobCategory(value: unknown): boolean {
  return typeof value === "string" && JOB_CATEGORIES.some((c) => c.value === value)
}

// Ажил хайгчид харуулах шошго. Жагсаалтад байхгүй (хуучин чөлөөт текст) бол утгыг нь буцаана.
export function getJobCategoryLabel(value: string | null | undefined): string {
  if (!value) return ""
  const key = value.trim().toLowerCase()
  return JOB_CATEGORIES.find((c) => c.value === key)?.label ?? value
}

export const JOB_TYPE_OPTIONS: { value: (typeof JOB_TYPES)[number]; label: string }[] = [
  { value: "fulltime", label: "Бүтэн цаг" },
  { value: "parttime", label: "Хагас цаг" },
  { value: "contract", label: "Гэрээт" },
  { value: "intern", label: "Дадлага" },
  { value: "remote", label: "Зайнаас" },
]

const JOB_TYPE_ALIASES: Record<string, string> = {
  full_time: "fulltime",
  part_time: "parttime",
  internship: "intern",
}

export function getJobTypeLabel(value: string | null | undefined): string {
  if (!value) return ""
  const key = JOB_TYPE_ALIASES[value] ?? value
  return JOB_TYPE_OPTIONS.find((t) => t.value === key)?.label ?? value
}

// «Тохиролцоно» цалинг mt_openjob.salary-д энэ текстээр хадгална
export const SALARY_NEGOTIABLE = "Тохиролцоно"
export const SALARY_MAX = 1_000_000_000

// Оруулсан утгаас зөвхөн цифрийг авна ("2,500,000₮" -> "2500000")
export function salaryDigits(value: string): string {
  return value.replace(/\D/g, "")
}

// Мянгатын таслалтай харуулах ("2500000" -> "2,500,000")
export function formatSalaryInput(digits: string): string {
  return digits ? Number(digits).toLocaleString("en-US") : ""
}

// Цалингийн утгын шалгалт (тоо, 0-ээс их, хэт их биш эсвэл «Тохиролцоно»)
export function salaryError(salary: unknown): string | null {
  if (salary === SALARY_NEGOTIABLE) return null
  const text = typeof salary === "number" ? String(salary) : typeof salary === "string" ? salary.trim() : ""
  if (!text) return "Цалингийн хэмжээг оруулна уу эсвэл «Тохиролцоно» сонгоно уу."
  if (!/^\d+$/.test(text)) return "Цалинг зөвхөн тоогоор оруулна уу."
  const amount = Number(text)
  if (amount <= 0) return "Цалин 0-ээс их байна."
  if (amount > SALARY_MAX) return "Цалингийн хэмжээ хэт их байна."
  return null
}

export interface JobFormValues {
  title: string
  category: string
  jobType: string
  location: string
  salary: string
  salaryType: string
  description: string
  requirements: string
}

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>

export const JOB_TEXT_MIN_LENGTH = 20

// Формын талбар бүрийн алдаа (клиент realtime болон сервер хоёуланд ашиглана)
export function jobFormErrors(v: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {}
  const title = v.title.trim()
  if (!title) errors.title = "Ажлын байрны нэрээ оруулна уу."
  else if (title.length < 3) errors.title = "Хамгийн багадаа 3 тэмдэгт байна."
  else if (title.length > JOB_FIELD_LIMITS.title) errors.title = `${JOB_FIELD_LIMITS.title}-аас ихгүй тэмдэгт байна.`

  if (!v.category) errors.category = "Ангиллаа сонгоно уу."
  if (!v.location.trim()) errors.location = "Ажиллах байршлаа сонгоно уу."

  const salary = salaryError(v.salary)
  if (salary) errors.salary = salary

  for (const field of ["description", "requirements"] as const) {
    const text = v[field].trim()
    const name = field === "description" ? "Ажлын үүрэг, тодорхойлолтоо" : "Тавигдах шаардлагаа"
    if (!text) errors[field] = `${name} бичнэ үү.`
    else if (text.length < JOB_TEXT_MIN_LENGTH) errors[field] = `Дор хаяж ${JOB_TEXT_MIN_LENGTH} тэмдэгтээр дэлгэрэнгүй бичнэ үү.`
    else if (text.length > JOB_FIELD_LIMITS[field]) errors[field] = `${JOB_FIELD_LIMITS[field]}-аас ихгүй тэмдэгт байна.`
  }
  return errors
}
