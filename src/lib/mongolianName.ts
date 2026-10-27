// Овог, нэрийг зөвхөн Монгол кирилл үсгээр бүртгүүлэх шалгалт (клиент, сервер хоёуланд нь ашиглана).

const LETTERS = "А-ЯЁӨҮа-яёөү"

// Үсгээр эхэлж, үсгээр төгссөн; дунд нь ганц зураас эсвэл зай байж болно (жишээ: "Бат-Эрдэнэ")
const NAME_RE = new RegExp(`^[${LETTERS}]+(?:[- ][${LETTERS}]+)*$`, "u")

export const CYRILLIC_NAME_MAX_LENGTH = 50

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function isCyrillicName(value: string): boolean {
  const name = normalizeName(value)
  return name.length >= 2 && name.length <= CYRILLIC_NAME_MAX_LENGTH && NAME_RE.test(name)
}

// Талбарын доор харуулах алдааны тайлбар; зөв бол null
export function getNameError(value: string, emptyMessage: string): string | null {
  const name = normalizeName(value)
  if (!name) return emptyMessage
  if (/[A-Za-z]/.test(name)) return "Латин үсэг орсон байна. Зөвхөн кирилл үсгээр бичнэ үү."
  if (/\d/.test(name)) return "Тоо оруулах боломжгүй"
  if (!isCyrillicName(name)) {
    if (name.length < 2) return "Хамгийн багадаа 2 үсэг байна"
    if (name.length > CYRILLIC_NAME_MAX_LENGTH) return `${CYRILLIC_NAME_MAX_LENGTH}-аас ихгүй тэмдэгт байна`
    return "Зөвхөн кирилл үсэг, зураас (-) ашиглана уу"
  }
  return null
}
