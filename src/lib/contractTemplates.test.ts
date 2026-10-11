import { describe, expect, it } from "vitest"
import { applyTemplate, contractEndDate, normalizeTemplate, templateFromTerms, validateTemplate } from "./contractTemplates"
import type { ContractTemplateInput, ContractTerms } from "@/types/contract"

const TERMS = "Талууд Хөдөлмөрийн тухай хуулийн дагуу ажиллана."

const baseTerms: ContractTerms = {
  position: "Кассчин",
  salary: 1500000,
  salary_type: "monthly",
  start_date: "2026-10-15",
  end_date: null,
  work_hours: null,
  location: "Улаанбаатар",
  terms: "Анхны нөхцөл",
}

const template: ContractTemplateInput = {
  name: "Цагийн ажилтан",
  is_default: false,
  position: null,
  salary: 12000,
  salary_type: "hourly",
  duration_months: 3,
  work_hours: "Даваа-Баасан 09:00-18:00",
  location: null,
  terms: TERMS,
}

describe("validateTemplate", () => {
  it("хоосон талбаруудыг null болгож цэвэрлэнэ", () => {
    const result = validateTemplate({ name: "  Үндсэн  ", position: " ", salary: "", duration_months: "", terms: TERMS })
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Үндсэн",
        is_default: false,
        position: null,
        salary: null,
        salary_type: "monthly",
        duration_months: null,
        work_hours: null,
        location: null,
        terms: TERMS,
      },
    })
  })

  it("нэр, нөхцөл заавал", () => {
    expect(validateTemplate({ name: "", terms: TERMS }).ok).toBe(false)
    expect(validateTemplate({ name: "А", terms: "богино" }).ok).toBe(false)
  })

  it("буруу цалин, хугацаа, төрлийг хүлээж авахгүй", () => {
    expect(validateTemplate({ name: "А", terms: TERMS, salary: -1 }).ok).toBe(false)
    expect(validateTemplate({ name: "А", terms: TERMS, duration_months: 0 }).ok).toBe(false)
    expect(validateTemplate({ name: "А", terms: TERMS, duration_months: 2.5 }).ok).toBe(false)
    expect(validateTemplate({ name: "А", terms: TERMS, salary_type: "weekly" }).ok).toBe(false)
  })

  it("тоон утгыг string-ээс хөрвүүлнэ", () => {
    const result = validateTemplate({ name: "А", terms: TERMS, salary: "2500000", duration_months: "12", is_default: true })
    expect(result.ok && result.data).toMatchObject({ salary: 2500000, duration_months: 12, is_default: true })
  })
})

describe("contractEndDate", () => {
  it("N сарын дараах өмнөх өдөр дуусна", () => {
    expect(contractEndDate("2026-10-15", 12)).toBe("2027-10-14")
    expect(contractEndDate("2026-03-01", 1)).toBe("2026-03-31")
    expect(contractEndDate("2026-11-01", 3)).toBe("2027-01-31")
  })

  it("сард байхгүй өдрийг сарын сүүлээр тооцно", () => {
    expect(contractEndDate("2026-01-31", 1)).toBe("2026-02-28")
    expect(contractEndDate("2027-12-31", 2)).toBe("2028-02-29")
  })

  it("буруу огноонд null", () => {
    expect(contractEndDate("", 3)).toBeNull()
  })
})

describe("applyTemplate", () => {
  it("загварт байгаа талбарыг хэрэглэж, хоосныг хэвээр үлдээнэ", () => {
    expect(applyTemplate(baseTerms, template)).toEqual({
      ...baseTerms,
      salary: 12000,
      salary_type: "hourly",
      end_date: "2027-01-14",
      work_hours: "Даваа-Баасан 09:00-18:00",
      terms: TERMS,
    })
  })

  it("цалингүй загвар цалингийн төрлийг өөрчлөхгүй, хугацаагүй загвар дуусах огноог хадгална", () => {
    const applied = applyTemplate({ ...baseTerms, end_date: "2027-01-01" }, { ...template, salary: null, duration_months: null })
    expect(applied.salary).toBe(1500000)
    expect(applied.salary_type).toBe("monthly")
    expect(applied.end_date).toBe("2027-01-01")
  })
})

describe("templateFromTerms", () => {
  it("гэрээний нөхцлөөс загвар үүсгэнэ, 0 цалинг хоосон гэж үзнэ", () => {
    expect(templateFromTerms("Шинэ", { ...baseTerms, salary: 0 })).toMatchObject({
      name: "Шинэ",
      position: "Кассчин",
      salary: null,
      duration_months: null,
      terms: "Анхны нөхцөл",
    })
  })
})

describe("normalizeTemplate", () => {
  it("numeric string-ийг тоо болгоно", () => {
    expect(normalizeTemplate({ salary: "1500000.00" }).salary).toBe(1500000)
    expect(normalizeTemplate({ salary: null }).salary).toBeNull()
  })
})
