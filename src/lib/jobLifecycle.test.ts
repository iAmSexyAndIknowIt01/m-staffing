import { describe, expect, it } from "vitest"
import { daysLeft, JOB_POST_DAYS, planRenewal, planStatusChange, type JobTiming } from "./jobLifecycle"

const now = new Date("2026-11-01T00:00:00Z")
const DAY = 24 * 60 * 60 * 1000
const at = (days: number) => new Date(now.getTime() + days * DAY).toISOString()
const job = (status: string, expires_at: string | null = null, paused_remaining_seconds: number | null = null): JobTiming => ({
  status,
  expires_at,
  paused_remaining_seconds,
})

describe("planStatusChange", () => {
  it("ижил төлөв хадгалахад юу ч өөрчлөхгүй, эрх хасахгүй", () => {
    const r = planStatusChange(job("active", at(10)), "active", now)
    expect(r).toEqual({ update: { status: "active", expires_at: at(10), paused_remaining_seconds: null }, chargesCredit: false })
  })

  it("expired төлөвийг гараар тогтоохыг хориглоно", () => {
    expect(planStatusChange(job("active", at(10)), "expired", now)).toHaveProperty("error")
  })

  it("идэвхтэй → ноорог: үлдсэн хугацааг хадгалж, тоолохыг зогсооно", () => {
    const r = planStatusChange(job("active", at(10)), "draft", now)
    expect(r).toEqual({ update: { status: "draft", expires_at: null, paused_remaining_seconds: 10 * 24 * 3600 }, chargesCredit: false })
  })

  it("ноорог → идэвхтэй: үлдсэн хугацаагаар үнэгүй үргэлжилнэ", () => {
    const later = new Date(now.getTime() + 5 * DAY)
    const r = planStatusChange(job("draft", null, 10 * 24 * 3600), "active", later)
    expect(r).toEqual({
      update: { status: "active", expires_at: new Date(later.getTime() + 10 * DAY).toISOString(), paused_remaining_seconds: null },
      chargesCredit: false,
    })
  })

  it("хэзээ ч нийтлэгдээгүй ноорог → идэвхтэй: 30 хоног, эрх хасахгүй", () => {
    const r = planStatusChange(job("draft"), "active", now)
    expect(r).toEqual({ update: { status: "active", expires_at: at(JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: false })
  })

  it("хаагдсан болон хугацаа дууссан зарыг дахин нээхэд эрх хасч 30 хоног өгнө", () => {
    for (const status of ["closed", "expired"]) {
      const r = planStatusChange(job(status, at(-3)), "active", now)
      expect(r).toEqual({ update: { status: "active", expires_at: at(JOB_POST_DAYS), paused_remaining_seconds: null }, chargesCredit: true })
    }
  })

  it("хаагдсан → ноорог → идэвхтэй замаар эрх хасалтаас зайлсхийх боломжгүй", () => {
    const toDraft = planStatusChange(job("closed", at(-3)), "draft", now)
    if ("error" in toDraft) throw new Error(toDraft.error)
    expect(toDraft.update.expires_at).not.toBeNull()
    const reopen = planStatusChange(toDraft.update, "active", now)
    expect(reopen).toHaveProperty("chargesCredit", true)
  })

  it("идэвхтэй → хаагдсан: expires_at хадгалагдана", () => {
    const r = planStatusChange(job("active", at(12)), "closed", now)
    expect(r).toEqual({ update: { status: "closed", expires_at: at(12), paused_remaining_seconds: null }, chargesCredit: false })
  })
})

describe("planRenewal", () => {
  it("идэвхтэй зарыг дуусах огнооноос нь 30 хоног сунгана", () => {
    expect(planRenewal(job("active", at(5)), now)).toEqual({
      update: { status: "active", expires_at: at(5 + JOB_POST_DAYS), paused_remaining_seconds: null },
      chargesCredit: true,
    })
  })

  it("хугацаа дууссан зарыг өнөөдрөөс 30 хоногоор дахин нээнэ", () => {
    expect(planRenewal(job("expired", at(-2)), now)).toEqual({
      update: { status: "active", expires_at: at(JOB_POST_DAYS), paused_remaining_seconds: null },
      chargesCredit: true,
    })
  })

  it("хугацаагүй идэвхтэй зарыг сунгахгүй (эрх хасахгүй)", () => {
    expect(planRenewal(job("active", null), now)).toHaveProperty("error")
  })

  it("ноорог зарыг сунгахгүй", () => {
    expect(planRenewal(job("draft"), now)).toHaveProperty("error")
  })
})

describe("daysLeft", () => {
  it("үлдсэн хоногийг дээш бүхэлчилнэ, өнгөрсөн бол 0", () => {
    expect(daysLeft(at(2.2), now)).toBe(3)
    expect(daysLeft(at(-1), now)).toBe(0)
    expect(daysLeft(null, now)).toBeNull()
  })
})
