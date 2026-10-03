// Нэвтрэлтийн түгжээ: нэг имэйлээр MAX_FAILS_PER_EMAIL удаа буруу оролдвол
// LOCK_WINDOW_MS хугацаанд түгжинэ. Нэг IP-ээс олон имэйл туршихаас сэргийлж
// IP-д тусдаа хязгаар бий.

export const LOCK_WINDOW_MS = 15 * 60 * 1000
export const MAX_FAILS_PER_EMAIL = 3
export const MAX_FAILS_PER_IP = 20

export interface LockStatus {
  /** Түгжээний хүснэгт уншигдсан эсэх (migration ажиллаагүй бол false) */
  available: boolean
  locked: boolean
  failsByEmail: number
  unlockAt: Date | null
}

export const LOCK_UNAVAILABLE: LockStatus = { available: false, locked: false, failsByEmail: 0, unlockAt: null }

/**
 * @param recentFailTimes цонх доторх амжилтгүй оролдлогын хугацаа, шинээс нь эхлэн (хамгийн ихдээ MAX_FAILS_PER_EMAIL)
 * @param ipFails цонх доторх тухайн IP-ийн амжилтгүй оролдлогын тоо
 */
export function computeLock(recentFailTimes: string[], ipFails: number, now = Date.now()): LockStatus {
  const failsByEmail = recentFailTimes.length
  const emailLocked = failsByEmail >= MAX_FAILS_PER_EMAIL
  const ipLocked = ipFails >= MAX_FAILS_PER_IP

  let unlockAt: Date | null = null
  if (emailLocked) {
    // Сүүлийн N оролдлогын хамгийн хуучин нь цонхноос гарахад түгжээ тайлагдана
    const oldestOfLastN = new Date(recentFailTimes[MAX_FAILS_PER_EMAIL - 1]).getTime()
    unlockAt = new Date(oldestOfLastN + LOCK_WINDOW_MS)
  } else if (ipLocked) {
    unlockAt = new Date(now + LOCK_WINDOW_MS)
  }

  return { available: true, locked: emailLocked || ipLocked, failsByEmail, unlockAt }
}

/** Түгжээ тайлагдах хүртэлх минут (хамгийн багадаа 1) */
export function minutesUntil(unlockAt: Date | null, now = Date.now()): number {
  if (!unlockAt) return Math.ceil(LOCK_WINDOW_MS / 60000)
  return Math.max(1, Math.ceil((unlockAt.getTime() - now) / 60000))
}
