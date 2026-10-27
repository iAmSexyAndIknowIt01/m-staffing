import { describe, expect, it } from "vitest"
import { getPasswordStrength, validateNewPassword } from "./password"

describe("getPasswordStrength", () => {
  it("хоосон үед 0", () => {
    expect(getPasswordStrength("").score).toBe(0)
  })

  it("шаардлага хангаагүй бол сул", () => {
    for (const pw of ["abc", "abcdefgh", "12345678", "abc1"]) {
      expect(getPasswordStrength(pw).score).toBe(1)
    }
  })

  it("нэмэлт шинжээр чанар өснө", () => {
    expect(getPasswordStrength("abcdefg1").label).toBe("Дунд")
    expect(getPasswordStrength("Abcdefg1").label).toBe("Сайн")
    expect(getPasswordStrength("Abcdefg1!").label).toBe("Маш сайн")
    expect(getPasswordStrength("abcdefghijk1!").label).toBe("Маш сайн")
  })

  it("шаардлага хангасан бол validateNewPassword-той нийцнэ", () => {
    for (const pw of ["abcdefg1", "Abcdefg1!", "abc", "12345678"]) {
      const s = getPasswordStrength(pw)
      expect(s.checks.every((c) => c.ok)).toBe(validateNewPassword(pw) === null)
    }
  })
})
