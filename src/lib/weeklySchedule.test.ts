import { describe, expect, it } from "vitest"
import { compactSchedule, emptySchedule, decodeSchedule, encodeSchedule, scheduleError, scheduleFit, toSchedule } from "./weeklySchedule"

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

  it("өдөр бүрийн нийцлийг тус тусад нь тооцно", () => {
    const mon = { monday: { enabled: true, from: "09:00", to: "16:00" } }
    expect(scheduleFit(mon, { monday: { enabled: true, from: "09:00", to: "16:00" } }, 100)).toEqual({ total: 1, days: ["Даваа"], best: 100, worst: 100 })
    expect(scheduleFit(mon, { monday: { enabled: true, from: "08:00", to: "18:00" } }, 100)?.best).toBe(100)
    expect(scheduleFit(mon, { monday: { enabled: true, from: "09:20", to: "15:00" } }, 50)).toEqual({ total: 1, days: ["Даваа"], best: 80, worst: 80 })
    expect(scheduleFit(mon, { monday: { enabled: true, from: "09:10", to: "17:00" } }, 75)?.best).toBe(97)
    expect(scheduleFit(mon, { monday: { enabled: true, from: "09:20", to: "15:00" } }, 100)?.days).toEqual([])
    expect(scheduleFit(mon, { monday: { enabled: true, from: "17:00", to: "20:00" } }, 50)?.days).toEqual([])
  })

  it("гурван өдрийн нэг нь л таарвал тохирно", () => {
    const job = {
      monday: { enabled: true, from: "09:27", to: "16:27" },
      tuesday: { enabled: true, from: "09:27", to: "14:28" },
      saturday: { enabled: true, from: "09:27", to: "16:27" },
    }
    const fit = scheduleFit(job, { saturday: { enabled: true, from: "09:00", to: "17:00" } }, 100)
    expect(fit).toEqual({ total: 3, days: ["Бямба"], best: 100, worst: 100 })
    // Хуваарьгүй зар, цаг оруулаагүй ажилтан
    expect(scheduleFit(null, job, 50)).toBeNull()
    expect(scheduleFit(job, {}, 50)).toBeNull()
  })

  it("URL-д хадгалах хэлбэрт хувиргаж, буцааж уншина", () => {
    const s = { ...emptySchedule(), monday: { enabled: true, from: "09:20", to: "15:00" }, saturday: { enabled: true, from: "10:00", to: "" } }
    expect(encodeSchedule(s)).toBe("monday.0920-1500")
    expect(decodeSchedule("monday.0920-1500,funday.0900-1000,sunday.99xx")?.monday).toEqual({ enabled: true, from: "09:20", to: "15:00" })
    expect(decodeSchedule("bad")).toBeNull()
    expect(decodeSchedule(null)).toBeNull()
  })
})
