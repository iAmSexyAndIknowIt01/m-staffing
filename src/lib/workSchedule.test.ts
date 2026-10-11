import { describe, expect, it } from "vitest"
import {
  emptySchedule,
  formatDuration,
  formatWorkSchedule,
  isOvernight,
  parseWorkSchedule,
  scheduleErrors,
  toWorkHoursDraft,
  weeklyMinutes,
  workHoursFromDraft,
  workHoursLines,
  type WorkSchedule,
} from "./workSchedule"

// { 0: ["10:00", "18:00"] } → Даваа 10:00-18:00, бусад нь амралт
function schedule(days: Record<number, [string, string]>): WorkSchedule {
  return emptySchedule().map((slot, i) => (days[i] ? { enabled: true, start: days[i][0], end: days[i][1] } : slot))
}

describe("formatWorkSchedule", () => {
  it("өдөр бүрийн өөр цагийг тусад нь бичнэ", () => {
    expect(formatWorkSchedule(schedule({ 0: ["10:00", "18:00"], 2: ["12:00", "18:00"] }))).toBe(
      "Даваа 10:00-18:00; Лхагва 12:00-18:00"
    )
  })

  it("дараалсан 3+ өдрийг муж болгож нэгтгэнэ", () => {
    const weekdays = schedule({ 0: ["09:00", "18:00"], 1: ["09:00", "18:00"], 2: ["09:00", "18:00"], 3: ["09:00", "18:00"], 4: ["09:00", "18:00"] })
    expect(formatWorkSchedule(weekdays)).toBe("Даваа-Баасан 09:00-18:00")
  })

  it("дараалаагүй ижил цагтай өдрүүдийг таслалаар нэгтгэнэ", () => {
    expect(formatWorkSchedule(schedule({ 0: ["09:00", "18:00"], 2: ["09:00", "18:00"], 5: ["10:00", "14:00"], 6: ["10:00", "14:00"] }))).toBe(
      "Даваа, Лхагва 09:00-18:00; Бямба, Ням 10:00-14:00"
    )
  })

  it("сонгоогүй эсвэл алдаатай өдрийг алгасна", () => {
    expect(formatWorkSchedule(emptySchedule())).toBe("")
    expect(formatWorkSchedule(schedule({ 0: ["", "18:00"], 1: ["09:00", "18:00"] }))).toBe("Мягмар 09:00-18:00")
  })
})

describe("parseWorkSchedule", () => {
  it("formatWorkSchedule-ийн гаралтыг буцааж уншина", () => {
    const original = schedule({ 0: ["10:00", "18:00"], 1: ["10:00", "18:00"], 2: ["10:00", "18:00"], 4: ["12:00", "18:00"], 6: ["22:00", "06:00"] })
    const text = formatWorkSchedule(original)
    expect(parseWorkSchedule(text)).toEqual(original)
  })

  it("хуучин placeholder хэлбэрийг таньж, цагийг нормчилно", () => {
    const parsed = parseWorkSchedule("Даваа-Баасан 9:00 - 18:00")
    expect(parsed?.filter((d) => d.enabled)).toHaveLength(5)
    expect(parsed?.[0]).toEqual({ enabled: true, start: "09:00", end: "18:00" })
    expect(parsed?.[5].enabled).toBe(false)
  })

  it("хуваарийн хэлбэрт таарахгүй бичвэрт null", () => {
    for (const text of ["", "09:00-18:00", "2 өдөр ажиллаж 2 өдөр амарна", "Баасан-Даваа 09:00-18:00", "Даваа 09:00-09:00", "Даваа 25:00-18:00"]) {
      expect(parseWorkSchedule(text)).toBeNull()
    }
  })

  it("нэг өдөр давхардвал null", () => {
    expect(parseWorkSchedule("Даваа-Лхагва 09:00-18:00; Мягмар 10:00-12:00")).toBeNull()
  })
})

describe("scheduleErrors", () => {
  it("дутуу эсвэл ижил цагийг өдрийн нэртэй мэдэгдэнэ", () => {
    expect(scheduleErrors(schedule({ 0: ["", "18:00"], 3: ["09:00", "09:00"], 4: ["09:00", "18:00"] }))).toEqual([
      "Даваа: Эхлэх, дуусах цагийг бүрэн оруулна уу.",
      "Пүрэв: Эхлэх, дуусах цаг ижил байж болохгүй.",
    ])
  })

  it("сонгоогүй өдрийн цагийг шалгахгүй", () => {
    const s = emptySchedule()
    s[0] = { enabled: false, start: "", end: "" }
    expect(scheduleErrors(s)).toEqual([])
  })
})

describe("weeklyMinutes", () => {
  it("шөнийн ээлжийг дараа өдөр хүртэл тооцно", () => {
    expect(isOvernight({ start: "22:00", end: "06:00" })).toBe(true)
    expect(weeklyMinutes(schedule({ 0: ["10:00", "18:00"], 2: ["12:30", "18:00"], 6: ["22:00", "06:00"] }))).toBe((8 + 5.5 + 8) * 60)
  })

  it("цагийг уншигдахуйц бичнэ", () => {
    expect(formatDuration(2700)).toBe("45 цаг")
    expect(formatDuration(2250)).toBe("37 цаг 30 мин")
  })
})

describe("work hours draft", () => {
  it("хоосон утга хуваарийн горимд нээгдэнэ", () => {
    expect(toWorkHoursDraft(null)).toEqual({ mode: "schedule", schedule: emptySchedule(), text: "" })
    expect(workHoursFromDraft(toWorkHoursDraft(null))).toBeNull()
  })

  it("хуваарийн хэлбэрт таарахгүй хуучин бичвэр чөлөөт горимд хэвээр үлдэнэ", () => {
    const draft = toWorkHoursDraft(" Ээлжийн хуваарь: 2/2 ")
    expect(draft.mode).toBe("text")
    expect(workHoursFromDraft(draft)).toBe("Ээлжийн хуваарь: 2/2")
  })

  it("хуваарь хадгалаад дахин нээхэд ижил утга гарна", () => {
    const value = "Даваа 10:00-18:00; Лхагва 12:00-18:00"
    expect(workHoursFromDraft(toWorkHoursDraft(value))).toBe(value)
  })
})

describe("workHoursLines", () => {
  it("хуваарийг бүлэг тус бүр мөр болгоно, чөлөөт бичвэрийг хэвээр", () => {
    expect(workHoursLines("Даваа 10:00-18:00; Лхагва 12:00-18:00")).toEqual(["Даваа 10:00-18:00", "Лхагва 12:00-18:00"])
    expect(workHoursLines("Уян хатан цаг; 7 хоногт 40 цаг")).toEqual(["Уян хатан цаг; 7 хоногт 40 цаг"])
    expect(workHoursLines(null)).toEqual([])
  })
})
