import { describe, expect, it } from "vitest"
import { formatRemaining, maskEmail, maskPhone } from "./staffContact"

describe("maskPhone", () => {
  it("эхний 2, сүүлийн 2 оронг үлдээнэ", () => {
    expect(maskPhone("96434301")).toBe("96****01")
  })
  it("богино, хоосон утга", () => {
    expect(maskPhone("1234")).toBe("****")
    expect(maskPhone("  ")).toBe("")
  })
})

describe("maskEmail", () => {
  it("нэр, домайны ихэнхийг нууна", () => {
    expect(maskEmail("ochoozb@gmail.com")).toBe("oc*****@g****.com")
  })
  it("богино нэр", () => {
    expect(maskEmail("a@x.mn")).toBe("a*@x*.mn")
  })
  it("@ байхгүй утгыг бүхэлд нь нууна", () => {
    expect(maskEmail("abc")).toBe("***")
    expect(maskEmail("")).toBe("")
  })
})

describe("formatRemaining", () => {
  const now = Date.parse("2026-11-14T10:00:00Z")
  it("цаг, минутаар", () => {
    expect(formatRemaining("2026-11-14T19:12:00Z", now)).toBe("9 цаг 12 мин")
    expect(formatRemaining("2026-11-14T20:00:00Z", now)).toBe("10 цаг")
    expect(formatRemaining("2026-11-14T10:05:00Z", now)).toBe("5 мин")
  })
  it("дууссан бол 0 мин", () => {
    expect(formatRemaining("2026-11-14T09:00:00Z", now)).toBe("0 мин")
  })
})
