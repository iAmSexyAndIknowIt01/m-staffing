import { describe, expect, it } from "vitest"
import { daysUntilExpiry, isLotActive, summarizeLots, type TokenLot } from "./tokenLots"

const now = Date.parse("2026-11-26T00:00:00Z")
const day = 24 * 60 * 60 * 1000
const lot = (over: Partial<TokenLot>): TokenLot => ({
  id: "x",
  tokens: 15_000,
  remaining: 15_000,
  source: "purchase",
  planType: "starter",
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: new Date(now + 200 * day).toISOString(),
  ...over,
})

describe("summarizeLots", () => {
  it("хугацаа нь дууссан багцыг тооцохгүй", () => {
    const s = summarizeLots(
      [
        lot({ id: "a", remaining: 10_000 }),
        lot({ id: "b", remaining: 5_000, expiresAt: new Date(now - day).toISOString() }),
      ],
      now
    )
    expect(s).toMatchObject({ tokenLimit: 15_000, remaining: 10_000, used: 5_000 })
  })

  it("хамгийн түрүүнд дуусах огноо, 30 хоногт дуусах үлдэгдэл", () => {
    const soon = new Date(now + 10 * day).toISOString()
    const s = summarizeLots(
      [
        lot({ id: "a", remaining: 4_000, expiresAt: soon }),
        lot({ id: "b", remaining: 15_000 }),
        lot({ id: "c", remaining: 0, expiresAt: new Date(now + 2 * day).toISOString() }),
        lot({ id: "d", remaining: 8_000, expiresAt: null, source: "migration" }),
      ],
      now
    )
    expect(s.nextExpiry).toBe(soon)
    expect(s.expiringSoon).toBe(4_000)
    expect(s.remaining).toBe(27_000)
  })

  it("багцгүй бол 0", () => {
    expect(summarizeLots([], now)).toEqual({ tokenLimit: 0, remaining: 0, used: 0, nextExpiry: null, expiringSoon: 0 })
  })
})

describe("isLotActive, daysUntilExpiry", () => {
  it("хугацаагүй багц үргэлж хүчинтэй", () => {
    expect(isLotActive({ expiresAt: null }, now)).toBe(true)
    expect(daysUntilExpiry(null, now)).toBeNull()
  })
  it("үлдсэн хоног", () => {
    expect(daysUntilExpiry(new Date(now + 2.5 * day).toISOString(), now)).toBe(3)
    expect(daysUntilExpiry(new Date(now - day).toISOString(), now)).toBe(0)
    expect(isLotActive({ expiresAt: new Date(now - 1).toISOString() }, now)).toBe(false)
  })
})
