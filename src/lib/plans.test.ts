import { beforeEach, describe, expect, it, vi } from "vitest"

// Supabase query builder-ийн хялбар хуурамч хувилбар
const state = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null,
  postedCount: 0,
  since: null as string | null,
}))

vi.mock("@/lib/supabase", () => {
  const builder = (table: string) => {
    const q = {
      select: () => q,
      eq: () => q,
      gte: (_col: string, value: string) => {
        state.since = value
        return q
      },
      maybeSingle: async () => ({ data: state.subscription, error: null }),
      then: (resolve: (v: unknown) => void) => resolve({ count: table === "mt_openjob" ? state.postedCount : 0, error: null }),
    }
    return q
  }
  return { supabase: { from: builder } }
})

import { PAID_PLAN_DAYS, PLANS, getEffectiveSubscription, hasReachedJobLimit } from "./plans"

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  state.subscription = null
  state.postedCount = 0
  state.since = null
})

describe("PLANS", () => {
  it("zangia маягийн багцууд", () => {
    expect(PLANS.starter).toMatchObject({ price: 800_000, jobLimit: 15 })
    expect(PLANS.standard).toMatchObject({ price: 1_500_000, jobLimit: 50 })
    expect(PLANS.premium).toMatchObject({ price: 2_800_000, jobLimit: 100 })
    expect(PAID_PLAN_DAYS).toBe(365)
  })
})

describe("getEffectiveSubscription", () => {
  it("багцын мөр байхгүй бол туршилтын эрх, нийт нийтэлсэн зараар тооцно", async () => {
    state.postedCount = 1
    expect(await getEffectiveSubscription("u")).toEqual({
      planType: "free",
      status: "active",
      jobLimit: PLANS.free.jobLimit,
      used: 1,
      remaining: PLANS.free.jobLimit - 1,
      expiresAt: null,
    })
    expect(state.since).toBeNull()
  })

  it("хуучин компанийн хадгалсан туршилтын тоог хүндэтгэнэ", async () => {
    state.subscription = { plan_type: "free", status: "active", job_limit: 10, expires_at: null }
    state.postedCount = 4
    expect(await getEffectiveSubscription("u")).toMatchObject({ jobLimit: 10, remaining: 6 })
  })

  it("төлбөртэй багцад зөвхөн худалдаж авснаас хойшхи зарыг тооцно", async () => {
    const expiresAt = new Date(Date.now() + 100 * DAY).toISOString()
    state.subscription = { plan_type: "starter", status: "active", job_limit: 15, expires_at: expiresAt }
    state.postedCount = 5
    const sub = await getEffectiveSubscription("u")
    expect(sub).toMatchObject({ planType: "starter", status: "active", jobLimit: 15, used: 5, remaining: 10 })
    expect(new Date(state.since!).getTime()).toBe(new Date(expiresAt).getTime() - PAID_PLAN_DAYS * DAY)
  })

  it("хугацаа дууссан бол үлдсэн эрх 0", async () => {
    state.subscription = { plan_type: "premium", status: "active", job_limit: 100, expires_at: new Date(Date.now() - DAY).toISOString() }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "premium", status: "expired", remaining: 0 })
  })

  it("үл мэдэгдэх plan_type-ыг туршилтын эрх гэж үзнэ", async () => {
    state.subscription = { plan_type: "gold", status: "active", job_limit: null, expires_at: null }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "free", jobLimit: PLANS.free.jobLimit })
  })
})

describe("hasReachedJobLimit", () => {
  it("эрх үлдсэн бол зөвшөөрнө", async () => {
    state.postedCount = PLANS.free.jobLimit - 1
    expect(await hasReachedJobLimit("u")).toEqual({ reached: false, limit: PLANS.free.jobLimit, remaining: 1, expired: false })
  })

  it("эрх дууссан бол хориглоно", async () => {
    state.postedCount = PLANS.free.jobLimit
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })
})
