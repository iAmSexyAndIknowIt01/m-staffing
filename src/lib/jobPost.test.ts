import { describe, expect, it } from "vitest"
import {
  SALARY_NEGOTIABLE,
  formatSalaryInput,
  getJobCategoryLabel,
  getJobTypeLabel,
  isJobCategory,
  jobFormErrors,
  salaryDigits,
  salaryError,
} from "./jobPost"

const valid = {
  title: "Кассчин",
  category: "retail",
  jobType: "fulltime",
  location: "Улаанбаатар, Сүхбаатар дүүрэг",
  salary: "1500000",
  salaryType: "monthly",
  description: "Харилцагчдад үйлчилгээ үзүүлж, кассын тооцоо хийнэ.",
  requirements: "Харилцааны соёлтой, хариуцлагатай байх.",
}

describe("ангилал, ажлын төрөл", () => {
  it("мэдэгдэж буй ангиллыг монгол шошгоор харуулна", () => {
    expect(getJobCategoryLabel("it")).toBe("Мэдээллийн технологи (IT)")
    expect(getJobCategoryLabel("IT")).toBe("Мэдээллийн технологи (IT)")
    expect(getJobCategoryLabel("Худалдаа")).toBe("Худалдаа")
    expect(isJobCategory("food")).toBe(true)
    expect(isJobCategory("x")).toBe(false)
  })

  it("гэрээт болон хуучин нэршлийг орчуулна", () => {
    expect(getJobTypeLabel("contract")).toBe("Гэрээт")
    expect(getJobTypeLabel("full_time")).toBe("Бүтэн цаг")
  })
})

describe("цалин", () => {
  it("тоо, «Тохиролцоно»-г зөвшөөрнө", () => {
    expect(salaryError("1500000")).toBeNull()
    expect(salaryError(SALARY_NEGOTIABLE)).toBeNull()
  })

  it("буруу утгыг татгалзана", () => {
    for (const v of ["", "0", "-5", "1e5", "abc", "2,500,000", "10000000000"]) {
      expect(salaryError(v)).not.toBeNull()
    }
  })

  it("цифр ялгаж, мянгатаар форматлана", () => {
    expect(salaryDigits("2,500,000₮")).toBe("2500000")
    expect(formatSalaryInput("2500000")).toBe("2,500,000")
  })
})

describe("jobFormErrors", () => {
  it("зөв формд алдаагүй", () => {
    expect(jobFormErrors(valid)).toEqual({})
  })

  it("дутуу, богино талбаруудыг заана", () => {
    const errors = jobFormErrors({ ...valid, title: "", category: "", location: " ", salary: "", description: "Богино", requirements: "" })
    expect(Object.keys(errors).sort()).toEqual(["category", "description", "location", "requirements", "salary", "title"])
  })
})
