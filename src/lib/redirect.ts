// Нэвтэрсний дараа буцах хаяг (?next=) — зөвхөн өөрийн сайтын хамгаалалттай хэсэг рүү зөвшөөрнө.
// Гадны сайт руу шилжүүлэх (open redirect) оролдлогыг хаана: "//evil.com", "/\evil.com", "https://..." гэх мэт.
const ALLOWED_PREFIX = /^\/(dashboard|admin)(\/|\?|#|$)/

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null
  if (/[\u0000-\u001f\\]/.test(raw)) return null
  return ALLOWED_PREFIX.test(raw) ? raw : null
}

// Нэвтрэх хуудасны хаяг — буцах хаягийг хадгална
export function loginPathFor(nextPath: string): string {
  const safe = safeNextPath(nextPath)
  return safe && safe !== "/dashboard" ? `/login?next=${encodeURIComponent(safe)}` : "/login"
}
