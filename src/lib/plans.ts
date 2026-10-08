import { supabase } from "@/lib/supabase"

// Багцын тохиргооны цорын ганц эх сурвалж.
// Billing хуудсанд зарласан тоотой (10 / 50 / 100) таарч байх ёстой.

export type PlanType = "free" | "standard" | "premium"

export const PLANS: Record<PlanType, { name: string; price: number; jobLimit: number }> = {
  free: { name: "Үнэгүй багц", price: 0, jobLimit: 10 },
  standard: { name: "Standard Plan", price: 150000, jobLimit: 50 },
  premium: { name: "Premium Plan", price: 350000, jobLimit: 100 },
}

export const PAID_PLAN_DAYS = 30

export function isPlanType(value: unknown): value is PlanType {
  return typeof value === "string" && Object.hasOwn(PLANS, value)
}

// Төлбөр баталгаажсаны дараах дуусах хугацаа. Ижил багцаа хугацаа дуусахаас өмнө
// сунгавал үлдсэн хоног алдагдахгүй — одоогийн дуусах хугацаан дээр нэмнэ.
export function computePaidExpiry(
  current: { plan_type: string | null; status: string | null; expires_at: string | null } | null,
  planType: PlanType,
  now: Date = new Date()
): Date {
  const currentExpiry = current?.expires_at ? new Date(current.expires_at) : null
  const extendsCurrent =
    current?.plan_type === planType &&
    current.status === "active" &&
    currentExpiry !== null &&
    currentExpiry.getTime() > now.getTime()

  const base = extendsCurrent ? currentExpiry : now
  return new Date(base.getTime() + PAID_PLAN_DAYS * 24 * 60 * 60 * 1000)
}

export interface EffectiveSubscription {
  planType: PlanType
  status: "active" | "expired"
  jobLimit: number
  expiresAt: string | null
}

// Компанийн одоо хүчинтэй багц. Төлбөртэй багцын хугацаа дууссан бол
// "expired" төлөвтэй, лимит нь Free багцынх болно.
export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription> {
  const { data, error } = await supabase
    .from("mt_company_subscriptions")
    .select("plan_type, status, job_limit, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { planType: "free", status: "active", jobLimit: PLANS.free.jobLimit, expiresAt: null }
  }

  const planType: PlanType = isPlanType(data.plan_type) ? data.plan_type : "free"
  const expired =
    data.status !== "active" ||
    (data.expires_at !== null && new Date(data.expires_at).getTime() < Date.now())

  if (expired && planType !== "free") {
    return { planType, status: "expired", jobLimit: PLANS.free.jobLimit, expiresAt: data.expires_at }
  }

  return {
    planType,
    status: "active",
    jobLimit: data.job_limit ?? PLANS[planType].jobLimit,
    expiresAt: data.expires_at,
  }
}

// Идэвхтэй зарын тоо лимитэд хүрсэн эсэх. excludeJobId — засварлаж буй зарыг тооцохгүй.
export async function hasReachedJobLimit(userId: string, excludeJobId?: string): Promise<{ reached: boolean; limit: number }> {
  const sub = await getEffectiveSubscription(userId)

  let query = supabase
    .from("mt_openjob")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")

  if (excludeJobId) query = query.neq("id", excludeJobId)

  const { count, error } = await query
  if (error) throw error

  return { reached: (count ?? 0) >= sub.jobLimit, limit: sub.jobLimit }
}
