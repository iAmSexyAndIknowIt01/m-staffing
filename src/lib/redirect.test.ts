import { describe, expect, it } from "vitest"
import { loginPathFor, safeNextPath } from "./redirect"

describe("safeNextPath", () => {
  it("dashboard, admin доторх замыг зөвшөөрнө", () => {
    expect(safeNextPath("/dashboard/staff/jobs/123")).toBe("/dashboard/staff/jobs/123")
    expect(safeNextPath("/dashboard?tab=1")).toBe("/dashboard?tab=1")
    expect(safeNextPath("/admin/dashboard")).toBe("/admin/dashboard")
  })

  it("гадны болон бусад замыг татгалзана", () => {
    for (const bad of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "/login", "/dashboardx", "/dashboard\\..\\x", "javascript:alert(1)"]) {
      expect(safeNextPath(bad)).toBeNull()
    }
  })
})

describe("loginPathFor", () => {
  it("буцах хаягийг кодлож хавсаргана", () => {
    expect(loginPathFor("/dashboard/staff/jobs?q=a b")).toBe("/login?next=%2Fdashboard%2Fstaff%2Fjobs%3Fq%3Da%20b")
  })

  it("үндсэн самбар эсвэл хүчингүй замд next нэмэхгүй", () => {
    expect(loginPathFor("/dashboard")).toBe("/login")
    expect(loginPathFor("//evil.com")).toBe("/login")
  })
})
