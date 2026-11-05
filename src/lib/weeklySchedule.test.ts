import { describe, expect, it } from "vitest"
import { compactSchedule, emptySchedule, decodeSchedule, encodeSchedule, scheduleError, scheduleMatch, toSchedule } from "./weeklySchedule"

describe("weeklySchedule", () => {
  it("DB-ийн утгыг 7 өдрийн хуваарь болгож, танихгүй түлхүүрийг хаяна", () => {
    const s = toSchedule({ monday: { enabled: true, from: "09:00", to: "13:00" }, funday: { enabled: true } })
    expect(Object.keys(s)).toHaveLength(7)
    expect(s.monday).toEqual({ enabled: true, from: "09:00", to: "13:00" })
    expect(s.sunday.enabled).toBe(false)
    expect(toSchedule(null).friday.enabled).toBe(false)
  })

  it("дор хаяж нэг өдөр, бүрэн бөгөөд зөв цаг шаардана", () => {
    expect(scheduleError(emptySchedule())).not.toBeNull()
    expect(scheduleError({ monday: { enabled: true, from: "09:00", to: "" } })).toContain("Даваа")
    expect(scheduleError({ monday: { enabled: true, from: "14:00", to: "09:00" } })).not.toBeNull()
    expect(scheduleError({ monday: { enabled: true, from: "9am", to: "13:00" } })).not.toBeNull()
    expect(scheduleError("x")).not.toBeNull()
    expect(scheduleError({ monday: { enabled: true, from: "09:00", to: "13:00" } })).toBeNull()
  })

  it("хадгалахад зөвхөн сонгосон өдрүүдийг үлдээнэ", () => {
    const s = { ...emptySchedule(), friday: { enabled: true, from: "18:00", to: "22:00" }, monday: { enabled: false, from: "08:00", to: "10:00" } }
    expect(compactSchedule(s)).toEqual({ friday: { enabled: true, from: "18:00", to: "22:00" } })
  })

  it("давхцсан цагийн хувиар нийцлийг тооцно", () => {
    const job = { monday: { enabled: true, from: "09:00", to: "16:00" } }
    expect(scheduleMatch(job, { monday: { enabled: true, from: "09:00", to: "16:00" } })).toBe(100)
    expect(scheduleMatch(job, { monday: { enabled: true, from: "08:00", to: "18:00" } })).toBe(100)
    expect(scheduleMatch(job, { monday: { enabled: true, from: "09:20", to: "15:00" } })).toBe(80)
    expect(scheduleMatch(job, { monday: { enabled: true, from: "09:10", to: "17:00" } })).toBe(97)
    expect(scheduleMatch(job, { monday: { enabled: true, from: "17:00", to: "20:00" } })).toBe(0)
    // Хоёр өдрийн нэгд нь л ажиллах боломжтой
    const twoDays = { ...job, wednesday: { enabled: true, from: "09:00", to: "16:00" } }
    expect(scheduleMatch(twoDays, { monday: { enabled: true, from: "09:00", to: "16:00" } })).toBe(50)
    // Хуваарьгүй зар, цаг оруулаагүй ажилтан
    expect(scheduleMatch(null, job)).toBeNull()
    expect(scheduleMatch(job, {})).toBeNull()
  })

  it("URL-д хадгалах хэлбэрт хувиргаж, буцааж уншина", () => {
    const s = { ...emptySchedule(), monday: { enabled: true, from: "09:20", to: "15:00" }, saturday: { enabled: true, from: "10:00", to: "" } }
    expect(encodeSchedule(s)).toBe("monday.0920-1500")
    expect(decodeSchedule("monday.0920-1500,funday.0900-1000,sunday.99xx")?.monday).toEqual({ enabled: true, from: "09:20", to: "15:00" })
    expect(decodeSchedule("bad")).toBeNull()
    expect(decodeSchedule(null)).toBeNull()
  })
})
