// Долоо хоногийн ажлын цагийн хуваарь — ажилтны ажиллах боломжтой цаг (mt_profile.availability)
// болон хагас цагийн зарын ажлын цаг (mt_openjob.work_schedule)-д ижил бүтэцтэй.
// Клиент болон серверт нийтлэг; импортгүй.

export const WEEK_DAYS = [
  ["monday", "Даваа"],
  ["tuesday", "Мягмар"],
  ["wednesday", "Лхагва"],
  ["thursday", "Пүрэв"],
  ["friday", "Баасан"],
  ["saturday", "Бямба"],
  ["sunday", "Ням"],
] as const

export type WeekDay = (typeof WEEK_DAYS)[number][0]
export type ScheduleDay = { enabled: boolean; from: string; to: string }
export type WeeklySchedule = Record<WeekDay, ScheduleDay>

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function emptySchedule(): WeeklySchedule {
  return Object.fromEntries(WEEK_DAYS.map(([key]) => [key, { enabled: false, from: "", to: "" }])) as WeeklySchedule
}

// DB/хэрэглэгчээс ирсэн утгыг бүтэн 7 өдрийн хуваарь болгоно (танихгүй түлхүүрийг хаяна)
export function toSchedule(value: unknown): WeeklySchedule {
  const schedule = emptySchedule()
  if (!value || typeof value !== "object" || Array.isArray(value)) return schedule
  const source = value as Record<string, unknown>
  for (const [key] of WEEK_DAYS) {
    const day = source[key]
    if (!day || typeof day !== "object") continue
    const { enabled, from, to } = day as Record<string, unknown>
    schedule[key] = {
      enabled: enabled === true,
      from: typeof from === "string" ? from : "",
      to: typeof to === "string" ? to : "",
    }
  }
  return schedule
}

// Сонгосон өдрүүд (хадгалахад зөвхөн эдгээрийг үлдээнэ)
export function enabledDays(schedule: WeeklySchedule): [WeekDay, string, ScheduleDay][] {
  return WEEK_DAYS.filter(([key]) => schedule[key].enabled).map(([key, label]) => [key, label, schedule[key]])
}

// Алдаатай бол хэрэглэгчид харуулах мессеж, зөв бол null
export function scheduleError(value: unknown): string | null {
  if (value !== undefined && value !== null && (typeof value !== "object" || Array.isArray(value))) {
    return "Ажлын цагийн мэдээлэл буруу байна."
  }
  const days = enabledDays(toSchedule(value))
  if (days.length === 0) return "Ажиллах өдрөө дор хаяж нэгийг сонгоно уу."
  for (const [, label, day] of days) {
    if (!day.from || !day.to) return `${label} гарагийн ажиллах цагийг бүрэн оруулна уу.`
    if (!TIME_RE.test(day.from) || !TIME_RE.test(day.to)) return `${label} гарагийн цаг буруу байна.`
    if (day.from >= day.to) return `${label} гарагийн эхлэх цаг дуусах цагаас өмнө байх ёстой.`
  }
  return null
}

// DB-д хадгалах хэлбэр: зөвхөн сонгосон өдрүүд
export function compactSchedule(schedule: WeeklySchedule): Partial<WeeklySchedule> {
  return Object.fromEntries(enabledDays(schedule).map(([key, , day]) => [key, { enabled: true, from: day.from, to: day.to }]))
}
