import { describe, expect, it } from "vitest"
import { birthDateLabel, calcAge, formatBirthDate, parseBirthDate } from "./birthDate"

const now = new Date(2026, 10, 14) // 2026-11-14

describe("calcAge", () => {
  it("төрсөн өдөр болсон, болоогүйг ялгана", () => {
    expect(calcAge("1995-11-14", now)).toBe(31)
    expect(calcAge("1995-11-15", now)).toBe(30)
    expect(calcAge("1995-03-12", now)).toBe(31)
  })
  it("буруу огноо", () => {
    expect(calcAge("2023-02-30", now)).toBeNull()
    expect(calcAge("1995/03/12", now)).toBeNull()
  })
})

describe("birthDateLabel", () => {
  it("огноо, насыг харуулна", () => {
    expect(formatBirthDate("1995-03-12")).toBe("1995.03.12")
    expect(birthDateLabel("1995-03-12", now)).toBe("1995.03.12 (31 нас)")
    expect(birthDateLabel(null, now)).toBe("")
  })
})

describe("parseBirthDate", () => {
  it("хоосон бол null", () => {
    expect(parseBirthDate("", now)).toEqual({ ok: true, value: null })
    expect(parseBirthDate(null, now)).toEqual({ ok: true, value: null })
  })
  it("зөв огноог хүлээж авна", () => {
    expect(parseBirthDate("2000-01-31", now)).toEqual({ ok: true, value: "2000-01-31" })
  })
  it("буруу, ирээдүй, хэт залуу, хэт өндөр настай", () => {
    expect(parseBirthDate("2000-13-01", now).ok).toBe(false)
    expect(parseBirthDate("2027-01-01", now).ok).toBe(false)
    expect(parseBirthDate("2015-01-01", now).ok).toBe(false)
    expect(parseBirthDate("1900-01-01", now).ok).toBe(false)
    expect(parseBirthDate(19950312, now).ok).toBe(false)
  })
})
