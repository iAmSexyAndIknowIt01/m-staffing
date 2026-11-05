import { describe, expect, it } from "vitest"
import { compactSchedule, emptySchedule, scheduleError, toSchedule } from "./weeklySchedule"

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
})
