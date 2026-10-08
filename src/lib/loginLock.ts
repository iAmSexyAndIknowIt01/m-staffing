// Нэвтрэлтийн түгжээ (LOCK_WINDOW_MS цонх дотор):
// - Нэг имэйлд нэг IP-ээс MAX_FAILS_PER_EMAIL_IP удаа буруу оролдвол тэр IP-д түгжинэ.
//   Ингэснээр өөр хүн буруу нууц үг оруулж бусдын бүртгэлийг түгжиж чадахгүй.
// - Олон IP-ээс нэг имэйлийг туршвал (тархсан халдлага) MAX_FAILS_PER_EMAIL-д хүрэхэд бүх IP-д түгжинэ.
// - Нэг IP-ээс олон имэйл туршвал MAX_FAILS_PER_IP-д хүрэхэд тэр IP-г түгжинэ.

export const LOCK_WINDOW_MS = 15 * 60 * 1000
export const MAX_FAILS_PER_EMAIL_IP = 3
export const MAX_FAILS_PER_EMAIL = 20
export const MAX_FAILS_PER_IP = 20

export type LockReason = "email_ip" | "email" | "ip"

export interface LockStatus {
  /** Түгжээний хүснэгт уншигдсан эсэх (migration ажиллаагүй бол false) */
  available: boolean
  locked: boolean
  reason: LockReason | null
  /** Энэ IP-ээс энэ имэйлд хийсэн амжилтгүй оролдлого */
  failsByEmailIp: number
  unlockAt: Date | null
}

export const LOCK_UNAVAILABLE: LockStatus = { available: false, locked: false, reason: null, failsByEmailIp: 0, unlockAt: null }

export interface FailCounts {
  /** Энэ имэйл + IP-ийн цонх доторх амжилтгүй оролдлогын хугацаа, шинээс нь эхлэн (хамгийн ихдээ MAX_FAILS_PER_EMAIL_IP) */
  emailIpFailTimes: string[]
  /** Энэ имэйлийн бүх IP-ээс хийсэн амжилтгүй оролдлогын тоо */
  emailFails: number
  /** Энэ IP-ийн бүх имэйлд хийсэн амжилтгүй оролдлогын тоо */
  ipFails: number
}

export function computeLock({ emailIpFailTimes, emailFails, ipFails }: FailCounts, now = Date.now()): LockStatus {
  const failsByEmailIp = emailIpFailTimes.length
  const base = { available: true, failsByEmailIp }

  if (failsByEmailIp >= MAX_FAILS_PER_EMAIL_IP) {
    // Сүүлийн N оролдлогын хамгийн хуучин нь цонхноос гарахад түгжээ тайлагдана
    const oldestOfLastN = new Date(emailIpFailTimes[MAX_FAILS_PER_EMAIL_IP - 1]).getTime()
    return { ...base, locked: true, reason: "email_ip", unlockAt: new Date(oldestOfLastN + LOCK_WINDOW_MS) }
  }
  if (emailFails >= MAX_FAILS_PER_EMAIL) {
    return { ...base, locked: true, reason: "email", unlockAt: new Date(now + LOCK_WINDOW_MS) }
  }
  if (ipFails >= MAX_FAILS_PER_IP) {
    return { ...base, locked: true, reason: "ip", unlockAt: new Date(now + LOCK_WINDOW_MS) }
  }
  return { ...base, locked: false, reason: null, unlockAt: null }
}

/** Түгжээ тайлагдах хүртэлх минут (хамгийн багадаа 1) */
export function minutesUntil(unlockAt: Date | null, now = Date.now()): number {
  if (!unlockAt) return Math.ceil(LOCK_WINDOW_MS / 60000)
  return Math.max(1, Math.ceil((unlockAt.getTime() - now) / 60000))
}
