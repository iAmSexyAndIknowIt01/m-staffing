"use client"

import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  Search,
  SearchX,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { getErrorMessage } from "@/lib/errors"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"

// /api/staff/requests-ийн буцаах мөр
interface ApiRequestRow {
  id: string
  status: RequestStatus | null
  created_at: string
  mt_openjob: { title: string | null; mt_company: { company_name: string | null; logo_url: string | null } | null } | null
}

type RequestStatus = "pending" | "approved" | "interview" | "rejected" | "accepted" | "not-approved"

interface RequestItem {
  id: string
  jobTitle: string
  companyName: string
  logoUrl: string | null
  status: RequestStatus
  createdAt: string
}

const ITEMS_PER_PAGE = 10

// Статус бүрийн нэр, өнгө, дүрс, явцын шат (0 Илгээсэн, 1 Хянагдаж буй, 2 Ярилцлага, 3 Шийдвэр)
const STATUS: Record<RequestStatus, { label: string; badge: string; icon: LucideIcon; step: number; outcome?: "success" | "fail" }> = {
  pending: { label: "Хянагдаж буй", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, step: 1 },
  interview: { label: "Ярилцлагад урьсан", badge: "bg-sky-50 text-sky-700 border-sky-200", icon: CalendarCheck, step: 2 },
  approved: { label: "Тэнцсэн", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, step: 3, outcome: "success" },
  accepted: { label: "Баталгаажсан", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, step: 3, outcome: "success" },
  "not-approved": { label: "Тэнцээгүй", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, step: 3, outcome: "fail" },
  rejected: { label: "Татгалзсан", badge: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, step: 3, outcome: "fail" },
}

const FILTERS: { key: "all" | RequestStatus; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "pending", label: "Хянагдаж буй" },
  { key: "interview", label: "Ярилцлага" },
  { key: "approved", label: "Тэнцсэн" },
  { key: "accepted", label: "Баталгаажсан" },
  { key: "not-approved", label: "Тэнцээгүй" },
  { key: "rejected", label: "Татгалзсан" },
]

const STEPS = ["Илгээсэн", "Хянагдаж буй", "Ярилцлага", "Шийдвэр"]

// Логоны URL-ийг шалгах функц
function getCompanyLogoUrl(logoUrl: string | null | undefined) {
  if (!logoUrl) return null
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (!base) return logoUrl
  return `${base}/storage/v1/object/public/company-logos/${logoUrl}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "Өнөөдөр"
  if (days === 1) return "Өчигдөр"
  if (days < 7) return `${days} хоногийн өмнө`
  if (days < 30) return `${Math.floor(days / 7)} долоо хоногийн өмнө`
  if (days < 365) return `${Math.floor(days / 30)} сарын өмнө`
  return `${Math.floor(days / 365)} жилийн өмнө`
}

// Хүсэлтийн явц: Илгээсэн → Хянагдаж буй → Ярилцлага → Шийдвэр
function Progress({ status }: { status: RequestStatus }) {
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

export default function StaffRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch(`/api/staff/requests`)
        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.error || "Дата татахад алдаа гарлаа")
        }

        setRequests(
          ((result.data || []) as ApiRequestRow[]).map((item) => ({
            id: item.id,
            jobTitle: item.mt_openjob?.title || "Тодорхойгүй ажлын байр",
            companyName: item.mt_openjob?.mt_company?.company_name || "Компанийн нэр байхгүй",
            logoUrl: item.mt_openjob?.mt_company?.logo_url || null,
            status: item.status && item.status in STATUS ? item.status : "pending",
            createdAt: item.created_at,
          }))
        )
      } catch (err) {
        console.error("Fetch requests error:", err)
        setError(getErrorMessage(err, "Серверийн алдаа гарлаа"))
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length }
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [requests])

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return requests.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!query) return true
      return item.jobTitle.toLowerCase().includes(query) || item.companyName.toLowerCase().includes(query)
    })
  }, [requests, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE))
  const page = Math.min(currentPage, totalPages)
  const paginatedRequests = filteredRequests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Бусад хуудастай ижил: контентын оронд loader (цэс харагдсаар)
  if (loading) {
    return <LoadingLayout loading />
  }

  const active = (counts.pending || 0) + (counts.interview || 0)
  const success = (counts.approved || 0) + (counts.accepted || 0)
  const stats = [
    { label: "Нийт илгээсэн", value: counts.all || 0, icon: Send, tone: "bg-orange-50 text-orange-600" },
    { label: "Шийдвэр хүлээж буй", value: active, icon: Clock, tone: "bg-amber-50 text-amber-600" },
    { label: "Ярилцлагад урьсан", value: counts.interview || 0, icon: CalendarCheck, tone: "bg-sky-50 text-sky-600" },
    { label: "Тэнцсэн", value: success, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 sm:space-y-6">
      {/* ТОЛГОЙ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Миний хүсэлтүүд</h1>
          <p className="text-sm text-gray-500 mt-1">Илгээсэн анкетууд болон тэдгээрийн явц</p>
        </div>
        <Link
          href="/dashboard/staff/jobs"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-sm transition"
        >
          <Briefcase className="w-4 h-4" /> Ажил хайх
        </Link>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Та одоогоор анкет илгээгээгүй байна"
          description="Нээлттэй ажлын байраас сонгоод анкетаа илгээхэд явц нь энд харагдана."
          action={{ label: "Ажлын байр үзэх", href: "/dashboard/staff/jobs" }}
        />
      ) : (
        <>
          {/* ТОЙМ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ХАЙЛТ + СТАТУС */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Ажлын нэр эсвэл компаниар хайх..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Хүсэлт хайх"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Статусаар шүүх">
              {FILTERS.filter(({ key }) => key === "all" || counts[key]).map(({ key, label }) => {
                const selected = statusFilter === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setStatusFilter(key)
                      setCurrentPage(1)
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition ${
                      selected
                        ? "bg-orange-600 border-orange-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {label}
                    <span className={`text-xs ${selected ? "text-orange-100" : "text-gray-400"}`}>{counts[key] || 0}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ЖАГСААЛТ */}
          {paginatedRequests.length > 0 ? (
            <ul className="space-y-3">
              {paginatedRequests.map((req) => {
                const logoSrc = getCompanyLogoUrl(req.logoUrl)
                const status = STATUS[req.status]
                const StatusIcon = status.icon
                return (
                  <li key={req.id}>
                    <Link
                      href={`/dashboard/staff/requests/${req.id}`}
                      className="group block bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={`${req.companyName} лого`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-base font-bold text-orange-600">{req.companyName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{req.jobTitle}</h3>
                              <p className="text-sm text-gray-500 truncate">{req.companyName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0 mt-0.5 transition" />
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.badge}`}>
                              <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                            </span>
                            <span className="text-xs text-gray-400" title={formatDate(req.createdAt)}>
                              {timeAgo(req.createdAt)} илгээсэн
                            </span>
                          </div>

                          <div className="mt-3">
                            <Progress status={req.status} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon={SearchX}
              title="Хайлтад тохирох хүсэлт олдсонгүй"
              description="Хайлтын үг эсвэл статусын шүүлтүүрээ өөрчилж үзнэ үү."
            />
          )}

          {/* ХУУДАСЛАЛТ */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3" aria-label="Хуудаслалт">
              <span className="text-sm text-gray-500">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredRequests.length)} / {filteredRequests.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Өмнөх хуудас"
                  className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-700 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Дараах хуудас"
                  className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
