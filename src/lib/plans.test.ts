import { beforeEach, describe, expect, it, vi } from "vitest"

// Supabase query builder болон rpc-ийн хялбар хуурамч хувилбар
const state = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null,
  usedTokens: 0,
  since: null as string | null,
  inserted: [] as Record<string, unknown>[],
}))

vi.mock("@/lib/supabase", () => {
  const builder = () => {
    const q = {
      select: () => q,
      eq: () => q,
      insert: (row: Record<string, unknown>) => {
        state.inserted.push(row)
        return q
      },
      single: async () => ({ data: { id: "usage-1" }, error: null }),
      maybeSingle: async () => ({ data: state.subscription, error: null }),
    }
    return q
  }
  const rpc = async (_fn: string, args: { p_since: string | null }) => {
    state.since = args.p_since
    return { data: state.usedTokens, error: null }
  }
  return { supabase: { from: builder, rpc } }
})

import { PAID_PLAN_DAYS, PLANS, TOKEN_COSTS, chargeTokens, getEffectiveSubscription, hasReachedJobLimit } from "./plans"
import { actionsFor, formatTokens, priceForAction, pricePerThousandTokens } from "./planCatalog"

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  state.subscription = null
  state.usedTokens = 0
  state.since = null
  state.inserted = []
})

describe("PLANS, TOKEN_COSTS", () => {
  it("M токен багцууд", () => {
    // Шинэ компанид автоматаар токен олгохгүй
    expect(PLANS.free).toMatchObject({ price: 0, tokens: 0 })
    expect(PLANS.starter).toMatchObject({ price: 399_999, tokens: 15_000 })
    expect(PLANS.standard).toMatchObject({ price: 999_999, tokens: 50_000 })
    expect(PLANS.premium).toMatchObject({ price: 1_499_999, tokens: 100_000 })
    expect(PAID_PLAN_DAYS).toBe(365)
  })

  it("зар нийтлэх 1,000, ажилтанд хүсэлт 1,500", () => {
    expect(TOKEN_COSTS.post).toBe(1_000)
    expect(TOKEN_COSTS.contact_unlock).toBe(1_500)
  })

  it("туслах функцууд", () => {
    expect(formatTokens(15_000)).toBe("15,000 M токен")
    expect(formatTokens(-5)).toBe("0 M токен")
    expect(actionsFor(15_000, "post")).toBe(15)
    expect(actionsFor(15_000, "contact_unlock")).toBe(10)
    expect(pricePerThousandTokens("starter")).toBe(26_667)
    expect(priceForAction("starter", "post")).toBe(26_667)
    expect(priceForAction("starter", "contact_unlock")).toBe(40_000)
    expect(PLANS.starter.name).toBe("M багц")
  })
})

describe("getEffectiveSubscription", () => {
  it("багцын мөр байхгүй бол 0 токен, зар нийтлэх боломжгүй", async () => {
    expect(await getEffectiveSubscription("u")).toEqual({
      planType: "free",
      status: "active",
      tokenLimit: 0,
      used: 0,
      remaining: 0,
      expiresAt: null,
    })
    expect(state.since).toBeNull()
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })

  it("админы гараар олгосон туршилтын токеныг нийт зарцуулалтаар тооцно", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 15_000, expires_at: null }
    state.usedTokens = 1_000
    expect(await getEffectiveSubscription("u")).toMatchObject({ tokenLimit: 15_000, used: 1_000, remaining: 14_000 })
  })

  it("хуучин компанийн хадгалсан туршилтын хэмжээг хүндэтгэнэ", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 10_000, expires_at: null }
    state.usedTokens = 4_000
    expect(await getEffectiveSubscription("u")).toMatchObject({ tokenLimit: 10_000, remaining: 6_000 })
  })

  it("төлбөртэй багцад зөвхөн худалдаж авснаас хойшхи зарцуулалтыг тооцно", async () => {
    const expiresAt = new Date(Date.now() + 100 * DAY).toISOString()
    state.subscription = { plan_type: "starter", status: "active", token_limit: 15_000, expires_at: expiresAt }
    state.usedTokens = 2_500
    const sub = await getEffectiveSubscription("u")
    expect(sub).toMatchObject({ planType: "starter", status: "active", tokenLimit: 15_000, used: 2_500, remaining: 12_500 })
    expect(new Date(state.since!).getTime()).toBe(new Date(expiresAt).getTime() - PAID_PLAN_DAYS * DAY)
  })

  it("хугацаа дууссан бол үлдсэн 0", async () => {
    state.subscription = { plan_type: "premium", status: "active", token_limit: 100_000, expires_at: new Date(Date.now() - DAY).toISOString() }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "premium", status: "expired", remaining: 0 })
  })

  it("үл мэдэгдэх plan_type-ыг туршилтын эрх гэж үзнэ", async () => {
    state.subscription = { plan_type: "gold", status: "active", token_limit: null, expires_at: null }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "free", tokenLimit: PLANS.free.tokens })
  })
})

describe("hasReachedJobLimit", () => {
  it("зар нийтлэх токен хүрэлцэж байвал зөвшөөрнө", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 3_000, expires_at: null }
    state.usedTokens = 3_000 - TOKEN_COSTS.post
    expect(await hasReachedJobLimit("u")).toEqual({
      reached: false,
      limit: 3_000,
      remaining: TOKEN_COSTS.post,
      expired: false,
      cost: TOKEN_COSTS.post,
    })
  })

  it("үлдсэн токен зарын үнээс бага бол хориглоно", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 3_000, expires_at: null }
    state.usedTokens = 3_000 - 500
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })
})

describe("chargeTokens", () => {
  it("үйлдлийн үнээр бүртгэнэ", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 3_000, expires_at: null }
    const result = await chargeTokens("u", "contact_unlock")
    expect(result).toEqual({ usageId: "usage-1" })
    expect(state.inserted[0]).toMatchObject({ user_id: "u", reason: "contact_unlock", tokens: 1_500 })
  })

  it("токен хүрэлцэхгүй бол бүртгэхгүй", async () => {
    state.subscription = { plan_type: "free", status: "active", token_limit: 3_000, expires_at: null }
    state.usedTokens = 3_000 - 1_000
    const result = await chargeTokens("u", "contact_unlock")
    expect(result).toHaveProperty("error")
    expect("error" in result && result.error).toContain("1,500 M токен")
    expect(state.inserted).toHaveLength(0)
  })
})
