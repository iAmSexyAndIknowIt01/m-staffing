import { describe, expect, it } from "vitest"
import {
  generateResetCode,
  hashResetCode,
  isResetCodeMatch,
  normalizeEmail,
  validateNewPassword,
} from "./passwordReset"

describe("сэргээх код", () => {
  it("6 оронтой тоо үүсгэнэ", () => {
    for (let i = 0; i < 50; i++) expect(generateResetCode()).toMatch(/^\d{6}$/)
  })

  it("hash нь кодыг ил агуулахгүй, тулгалт зөв ажиллана", () => {
    const hash = hashResetCode("123456")
    expect(hash).not.toContain("123456")
    expect(hash).toHaveLength(64)
    expect(isResetCodeMatch("123456", hash)).toBe(true)
    expect(isResetCodeMatch("123457", hash)).toBe(false)
  })

  it("гэмтсэн hash-д false буцаана", () => {
    expect(isResetCodeMatch("123456", "abc")).toBe(false)
  })
})

describe("normalizeEmail", () => {
  it("жижиг үсэг болгож, зайг арилгана", () => {
    expect(normalizeEmail("  User@Mail.MN ")).toBe("user@mail.mn")
  })

  it("буруу имэйлд null", () => {
    expect(normalizeEmail("abc")).toBeNull()
    expect(normalizeEmail(123)).toBeNull()
  })
})

describe("validateNewPassword", () => {
  it("шаардлага хангасан нууц үгийг зөвшөөрнө", () => {
    expect(validateNewPassword("secret123")).toBeNull()
  })

  it("богино, тоогүй, үсэггүй нууц үгийг татгалзана", () => {
    expect(validateNewPassword("abc12")).not.toBeNull()
    expect(validateNewPassword("abcdefgh")).not.toBeNull()
    expect(validateNewPassword("12345678")).not.toBeNull()
    expect(validateNewPassword(undefined)).not.toBeNull()
    expect(validateNewPassword("a1".repeat(40))).not.toBeNull()
  })
})
