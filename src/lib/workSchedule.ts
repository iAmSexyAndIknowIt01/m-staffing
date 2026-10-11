// Гэрээний ажлын цагийн хуваарь. DB-д work_hours текст баганад
// "Даваа-Баасан 09:00-18:00; Бямба 10:00-14:00" хэлбэрээр хадгална — шинэ багана,
// hash-ийн өөрчлөлт шаардахгүй, хуучин гэрээ болон PDF хэвээр уншигдана.

export const WEEKDAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"] as const

export interface DaySlot {
  enabled: boolean
  start: string // HH:MM
  end: string // HH:MM
}

// Үргэлж 7 элементтэй (Даваа → Ням)
export type WorkSchedule = DaySlot[]

export const DEFAULT_START = "09:00"
export const DEFAULT_END = "18:00"

export function emptySchedule(): WorkSchedule {
  return WEEKDAYS.map(() => ({ enabled: false, start: DEFAULT_START, end: DEFAULT_END }))
}

const TIME_RE = /^(\d{1,2}):(\d{2})$/

// "9:00" → "09:00". Буруу бол null
function normalizeTime(value: string): string | null {
  const m = TIME_RE.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, "0")}:${m[2]}`
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// Шөнийн ээлж (22:00-06:00) — дуусах цаг дараа өдөр
export function isOvernight(slot: Pick<DaySlot, "start" | "end">): boolean {
  return toMinutes(slot.end) < toMinutes(slot.start)
}

// Өдрийн алдаа (хоосон бол null)
export function slotError(slot: DaySlot): string | null {
  if (!slot.enabled) return null
  const start = normalizeTime(slot.start)
  const end = normalizeTime(slot.end)
  if (!start || !end) return "Эхлэх, дуусах цагийг бүрэн оруулна уу."
  if (start === end) return "Эхлэх, дуусах цаг ижил байж болохгүй."
  return null
}

// Илгээх / хадгалахад саад болох алдаанууд ("Даваа: ...")
export function scheduleErrors(schedule: WorkSchedule): string[] {
  return schedule.flatMap((slot, i) => {
    const error = slotError(slot)
    return error ? [`${WEEKDAYS[i]}: ${error}`] : []
  })
}

const validSlot = (slot: DaySlot) => slot.enabled && slotError(slot) === null

// Долоо хоногийн нийт ажлын минут (шөнийн ээлжийг дараа өдөр хүртэл тооцно)
export function weeklyMinutes(schedule: WorkSchedule): number {
  return schedule.filter(validSlot).reduce((sum, slot) => {
    const diff = toMinutes(slot.end) - toMinutes(slot.start)
    return sum + (diff < 0 ? diff + 24 * 60 : diff)
  }, 0)
}

// Дараалсан 3+ өдрийг "Даваа-Баасан", бусдыг таслалаар
function formatDays(indexes: number[]): string {
  const parts: string[] = []
  for (let i = 0; i < indexes.length; ) {
    let j = i
    while (j + 1 < indexes.length && indexes[j + 1] === indexes[j] + 1) j++
    if (j - i >= 2) parts.push(`${WEEKDAYS[indexes[i]]}-${WEEKDAYS[indexes[j]]}`)
    else for (let k = i; k <= j; k++) parts.push(WEEKDAYS[indexes[k]])
    i = j + 1
  }
  return parts.join(", ")
}

// Ижил цагтай өдрүүдийг нэгтгэж, эхний өдрийн дарааллаар бичнэ. Сонгосон өдөргүй бол ""
export function formatWorkSchedule(schedule: WorkSchedule): string {
  const groups = new Map<string, number[]>()
  schedule.forEach((slot, i) => {
    if (!validSlot(slot)) return
    const key = `${normalizeTime(slot.start)}-${normalizeTime(slot.end)}`
    groups.set(key, [...(groups.get(key) || []), i])
  })
  return Array.from(groups, ([hours, days]) => `${formatDays(days)} ${hours}`).join("; ")
}

const SEGMENT_RE = /^(.+?)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/

function dayIndex(name: string): number {
  const lower = name.trim().toLowerCase()
  return WEEKDAYS.findIndex((d) => d.toLowerCase() === lower)
}

// formatWorkSchedule-ийн эсрэг. Энэ хэлбэрт таарахгүй (чөлөөт бичвэр) бол null
export function parseWorkSchedule(text: string | null | undefined): WorkSchedule | null {
  const trimmed = text?.trim()
  if (!trimmed) return null
  const schedule = emptySchedule()

  for (const segment of trimmed.split(";")) {
    const m = SEGMENT_RE.exec(segment.trim())
    if (!m) return null
    const start = normalizeTime(m[2])
    const end = normalizeTime(m[3])
    if (!start || !end || start === end) return null

    for (const token of m[1].split(",")) {
      const [from, to, ...rest] = token.split(/[-–]/)
      if (rest.length) return null
      const a = dayIndex(from)
      const b = to === undefined ? a : dayIndex(to)
      if (a < 0 || b < a) return null
      for (let i = a; i <= b; i++) {
        if (schedule[i].enabled) return null
        schedule[i] = { enabled: true, start, end }
      }
    }
  }
  return schedule
}

// Баримтад харуулах мөрүүд: хуваарь бол бүлэг тус бүр шинэ мөрөнд, чөлөөт бичвэр бол хэвээр
export function workHoursLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  return parseWorkSchedule(text) ? text.split(";").map((s) => s.trim()) : [text.trim()]
}

// Засах формын төлөв: долоо хоногийн хуваарь эсвэл чөлөөт бичвэр (ээлжийн ажил г.м.)
export type WorkHoursMode = "schedule" | "text"

export interface WorkHoursDraft {
  mode: WorkHoursMode
  schedule: WorkSchedule
  text: string
}

// Хадгалсан утгыг формд: хуваарийн хэлбэрт таарахгүй хуучин бичвэр чөлөөт горимд нээгдэнэ
export function toWorkHoursDraft(value: string | null | undefined): WorkHoursDraft {
  const text = value?.trim() || ""
  const parsed = parseWorkSchedule(text)
  if (text && !parsed) return { mode: "text", schedule: emptySchedule(), text }
  return { mode: "schedule", schedule: parsed ?? emptySchedule(), text: "" }
}

export function workHoursFromDraft(draft: WorkHoursDraft): string | null {
  const value = draft.mode === "schedule" ? formatWorkSchedule(draft.schedule) : draft.text.trim()
  return value || null
}

export function workHoursErrors(draft: WorkHoursDraft): string[] {
  return draft.mode === "schedule" ? scheduleErrors(draft.schedule) : []
}

// 2700 → "45 цаг", 2250 → "37 цаг 30 мин"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} цаг ${m} мин` : `${h} цаг`
}
