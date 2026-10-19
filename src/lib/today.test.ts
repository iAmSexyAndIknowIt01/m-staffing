import { describe, expect, it } from "vitest"
import { formatToday } from "./today"

describe("formatToday", () => {
  it("он, сар, өдөр болон гарагийг монголоор форматлана", () => {
    expect(formatToday(new Date(2026, 9, 19))).toEqual({ date: "2026 оны 10 сарын 19", weekday: "Даваа гараг" })
  })

  it("ням гарагийг зөв нэрлэнэ", () => {
    expect(formatToday(new Date(2026, 0, 4)).weekday).toBe("Ням гараг")
  })
})
