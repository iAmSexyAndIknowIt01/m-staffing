// Багцын каталог (импортгүй тул клиент компонентоос ч хэрэглэж болно).
// Багц бүр нь тодорхой тооны «зар нийтлэх эрх»; зар нийтлэх бүрт 1 эрх хасагдана.

export type PlanType = "free" | "starter" | "standard" | "premium"
export type PaidPlanType = Exclude<PlanType, "free">

export interface PlanInfo {
  name: string
  price: number
  // Нийтлэх эрхийн тоо
  jobLimit: number
}

export const PLANS: Record<PlanType, PlanInfo> = {
  free: { name: "Туршилтын эрх", price: 0, jobLimit: 3 },
  starter: { name: "Эхлэл багц", price: 800_000, jobLimit: 15 },
  standard: { name: "Стандарт багц", price: 1_500_000, jobLimit: 50 },
  premium: { name: "Премиум багц", price: 2_800_000, jobLimit: 100 },
}

export const PAID_PLAN_TYPES: PaidPlanType[] = ["starter", "standard", "premium"]

// Төлбөртэй багцын хүчинтэй хугацаа (хоног)
export const PAID_PLAN_DAYS = 365

export function isPlanType(value: unknown): value is PlanType {
  return typeof value === "string" && Object.hasOwn(PLANS, value)
}

export function isPaidPlanType(value: unknown): value is PaidPlanType {
  return isPlanType(value) && value !== "free"
}

// Нэг зарын үнэ (₮, бүхэл тоогоор)
export function pricePerPost(plan: PaidPlanType): number {
  return Math.round(PLANS[plan].price / PLANS[plan].jobLimit)
}
