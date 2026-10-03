import { createHash, randomInt, timingSafeEqual } from "crypto"

export const RESET_CODE_TTL_MS = 10 * 60 * 1000 // Код 10 минут хүчинтэй
export const RESET_RESEND_COOLDOWN_MS = 60 * 1000 // Нэг имэйл рүү 60 секундэд нэг удаа
export const RESET_MAX_CODES_PER_HOUR = 5 // Нэг имэйл рүү цагт 5-аас олон код илгээхгүй
export const RESET_MAX_ATTEMPTS = 5 // Нэг кодыг 5 удаа буруу оруулбал хүчингүй
export const PASSWORD_MIN_LENGTH = 8

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null
  const trimmed = email.trim().toLowerCase()
  return EMAIL_REGEX.test(trimmed) && trimmed.length <= 254 ? trimmed : null
}

export function generateResetCode(): string {
  return randomInt(100000, 1000000).toString()
}

// Кодыг DB-д ил хадгалахгүй
export function hashResetCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export function isResetCodeMatch(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashResetCode(code), "hex")
  const b = Buffer.from(storedHash, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}

// Шинэ нууц үгийн шаардлага. Алдаатай бол хэрэглэгчид харуулах мессеж, зөв бол null.
export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Нууц үг хамгийн багадаа ${PASSWORD_MIN_LENGTH} тэмдэгт байна.`
  }
  if (password.length > 72) {
    return "Нууц үг хэт урт байна (72 тэмдэгтээс ихгүй)."
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Нууц үг үсэг болон тоо хоёуланг агуулсан байна."
  }
  return null
}
