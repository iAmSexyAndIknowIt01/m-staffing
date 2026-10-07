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
