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
