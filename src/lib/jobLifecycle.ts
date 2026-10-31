// Ажлын зарын хугацаа, төлөвийн шилжилт — DB-гүй цэвэр логик (client болон server хоёуланд).
//
//   active  — ажил хайгчдад харагдана. expires_at хүртэл (нийтэлснээс хойш JOB_POST_DAYS хоног)
//   draft   — харагдахгүй, хугацаа тоологдохгүй. Идэвхтэй зарыг ноорог болговол үлдсэн хугацааг
//             paused_remaining_seconds-д хадгалж, дахин нийтлэхэд үргэлжлүүлнэ (эрх хасагдахгүй)
//   closed  — ажил олгогч өөрөө хаасан
//   expired — хугацаа дуусч pg_cron (public.expire_job_posts) автоматаар хаасан
//
// closed/expired зарыг дахин нээх, идэвхтэй зарыг «Сунгах» нь 1 нийтлэх эрх хасч, JOB_POST_DAYS хоног нэмнэ.

export const JOB_POST_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type JobStatus = "active" | "draft" | "closed" | "expired"
export const JOB_STATUSES: JobStatus[] = ["active", "draft", "closed", "expired"]

export interface JobTiming {
  status: string
  expires_at: string | null
  paused_remaining_seconds: number | null
}

export interface JobTimingUpdate {
  status: JobStatus
  expires_at: string | null
  paused_remaining_seconds: number | null
}

export type JobPlan = { update: JobTimingUpdate; chargesCredit: boolean } | { error: string }

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && (JOB_STATUSES as string[]).includes(value)
}

const plusDays = (from: Date, days: number) => new Date(from.getTime() + days * DAY_MS).toISOString()

// Хуучин (төлөвгүй/буруу) утгыг идэвхтэй гэж үзнэ
const statusOf = (job: JobTiming): JobStatus => (isJobStatus(job.status) ? job.status : "active")

// Ажил олгогч төлөвийг гараар солих үеийн шинэ утгууд, эрх хасагдах эсэх
export function planStatusChange(job: JobTiming, next: JobStatus, now: Date = new Date()): JobPlan {
  const current = statusOf(job)
  const keep = { status: current, expires_at: job.expires_at, paused_remaining_seconds: job.paused_remaining_seconds }

  if (next === current) return { update: keep, chargesCredit: false }
  if (next === "expired") return { error: "Хугацаа дууссан төлөвийг систем автоматаар тогтооно." }

  if (next === "active") {
    if (current === "draft") {
      // Түр ноорог болгосон зар — үлдсэн хугацаагаар үргэлжилнэ
      if (job.paused_remaining_seconds && job.paused_remaining_seconds > 0) {
        return {
          update: { status: "active", expires_at: new Date(now.getTime() + job.paused_remaining_seconds * 1000).toISOString(), paused_remaining_seconds: null },
          chargesCredit: false,
        }
      }
      // Хэзээ ч нийтлэгдээгүй ноорог — үүсгэхэд эрх аль хэдийн хасагдсан
      if (!job.expires_at) {
        return { update: { status: "active", expires_at: plusDays(now, JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: false }
      }
    }
    // Хаагдсан, хугацаа дууссан (эсвэл тэднээс ноорог болгосон) зарыг дахин нээх
    return { update: { status: "active", expires_at: plusDays(now, JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: true }
  }

  if (next === "draft") {
    if (current === "active") {
      const expires = job.expires_at ? new Date(job.expires_at).getTime() : now.getTime() + JOB_POST_DAYS * DAY_MS
      const remaining = Math.max(0, Math.floor((expires - now.getTime()) / 1000))
      return { update: { status: "draft", expires_at: null, paused_remaining_seconds: remaining }, chargesCredit: false }
    }
    // Хаагдсан/хугацаа дууссан зарыг ноорог болгоход хугацаа нь сэргэхгүй (дахин нээхэд эрх хасагдана)
    return { update: { status: "draft", expires_at: job.expires_at ?? now.toISOString(), paused_remaining_seconds: null }, chargesCredit: false }
  }

  // next === "closed": дахин нээхэд эрх хасагдахаар expires_at-г заавал үлдээнэ
  return { update: { status: "closed", expires_at: job.expires_at ?? now.toISOString(), paused_remaining_seconds: null }, chargesCredit: false }
}

// «Сунгах» (идэвхтэй зар) эсвэл «Дахин нээх» (хаагдсан/хугацаа дууссан зар) — үргэлж 1 эрх хасна
export function planRenewal(job: JobTiming, now: Date = new Date()): JobPlan {
  const current = statusOf(job)
  if (current === "draft") return { error: "Ноорог зарыг эхлээд нийтэлнэ үү." }

  if (current === "active") {
    const base = job.expires_at && new Date(job.expires_at).getTime() > now.getTime() ? new Date(job.expires_at) : now
    return { update: { status: "active", expires_at: plusDays(base, JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: true }
  }

  return { update: { status: "active", expires_at: plusDays(now, JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: true }
}

// Идэвхтэй зарын үлдсэн хоног (дээш нь бүхэлчилнэ). Хугацаагүй бол null.
export function daysLeft(expiresAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / DAY_MS))
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Идэвхтэй",
  draft: "Ноорог",
  closed: "Хаагдсан",
  expired: "Хугацаа дууссан",
}
