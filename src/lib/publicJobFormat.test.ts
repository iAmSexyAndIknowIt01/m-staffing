import { describe, expect, it } from "vitest"
import { publicSalaryText, shortDescription } from "./publicJobFormat"

describe("publicSalaryText", () => {
  it("цалинг мянгатын таслал, хугацаатай харуулна", () => {
    expect(publicSalaryText("8000", "hourly")).toBe("8,000₮/цаг")
    expect(publicSalaryText("2,500,000₮", "monthly")).toBe("2,500,000₮/сар")
    expect(publicSalaryText("500000", null)).toBe("500,000₮")
  })

  it("хоосон эсвэл тохиролцох цалинд «Тохиролцоно»", () => {
    expect(publicSalaryText("", "monthly")).toBe("Тохиролцоно")
    expect(publicSalaryText("Тохиролцоно", null)).toBe("Тохиролцоно")
    expect(publicSalaryText("1000", "negotiable")).toBe("Тохиролцоно")
  })
})

describe("shortDescription", () => {
  it("мөр, илүү зайг цэвэрлэж, урт бол таслана", () => {
    expect(shortDescription("  Сайн\n\n ажилтан  ")).toBe("Сайн ажилтан")
    const long = shortDescription("а".repeat(200), 10)
    expect(long).toHaveLength(10)
    expect(long.endsWith("…")).toBe(true)
  })
})
