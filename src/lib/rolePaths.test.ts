import { describe, expect, it } from "vitest"
import { foreignRoleSection } from "./rolePaths"

describe("foreignRoleSection", () => {
  it("ажил хайгч компанийн нийтийн профайлыг үзэж болно", () => {
    expect(foreignRoleSection("/dashboard/company/profile/08784681-b70c", "staff")).toBeNull()
    expect(foreignRoleSection("/dashboard/company/profile/abc/", "staff")).toBeNull()
  })

  it("ажил хайгч компанийн бусад хэсэгт орохгүй", () => {
    expect(foreignRoleSection("/dashboard/company/profile", "staff")).toBe("company")
    expect(foreignRoleSection("/dashboard/company/profile/abc/edit", "staff")).toBe("company")
    expect(foreignRoleSection("/dashboard/company/billing", "staff")).toBe("company")
    expect(foreignRoleSection("/dashboard/company", "staff")).toBe("company")
  })

  it("ажил олгогч ажил хайгчийн хэсэгт орохгүй, өөрийн хэсэгт орно", () => {
    expect(foreignRoleSection("/dashboard/staff/jobs", "company")).toBe("staff")
    expect(foreignRoleSection("/dashboard/company/billing", "company")).toBeNull()
    expect(foreignRoleSection("/dashboard", "company")).toBeNull()
  })
})
