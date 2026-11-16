import { describe, expect, it } from "vitest"
import { JOB_CATEGORIES, JOB_FIELD_LIMITS, JOB_TEXT_MIN_LENGTH, JOB_TYPES } from "./jobPost"
import { JOB_TEMPLATES, JOB_TYPE_TEMPLATE_LINES, adaptTemplateToJobType, getJobTemplates } from "./jobTemplates"

describe("jobTemplates", () => {
  it("«Бусад»-аас бусад ангилал бүр 6+ загвартай", () => {
    for (const { value } of JOB_CATEGORIES) {
      if (value === "other") continue
      expect(JOB_TEMPLATES[value]?.length ?? 0, value).toBeGreaterThanOrEqual(6)
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

  it("ажлын төрөл бүрт нэмэлт мөр тодорхойлогдсон", () => {
    for (const type of JOB_TYPES) expect(JOB_TYPE_TEMPLATE_LINES[type], type).toBeDefined()
  })

  it("сонгосон ажлын төрлийн мөрийг залгаж, давтахгүй", () => {
    const base = JOB_TEMPLATES.food[0]
    const adapted = adaptTemplateToJobType(base, "parttime")
    expect(adapted.jobTypeLabel).toBe("Хагас цагийн")
    expect(adapted.description.startsWith(base.description)).toBe(true)
    expect(adapted.description).toContain("• Тохиролцсон цагийн хуваарийн дагуу ээлжээр ажиллах")
    expect(adapted.added.requirements).toEqual(JOB_TYPE_TEMPLATE_LINES.parttime.requirements)
    expect(adapted.description.split("\n").length).toBe(base.description.split("\n").length + 1)

    // Дахин тааруулахад нэмэлт мөр давтагдахгүй
    const twice = adaptTemplateToJobType(adapted, "parttime")
    expect(twice.description).toBe(adapted.description)
    expect(twice.added.description).toEqual([])
  })

  it("мэдэгдэхгүй төрөлд загварыг хэвээр буцаана", () => {
    const base = JOB_TEMPLATES.retail[0]
    const adapted = adaptTemplateToJobType(base, "")
    expect(adapted.description).toBe(base.description)
    expect(adapted.jobTypeLabel).toBeNull()
  })
})
