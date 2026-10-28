import { afterEach, describe, expect, it, vi } from "vitest"
import { getAppOrigin } from "./url"

const req = new Request("https://evil.example.com/api/x")

describe("getAppOrigin", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("APP_URL-ийг хамгийн түрүүнд ашиглана", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("APP_URL", "https://mstaffing.mn/")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "mstaffing.vercel.app")
    expect(getAppOrigin(req)).toBe("https://mstaffing.mn")
  })

  it("APP_URL байхгүй бол Vercel-ийн production домэйныг https-тэй ашиглана", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("APP_URL", "")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "mstaffing.vercel.app")
    expect(getAppOrigin(req)).toBe("https://mstaffing.vercel.app")
  })

  it("production-д хүсэлтийн Host-ыг хэзээ ч ашиглахгүй", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("APP_URL", "")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "")
    expect(getAppOrigin(req)).toBeNull()
  })

  it("хөгжүүлэлтийн орчинд хүсэлтийн хаягийг ашиглана", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("APP_URL", "")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "")
    expect(getAppOrigin(new Request("http://localhost:3000/x"))).toBe("http://localhost:3000")
  })
})
