import { describe, expect, it, vi } from "vitest"
import { DEFAULT_RESEND_FROM, RESEND_BATCH_LIMIT, getResendConfig, sendBatchViaResend, sendViaResend } from "./resend"

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

describe("sendBatchViaResend", () => {
  const config = { apiKey: "re_x", from: "noreply@mstaffing.mn" }

  it("хүлээн авагч бүрд тусдаа имэйл болгож batch API руу илгээнэ", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { data: [{ id: "a" }, { id: "b" }] }))
    await sendBatchViaResend(
      [
        { to: "a@example.mn", subject: "Санал", html: "<p>x</p>" },
        { to: "b@example.mn", subject: "Санал", html: "<p>x</p>" },
      ],
      { ...config, fetchImpl }
    )
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails/batch")
    const body = JSON.parse(init.body)
    expect(body).toHaveLength(2)
    expect(body[0]).toEqual({ from: "MStaffing <noreply@mstaffing.mn>", to: ["a@example.mn"], subject: "Санал", html: "<p>x</p>" })
    expect(body[1].to).toEqual(["b@example.mn"])
  })

  it("хоосон жагсаалтад хүсэлт илгээхгүй, хязгаараас их бол алдаа", async () => {
    const fetchImpl = vi.fn()
    await sendBatchViaResend([], { ...config, fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    const many = Array.from({ length: RESEND_BATCH_LIMIT + 1 }, (_, i) => ({ to: `u${i}@x.mn`, subject: "s", html: "h" }))
    await expect(sendBatchViaResend(many, { ...config, fetchImpl })).rejects.toThrow(/хязгаар/)
  })

  it("алдаатай хариуг throw хийнэ", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429, { message: "daily quota" }))
    await expect(
      sendBatchViaResend([{ to: "a@x.mn", subject: "s", html: "h" }], { ...config, fetchImpl })
    ).rejects.toThrow(/429.*quota/)
  })
})
