import { createHash, randomInt, timingSafeEqual } from "crypto"

// Имэйлээр илгээх 6 оронтой код (бүртгэл баталгаажуулах, нууц үг сэргээх)-ийн нийтлэг туслахууд

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null
  const trimmed = email.trim().toLowerCase()
  return EMAIL_REGEX.test(trimmed) && trimmed.length <= 254 ? trimmed : null
}

// ilike-д хэрэглэгчийн утга оруулахад %, _ нь wildcard болохоос сэргийлнэ
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export function generateCode(): string {
  return randomInt(100000, 1000000).toString()
}

// Кодыг DB-д ил хадгалахгүй
export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export function isCodeMatch(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(code), "hex")
  const b = Buffer.from(storedHash, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}
