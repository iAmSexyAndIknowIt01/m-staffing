// Компанийн профайлын cover загварууд (mt_company.cover_style). Зураг биш — CompanyCover компонент SVG/CSS-ээр зурна.
// Импортгүй тул клиент, сервер хоёул ашиглана.

export const COMPANY_COVERS = [
  { id: "classic", label: "Алхан хээ" },
  { id: "sunset", label: "Тал нутаг" },
  { id: "dots", label: "Өлзий хээ" },
  { id: "waves", label: "Угалз" },
  { id: "skyline", label: "Говь" },
  { id: "stripes", label: "Хаалганы хээ" },
  { id: "glow", label: "Оддын шөнө" },
  { id: "pattern", label: "M хээ" },
  { id: "city_day", label: "Өдрийн хот" },
  { id: "city_morning", label: "Өглөөний хот" },
  { id: "city_sunset", label: "Үдшийн хот" },
  { id: "city_night", label: "Шөнийн хот" },
  { id: "city_line", label: "Зураасан хот" },
  { id: "city_orange", label: "Улбар шар хот" },
] as const

export type CompanyCoverId = (typeof COMPANY_COVERS)[number]["id"]

export const DEFAULT_COVER: CompanyCoverId = "classic"

export function isCompanyCover(value: unknown): value is CompanyCoverId {
  return typeof value === "string" && COMPANY_COVERS.some((cover) => cover.id === value)
}

// DB-ийн утгыг (хоосон, хуучин, буруу) аюулгүй загвар болгоно
export function toCompanyCover(value: unknown): CompanyCoverId {
  return isCompanyCover(value) ? value : DEFAULT_COVER
}
