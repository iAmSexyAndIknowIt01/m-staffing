import { supabase } from "@/lib/supabase"
import { PAID_PLAN_DAYS, PLANS, isPlanType, type PlanType } from "@/lib/planCatalog"

// Багцын каталогийг (үнэ, эрхийн тоо) planCatalog.ts-ээс авна — клиент ч мөн тэндээс импортолно
export { PAID_PLAN_DAYS, PAID_PLAN_TYPES, PLANS, isPaidPlanType, isPlanType, pricePerPost } from "@/lib/planCatalog"
export type { PaidPlanType, PlanType } from "@/lib/planCatalog"

const DAY_MS = 24 * 60 * 60 * 1000

// Zangia маягийн «зар нийтлэх эрх»:
// - Төлбөртэй багц: худалдаж авснаас хойш PAID_PLAN_DAYS хоногт job_limit ширхэг зар нийтэлнэ.
// - Туршилтын (free) эрх: хугацаагүй, нийт job_limit ширхэг зар.
// Ашигласан эрх = тухайн хугацаанд үүсгэсэн зарын тоо (зар хаагдсан ч эрх буцаж ирэхгүй).

export interface EffectiveSubscription {
  planType: PlanType
  status: "active" | "expired"
  // Нийт нийтлэх эрх
  jobLimit: number
  // Ашигласан, үлдсэн эрх
  used: number
  remaining: number
  expiresAt: string | null
}

// Төлбөртэй багцын эхэлсэн огноо (дуусах огнооноос хүчинтэй хугацааг хасна)
function periodStart(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  return new Date(new Date(expiresAt).getTime() - PAID_PLAN_DAYS * DAY_MS).toISOString()
}

async function countPostedJobs(userId: string, since: string | null): Promise<number> {
  let query = supabase.from("mt_openjob").select("id", { count: "exact", head: true }).eq("user_id", userId)
  if (since) query = query.gte("created_at", since)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

// Компанийн одоогийн багц, ашигласан/үлдсэн эрх. Төлбөртэй багцын хугацаа дууссан бол үлдсэн эрх 0.
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription> {
  const { data, error } = await supabase
    .from("mt_company_subscriptions")
    .select("plan_type, status, job_limit, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error

  const planType: PlanType = isPlanType(data?.plan_type) ? data.plan_type : "free"

  if (!data || planType === "free") {
    // Туршилтын эрх: бүртгүүлэхэд хадгалсан тоо (хуучин компаниудад өмнөх 10) эсвэл одоогийн анхдагч
    const jobLimit = data?.job_limit ?? PLANS.free.jobLimit
    const used = await countPostedJobs(userId, null)
    return { planType: "free", status: "active", jobLimit, used, remaining: Math.max(jobLimit - used, 0), expiresAt: null }
  }

  const jobLimit = data.job_limit ?? PLANS[planType].jobLimit
  const expired =
    data.status !== "active" || (data.expires_at !== null && new Date(data.expires_at).getTime() < Date.now())
  const used = await countPostedJobs(userId, periodStart(data.expires_at))

  return {
    planType,
    status: expired ? "expired" : "active",
    jobLimit,
    used,
    remaining: expired ? 0 : Math.max(jobLimit - used, 0),
    expiresAt: data.expires_at,
  }
}

// Шинэ зар нийтлэх эрх дууссан эсэх
export async function hasReachedJobLimit(
  userId: string
): Promise<{ reached: boolean; limit: number; remaining: number; expired: boolean }> {
  const sub = await getEffectiveSubscription(userId)
  return { reached: sub.remaining <= 0, limit: sub.jobLimit, remaining: sub.remaining, expired: sub.status === "expired" }
}

// Төлбөр баталгаажихад шинэ багцын эрх, дуусах огноо.
// Хүчинтэй багцын үлдсэн эрхийг шинэ багц руу шилжүүлж, хугацааг худалдан авсан өдрөөс 1 жил болгоно.
export function computePaidPackage(
  current: Pick<EffectiveSubscription, "status" | "remaining"> | null,
  planType: Exclude<PlanType, "free">,
  now: Date = new Date()
): { jobLimit: number; expiresAt: Date } {
  const carryOver = current && current.status === "active" ? current.remaining : 0
  return {
    jobLimit: carryOver + PLANS[planType].jobLimit,
    expiresAt: new Date(now.getTime() + PAID_PLAN_DAYS * DAY_MS),
  }
}
