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

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// Ажлын хуваарь ажилтны цагтай хэр нийцэж буйг хувиар (0–100) буцаана.
// Зарын нийт ажлын минутаас ажилтны боломжтой цагтай давхцсан минутын эзлэх хувь:
//   зар Даваа 09:00–16:00, ажилтан 09:20–15:00 → 340/420 ≈ 81%; 09:10–17:00 → 410/420 ≈ 98%.
// Хуваарьгүй (хагас цагийн бус) зар эсвэл ажилтан цаг оруулаагүй бол null.
export function scheduleMatch(job: unknown, availability: unknown): number | null {
  const jobDays = enabledDays(toSchedule(job)).filter(([, , d]) => TIME_RE.test(d.from) && TIME_RE.test(d.to) && d.from < d.to)
  if (jobDays.length === 0) return null
  const free = toSchedule(availability)
  if (enabledDays(free).length === 0) return null
  let total = 0
  let overlap = 0
  for (const [key, , day] of jobDays) {
    const start = toMinutes(day.from)
    const end = toMinutes(day.to)
    total += end - start
    const slot = free[key]
    if (!slot.enabled || !TIME_RE.test(slot.from) || !TIME_RE.test(slot.to)) continue
    overlap += Math.max(0, Math.min(end, toMinutes(slot.to)) - Math.max(start, toMinutes(slot.from)))
  }
  return total > 0 ? Math.floor((overlap / total) * 100) : null
}

// URL-д хадгалах товч хэлбэр: "monday.0920-1500,saturday.1000-1600" (зөвхөн бүрэн бөглөсөн өдрүүд)
export function encodeSchedule(schedule: WeeklySchedule): string {
  return enabledDays(schedule)
    .filter(([, , d]) => TIME_RE.test(d.from) && TIME_RE.test(d.to))
    .map(([key, , d]) => `${key}.${d.from.replace(":", "")}-${d.to.replace(":", "")}`)
    .join(",")
}

export function decodeSchedule(value: string | null | undefined): WeeklySchedule | null {
  if (!value) return null
  const schedule = emptySchedule()
  const keys = new Set<string>(WEEK_DAYS.map(([key]) => key))
  for (const part of value.split(",")) {
    const match = /^([a-z]+)\.(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(part)
    if (!match || !keys.has(match[1])) continue
    const from = `${match[2]}:${match[3]}`
    const to = `${match[4]}:${match[5]}`
    if (TIME_RE.test(from) && TIME_RE.test(to)) schedule[match[1] as WeekDay] = { enabled: true, from, to }
  }
  return enabledDays(schedule).length > 0 ? schedule : null
}
