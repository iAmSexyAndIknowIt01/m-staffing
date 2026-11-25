// Жагсаалтын API-ийн ?limit=&offset= параметрийг аюулгүй унших
export const MAX_PAGE_SIZE = 100

export function parsePaging(
  params: URLSearchParams,
  defaultLimit = 20
): { limit: number; offset: number } {
  const rawLimit = Math.floor(Number(params.get("limit")))
  const rawOffset = Math.floor(Number(params.get("offset")))
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_PAGE_SIZE) : defaultLimit
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0
  return { limit, offset }
}
