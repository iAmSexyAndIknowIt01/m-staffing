// Имэйл мэдэгдлийн төрөл, анхдагч утга — client болон server хоёуланд ашиглана (DB-гүй цэвэр логик).
// Хүснэгт: mt_notification_settings (supabase/migrations/20261028000000_notification_settings.sql)

import { JOB_CATEGORIES } from "@/lib/jobPost"

export type NotificationRole = "staff" | "company"

export type NotificationKey = "application_status" | "job_offer" | "new_application" | "company_approval" | "payment"

export type NotificationSettings = Record<NotificationKey, boolean> & {
  // job_offer-ийн ангилал (JOB_CATEGORIES-ийн value). Хоосон бол бүх ангилал.
  job_offer_categories: string[]
}

export interface NotificationOption {
  key: NotificationKey
  title: string
  description: string
}

export const NOTIFICATION_OPTIONS: Record<NotificationRole, NotificationOption[]> = {
  staff: [
    {
      key: "application_status",
      title: "Анкетын төлөв өөрчлөгдөх",
      description: "Ажил олгогч таныг ярилцлагад урих, тэнцсэн, тэнцээгүй эсвэл татгалзсан үед.",
    },
    {
      key: "job_offer",
      title: "Шинэ ажлын санал",
      description: "Таны сонгосон ангилалд шинэ ажлын байр нийтлэгдэх үед.",
    },
  ],
  company: [
    {
      key: "new_application",
      title: "Шинэ анкет ирэх",
      description: "Танай зарт ажил хайгч анкет илгээх үед.",
    },
    {
      key: "company_approval",
      title: "Байгууллага баталгаажих",
      description: "Админ танай байгууллагыг баталгаажуулж, зар нийтлэх боломжтой болох үед.",
    },
    {
      key: "payment",
      title: "Төлбөрийн мэдэгдэл",
      description: "Багцын төлбөр баталгаажих эсвэл нэхэмжлэх цуцлагдах үед.",
    },
  ],
}

// Шинэ ажлын санал олон хүнд илгээгддэг тул хэрэглэгч өөрөө асаана (opt-in); бусад нь анхнаасаа асаалттай.
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  application_status: true,
  job_offer: false,
  job_offer_categories: [],
  new_application: true,
  company_approval: true,
  payment: true,
}

const KEYS = Object.keys(DEFAULT_NOTIFICATION_SETTINGS).filter((k) => k !== "job_offer_categories") as NotificationKey[]
const CATEGORY_VALUES = new Set<string>(JOB_CATEGORIES.map((c) => c.value))

// DB-ийн мөр эсвэл хэрэглэгчийн илгээсэн утгыг анхдагч утгатай нэгтгэнэ.
// Мэдэгдэхгүй түлхүүр, буруу төрлийн утга, байхгүй ангиллыг хаяна.
export function normalizeNotificationSettings(input: unknown): NotificationSettings {
  const result: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, job_offer_categories: [] }
  if (!input || typeof input !== "object") return result
  const src = input as Record<string, unknown>
  for (const key of KEYS) {
    if (typeof src[key] === "boolean") result[key] = src[key]
  }
  if (Array.isArray(src.job_offer_categories)) {
    result.job_offer_categories = [...new Set(src.job_offer_categories.filter((c): c is string => typeof c === "string" && CATEGORY_VALUES.has(c)))]
  }
  return result
}

// Тухайн ангиллын шинэ зарын санал энэ хэрэглэгчид очих эсэх.
// «Бусад»-аар гараар бичсэн салбар (жагсаалтад байхгүй утга) нь "other" ангилалд тооцогдоно.
export function wantsJobOffer(settings: Pick<NotificationSettings, "job_offer" | "job_offer_categories">, category: string): boolean {
  if (!settings.job_offer) return false
  if (settings.job_offer_categories.length === 0) return true
  return settings.job_offer_categories.includes(CATEGORY_VALUES.has(category) ? category : "other")
}
