"use client"

import { Briefcase, Calendar, FileText, Loader2, Mail, Phone, Search, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { CONTRACTS_ENABLED } from "@/lib/features"
import { showAlert } from "@/components/common/AppDialog"
import { confirmCreateContract, confirmStatusChange } from "@/components/company/confirmApplicantAction"
import EmptyState from "@/components/common/EmptyState"
import Select from "@/components/common/Select"
import Pagination from "@/components/staff/jobs/Pagination"

interface Applicant {
  id: string
  user_name: string
  job_title: string
  email: string
  phone: string
  created_at: string
  status: string
}

interface ApplicantsListProps {
  initialApplicants: Applicant[]
}

type StatusKey = "all" | "pending" | "interview" | "accepted" | "approved" | "not-approved" | "rejected"

const STATUS_META: Record<Exclude<StatusKey, "all">, { label: string; className: string }> = {
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-50 text-amber-700 border-amber-200/60" },
  interview: { label: "Ярилцлага", className: "bg-orange-50 text-orange-700 border-orange-200/60" },
  accepted: { label: "Баталгаажсан", className: "bg-blue-50 text-blue-700 border-blue-200/60" },
  approved: { label: "Тэнцсэн", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  "not-approved": { label: "Тэнцээгүй", className: "bg-gray-100 text-gray-600 border-gray-200/60" },
  rejected: { label: "Татгалзсан", className: "bg-rose-50 text-rose-600 border-rose-200/60" },
}

const STATUS_TABS: StatusKey[] = ["all", "pending", "interview", "accepted", "approved", "not-approved", "rejected"]
const PAGE_SIZE = 10

// "new", "pending", хоосон төлөвийг «Хүлээгдэж буй» гэж нэгтгэнэ
function normalizeStatus(status: string): Exclude<StatusKey, "all"> | "unknown" {
  const s = (status || "").toLowerCase()
  if (s === "" || s === "new" || s === "pending") return "pending"
  return s in STATUS_META ? (s as Exclude<StatusKey, "all">) : "unknown"
}

function StatusBadge({ status }: { status: string }) {
  const key = normalizeStatus(status)
  const meta = key === "unknown" ? { label: "Тодорхойгүй", className: "bg-gray-50 text-gray-600 border-gray-200/60" } : STATUS_META[key]
  return <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.className}`}>{meta.label}</span>
}

export default function ApplicantsList({ initialApplicants }: ApplicantsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const param = (key: string) => searchParams.get(key) ?? ""

  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Шүүлтүүр, эрэмбэ, хуудсыг URL-д хадгална — профайл руу ороод буцахад хэвээр үлдэнэ
  const [searchQuery, setSearchQuery] = useState(() => param("q"))
  const [statusFilter, setStatusFilter] = useState<StatusKey>(() =>
    STATUS_TABS.includes(param("status") as StatusKey) ? (param("status") as StatusKey) : "all"
  )
  const [jobFilter, setJobFilter] = useState(() => param("job"))
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(() => (param("sort") === "oldest" ? "oldest" : "newest"))
  const [page, setPage] = useState(() => Math.max(1, Math.floor(Number(param("page"))) || 1))
  const listTopRef = useRef<HTMLDivElement>(null)

  const withPageReset = <T,>(set: (value: T) => void) => (value: T) => {
    set(value)
    setPage(1)
  }

  const jobOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const app of applicants) counts.set(app.job_title, (counts.get(app.job_title) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "mn"))
  }, [applicants])

  // Зар устсан г.м. шалтгаанаар URL дахь ажлын байр жагсаалтад байхгүй бол шүүлтүүрийг үл тооцно
  const activeJob = jobOptions.some(([title]) => title === jobFilter) ? jobFilter : ""

  // Төлөвийн тоо: ажлын байр, хайлтын шүүлтүүрийг тооцсон (сонгосон төлөвөөс бусад)
  const baseFiltered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return applicants.filter((app) => {
      if (activeJob && app.job_title !== activeJob) return false
      if (!query) return true
      return (
        app.user_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.phone.includes(query) ||
        app.job_title.toLowerCase().includes(query)
      )
    })
  }, [applicants, activeJob, searchQuery])

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_TABS.map((s) => [s, 0])) as Record<StatusKey, number>
    counts.all = baseFiltered.length
    for (const app of baseFiltered) {
      const key = normalizeStatus(app.status)
      if (key !== "unknown") counts[key]++
    }
    return counts
  }, [baseFiltered])

  const filteredApplicants = useMemo(() => {
    const list = statusFilter === "all" ? baseFiltered : baseFiltered.filter((app) => normalizeStatus(app.status) === statusFilter)
    return [...list].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return sortOrder === "newest" ? diff : -diff
    })
  }, [baseFiltered, statusFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedApplicants = filteredApplicants.slice(pageStart, pageStart + PAGE_SIZE)
  const visiblePages = (() => {
    const maxVisible = 5
    let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1)
    const end = Math.min(start + maxVisible - 1, totalPages)
    start = Math.max(end - maxVisible + 1, 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (activeJob) params.set("job", activeJob)
    if (sortOrder === "oldest") params.set("sort", "oldest")
    if (currentPage > 1) params.set("page", String(currentPage))
    return params.toString()
  }, [searchQuery, statusFilter, activeJob, sortOrder, currentPage])

  useEffect(() => {
    if (queryString === window.location.search.replace(/^\?/, "")) return
    router.replace(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
  }, [queryString, router])

  const backHref = `/dashboard/company/applicants${queryString ? `?${queryString}` : ""}`
  const profileHref = (id: string) => `/dashboard/company/applicants/profile?${new URLSearchParams({ id, back: backHref })}`

  const hasActiveFilters = !!searchQuery || statusFilter !== "all" || !!activeJob || sortOrder !== "newest"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setJobFilter("")
    setSortOrder("newest")
    setPage(1)
  }

  // Pagination өмнөх/дараах товч функц (prev => prev ± 1) дамжуулдаг
  const changePage = (next: number | ((prev: number) => number)) => {
    setPage((prev) => (typeof next === "function" ? next(Math.min(prev, totalPages)) : next))
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!(await confirmStatusChange(newStatus, applicants.find((a) => a.id === id)))) return

    try {
      setUpdatingId(id)
      const response = await fetch("/api/company/jobrequest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Алдаа гарлаа. Дахин оролдоно уу.")

      setApplicants((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)))
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Алдаа гарлаа. Дахин оролдоно уу.", { tone: "error" })
    } finally {
      setUpdatingId(null)
    }
  }

  // Тэнцсэн анкетаас гэрээний ноорог үүсгэж (эсвэл байгааг нь) нээнэ
  const handleCreateContract = async (id: string) => {
    if (!(await confirmCreateContract(applicants.find((a) => a.id === id)))) return

    try {
      setUpdatingId(id)
      const response = await fetch("/api/company/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_request_id: id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Амжилтгүй боллоо")

      router.push(`/dashboard/company/contracts/${result.data.id}`)
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Алдаа гарлаа. Дахин оролдоно уу.", { tone: "error" })
      setUpdatingId(null)
    }
  }

  // Мөр бүрийн үйлдлийн товчнууд (desktop, mobile хоёуланд)
  const renderActions = (app: Applicant, mobile: boolean) => {
    const status = normalizeStatus(app.status)
    const busy = updatingId === app.id
    const disabled = updatingId !== null
    const base = `text-xs font-bold rounded-xl transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5 ${mobile ? "py-2.5" : "px-3 py-2"}`
    const primary = `${base} bg-emerald-600 hover:bg-emerald-700 text-white ${mobile ? "flex-1" : ""}`
    const secondary = (tone: string) => `${base} ${tone} ${mobile ? "px-3.5" : ""}`

    return (
      <>
        <Link
          href={profileHref(app.id)}
          className={`${base} bg-gray-900 hover:bg-gray-800 text-white ${mobile ? "flex-1" : ""}`}
        >
          Дэлгэрэнгүй
        </Link>
        {status === "pending" && (
          <>
            <button type="button" disabled={disabled} onClick={() => handleStatusChange(app.id, "interview")} className={primary}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Урих
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleStatusChange(app.id, "rejected")}
              className={secondary("bg-rose-50 hover:bg-rose-100 text-rose-600")}
              aria-label="Татгалзах"
            >
              {mobile ? <X className="w-4 h-4" /> : "Татгалзах"}
            </button>
          </>
        )}
        {status === "accepted" && (
          <>
            <button type="button" disabled={disabled} onClick={() => handleStatusChange(app.id, "approved")} className={primary}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Тэнцсэн
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleStatusChange(app.id, "not-approved")}
              className={secondary("bg-orange-50 hover:bg-orange-100 text-orange-600")}
              aria-label="Тэнцээгүй"
            >
              {mobile ? <X className="w-4 h-4" /> : "Тэнцээгүй"}
            </button>
          </>
        )}
        {CONTRACTS_ENABLED && status === "approved" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleCreateContract(app.id)}
            className={`${base} bg-orange-500 hover:bg-orange-600 text-white ${mobile ? "flex-1" : ""}`}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Гэрээ
          </button>
        )}
      </>
    )
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("mn-MN")

  if (applicants.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm">
        <EmptyState
          illustration="folder"
          title="Одоогоор анкет ирээгүй байна"
          description="Ажлын зар нийтлэхэд ажил хайгчдын илгээсэн анкет энд харагдана."
          action={{ label: "Зар нийтлэх", href: "/dashboard/company/post-job" }}
          className="border-0"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ХАЙЛТ БОЛОН ШҮҮЛТҮҮР */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(0,16rem)_minmax(0,11rem)] gap-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Нэр, имэйл, утас, ажлын байраар хайх..."
              value={searchQuery}
              aria-label="Анкет хайх"
              onChange={(e) => withPageReset(setSearchQuery)(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition"
            />
          </div>
          <Select value={activeJob} aria-label="Ажлын байраар шүүх" onChange={(e) => withPageReset(setJobFilter)(e.target.value)}>
            <option value="">Бүх ажлын байр ({applicants.length})</option>
            {jobOptions.map(([title, count]) => (
              <option key={title} value={title}>
                {title} ({count})
              </option>
            ))}
          </Select>
          <Select
            value={sortOrder}
            aria-label="Эрэмбэлэх"
            onChange={(e) => withPageReset(setSortOrder)(e.target.value === "oldest" ? "oldest" : "newest")}
          >
            <option value="newest">Шинэ нь эхэндээ</option>
            <option value="oldest">Хуучин нь эхэндээ</option>
          </Select>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Төлөвөөр шүүх">
          {STATUS_TABS.map((key) => {
            const selected = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => withPageReset(setStatusFilter)(key)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition ${
                  selected
                    ? "bg-orange-600 border-orange-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {key === "all" ? "Бүгд" : STATUS_META[key].label}
                <span className={`text-xs tabular-nums ${selected ? "text-orange-100" : "text-gray-400"}`}>{statusCounts[key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ИЛЭРЦИЙН ТОО */}
      <div ref={listTopRef} className="flex flex-wrap items-center justify-between gap-2 scroll-mt-24">
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-bold text-gray-900">{filteredApplicants.length}</span> анкет
          {totalPages > 1 && (
            <span className="text-gray-400"> · {pageStart + 1}–{pageStart + pagedApplicants.length} харуулж байна</span>
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition"
          >
            <X className="w-4 h-4" /> Шүүлтүүр цэвэрлэх
          </button>
        )}
      </div>

      {filteredApplicants.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm">
          <EmptyState
            illustration="search"
            title="Илэрц олдсонгүй"
            description="Таны сонгосон шүүлтүүрт тохирох анкет байхгүй байна. Шүүлтүүрээ өөрчилж эсвэл цэвэрлээд дахин оролдоно уу."
            className="border-0"
          />
        </div>
      ) : (
        <>
          {/* КОМПЬЮТЕР: хүснэгт */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-500">
                  <th className="px-5 py-3.5">Ажил хайгч, ажлын байр</th>
                  <th className="px-4 py-3.5">Холбоо барих</th>
                  <th className="px-4 py-3.5">Ирүүлсэн</th>
                  <th className="px-4 py-3.5">Төлөв</th>
                  <th className="px-5 py-3.5 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {pagedApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4 max-w-xs">
                      <Link href={profileHref(app.id)} className="font-bold text-gray-900 hover:text-orange-700 transition block truncate">
                        {app.user_name}
                      </Link>
                      <div className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Briefcase className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="truncate">{app.job_title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {app.phone && <div className="text-gray-700 font-medium">{app.phone}</div>}
                      {app.email && <div className="text-xs text-gray-400 mt-0.5">{app.email}</div>}
                      {!app.phone && !app.email && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">{renderActions(app, false)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* УТАС: карт */}
          <ul className="md:hidden space-y-3">
            {pagedApplicants.map((app) => (
              <li key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <Link href={profileHref(app.id)} className="font-bold text-gray-900 truncate block">
                      {app.user_name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                      <Briefcase className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="truncate">{app.job_title}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="text-xs space-y-1 text-gray-600">
                  {app.phone && (
                    <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 hover:underline w-fit">
                      <Phone className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" /> {app.phone}
                    </a>
                  )}
                  {app.email && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-hidden="true" /> <span className="truncate">{app.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-400" suppressHydrationWarning>
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {formatDate(app.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">{renderActions(app, true)}</div>
              </li>
            ))}
          </ul>

          <Pagination
            filteredJobsCount={filteredApplicants.length}
            totalPages={totalPages}
            isFiltering={false}
            currentPage={currentPage}
            visiblePages={visiblePages}
            setCurrentPage={changePage}
          />
        </>
      )}
    </div>
  )
}
