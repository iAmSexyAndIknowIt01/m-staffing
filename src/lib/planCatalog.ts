// Багцын каталог (импортгүй тул клиент компонентоос ч хэрэглэж болно).
// Багц бүр нь тодорхой хэмжээний M токен өгнө. Үйлдэл бүр TOKEN_COSTS-ийн дагуу токен зарцуулна.

export type PlanType = "free" | "starter" | "standard" | "premium"
export type PaidPlanType = Exclude<PlanType, "free">

export interface PlanInfo {
  name: string
  price: number
  // Багцаар олгох M токен
  tokens: number
}

export const PLANS: Record<PlanType, PlanInfo> = {
  // Шинэ компанид автоматаар токен олгохгүй — админ гараар олгоно
  free: { name: "Туршилтын эрх", price: 0, tokens: 0 },
  starter: { name: "M багц", price: 399_999, tokens: 15_000 },
  standard: { name: "Стандарт багц", price: 999_999, tokens: 50_000 },
  premium: { name: "Премиум багц", price: 1_499_999, tokens: 100_000 },
}

// Үйлдэл бүрийн зарцуулах M токен (tr_job_credit_usage.reason)
export const TOKEN_COSTS = {
  // Шинэ зар нийтлэх
  post: 1_000,
  // Хаагдсан / хугацаа дууссан зарыг дахин нээх
  reopen: 1_000,
  // Идэвхтэй зарын хугацааг сунгах
  extend: 1_000,
  // Ажилтанд «Ажиллах хүсэлт илгээх» (утас, имэйл нээх)
  contact_unlock: 1_500,
} as const

export type TokenAction = keyof typeof TOKEN_COSTS

export const TOKEN_ACTION_LABELS: Record<TokenAction, string> = {
  post: "Зар нийтлэх",
  reopen: "Зар дахин нээх",
  extend: "Зарын хугацаа сунгах",
  contact_unlock: "Ажилтанд хүсэлт илгээх",
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

// "15,000 M токен"
export function formatTokens(tokens: number): string {
  return `${Math.max(0, Math.round(tokens)).toLocaleString("en-US")} M токен`
}

// Багцаар хэдэн удаа тухайн үйлдлийг хийх боломжтой (жишээ: 15,000 → 15 зар)
export function actionsFor(tokens: number, action: TokenAction): number {
  return Math.floor(Math.max(0, tokens) / TOKEN_COSTS[action])
}

// Тухайн багцаар нэг үйлдэл хийх үнэ (₮, бүхэл тоогоор): зар 1,000 токен, хүсэлт 1,500 токен
export function priceForAction(plan: PaidPlanType, action: TokenAction): number {
  return Math.round((PLANS[plan].price / PLANS[plan].tokens) * TOKEN_COSTS[action])
}

// 1,000 M токены үнэ (₮, бүхэл тоогоор) — багцуудыг харьцуулахад
export function pricePerThousandTokens(plan: PaidPlanType): number {
  return Math.round((PLANS[plan].price / PLANS[plan].tokens) * 1000)
}
