import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createSessionToken, isAdminEmail, verifySessionToken, SESSION_MAX_AGE } from "./session"

const base = { userId: "user-1", role: "company" as const, email: "a@b.mn", isAdmin: false }

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "x".repeat(32))
  vi.stubEnv("ADMIN_EMAILS", "Admin@MStaffing.mn, other@x.mn")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe("session token", () => {
  it("зөв token-ыг баталгаажуулна", async () => {
    const token = await createSessionToken(base)
    const session = await verifySessionToken(token)
    expect(session).toMatchObject(base)
    expect(session?.exp! - session?.iat!).toBe(SESSION_MAX_AGE)
  })

  it("payload-ыг өөрчилбөл хүчингүй", async () => {
    const token = await createSessionToken(base)
    const [, signature] = token.split(".")
    const forged = Buffer.from(JSON.stringify({ ...base, role: "staff", isAdmin: true, exp: 9999999999 }))
      .toString("base64url")
    expect(await verifySessionToken(`${forged}.${signature}`)).toBeNull()
  })

  it("өөр secret-ээр гарын үсэг зурсан бол хүчингүй", async () => {
    const token = await createSessionToken(base)
    vi.stubEnv("SESSION_SECRET", "y".repeat(32))
    expect(await verifySessionToken(token)).toBeNull()
  })

  it("хугацаа дууссан бол хүчингүй", async () => {
    const token = await createSessionToken(base)
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE + 1) * 1000)
    expect(await verifySessionToken(token)).toBeNull()
  })

  it("буруу хэлбэртэй token-д null буцаана", async () => {
    expect(await verifySessionToken(undefined)).toBeNull()
    expect(await verifySessionToken("")).toBeNull()
    expect(await verifySessionToken("abc")).toBeNull()
    expect(await verifySessionToken("a.b.c")).toBeNull()
  })

  it("SESSION_SECRET богино бол алдаа шиднэ", async () => {
    vi.stubEnv("SESSION_SECRET", "short")
    await expect(createSessionToken(base)).rejects.toThrow()
  })
})

describe("isAdminEmail", () => {
  it("том жижиг үсэг, зайг үл тооцно", () => {
    expect(isAdminEmail("admin@mstaffing.mn")).toBe(true)
    expect(isAdminEmail("OTHER@x.mn")).toBe(true)
    expect(isAdminEmail("nobody@x.mn")).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })
})
