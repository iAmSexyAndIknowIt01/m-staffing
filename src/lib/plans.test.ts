import { beforeEach, describe, expect, it, vi } from "vitest"

// Supabase query builder болон rpc-ийн хялбар хуурамч хувилбар
const state = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null,
  lots: [] as Record<string, unknown>[],
  rpcCalls: [] as { fn: string; args: Record<string, unknown> }[],
  rpcError: null as { message: string } | null,
}))

vi.mock("@/lib/supabase", () => {
  const builder = (table: string) => {
    const q = {
      select: () => q,
      eq: () => q,
      or: () => q,
      order: () => q,
      maybeSingle: async () => ({ data: state.subscription, error: null }),
      then: (resolve: (v: unknown) => void) => resolve({ data: table === "tr_token_lot" ? state.lots : [], error: null }),
    }
    return q
  }
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    state.rpcCalls.push({ fn, args })
    if (state.rpcError) return { data: null, error: state.rpcError }
    return { data: "usage-1", error: null }
  }
  return { supabase: { from: builder, rpc } }
})

import { PAID_PLAN_DAYS, PLANS, TOKEN_COSTS, chargeTokens, getEffectiveSubscription, grantPurchasedTokens, hasReachedJobLimit } from "./plans"
import { actionsFor, formatTokens, priceForAction, pricePerThousandTokens } from "./planCatalog"

const DAY = 24 * 60 * 60 * 1000
const lot = (remaining: number, tokens = 15_000, expiresInDays: number | null = 200) => ({
  id: `lot-${remaining}`,
  tokens,
  remaining,
  source: "purchase",
  plan_type: "starter",
  created_at: new Date().toISOString(),
  expires_at: expiresInDays === null ? null : new Date(Date.now() + expiresInDays * DAY).toISOString(),
})

beforeEach(() => {
  state.subscription = null
  state.lots = []
  state.rpcCalls = []
  state.rpcError = null
})

describe("PLANS, TOKEN_COSTS", () => {
  it("M токен багцууд", () => {
    // Шинэ компанид автоматаар токен олгохгүй
    expect(PLANS.free).toMatchObject({ price: 0, tokens: 0 })
    expect(PLANS.starter).toMatchObject({ name: "M багц", price: 399_999, tokens: 15_000 })
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
  })
})

describe("getEffectiveSubscription", () => {
  it("багцгүй бол 0 токен, зар нийтлэх боломжгүй", async () => {
    expect(await getEffectiveSubscription("u")).toMatchObject({
      planType: "free",
      status: "active",
      tokenLimit: 0,
      used: 0,
      remaining: 0,
    })
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })

  it("хүчинтэй багцуудын үлдэгдлийг нийлүүлнэ", async () => {
    state.subscription = { plan_type: "standard", status: "active", expires_at: new Date(Date.now() + 100 * DAY).toISOString() }
    state.lots = [lot(4_000, 15_000, 20), lot(50_000, 50_000, 300)]
    const sub = await getEffectiveSubscription("u")
    expect(sub).toMatchObject({ planType: "standard", status: "active", tokenLimit: 65_000, remaining: 54_000, used: 11_000 })
    expect(sub.expiringSoon).toBe(4_000)
    expect(sub.nextExpiry).toBe(state.lots[0].expires_at)
  })

  it("сүүлийн багцын хугацаа дууссан ч өөр хүчинтэй үлдэгдэл байвал идэвхтэй", async () => {
    state.subscription = { plan_type: "starter", status: "active", expires_at: new Date(Date.now() - DAY).toISOString() }
    state.lots = [lot(8_000, 10_000, null)]
    expect(await getEffectiveSubscription("u")).toMatchObject({ status: "active", remaining: 8_000 })
  })

  it("төлбөртэй багцын хугацаа дууссан бөгөөд үлдэгдэлгүй бол дууссан", async () => {
    state.subscription = { plan_type: "premium", status: "active", expires_at: new Date(Date.now() - DAY).toISOString() }
    expect(await getEffectiveSubscription("u")).toMatchObject({ planType: "premium", status: "expired", remaining: 0 })
  })
})

describe("hasReachedJobLimit", () => {
  it("зар нийтлэх токен хүрэлцэж байвал зөвшөөрнө", async () => {
    state.lots = [lot(TOKEN_COSTS.post, 3_000, null)]
    expect(await hasReachedJobLimit("u")).toEqual({
      reached: false,
      limit: 3_000,
      remaining: TOKEN_COSTS.post,
      expired: false,
      cost: TOKEN_COSTS.post,
    })
  })

  it("үлдсэн токен зарын үнээс бага бол хориглоно", async () => {
    state.lots = [lot(500, 3_000, null)]
    expect((await hasReachedJobLimit("u")).reached).toBe(true)
  })
})

describe("chargeTokens", () => {
  it("DB-ийн spend_tokens функцээр үйлдлийн үнийг хасна", async () => {
    state.lots = [lot(3_000)]
    expect(await chargeTokens("u", "contact_unlock", null)).toEqual({ usageId: "usage-1" })
    expect(state.rpcCalls[0]).toEqual({
      fn: "spend_tokens",
      args: { p_user: "u", p_reason: "contact_unlock", p_tokens: 1_500, p_job: null },
    })
  })

  it("токен хүрэлцэхгүй бол DB-г дуудахгүй", async () => {
    state.lots = [lot(1_000)]
    const result = await chargeTokens("u", "contact_unlock")
    expect("error" in result && result.error).toContain("1,500 M токен")
    expect(state.rpcCalls).toHaveLength(0)
  })

  it("зэрэг ирсэн хүсэлтээр DB хүрэлцэхгүй гэвэл ойлгомжтой алдаа буцаана", async () => {
    state.lots = [lot(3_000)]
    state.rpcError = { message: "INSUFFICIENT_TOKENS" }
    const result = await chargeTokens("u", "post")
    expect(result).toHaveProperty("error")
  })
})

describe("grantPurchasedTokens", () => {
  it("багцын токеныг 365 хоногийн шинэ багц болгон олгоно", async () => {
    await grantPurchasedTokens("u", "starter", "inv-1")
    expect(state.rpcCalls[0]).toEqual({
      fn: "grant_tokens",
      args: { p_user: "u", p_tokens: 15_000, p_days: 365, p_source: "purchase", p_plan: "starter", p_invoice: "inv-1" },
    })
  })
})
