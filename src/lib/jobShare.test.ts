import { describe, expect, it } from "vitest"
import { jobShareUrl } from "./jobShare"

describe("jobShareUrl", () => {
  it("нийтийн зарын хуудасны линкийг үүсгэнэ", () => {
    expect(jobShareUrl("https://mstaffing.mn", "abc-123")).toBe("https://mstaffing.mn/jobs/abc-123")
  })

  it("id-г кодлоно", () => {
    expect(jobShareUrl("https://mstaffing.mn", "a/b")).toBe("https://mstaffing.mn/jobs/a%2Fb")
  })
})
