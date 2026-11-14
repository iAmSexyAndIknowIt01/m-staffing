// Ажилтны төрсөн огноо (mt_staff.birth_date, "YYYY-MM-DD"). Клиент, сервер хоёул ашиглана.

export const MIN_AGE = 14
export const MAX_AGE = 100

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function parts(value: string): { y: number; m: number; d: number } | null {
  const match = DATE_RE.exec(value)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  // 2023-02-30 г.м. байхгүй огноог хүлээж авахгүй
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return { y, m, d }
}

// Бүтэн нас (төрсөн өдөр нь болоогүй бол 1-ийг хасна)
export function calcAge(birthDate: string, now: Date = new Date()): number | null {
  const p = parts(birthDate)
  if (!p) return null
  let age = now.getFullYear() - p.y
  const month = now.getMonth() + 1
  if (month < p.m || (month === p.m && now.getDate() < p.d)) age -= 1
  return age
}

// "1995-03-12" → "1995.03.12"
export function formatBirthDate(birthDate: string): string {
  return parts(birthDate) ? birthDate.replaceAll("-", ".") : ""
}

// "1995.03.12 (30 нас)"
export function birthDateLabel(birthDate: string | null | undefined, now: Date = new Date()): string {
  if (!birthDate) return ""
  const age = calcAge(birthDate, now)
  if (age === null) return ""
  return `${formatBirthDate(birthDate)} (${age} нас)`
}

// Хадгалахын өмнөх шалгалт. Хоосон утга → null (арилгана).
export function parseBirthDate(
  input: unknown,
  now: Date = new Date()
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (input === null || input === undefined || input === "") return { ok: true, value: null }
  if (typeof input !== "string" || !parts(input)) return { ok: false, error: "Төрсөн огноо буруу байна." }
  const age = calcAge(input, now)!
  if (age < 0) return { ok: false, error: "Төрсөн огноо ирээдүйд байж болохгүй." }
  if (age < MIN_AGE) return { ok: false, error: `Ажил хайгч ${MIN_AGE}-өөс дээш настай байх ёстой.` }
  if (age > MAX_AGE) return { ok: false, error: "Төрсөн огноогоо шалгана уу." }
  return { ok: true, value: input }
}
