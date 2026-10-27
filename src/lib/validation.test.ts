import { describe, expect, it } from "vitest"
import { getClientIp } from "./clientIp"
import { normalizeHttpUrl } from "./url"
import { canCompanySetStatus } from "./jobRequest"
import { PAID_PLAN_DAYS, PLANS, computePaidPackage, isPlanType } from "./plans"
import { parseEducation, parseExperience, parseSkillNames } from "./staffProfile"
import { parseCompanyProfile } from "./companyProfile"
import { jobPostError } from "./jobPost"
import { chunk, selectInChunks } from "./chunk"
import { isContractAction, toContractSalaryType, validateContractTerms } from "./contracts"

const DAY_MS = 24 * 60 * 60 * 1000

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x.mn", { headers })

  it("proxy-н тавьсан x-real-ip-г эхэлж авна", () => {
    expect(getClientIp(req({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9" }))).toBe("1.1.1.1")
  })

  it("x-forwarded-for-ийн клиентийн зохиосон эхний утгыг биш, сүүлийнхийг авна", () => {
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2")
  })

  it("толгой байхгүй бол null", () => {
    expect(getClientIp(req({}))).toBeNull()
  })
})

describe("normalizeHttpUrl", () => {
  it("хоосон утгад null", () => {
    expect(normalizeHttpUrl("")).toBeNull()
    expect(normalizeHttpUrl("   ")).toBeNull()
    expect(normalizeHttpUrl(null)).toBeNull()
    expect(normalizeHttpUrl(undefined)).toBeNull()
  })

  it("схемгүй хаягт https:// нэмнэ", () => {
    expect(normalizeHttpUrl("mstaffing.mn")).toBe("https://mstaffing.mn/")
    expect(normalizeHttpUrl("http://a.mn/x")).toBe("http://a.mn/x")
  })

  it("аюултай схем болон буруу утгыг татгалзана", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeUndefined()
    expect(normalizeHttpUrl("data:text/html,<script>")).toBeUndefined()
    expect(normalizeHttpUrl("JavaScript:alert(1)")).toBeUndefined()
    expect(normalizeHttpUrl("not a url")).toBeUndefined()
    expect(normalizeHttpUrl(123)).toBeUndefined()
    expect(normalizeHttpUrl(`https://a.mn/${"x".repeat(600)}`)).toBeUndefined()
  })
})

describe("canCompanySetStatus", () => {
  it("UI-ийн урсгалыг зөвшөөрнө", () => {
    expect(canCompanySetStatus("pending", "interview")).toBe(true)
    expect(canCompanySetStatus("new", "rejected")).toBe(true)
    expect(canCompanySetStatus("interview", "rejected")).toBe(true)
    expect(canCompanySetStatus("accepted", "approved")).toBe(true)
    expect(canCompanySetStatus("accepted", "not-approved")).toBe(true)
  })

  it("алгасах, буцаах, эцсийн төлөвийг өөрчлөхийг хориглоно", () => {
    expect(canCompanySetStatus("pending", "approved")).toBe(false) // ярилцлагагүйгээр тэнцүүлэх
    expect(canCompanySetStatus("interview", "accepted")).toBe(false) // зөвхөн ажилтан хүлээж авна
    expect(canCompanySetStatus("approved", "rejected")).toBe(false)
    expect(canCompanySetStatus("rejected", "interview")).toBe(false)
    expect(canCompanySetStatus("pending", "constructor")).toBe(false)
  })
})

describe("computePaidPackage", () => {
  const now = new Date("2026-10-07T00:00:00Z")
  const yearLater = now.getTime() + PAID_PLAN_DAYS * DAY_MS

  it("хүчинтэй багцын үлдсэн эрхийг шинэ багц руу шилжүүлж, хугацааг 1 жил болгоно", () => {
    const pkg = computePaidPackage({ status: "active", remaining: 4 }, "starter", now)
    expect(pkg.jobLimit).toBe(4 + PLANS.starter.jobLimit)
    expect(pkg.expiresAt.getTime()).toBe(yearLater)
  })

  it("хугацаа дууссан эсвэл багцгүй үед зөвхөн шинэ багцын эрх", () => {
    expect(computePaidPackage({ status: "expired", remaining: 0 }, "premium", now).jobLimit).toBe(PLANS.premium.jobLimit)
    expect(computePaidPackage(null, "standard", now)).toEqual({ jobLimit: PLANS.standard.jobLimit, expiresAt: new Date(yearLater) })
  })
})

describe("prototype-ийн түлхүүрийг хүлээж авахгүй", () => {
  it("isPlanType, isContractAction, toContractSalaryType", () => {
    expect(isPlanType("constructor")).toBe(false)
    expect(isPlanType("premium")).toBe(true)
    expect(isContractAction("toString")).toBe(false)
    expect(isContractAction("sign")).toBe(true)
    expect(toContractSalaryType("constructor")).toBe("monthly")
  })

  it("validateContractTerms нь salary_type=constructor-ийг татгалзана", () => {
    const result = validateContractTerms({ position: "Нярав", salary: 1, salary_type: "constructor", start_date: "2026-10-07" })
    expect(result.ok).toBe(false)
  })
})

describe("parseExperience", () => {
  const valid = { company: "Тэст ХХК", position: "Нярав", startDate: "2024-01-01", endDate: "", description: "" }

  it("зөв оролтыг DB-ийн мөр болгоно", () => {
    const result = parseExperience([valid])
    expect(result).toEqual({
      ok: true,
      rows: [{ company: "Тэст ХХК", position: "Нярав", start_date: "2024-01-01", end_date: null, description: "" }],
    })
  })

  it("DB-д бичихээс өмнө буруу огноог барина", () => {
    expect(parseExperience([{ ...valid, startDate: "abc" }]).ok).toBe(false)
    expect(parseExperience([{ ...valid, startDate: "2024-02-30" }]).ok).toBe(false)
    expect(parseExperience([{ ...valid, endDate: "2023-01-01" }]).ok).toBe(false)
  })

  it("хоосон, массив биш, дутуу талбартай оролтыг татгалзана", () => {
    expect(parseExperience([]).ok).toBe(false)
    expect(parseExperience("x").ok).toBe(false)
    expect(parseExperience([{ ...valid, company: " " }]).ok).toBe(false)
    expect(parseExperience([null]).ok).toBe(false)
  })
})

describe("parseEducation", () => {
  const valid = { school: "МУИС", degree: "Бакалавр", field: "Эдийн засаг", graduationYear: "2020", isCurrent: false }

  it("төгссөн оныг тоо болгоно", () => {
    const result = parseEducation([valid])
    expect(result.ok && result.rows[0].graduation_year).toBe(2020)
  })

  it("буруу оныг татгалзана", () => {
    expect(parseEducation([{ ...valid, graduationYear: "20x0" }]).ok).toBe(false)
    expect(parseEducation([{ ...valid, graduationYear: "1800" }]).ok).toBe(false)
  })
})

describe("parseSkillNames", () => {
  it("техникийн болон хэлний ур чадварыг нэгтгэнэ", () => {
    expect(parseSkillNames({ technical: ["Excel"], languages: ["Англи"] })).toEqual(["Excel", "Англи"])
  })

  it("тэмдэгт мөр биш утгыг татгалзана", () => {
    expect(parseSkillNames({ technical: [1] })).toBeNull()
    expect(parseSkillNames(null)).toBeNull()
  })
})

describe("parseCompanyProfile", () => {
  it("холбоосуудыг цэвэрлэж, хоосон талбарыг null болгоно", () => {
    const result = parseCompanyProfile({ company_name: " Тэст ХХК ", website: "test.mn", phone: "" })
    expect(result).toMatchObject({ ok: true, data: { company_name: "Тэст ХХК", website: "https://test.mn/", phone: null, logo_url: null } })
  })

  it("javascript: холбоос болон нэргүй компанийг татгалзана", () => {
    expect(parseCompanyProfile({ company_name: "A", website: "javascript:alert(1)" }).ok).toBe(false)
    expect(parseCompanyProfile({ company_name: "A", facebook_url: "javascript:alert(1)" }).ok).toBe(false)
    expect(parseCompanyProfile({ company_name: "  " }).ok).toBe(false)
  })
})

describe("jobPostError", () => {
  it("мэдэгдэж буй утгыг зөвшөөрнө", () => {
    expect(jobPostError({ title: "Нярав", salary: "1500000", salaryType: "monthly", jobType: "fulltime" })).toBeNull()
  })

  it("мэдэгдэхгүй төрлийг татгалзана", () => {
    expect(jobPostError({ salaryType: "constructor" })).not.toBeNull()
    expect(jobPostError({ jobType: "x" })).not.toBeNull()
    expect(jobPostError({ title: "x".repeat(201) })).not.toBeNull()
  })
})

describe("chunk / selectInChunks", () => {
  it("массивыг хэсэглэнэ", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it("давхардсан ID-г хасаж, хэсэг бүрээр query хийгээд нэгтгэнэ", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `id-${i}`)
    const calls: number[] = []
    const rows = await selectInChunks([...ids, "id-0"], async (part) => {
      calls.push(part.length)
      return { data: part.map((id) => ({ id })), error: null }
    })
    expect(calls).toEqual([100, 100, 50])
    expect(rows).toHaveLength(250)
  })

  it("алдааг дамжуулна", async () => {
    await expect(selectInChunks(["a"], async () => ({ data: null, error: new Error("db") }))).rejects.toThrow("db")
  })
})
