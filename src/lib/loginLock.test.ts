import { describe, expect, it } from "vitest"
import {
  LOCK_WINDOW_MS,
  MAX_FAILS_PER_EMAIL,
  MAX_FAILS_PER_EMAIL_IP,
  MAX_FAILS_PER_IP,
  computeLock,
  minutesUntil,
} from "./loginLock"

const NOW = Date.parse("2026-10-03T10:00:00Z")
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString()
const counts = (emailIpFailTimes: string[], emailFails = emailIpFailTimes.length, ipFails = emailIpFailTimes.length) => ({
  emailIpFailTimes,
  emailFails,
  ipFails,
})

describe("computeLock", () => {
  it("нэг IP-ээс 3 удаа буруу оролдоход түгжинэ", () => {
    expect(MAX_FAILS_PER_EMAIL_IP).toBe(3)
    const lock = computeLock(counts([minutesAgo(1), minutesAgo(2), minutesAgo(5)]), NOW)
    expect(lock).toMatchObject({ locked: true, reason: "email_ip" })
    // Хамгийн хуучин оролдлого (5 минутын өмнө) + 15 минут = 10 минутын дараа тайлагдана
    expect(lock.unlockAt?.getTime()).toBe(NOW - 5 * 60000 + LOCK_WINDOW_MS)
    expect(minutesUntil(lock.unlockAt, NOW)).toBe(10)
  })

  it("2 удаа буруу оролдсон бол түгжихгүй", () => {
    const lock = computeLock(counts([minutesAgo(1), minutesAgo(2)]), NOW)
    expect(lock).toMatchObject({ locked: false, reason: null, failsByEmailIp: 2, unlockAt: null, available: true })
  })

  it("оролдлогогүй бол түгжихгүй", () => {
    expect(computeLock(counts([]), NOW).locked).toBe(false)
  })

  it("өөр IP-ээс хийсэн цөөн оролдлого энэ IP-г түгжихгүй (бусдын бүртгэлийг түгжиж чадахгүй)", () => {
    const lock = computeLock(counts([], MAX_FAILS_PER_EMAIL - 1, 0), NOW)
    expect(lock.locked).toBe(false)
  })

  it("олон IP-ээс нэг имэйлийг туршвал түгжинэ", () => {
    const lock = computeLock(counts([], MAX_FAILS_PER_EMAIL, 0), NOW)
    expect(lock).toMatchObject({ locked: true, reason: "email" })
    expect(minutesUntil(lock.unlockAt, NOW)).toBe(15)
  })

  it("нэг IP-ээс хэт олон оролдвол түгжинэ", () => {
    const lock = computeLock(counts([], 0, MAX_FAILS_PER_IP), NOW)
    expect(lock).toMatchObject({ locked: true, reason: "ip" })
    expect(minutesUntil(lock.unlockAt, NOW)).toBe(15)
  })
})

describe("minutesUntil", () => {
  it("хамгийн багадаа 1 минут буцаана", () => {
    expect(minutesUntil(new Date(NOW + 5000), NOW)).toBe(1)
  })
})
