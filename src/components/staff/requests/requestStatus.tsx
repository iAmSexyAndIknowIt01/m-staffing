import { CalendarCheck, CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react"

// Ажил хайгчийн хүсэлтийн төлөв: «Миний хүсэлтүүд» жагсаалт болон дэлгэрэнгүй хуудас хоёуланд хэрэглэнэ

export type RequestStatus = "pending" | "approved" | "interview" | "rejected" | "accepted" | "not-approved"

// Статус бүрийн нэр, өнгө, дүрс, явцын шат (0 Илгээсэн, 1 Хянагдаж буй, 2 Ярилцлага, 3 Шийдвэр)
export const STATUS: Record<RequestStatus, { label: string; badge: string; icon: LucideIcon; step: number; outcome?: "success" | "fail" }> = {
  pending: { label: "Хянагдаж буй", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, step: 1 },
  interview: { label: "Ярилцлагад урьсан", badge: "bg-sky-50 text-sky-700 border-sky-200", icon: CalendarCheck, step: 2 },
  approved: { label: "Тэнцсэн", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, step: 3, outcome: "success" },
  accepted: { label: "Баталгаажсан", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, step: 3, outcome: "success" },
  "not-approved": { label: "Тэнцээгүй", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, step: 3, outcome: "fail" },
  rejected: { label: "Татгалзсан", badge: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, step: 3, outcome: "fail" },
}

export const STATUS_DESCRIPTIONS: Record<RequestStatus, string> = {
  pending: "Ажил олгогч таны анкетыг хянаж байна. Шийдвэр гармагц энд харагдана.",
  interview: "Ажил олгогч таныг ярилцлагад урьсан байна. Оролцохоо баталгаажуулна уу.",
  accepted: "Та ярилцлагад оролцохоо баталгаажуулсан. Ажил олгогч тантай холбогдоно.",
  approved: "Баяр хүргэе! Та энэ ажлын байранд тэнцсэн байна.",
  "not-approved": "Харамсалтай нь энэ удаад тэнцсэнгүй. Бусад ажлын байранд амжилт хүсье.",
  rejected: "Ажил олгогч энэ удаад өөр нэр дэвшигч сонгосон байна.",
}

export function toRequestStatus(value: string | null | undefined): RequestStatus {
  return value && value in STATUS ? (value as RequestStatus) : "pending"
}

const STEPS = ["Илгээсэн", "Хянагдаж буй", "Ярилцлага", "Шийдвэр"]

export function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "Өнөөдөр"
  if (days === 1) return "Өчигдөр"
  if (days < 7) return `${days} хоногийн өмнө`
  if (days < 30) return `${Math.floor(days / 7)} долоо хоногийн өмнө`
  if (days < 365) return `${Math.floor(days / 30)} сарын өмнө`
  return `${Math.floor(days / 365)} жилийн өмнө`
}

// Хүсэлтийн явц: Илгээсэн → Хянагдаж буй → Ярилцлага → Шийдвэр
export function Progress({ status }: { status: RequestStatus }) {
  const { step, outcome } = STATUS[status]
  // Ярилцлагагүйгээр шууд шийдвэр гарсан бол ярилцлагын шатыг алгассан гэж харуулна
  const skippedInterview = step === 3 && status === "rejected"

  return (
    <ol className="flex items-center gap-1.5" aria-label={`Явц: ${STATUS[status].label}`}>
      {STEPS.map((label, i) => {
        const done = i < step || (i === step && i < 3)
        const isFinal = i === 3 && step === 3
        const skipped = skippedInterview && i === 2
        const color = isFinal
          ? outcome === "success"
            ? "bg-emerald-500"
            : "bg-rose-400"
          : skipped
            ? "bg-gray-200"
            : done
              ? "bg-orange-500"
              : "bg-gray-200"
        return (
          <li key={label} className="flex-1 min-w-0" title={label}>
            <span className={`block h-1.5 rounded-full ${color}`} />
            <span className={`mt-1 hidden sm:block text-xs leading-tight truncate ${i <= step ? "text-gray-600" : "text-gray-400"}`}>
              {i === 3 && step === 3 ? STATUS[status].label : label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

