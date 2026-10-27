// Нууц үгийн шаардлага. crypto ашигладаггүй тул клиент компонентоос ч импортлож болно.

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72 // bcrypt 72 байтаас хойшхыг тооцдоггүй

// Алдаатай бол хэрэглэгчид харуулах мессеж, зөв бол null.
export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Нууц үг хамгийн багадаа ${PASSWORD_MIN_LENGTH} тэмдэгт байна.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Нууц үг хэт урт байна (${PASSWORD_MAX_LENGTH} тэмдэгтээс ихгүй).`
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Нууц үг үсэг болон тоо хоёуланг агуулсан байна."
  }
  return null
}

export interface PasswordStrength {
  // 0: хоосон, 1: сул, 2: дунд, 3: сайн, 4: маш сайн
  score: 0 | 1 | 2 | 3 | 4
  label: string
  // Заавал хангах шаардлагууд (validateNewPassword-тэй ижил)
  checks: { id: "length" | "letter" | "number"; label: string; ok: boolean }[]
}

// Бүртгэлийн хуудсанд харуулах нууц үгийн чанар. Шаардлага хангаагүй бол хамгийн ихдээ «Сул».
export function getPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordStrength["checks"] = [
    { id: "length", label: `${PASSWORD_MIN_LENGTH}+ тэмдэгт`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { id: "letter", label: "Үсэг", ok: /[A-Za-z]/.test(password) },
    { id: "number", label: "Тоо", ok: /\d/.test(password) },
  ]

  if (!password) return { score: 0, label: "", checks }
  if (checks.some((c) => !c.ok)) return { score: 1, label: "Сул", checks }

  let bonus = 0
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) bonus++
  if (/[^A-Za-z0-9]/.test(password)) bonus++
  if (password.length >= 12) bonus++

  const score = bonus === 0 ? 2 : bonus === 1 ? 3 : 4
  const label = score === 2 ? "Дунд" : score === 3 ? "Сайн" : "Маш сайн"
  return { score, label, checks }
}
