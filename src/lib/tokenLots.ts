// M токены багц (tr_token_lot) — худалдан авалт бүр өөрийн дуусах огноотой.
// Зарцуулалт хамгийн түрүүнд дуусах багцаас эхэлнэ (DB-ийн spend_tokens функц).
// Импортгүй тул клиент (billing хуудас) ч ашиглана.

export interface TokenLot {
  id: string
  tokens: number
  remaining: number
  source: "purchase" | "admin" | "migration" | string
  planType: string | null
  createdAt: string
  // null — хугацаагүй
  expiresAt: string | null
}

// Дуусахаас өмнө сануулах хоног
export const EXPIRY_WARNING_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export function isLotActive(lot: Pick<TokenLot, "expiresAt">, now: number = Date.now()): boolean {
  return lot.expiresAt === null || new Date(lot.expiresAt).getTime() > now
}

export interface LotSummary {
  // Хүчинтэй багцуудын нийт, үлдсэн, ашигласан токен
  tokenLimit: number
  remaining: number
  used: number
  // Үлдэгдэлтэй хүчинтэй багцуудаас хамгийн түрүүнд дуусах огноо
  nextExpiry: string | null
  // EXPIRY_WARNING_DAYS хоногийн дотор дуусах үлдэгдэл
  expiringSoon: number
}

export function summarizeLots(lots: TokenLot[], now: number = Date.now()): LotSummary {
  const active = lots.filter((lot) => isLotActive(lot, now))
  const tokenLimit = active.reduce((sum, lot) => sum + lot.tokens, 0)
  const remaining = active.reduce((sum, lot) => sum + lot.remaining, 0)
  const expiring = active
    .filter((lot) => lot.remaining > 0 && lot.expiresAt !== null)
    .map((lot) => ({ at: new Date(lot.expiresAt!).getTime(), lot }))
    .sort((a, b) => a.at - b.at)
  const expiringSoon = expiring
    .filter(({ at }) => at - now <= EXPIRY_WARNING_DAYS * DAY_MS)
    .reduce((sum, { lot }) => sum + lot.remaining, 0)
  return {
    tokenLimit,
    remaining,
    used: tokenLimit - remaining,
    nextExpiry: expiring[0]?.lot.expiresAt ?? null,
    expiringSoon,
  }
}

// Дуусах хүртэлх хоног (хугацаагүй бол null, дууссан бол 0)
export function daysUntilExpiry(expiresAt: string | null, now: number = Date.now()): number | null {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / DAY_MS))
}

export const LOT_SOURCE_LABELS: Record<string, string> = {
  purchase: "Худалдан авалт",
  admin: "Админы олголт",
  migration: "Өмнөх үлдэгдэл",
}
