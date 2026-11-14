import { describe, expect, it } from "vitest"
import { getStaffCompleteness, isStaffProfileComplete, type StaffCompletenessInput } from "./staffProfileCompleteness"

const full: StaffCompletenessInput = {
  fullName: "Бат Болд",
  phone: "99112233",
  bio: "Бариста туршлагатай",
  avatarUrl: "https://example.com/a.png",
  gender: "male",
  skills: { technical: ["Касс"], languages: [] },
  experienceCount: 1,
  educationCount: 1,
  enabledDays: 2,
}

describe("getStaffCompleteness", () => {
  it("бүх хэсэг бөглөгдсөн бол 100%", () => {
    expect(getStaffCompleteness(full)).toEqual({ percent: 100, missing: [] })
    expect(isStaffProfileComplete(full)).toBe(true)
  })

  it("дутуу хэсгийг нэрлэнэ", () => {
    const r = getStaffCompleteness({ ...full, avatarUrl: "", experienceCount: 0, bio: "   " })
    expect(r.missing).toEqual(["зураг", "танилцуулга", "ажлын туршлага"])
    expect(r.percent).toBe(67)
  })

  it("хэл эсвэл техник ур чадварын аль нэг нь хангалттай, null skills-ийг дутуу гэж үзнэ", () => {
    expect(isStaffProfileComplete({ ...full, skills: { technical: [], languages: ["Англи"] } })).toBe(true)
    expect(isStaffProfileComplete({ ...full, skills: null })).toBe(false)
  })

  it("ажиллах цаг сонгоогүй бол бүрэн биш", () => {
    expect(isStaffProfileComplete({ ...full, enabledDays: 0 })).toBe(false)
  })
})
