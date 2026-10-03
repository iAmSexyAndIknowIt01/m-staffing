import { beforeEach, describe, expect, it, vi } from "vitest"

// Supabase query builder-ийн хялбар хуурамч хувилбар
const state = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null,
  activeJobCount: 0,
  lastNeq: null as string | null,
}))

vi.mock("@/lib/supabase", () => {
  const builder = (table: string) => {
    const q = {
      select: () => q,
      eq: () => q,
      neq: (_col: string, value: string) => {
        state.lastNeq = value
        return q
      },
      maybeSingle: async () => ({ data: state.subscription, error: null }),
      then: (resolve: (v: unknown) => void) =>
        resolve({ count: table === "mt_openjob" ? state.activeJobCount : 0, error: null }),
    }
    return q
  }
  return { supabase: { from: builder } }
})

import { PLANS, getEffectiveSubscription, hasReachedJobLimit } from "./plans"

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  state.subscription = null
  state.activeJobCount = 0
  state.lastNeq = null
})

describe("getEffectiveSubscription", () => {
  it("багцын мөр байхгүй бол Free", async () => {
    expect(await getEffectiveSubscription("u")).toEqual({
      planType: "free",
      status: "active",
      jobLimit: PLANS.free.jobLimit,
      expiresAt: null,
    })
  })

  it("хугацаа нь хүчинтэй төлбөртэй багцын лимитийг буцаана", async () => {
    const expiresAt = new Date(Date.now() + 5 * DAY).toISOString()
    state.subscription = { plan_type: "standard", status: "active", job_limit: 50, expires_at: expiresAt }
    const sub = await getEffectiveSubscription("u")
    expect(sub).toMatchObject({ planType: "standard", status: "active", jobLimit: 50 })
  })

  it("хугацаа дууссан төлбөртэй багц Free лимиттэй болно", async () => {
    const expiresAt = new Date(Date.now() - DAY).toISOString()
    state.subscription = { plan_type: "premium", status: "active", job_limit: 100, expires_at: expiresAt }
    const sub = await getEffectiveSubscription("u")
    expect(sub).toMatchObject({ planType: "premium", status: "expired", jobLimit: PLANS.free.jobLimit })
  })

  it("үл мэдэгдэх plan_type-ыг Free гэж үзнэ", async () => {
    state.subscription = { plan_type: "gold", status: "active", job_limit: null, expires_at: null }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "free", jobLimit: PLANS.free.jobLimit })
  })
})

describe("hasReachedJobLimit", () => {
  it("лимитээс бага бол зөвшөөрнө", async () => {
    state.activeJobCount = PLANS.free.jobLimit - 1
    expect(await hasReachedJobLimit("u")).toEqual({ reached: false, limit: PLANS.free.jobLimit })
  })

  it("лимитэд хүрсэн бол хориглоно", async () => {
    state.activeJobCount = PLANS.free.jobLimit
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })

  it("засварлаж буй зарыг тооцоонд оруулахгүй", async () => {
    await hasReachedJobLimit("u", "job-7")
    expect(state.lastNeq).toBe("job-7")
  })
})
