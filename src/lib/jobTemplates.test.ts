import { describe, expect, it } from "vitest"
import { JOB_CATEGORIES, JOB_FIELD_LIMITS, JOB_TEXT_MIN_LENGTH } from "./jobPost"
import { JOB_TEMPLATES, getJobTemplates } from "./jobTemplates"

describe("jobTemplates", () => {
  it("«Бусад»-аас бусад ангилал бүр 2+ загвартай", () => {
    for (const { value } of JOB_CATEGORIES) {
      if (value === "other") continue
      expect(JOB_TEMPLATES[value]?.length ?? 0, value).toBeGreaterThanOrEqual(2)
    }
  })

  it("загварын текст формын шалгалтад тэнцэнэ, id давхцахгүй", () => {
    const all = Object.values(JOB_TEMPLATES).flat().concat(getJobTemplates("other"))
    const ids = new Set<string>()
    for (const tpl of all) {
      for (const text of [tpl.description, tpl.requirements]) {
        expect(text.trim().length, tpl.id).toBeGreaterThanOrEqual(JOB_TEXT_MIN_LENGTH)
        expect(text.length).toBeLessThanOrEqual(JOB_FIELD_LIMITS.description)
      }
      if (!getJobTemplates("other").includes(tpl)) {
        expect(ids.has(tpl.id), tpl.id).toBe(false)
        ids.add(tpl.id)
      }
    }
  })

  it("жагсаалтад байхгүй ангилалд ерөнхий загвар буцаана", () => {
    expect(getJobTemplates("Хөдөө аж ахуй").length).toBeGreaterThan(0)
    expect(getJobTemplates("retail").length).toBeGreaterThan(getJobTemplates("x").length)
  })
})
