import { describe, expect, it } from "vitest"
import { DEFAULT_NOTIFICATION_SETTINGS, normalizeNotificationSettings, wantsJobOffer } from "./notificationCatalog"

describe("normalizeNotificationSettings", () => {
  it("мөр байхгүй бол анхдагч утга (ажлын санал унтраалттай)", () => {
    expect(normalizeNotificationSettings(null)).toEqual(DEFAULT_NOTIFICATION_SETTINGS)
    expect(normalizeNotificationSettings(undefined).job_offer).toBe(false)
    expect(normalizeNotificationSettings({}).new_application).toBe(true)
  })

  it("boolean биш утга, мэдэгдэхгүй түлхүүрийг хаяна", () => {
    const s = normalizeNotificationSettings({ payment: "false", application_status: false, role: "admin", user_id: "x" })
    expect(s.payment).toBe(true)
    expect(s.application_status).toBe(false)
    expect(s).not.toHaveProperty("role")
    expect(s).not.toHaveProperty("user_id")
  })

  it("зөвхөн байгаа ангиллыг давхардалгүй үлдээнэ", () => {
    const s = normalizeNotificationSettings({ job_offer_categories: ["retail", "retail", "unknown", 5, "food"] })
    expect(s.job_offer_categories).toEqual(["retail", "food"])
  })

  it("анхдагч объектыг өөрчлөхгүй", () => {
    normalizeNotificationSettings({ job_offer_categories: ["retail"] }).job_offer_categories.push("food")
    expect(DEFAULT_NOTIFICATION_SETTINGS.job_offer_categories).toEqual([])
  })
})

describe("wantsJobOffer", () => {
  it("унтраалттай бол хэзээ ч илгээхгүй", () => {
    expect(wantsJobOffer({ job_offer: false, job_offer_categories: [] }, "retail")).toBe(false)
  })

  it("ангилал сонгоогүй бол бүх ангилал", () => {
    expect(wantsJobOffer({ job_offer: true, job_offer_categories: [] }, "anything")).toBe(true)
  })

  it("сонгосон ангилалд л илгээнэ", () => {
    const s = { job_offer: true, job_offer_categories: ["retail"] }
    expect(wantsJobOffer(s, "retail")).toBe(true)
    expect(wantsJobOffer(s, "food")).toBe(false)
  })

  it("гараар бичсэн салбар «Бусад» ангилалд тооцогдоно", () => {
    expect(wantsJobOffer({ job_offer: true, job_offer_categories: ["other"] }, "Хөдөө аж ахуй")).toBe(true)
    expect(wantsJobOffer({ job_offer: true, job_offer_categories: ["retail"] }, "Хөдөө аж ахуй")).toBe(false)
  })
})
