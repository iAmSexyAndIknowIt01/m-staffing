import { supabase } from "@/lib/supabase"
import { PAID_PLAN_DAYS, PLANS, TOKEN_COSTS, formatTokens, isPlanType, type PaidPlanType, type PlanType, type TokenAction } from "@/lib/planCatalog"
import { summarizeLots, type TokenLot } from "@/lib/tokenLots"

// Багцын каталогийг (үнэ, токен, үйлдлийн үнэ) planCatalog.ts-ээс авна — клиент ч мөн тэндээс импортолно
export {
  PAID_PLAN_DAYS,
  PAID_PLAN_TYPES,
  PLANS,
  TOKEN_COSTS,
  formatTokens,
  isPaidPlanType,
  isPlanType,
} from "@/lib/planCatalog"
export type { PaidPlanType, PlanType, TokenAction } from "@/lib/planCatalog"

// M токен (migration 20261126000000_token_lots):
// - Худалдан авалт / админы олголт бүр tr_token_lot-д өөрийн дуусах огноотой «багц» болно.
// - Үлдэгдэл = хугацаа дуусаагүй багцуудын remaining-ийн нийлбэр.
// - Зарцуулалт (spend_tokens) хамгийн түрүүнд дуусах багцаас эхэлж хасна; буцаалт (refund_token_usage) мөн DB-д.
// Зар хаагдсан, устгагдсан ч зарцуулсан токен буцаж ирэхгүй.

export interface EffectiveSubscription {
  planType: PlanType
  status: "active" | "expired"
  // Хүчинтэй багцуудын нийт M токен
  tokenLimit: number
  // Ашигласан, үлдсэн M токен
  used: number
  remaining: number
  // Сүүлд худалдан авсан багцын дуусах огноо (mt_company_subscriptions)
  expiresAt: string | null
  // Үлдэгдэлтэй багцуудаас хамгийн түрүүнд дуусах огноо, 30 хоногт дуусах үлдэгдэл
  nextExpiry: string | null
  expiringSoon: number
}

const LOT_COLUMNS = "id, tokens, remaining, source, plan_type, created_at, expires_at"

type LotRow = {
  id: string
  tokens: number
  remaining: number
  source: string
  plan_type: string | null
  created_at: string
  expires_at: string | null
}

const toLot = (row: LotRow): TokenLot => ({
  id: row.id,
  tokens: row.tokens,
  remaining: row.remaining,
  source: row.source,
  planType: row.plan_type,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
})

// Компанийн токены багцууд. includeExpiredSince өгвөл тэр огнооноос хойш дууссаныг ч оруулна (түүхэнд).
export async function getTokenLots(userId: string, includeExpiredSince?: string): Promise<TokenLot[]> {
  const since = includeExpiredSince ?? new Date().toISOString()
  const { data, error } = await supabase
    .from("tr_token_lot")
    .select(LOT_COLUMNS)
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${since}`)
    .order("expires_at", { ascending: true, nullsFirst: false })
  if (error) throw error
  return ((data ?? []) as LotRow[]).map(toLot)
}

// Үйлдлийн үнээр токен хасна (хамгийн түрүүнд дуусах багцаас). Хүрэлцэхгүй бол { error }, амжилттай бол бүртгэлийн id.
export async function chargeTokens(
  userId: string,
  action: TokenAction,
  jobId: string | null = null
): Promise<{ error: string } | { usageId: string }> {
  const cost = TOKEN_COSTS[action]
  const sub = await getEffectiveSubscription(userId)
  const notEnough = () => ({
    error: `M токен хүрэлцэхгүй байна (үлдсэн ${formatTokens(sub.remaining)}, шаардлагатай ${formatTokens(cost)}). Шинэ багц худалдаж авна уу.`,
  })
  if (sub.status === "expired") return { error: "Таны багцын хугацаа дууссан байна. Шинэ багц худалдаж авна уу." }
  if (sub.remaining < cost) return notEnough()

  // Түгжээтэй DB функц: зэрэг ирсэн хүсэлт давхар зарцуулахгүй
  const { data, error } = await supabase.rpc("spend_tokens", { p_user: userId, p_reason: action, p_tokens: cost, p_job: jobId })
  if (error) {
    if (error.message?.includes("INSUFFICIENT_TOKENS")) return notEnough()
    throw error
  }
  return { usageId: String(data) }
}

// Зар үүсгэсний дараа «зар нийтлэх» бүртгэлийг тухайн зартай холбоно
export async function linkUsageToJob(usageId: string, jobId: string): Promise<void> {
  const { error } = await supabase.from("tr_job_credit_usage").update({ job_id: jobId }).eq("id", usageId)
  if (error) throw error
}

// Үйлдэл амжилтгүй болбол зарцуулсан токеныг хассан багцуудад нь буцаана
export async function refundUsage(usageId: string): Promise<void> {
  const { error } = await supabase.rpc("refund_token_usage", { p_usage: usageId })
  if (error) console.error("TOKEN_REFUND_ERROR:", error)
}

// Хуучин нэр: ажилтанд хүсэлт илгээх г.м. (src/lib/staffContactAccess.ts)
export const chargeCredit = chargeTokens

// Зар дахин нээх / сунгахад токен хасна. Хүрэлцэхгүй эсвэл багц дууссан бол алдааны мессеж буцаана.
export async function chargeJobCredit(userId: string, jobId: string, reason: "reopen" | "extend"): Promise<string | null> {
  const result = await chargeTokens(userId, reason, jobId)
  return "error" in result ? result.error : null
}

// Худалдан авалт баталгаажихад тухайн багцын токеныг PAID_PLAN_DAYS хоногийн хугацаатай шинэ багц болгон олгоно.
// Өмнөх багцуудын хугацаа сунгагдахгүй. invoice_id нь unique тул нэг нэхэмжлэх давхар олгогдохгүй.
export async function grantPurchasedTokens(userId: string, planType: PaidPlanType, invoiceId: string): Promise<void> {
  const { error } = await supabase.rpc("grant_tokens", {
    p_user: userId,
    p_tokens: PLANS[planType].tokens,
    p_days: PAID_PLAN_DAYS,
    p_source: "purchase",
    p_plan: planType,
    p_invoice: invoiceId,
  })
  if (error) throw error
}

// Компанийн одоогийн багц, үлдэгдэл (хүчинтэй багцуудаас)
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription> {
  const [{ data, error }, lots] = await Promise.all([
    supabase.from("mt_company_subscriptions").select("plan_type, status, expires_at").eq("user_id", userId).maybeSingle(),
    getTokenLots(userId),
  ])
  if (error) throw error

  const planType: PlanType = isPlanType(data?.plan_type) ? data.plan_type : "free"
  const summary = summarizeLots(lots)
  // Төлбөртэй багцын хугацаа дууссан бөгөөд хүчинтэй үлдэгдэлгүй бол «дууссан»
  const paidExpired =
    planType !== "free" &&
    (data?.status !== "active" || (data?.expires_at != null && new Date(data.expires_at).getTime() < Date.now()))
  const expired = paidExpired && summary.remaining === 0

  return {
    planType,
    status: expired ? "expired" : "active",
    tokenLimit: summary.tokenLimit,
    used: summary.used,
    remaining: summary.remaining,
    expiresAt: data?.expires_at ?? null,
    nextExpiry: summary.nextExpiry,
    expiringSoon: summary.expiringSoon,
  }
}

// Шинэ зар нийтлэх токен хүрэлцэхгүй эсэх
export async function hasReachedJobLimit(
  userId: string
): Promise<{ reached: boolean; limit: number; remaining: number; expired: boolean; cost: number }> {
  const sub = await getEffectiveSubscription(userId)
  return {
    reached: sub.status === "expired" || sub.remaining < TOKEN_COSTS.post,
    limit: sub.tokenLimit,
    remaining: sub.remaining,
    expired: sub.status === "expired",
    cost: TOKEN_COSTS.post,
  }
}

// Худалдан авалтын дуусах огноо (сүүлд авсан багц — mt_company_subscriptions.expires_at)
export function purchaseExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + PAID_PLAN_DAYS * 24 * 60 * 60 * 1000)
}
