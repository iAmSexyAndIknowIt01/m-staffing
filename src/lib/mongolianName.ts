// Овог, нэрийг зөвхөн Монгол кирилл үсгээр бүртгүүлэх шалгалт (клиент, сервер хоёуланд нь ашиглана).

const LETTERS = "А-ЯЁӨҮа-яёөү"

// Үсгээр эхэлж, үсгээр төгссөн; дунд нь ганц зураас эсвэл зай байж болно (жишээ: "Бат-Эрдэнэ")
const NAME_RE = new RegExp(`^[${LETTERS}]+(?:[- ][${LETTERS}]+)*$`, "u")
const DISALLOWED_RE = new RegExp(`[^${LETTERS}\\- ]`, "gu")

export const CYRILLIC_NAME_MAX_LENGTH = 50

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function isCyrillicName(value: string): boolean {
  const name = normalizeName(value)
  return name.length >= 2 && name.length <= CYRILLIC_NAME_MAX_LENGTH && NAME_RE.test(name)
}

// Шивэх үед кирилл бус тэмдэгтийг хасна. removed нь хасагдсан эсэх (латинаар бичсэн гэх мэт).
export function stripNonCyrillic(value: string): { value: string; removed: boolean } {
  const cleaned = value.replace(DISALLOWED_RE, "")
  return { value: cleaned, removed: cleaned !== value }
}
