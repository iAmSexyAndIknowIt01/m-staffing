import { describe, expect, it } from "vitest"
import { getProfileCompleteness } from "./companyProfileCompleteness"

describe("getProfileCompleteness", () => {
  it("бүх талбар бөглөгдсөн бол 100%", () => {
    expect(
      getProfileCompleteness({
        logo_url: "x", tagline: "x", description: "x", industry: "x", company_size: "x", phone: "x", website: "x",
      })
    ).toEqual({ percent: 100, missing: [] })
  })

  it("хоосон эсвэл зөвхөн зай агуулсан талбарыг дутуу гэж тооцно", () => {
    const result = getProfileCompleteness({ description: "  ", industry: "Банк", company_size: "11-50 ажилтан" })
    expect(result.percent).toBe(29)
    expect(result.missing).toEqual(["Лого", "Товч уриа", "Байгууллагын танилцуулга", "Утасны дугаар", "Цахим хуудас"])
  })
})
