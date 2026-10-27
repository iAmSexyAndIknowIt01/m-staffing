import { describe, expect, it } from "vitest"
import { isCyrillicName, normalizeName, stripNonCyrillic } from "./mongolianName"

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

describe("stripNonCyrillic", () => {
  it("кирилл бус тэмдэгтийг хасаж мэдэгдэнэ", () => {
    expect(stripNonCyrillic("Батbold1")).toEqual({ value: "Бат", removed: true })
    expect(stripNonCyrillic("Бат-Эрдэнэ")).toEqual({ value: "Бат-Эрдэнэ", removed: false })
  })
})
