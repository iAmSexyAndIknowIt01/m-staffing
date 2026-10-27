import { describe, expect, it } from "vitest"
import { getNameError, isCyrillicName, normalizeName } from "./mongolianName"

describe("isCyrillicName", () => {
  it("кирилл нэрийг зөвшөөрнө", () => {
    for (const name of ["Бат", "Өлзий", "Үүрцайх", "Бат-Эрдэнэ", "Мөнх Очир", "  Болд  ", "Ёндон"]) {
      expect(isCyrillicName(name)).toBe(true)
    }
  })

  it("латин, тоо, тэмдэгт, хоосон утгыг татгалзана", () => {
    for (const name of ["Bat", "Батbold", "Бат1", "Бат!", "", "   ", "Б", "-Бат", "Бат-", "Бат--Болд", "Ваt"]) {
      expect(isCyrillicName(name)).toBe(false)
    }
  })

  it("хэт урт нэрийг татгалзана", () => {
    expect(isCyrillicName("Б".repeat(51))).toBe(false)
  })
})

describe("normalizeName", () => {
  it("илүү зайг цэгцэлнэ", () => {
    expect(normalizeName("  Мөнх   Очир ")).toBe("Мөнх Очир")
  })
})

describe("getNameError", () => {
  it("зөв нэрт алдаа буцаахгүй", () => {
    expect(getNameError("Бат-Эрдэнэ", "Нэрээ оруулна уу")).toBeNull()
  })

  it("шалтгаанаас нь хамаарсан тайлбар буцаана", () => {
    expect(getNameError("  ", "Нэрээ оруулна уу")).toBe("Нэрээ оруулна уу")
    expect(getNameError("Bat", "")).toMatch(/Латин/)
    expect(getNameError("Бат1", "")).toMatch(/Тоо/)
    expect(getNameError("Б", "")).toMatch(/2 үсэг/)
    expect(getNameError("Бат!", "")).toMatch(/кирилл үсэг/)
  })
})
