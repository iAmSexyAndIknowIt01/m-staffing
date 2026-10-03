import { describe, expect, it } from "vitest"
import { LOCK_WINDOW_MS, MAX_FAILS_PER_EMAIL, MAX_FAILS_PER_IP, computeLock, minutesUntil } from "./loginLock"

const NOW = Date.parse("2026-10-03T10:00:00Z")
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString()

describe("computeLock", () => {
  it("3 удаа буруу оролдоход түгжинэ", () => {
    expect(MAX_FAILS_PER_EMAIL).toBe(3)
    const lock = computeLock([minutesAgo(1), minutesAgo(2), minutesAgo(5)], 0, NOW)
    expect(lock.locked).toBe(true)
    // Хамгийн хуучин оролдлого (5 минутын өмнө) + 15 минут = 10 минутын дараа тайлагдана
    expect(lock.unlockAt?.getTime()).toBe(NOW - 5 * 60000 + LOCK_WINDOW_MS)
    expect(minutesUntil(lock.unlockAt, NOW)).toBe(10)
  })

  it("2 удаа буруу оролдсон бол түгжихгүй", () => {
    const lock = computeLock([minutesAgo(1), minutesAgo(2)], 0, NOW)
    expect(lock).toMatchObject({ locked: false, failsByEmail: 2, unlockAt: null, available: true })
  })

  it("оролдлогогүй бол түгжихгүй", () => {
    expect(computeLock([], 0, NOW).locked).toBe(false)
  })

  it("нэг IP-ээс хэт олон оролдвол түгжинэ", () => {
    const lock = computeLock([], MAX_FAILS_PER_IP, NOW)
    expect(lock.locked).toBe(true)
    expect(minutesUntil(lock.unlockAt, NOW)).toBe(15)
  })
})

describe("minutesUntil", () => {
  it("хамгийн багадаа 1 минут буцаана", () => {
    expect(minutesUntil(new Date(NOW + 5000), NOW)).toBe(1)
  })
})
