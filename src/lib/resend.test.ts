import { describe, expect, it, vi } from "vitest"
import { DEFAULT_RESEND_FROM, getResendConfig, sendViaResend } from "./resend"

const message = { to: "user@example.mn", subject: "Код", html: "<p>123456</p>" }

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("getResendConfig", () => {
  it("RESEND_API_KEY байхгүй бол null буцаана", () => {
    expect(getResendConfig({})).toBeNull()
    expect(getResendConfig({ RESEND_API_KEY: "  " })).toBeNull()
  })

  it("RESEND_FROM-гүй бол noreply@mstaffing.mn ашиглана", () => {
    expect(getResendConfig({ RESEND_API_KEY: "re_x" })).toEqual({
      apiKey: "re_x",
      from: DEFAULT_RESEND_FROM,
    })
    expect(getResendConfig({ RESEND_API_KEY: "re_x", RESEND_FROM: "otp@mstaffing.mn" })?.from).toBe(
      "otp@mstaffing.mn"
    )
  })
})

describe("sendViaResend", () => {
  it("Resend API руу зөв хүсэлт илгээж id буцаана", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { id: "email_1" }))

    const id = await sendViaResend(message, { apiKey: "re_x", from: "noreply@mstaffing.mn", fetchImpl })

    expect(id).toBe("email_1")
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.headers.Authorization).toBe("Bearer re_x")
    expect(JSON.parse(init.body)).toEqual({
      from: "MStaffing <noreply@mstaffing.mn>",
      to: ["user@example.mn"],
      subject: "Код",
      html: "<p>123456</p>",
    })
  })

  it("алдаатай хариу ирвэл шалтгааныг агуулсан алдаа шиднэ", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429, { name: "daily_quota_exceeded", message: "quota" }))

    await expect(
      sendViaResend(message, { apiKey: "re_x", from: "noreply@mstaffing.mn", fetchImpl })
    ).rejects.toThrow(/429.*quota/)
  })

  it("JSON биш хариуг ч алдаа гэж үзнэ", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502, statusText: "Bad Gateway" }))

    await expect(
      sendViaResend(message, { apiKey: "re_x", from: "noreply@mstaffing.mn", fetchImpl })
    ).rejects.toThrow(/502/)
  })
})
