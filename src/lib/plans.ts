import { supabase } from "@/lib/supabase"
import { PAID_PLAN_DAYS, PLANS, TOKEN_COSTS, formatTokens, isPlanType, type PlanType, type TokenAction } from "@/lib/planCatalog"

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

const DAY_MS = 24 * 60 * 60 * 1000

// M токен:
// - Төлбөртэй багц: худалдаж авснаас хойш PAID_PLAN_DAYS хоногт token_limit токен.
// - Туршилтын (free) эрх: хугацаагүй, нийт token_limit токен.
// Ашигласан токен = тухайн хугацаанд tr_job_credit_usage.tokens-ийн нийлбэр
// (зар нийтлэх, дахин нээх, сунгах, ажилтанд хүсэлт илгээх бүр мөр үүсгэнэ).
// Зар хаагдсан, устгагдсан ч зарцуулсан токен буцаж ирэхгүй.

export interface EffectiveSubscription {
  planType: PlanType
  status: "active" | "expired"
  // Нийт M токен
  tokenLimit: number
  // Ашигласан, үлдсэн M токен
  used: number
  remaining: number
  expiresAt: string | null
}

// Төлбөртэй багцын эхэлсэн огноо (дуусах огнооноос хүчинтэй хугацааг хасна)
function periodStart(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  return new Date(new Date(expiresAt).getTime() - PAID_PLAN_DAYS * DAY_MS).toISOString()
}

async function tokenUsage(userId: string, since: string | null): Promise<number> {
  const { data, error } = await supabase.rpc("company_token_usage", { p_user: userId, p_since: since })
  if (error) throw error
  return Number(data ?? 0)
}

// Үйлдлийн үнээр 1 мөр бүртгэнэ. Токен хүрэлцэхгүй эсвэл багц дууссан бол { error }, амжилттай бол бүртгэлийн id.
export async function chargeTokens(
  userId: string,
  action: TokenAction,
  jobId: string | null = null
): Promise<{ error: string } | { usageId: string }> {
  const cost = TOKEN_COSTS[action]
  const sub = await getEffectiveSubscription(userId)
  if (sub.status === "expired") return { error: "Таны багцын хугацаа дууссан байна. Шинэ багц худалдаж авна уу." }
  if (sub.remaining < cost) {
    return {
      error: `M токен хүрэлцэхгүй байна (үлдсэн ${formatTokens(sub.remaining)}, шаардлагатай ${formatTokens(cost)}). Шинэ багц худалдаж авна уу.`,
    }
  }
  const { data, error } = await supabase
    .from("tr_job_credit_usage")
    .insert({ user_id: userId, job_id: jobId, reason: action, tokens: cost })
    .select("id")
    .single()
  if (error) throw error
  return { usageId: data.id as string }
}

// Зар үүсгэсний дараа «зар нийтлэх» бүртгэлийг тухайн зартай холбоно
export async function linkUsageToJob(usageId: string, jobId: string): Promise<void> {
  const { error } = await supabase.from("tr_job_credit_usage").update({ job_id: jobId }).eq("id", usageId)
  if (error) throw error
}

// Үйлдэл амжилтгүй болбол зарцуулсан токеныг буцаана (бүртгэлийг устгана)
export async function refundUsage(usageId: string): Promise<void> {
  const { error } = await supabase.from("tr_job_credit_usage").delete().eq("id", usageId)
  if (error) console.error("TOKEN_REFUND_ERROR:", error)
}

// Хуучин нэр: ажилтанд хүсэлт илгээх г.м. (src/lib/staffContactAccess.ts)
export const chargeCredit = chargeTokens

// Зар дахин нээх / сунгахад токен хасна. Хүрэлцэхгүй эсвэл багц дууссан бол алдааны мессеж буцаана.
export async function chargeJobCredit(userId: string, jobId: string, reason: "reopen" | "extend"): Promise<string | null> {
  const result = await chargeTokens(userId, reason, jobId)
  return "error" in result ? result.error : null
}

// Компанийн одоогийн багц, ашигласан/үлдсэн токен. Төлбөртэй багцын хугацаа дууссан бол үлдсэн 0.
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription> {
  const { data, error } = await supabase
    .from("mt_company_subscriptions")
    .select("plan_type, status, token_limit, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error

  const planType: PlanType = isPlanType(data?.plan_type) ? data.plan_type : "free"

  if (!data || planType === "free") {
    // Туршилтын эрх: бүртгүүлэхэд хадгалсан хэмжээ (хуучин компаниудад өмнөх 10 зар = 10,000) эсвэл анхдагч
    const tokenLimit = data?.token_limit ?? PLANS.free.tokens
    const used = await tokenUsage(userId, null)
    return { planType: "free", status: "active", tokenLimit, used, remaining: Math.max(tokenLimit - used, 0), expiresAt: null }
  }

  const tokenLimit = data.token_limit ?? PLANS[planType].tokens
  const expired =
    data.status !== "active" || (data.expires_at !== null && new Date(data.expires_at).getTime() < Date.now())
  const used = await tokenUsage(userId, periodStart(data.expires_at))

  return {
    planType,
    status: expired ? "expired" : "active",
    tokenLimit,
    used,
    remaining: expired ? 0 : Math.max(tokenLimit - used, 0),
    expiresAt: data.expires_at,
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

// Төлбөр баталгаажихад шинэ багцын токен, дуусах огноо.
// Хүчинтэй багцын үлдсэн токеныг шинэ багц руу шилжүүлж, хугацааг худалдан авсан өдрөөс 1 жил болгоно.
export function computePaidPackage(
  current: Pick<EffectiveSubscription, "status" | "remaining"> | null,
  planType: Exclude<PlanType, "free">,
  now: Date = new Date()
): { tokenLimit: number; expiresAt: Date } {
  const carryOver = current && current.status === "active" ? current.remaining : 0
  return {
    tokenLimit: carryOver + PLANS[planType].tokens,
    expiresAt: new Date(now.getTime() + PAID_PLAN_DAYS * DAY_MS),
  }
}
