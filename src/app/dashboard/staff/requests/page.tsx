"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"

interface RequestItem {
  id: string
  jobTitle: string
  companyName: string
  type: "applied" | "invitation"
  status: "pending" | "accepted" | "rejected"
  date: string
}

export default function StaffRequestsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "invitations">("all")
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filter болон Search төлөвүүд
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Pagination төлөвүүд
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 5 // Нэг хуудсанд харуулах хүсэлтийн тоо

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        
        const res = await fetch(`/api/staff/requests`)
        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.error || "Дата татахад алдаа гарлаа")
        }

        const formattedData: RequestItem[] = (result.data || []).map((item: any) => ({
          id: item.id,
          jobTitle: item.mt_openjob?.title || "Тодорхойгүй ажлын байр",
          companyName: item.mt_openjob?.mt_company?.company_name || "Компанийн нэр байхгүй",
          type: "applied",
          status: item.status || "pending",
          date: new Date(item.created_at).toISOString().split("T")[0],
        }))

        setRequests(formattedData)
      } catch (err: any) {
        console.error("Fetch requests error:", err)
        setError(err.message || "Серверийн алдаа гарлаа")
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  // Гадна дархад Dropdown хаагдах логик
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Статусны өнгө болон монгол нэршил гаргах функц
  const getStatusBadge = (status: RequestItem["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-200/50">Хүлээгдэж буй</span>
      case "accepted":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50">Зөвшөөрсөн</span>
      case "rejected":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-200/50">Татгалзсан</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-600 border border-gray-200/50">Тодорхойгүй</span>
    }
  }

  const statusLabels: Record<string, string> = {
    all: "Бүгд",
    pending: "Хүлээгдэж буй",
    accepted: "Зөвшөөрсөн",
    rejected: "Татгалзсан"
  }

  // Tab, Search, болон Status filter-ийг нэгтгэн шүүх
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // 1. Табаар шүүх
      if (activeTab === "applied" && item.type !== "applied") return false
      if (activeTab === "invitations" && item.type !== "invitation") return false

      // 2. Статусаар шүүх
      if (statusFilter !== "all" && item.status !== statusFilter) return false

      // 3. Хайлтын үгээр шүүх
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase()
        const matchesJob = item.jobTitle.toLowerCase().includes(query)
        const matchesCompany = item.companyName.toLowerCase().includes(query)
        if (!matchesJob && !matchesCompany) return false
      }

      return true
    })
  }, [requests, activeTab, statusFilter, searchQuery])

  // Хуудаслалтын тооцоолол
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(start, start + itemsPerPage)
  }, [filteredRequests, currentPage])

  // Хуудасны дугааруудыг ухаалгаар харуулах массив үүсгэх функц
  const getPaginationPages = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    if (current <= 3) {
      return [1, 2, 3, 4, '...', total]
    } else if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total]
    } else {
      return [1, '...', current - 1, current, current + 1, '...', total]
    }
  }

  // Шүүлтүүр өөрчлөгдөхөд хуудасны дугаарыг 1 болгож шинэчлэх
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, statusFilter, searchQuery])

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Толгой хэсэг */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Миний хүсэлтүүд</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Илгээсэн анкет болон компаниудаас ирсэн хүсэлт, урилгын түүх</p>
        </div>
        <div>
          <Link
            href="/dashboard/staff/jobs"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-orange-500 text-white font-semibold text-xs sm:text-sm hover:bg-orange-600 transition shadow-sm shadow-orange-500/20 w-full sm:w-auto"
          >
            <span>💼</span> Ажил хайх
          </Link>
        </div>
      </div>

      {/* Ачаалж буй эсвэл алдаа гарсан үеийн төлөв */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">Мэдээллийг ачаалж байна...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl sm:rounded-3xl border border-rose-100 shadow-sm px-4">
          <p className="text-rose-500 text-sm font-medium">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto shadow-inner">
            📂
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Та одоогоор ямар нэгэн хүсэлт илгээгээгүй байна</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Нээлттэй ажлын байрнаас сонголтоо хийж анкетаа илгээгээд карьерынхаа гарааг эхлүүлээрэй.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/staff/jobs"
              className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20"
            >
              🚀 Ажлын байр үзэх
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Таб сонголтууд (Mobile scrollable) */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "all" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Бүгд ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "applied" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Миний явуулсан анкетууд
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "invitations" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Компанийн урилгууд
            </button>
          </div>

          {/* Filterbar (Хайлт болон MStaffing Custom Dropdown) */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Хайлтын талбар */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Ажлын нэр эсвэл компаниар хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* MStaffing Styled Custom Dropdown */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 relative" ref={dropdownRef}>
              <span className="text-xs sm:text-sm font-medium text-gray-500 shrink-0">Статус:</span>
              
              <div className="relative w-full sm:w-48">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-indigo-300 focus:outline-none focus:border-indigo-500 transition"
                >
                  <span className="truncate">{statusLabels[statusFilter] || "Бүгд"}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setStatusFilter(key)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                          statusFilter === key
                            ? "bg-indigo-50/80 text-indigo-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{label}</span>
                        {statusFilter === key && <span className="text-indigo-600 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Жагсаалт хэсэг */}
            <div className="grid gap-3 sm:gap-4">
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 w-full md:w-auto">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg sm:text-xl shrink-0">
                        {req.type === "applied" ? "📄" : "✉️"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{req.jobTitle}</h3>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 w-fit">
                            {req.type === "applied" ? "Анкет илгээсэн" : "Урилга"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5 truncate">{req.companyName}</p>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Огноо: {req.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                      <div>{getStatusBadge(req.status)}</div>
                      <button className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold transition shrink-0">
                        Дэлгэрэнгүй
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-14 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm px-4">
                  <div className="text-3xl sm:text-4xl mb-2">🔍</div>
                  <p className="text-gray-700 font-bold text-sm sm:text-base">Хайлтанд тохирох хүсэлт олдсонгүй</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Та хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд үзнэ үү.</p>
                </div>
              )}
            </div>

            {/* Pagination хэсэг */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border border-gray-100 shadow-sm gap-3">
                <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Нийт <span className="font-semibold text-gray-900">{filteredRequests.length}</span> үр дүнгээс{" "}
                  <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                  </span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Өмнөх
                  </button>
                  
                  <div className="flex items-center gap-1 px-1">
                    {getPaginationPages(currentPage, totalPages).map((page, index) =>
                      page === '...' ? (
                        <span key={`dots-${index}`} className="px-2 text-gray-400 text-xs sm:text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs sm:text-sm font-semibold transition ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Дараах
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}