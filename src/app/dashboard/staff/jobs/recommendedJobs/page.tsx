"use client"

import { ArrowLeft, Briefcase, ChevronLeft, ChevronRight, MapPin, Search, SearchX, Sparkles, Wallet, XCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { getErrorMessage } from "@/lib/errors"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import { CompanyLogo, VerifiedCompanyName } from "@/components/staff/jobs/CompanyIdentity"

interface Job {
  id: string
  company_id?: string
  title: string
  company: string
  company_logo?: string | null
  type: string
  location: string
  salary: string
  category: string
  description?: string
}

const ITEMS_PER_PAGE = 10

function formatSalary(salaryStr: string) {
  const numericValue = salaryStr?.replace(/[^0-9]/g, "")
  if (!numericValue) return salaryStr || "Тохиролцоно"
  return `${Number(numericValue).toLocaleString()} ₮`
}

// Тайлбарын эхний хэсгийг нэг мөр болгон харуулна
function excerpt(text: string | undefined) {
  const clean = (text || "").replace(/\s+/g, " ").trim()
  if (!clean || clean === "Ажлын тайлбар байхгүй байна.") return ""
  return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean
}

export default function RecommendedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // Хэрэглэгчийг session-оос таньдаг тул URL-ийн userId шаардлагагүй
    async function fetchJobs() {
      try {
        const res = await fetch("/api/staff/dashboard", { cache: "no-store" })
        if (!res.ok) throw new Error("Ажлын байрны өгөгдлийг татаж чадсангүй.")
        const result = await res.json()
        setJobs(result.recommendedJobs || [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  // Ангилал тус бүрийн тоо (олон ажилтай нь эхэнд)
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    jobs.forEach((job) => {
      if (job.category) counts.set(job.category, (counts.get(job.category) || 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.location || "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || job.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [jobs, searchTerm, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE))
  const page = Math.min(currentPage, totalPages)
  const paginatedJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const goToPage = (next: number) => {
    setCurrentPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  const filters: [string, string, number][] = [["all", "Бүгд", jobs.length], ...categories.map(([c, n]) => [c, c, n] as [string, string, number])]

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 sm:space-y-6">
      {/* ТОЛГОЙ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Хянах самбар
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Танд санал болгох ажил</h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length > 0
              ? `Таны анкет илгээгээгүй ${jobs.length} нээлттэй ажлын байр`
              : "Таны анкет илгээгээгүй нээлттэй ажлын байрууд"}
          </p>
        </div>
        <Link
          href="/dashboard/staff/jobs"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 text-gray-700 text-sm font-semibold shadow-sm transition"
        >
          <Briefcase className="w-4 h-4" /> Бүх ажлын байр
        </Link>
      </div>

      {error ? (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Санал болгох ажлын байр одоогоор алга"
          description="Шинэ ажлын байр нэмэгдэхэд энд харагдана."
          action={{ label: "Ажлын байр үзэх", href: "/dashboard/staff/jobs" }}
        />
      ) : (
        <>
          {/* ХАЙЛТ + АНГИЛАЛ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Ажлын нэр, компани эсвэл байршлаар хайх..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                aria-label="Ажлын байр хайх"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Ангиллаар шүүх">
                {filters.map(([key, label, count]) => {
                  const selected = categoryFilter === key
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => {
                        setCategoryFilter(key)
                        setCurrentPage(1)
                      }}
                      className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition ${
                        selected
                          ? "bg-orange-600 border-orange-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                      }`}
                    >
                      {label}
                      <span className={`text-xs ${selected ? "text-orange-100" : "text-gray-400"}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ЖАГСААЛТ */}
          {paginatedJobs.length > 0 ? (
            <ul className="space-y-3">
              {paginatedJobs.map((job) => {
                const summary = excerpt(job.description)
                return (
                  <li key={job.id}>
                    <Link
                      href={`/dashboard/staff/jobs/${job.id}`}
                      className="group block bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <CompanyLogo name={job.company} logoUrl={job.company_logo} className="w-11 h-11 sm:w-12 sm:h-12" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{job.title}</h3>
                              <VerifiedCompanyName name={job.company} className="text-sm mt-0.5" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0 mt-0.5 transition" />
                          </div>

                          {summary && <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-2">{summary}</p>}

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {job.location}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                              <Wallet className="w-3.5 h-3.5" /> {formatSalary(job.salary)}
                            </span>
                            {job.type && <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{job.type}</span>}
                            {job.category && (
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-medium">{job.category}</span>
                            )}
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
              title="Хайлтад тохирох ажлын байр олдсонгүй"
              description="Хайлтын үг эсвэл ангиллын шүүлтүүрээ өөрчилж үзнэ үү."
            />
          )}

          {/* ХУУДАСЛАЛТ */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-3" aria-label="Хуудаслалт">
              <span className="text-sm text-gray-500">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredJobs.length)} / {filteredJobs.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
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
                  onClick={() => goToPage(page + 1)}
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
