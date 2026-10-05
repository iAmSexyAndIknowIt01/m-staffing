import { describe, expect, it } from "vitest"
import {
  allowedActions,
  contentHash,
  effectiveStatus,
  nextStatus,
  parseSalary,
  readyToSendError,
  todayISO,
  validateContractTerms,
} from "./contracts"

const validInput = {
  position: "Нягтлан",
  salary: "2500000",
  salary_type: "monthly",
  start_date: "2026-11-01",
  end_date: "2027-10-31",
  work_hours: " 09:00-18:00 ",
  location: "",
  terms: "Талууд Хөдөлмөрийн тухай хуулийн дагуу ажиллана.",
}

describe("nextStatus", () => {
  it("компани ноорог гэрээг илгээнэ", () => {
    expect(nextStatus("send", "draft", "company")).toBe("sent")
  })

  it("ажилтан илгээгдсэн гэрээнд гарын үсэг зурна", () => {
    expect(nextStatus("sign", "sent", "staff")).toBe("active")
  })

  it("компани ажилтны өмнөөс гарын үсэг зурж чадахгүй", () => {
    expect(nextStatus("sign", "sent", "company")).toBeNull()
  })

  it("ажилтан ноорог гэрээнд гарын үсэг зурж чадахгүй", () => {
    expect(nextStatus("sign", "draft", "staff")).toBeNull()
  })

  it("хүчинтэй гэрээг аль ч тал цуцална", () => {
    expect(nextStatus("terminate", "active", "company")).toBe("terminated")
    expect(nextStatus("terminate", "active", "staff")).toBe("terminated")
  })

  it("хүчинтэй гэрээг засварлах (revise) боломжгүй", () => {
    expect(nextStatus("revise", "active", "company")).toBeNull()
  })

  it("дууссан төлөвөөс шилжилт байхгүй", () => {
    for (const status of ["declined", "cancelled", "terminated", "expired"] as const) {
      expect(allowedActions(status, "company")).toEqual([])
      expect(allowedActions(status, "staff")).toEqual([])
    }
  })
})

describe("allowedActions", () => {
  it("илгээгдсэн гэрээнд талуудын үйлдэл", () => {
    expect(allowedActions("sent", "company")).toEqual(["revise", "cancel"])
    expect(allowedActions("sent", "staff")).toEqual(["sign", "decline"])
  })
})

describe("effectiveStatus", () => {
  it("дуусах огноо өнгөрсөн хүчинтэй гэрээ expired болно", () => {
    expect(effectiveStatus({ status: "active", end_date: "2026-10-04" }, "2026-10-05")).toBe("expired")
  })

  it("дуусах өдөр нь өөрөө хүчинтэй хэвээр", () => {
    expect(effectiveStatus({ status: "active", end_date: "2026-10-05" }, "2026-10-05")).toBe("active")
  })

  it("хугацаагүй гэрээ дуусахгүй", () => {
    expect(effectiveStatus({ status: "active", end_date: null }, "2099-01-01")).toBe("active")
  })
})

describe("todayISO", () => {
  it("Улаанбаатарын цагаар огноо гаргана", () => {
    // UTC 2026-10-05 17:00 = УБ 2026-10-06 01:00
    expect(todayISO(new Date("2026-10-05T17:00:00Z"))).toBe("2026-10-06")
  })
})

describe("validateContractTerms", () => {
  it("зөв оролтыг цэвэрлэнэ", () => {
    const result = validateContractTerms(validInput)
    expect(result).toEqual({
      ok: true,
      data: {
        position: "Нягтлан",
        salary: 2500000,
        salary_type: "monthly",
        start_date: "2026-11-01",
        end_date: "2027-10-31",
        work_hours: "09:00-18:00",
        location: null,
        terms: "Талууд Хөдөлмөрийн тухай хуулийн дагуу ажиллана.",
      },
    })
  })

  it("хоосон дуусах огноо = хугацаагүй", () => {
    const result = validateContractTerms({ ...validInput, end_date: "" })
    expect(result.ok && result.data.end_date).toBeNull()
  })

  it("дуусах огноо эхлэхээс өмнө байвал алдаа", () => {
    expect(validateContractTerms({ ...validInput, end_date: "2026-10-01" }).ok).toBe(false)
  })

  it("байхгүй огноог (2026-02-30) хүлээж авахгүй", () => {
    expect(validateContractTerms({ ...validInput, start_date: "2026-02-30" }).ok).toBe(false)
  })

  it("сөрөг цалин, буруу төрлийг хүлээж авахгүй", () => {
    expect(validateContractTerms({ ...validInput, salary: -1 }).ok).toBe(false)
    expect(validateContractTerms({ ...validInput, salary_type: "weekly" }).ok).toBe(false)
  })

  it("албан тушаал заавал", () => {
    expect(validateContractTerms({ ...validInput, position: "  " }).ok).toBe(false)
  })
})

describe("readyToSendError", () => {
  it("цалин 0 бол илгээхгүй", () => {
    const result = validateContractTerms({ ...validInput, salary: 0 })
    expect(result.ok && readyToSendError(result.data)).toBeTruthy()
  })

  it("бүрэн гэрээг илгээж болно", () => {
    const result = validateContractTerms(validInput)
    expect(result.ok && readyToSendError(result.data)).toBeNull()
  })
})

describe("contentHash", () => {
  it("нөхцөл эсвэл хувилбар өөрчлөгдвөл hash өөрчлөгдөнө", async () => {
    const result = validateContractTerms(validInput)
    if (!result.ok) throw new Error("invalid")
    const base = await contentHash(result.data, 1)

    expect(base).toMatch(/^[0-9a-f]{64}$/)
    expect(await contentHash(result.data, 1)).toBe(base)
    expect(await contentHash(result.data, 2)).not.toBe(base)
    expect(await contentHash({ ...result.data, salary: 2500001 }, 1)).not.toBe(base)
  })
})

describe("parseSalary", () => {
  it("текстэн цалингаас тоо гаргана", () => {
    expect(parseSalary("1,500,000₮")).toBe(1500000)
    expect(parseSalary(null)).toBe(0)
    expect(parseSalary("Тохиролцоно")).toBe(0)
  })
})
