import { describe, expect, it } from "vitest"
import { COMPANY_COVERS, DEFAULT_COVER, isCompanyCover, toCompanyCover } from "./companyCovers"
import { parseCompanyProfile } from "./companyProfile"

describe("companyCovers", () => {
  it("14 загвар, id давхцахгүй, анхдагч нь жагсаалтад байна", () => {
    expect(COMPANY_COVERS).toHaveLength(14)
    expect(new Set(COMPANY_COVERS.map((c) => c.id)).size).toBe(COMPANY_COVERS.length)
    expect(isCompanyCover(DEFAULT_COVER)).toBe(true)
  })

  it("буруу, хоосон, prototype түлхүүрийг анхдагч болгоно", () => {
    expect(toCompanyCover("sunset")).toBe("sunset")
    expect(toCompanyCover(null)).toBe(DEFAULT_COVER)
    expect(toCompanyCover("constructor")).toBe(DEFAULT_COVER)
    expect(toCompanyCover("<script>")).toBe(DEFAULT_COVER)
  })
})

describe("parseCompanyProfile cover_style", () => {
  const base = { company_name: "Тест ХХК" }

  it("илгээгээгүй бол хадгалсан утгад хүрэхгүй", () => {
    const r = parseCompanyProfile(base)
    expect(r.ok && "cover_style" in r.data).toBe(false)
  })

  it("зөв загварыг хүлээж авна, буруу бол алдаа", () => {
    const ok = parseCompanyProfile({ ...base, cover_style: "waves" })
    expect(ok.ok && ok.data.cover_style).toBe("waves")
    expect(parseCompanyProfile({ ...base, cover_style: "rainbow" })).toEqual({ ok: false, error: "Cover загвар буруу байна." })
  })
})
