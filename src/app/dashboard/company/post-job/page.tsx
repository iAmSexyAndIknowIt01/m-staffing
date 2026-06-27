"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface JobItem {
  id: string
  title: string
  category: string
  salary: string
  salary_type?: "monthly" | "hourly" // Цалингийн төрөл нэмэв
  job_type?: string                  // Ажлын цагийн төрөл нэмэв
  status: string
  created_at: string
  applicants_count: number
}

// Ажлын төрлийг Монголоор хөрвүүлэх туслах функц
const getJobTypeLabel = (type?: string) => {
  switch (type) {
    case "fulltime": return "Бүтэн цагийн"
    case "parttime": return "Хагас цагийн"
    case "contract": return "Гэрээт"
    case "intern": return "Дадлагажигч"
    case "remote": return "Зайнаас"
    default: return "Бүтэн цагийн"
  }
}

export default function PostJobPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // ОЛОН НӨХЦӨЛТ ШҮҮЛТҮҮРИЙН STATE-ҮҮД
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [salaryFilter, setSalaryFilter] = useState("all")
  const [applicantFilter, setApplicantFilter] = useState("all")
  const [dateSort, setDateSort] = useState("newest")
  
  // ХУУДАСЛАЛТЫН ДИНАМИК STATE-ҮҮД
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // API-аас дата татах хэсэг (StrictMode-д зориулж зассан)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function fetchJobs() {
      try {
        setLoading(true)
        const response = await fetch("/api/jobs", { signal })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Датаг татаж чадсангүй")
        }

        setJobs(result.data || [])
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message)
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchJobs()

    return () => {
      controller.abort()
    }
  }, [])

  const handleResetFilters = () => {
    searchQuery !== "" && setSearchQuery("")
    statusFilter !== "all" && setStatusFilter("all")
    salaryFilter !== "all" && setSalaryFilter("all")
    applicantFilter !== "all" && setApplicantFilter("all")
    dateSort !== "newest" && setDateSort("newest")
    setCurrentPage(1)
  }

  // 🔄 Анкет үзэх холбоос руу шилжихээс өмнө Loader асаах функц
  const handleViewApplicants = (jobId: string) => {
    setLoading(true)
    router.push(`/dashboard/company/post-job/${jobId}/applicants`)
  }

  // ШҮҮЛТҮҮР БОЛОН ЭРЭМБЭЛЭЛТ
  const filteredAndSortedJobs = jobs
    .filter((job) => {
      const query = searchQuery.toLowerCase()
      const matchesText =
        job.title?.toLowerCase().includes(query) ||
        job.category?.toLowerCase().includes(query)

      const matchesStatus = statusFilter === "all" || job.status === statusFilter

      let matchesSalary = true
      if (salaryFilter === "specified") {
        matchesSalary = !!job.salary && !job.salary.toLowerCase().includes("тохиролц")
      } else if (salaryFilter === "negotiate") {
        matchesSalary = !job.salary || job.salary.toLowerCase().includes("тохиролц")
      }

      const matchesApplicants =
        applicantFilter === "all" ||
        (applicantFilter === "has_applicants" && job.applicants_count > 0)

      return matchesText && matchesStatus && matchesSalary && matchesApplicants
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateSort === "newest" ? dateB - dateA : dateA - dateB
    })

  const isFilterActive =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    salaryFilter !== "all" ||
    applicantFilter !== "all" ||
    dateSort !== "newest"

  // ХУУДАСЛАЛТЫН ЛОГИК
  const totalPages = Math.ceil(filteredAndSortedJobs.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentJobs = filteredAndSortedJobs.slice(indexOfFirstItem, indexOfLastItem)

  const getPaginationRange = () => {
    const current = currentPage
    const total = totalPages
    
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const range: (number | string)[] = []
    range.push(1)

    if (current > 3) {
      range.push("...")
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    if (current < total - 2) {
      range.push("...")
    }

    range.push(total)
    return range
  }

  const formatSalary = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return amount;
    return Number(amount).toLocaleString("mn-MN");
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 md:space-y-8 px-4 sm:px-0 pb-6">
      
      {/* CUSTOM MSTAFFING LOADER */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
          <div className="relative flex items-center justify-center h-32 w-32">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
              <span className="text-xs font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
                mstaffing
              </span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
            Түр хүлээнэ үү...
          </p>
        </div>
      )}

      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Ажлын байрны удирдлага 💼</h1>
          <p className="text-gray-500 mt-1 text-xs md:text-base">
            Танай компаниейн зарласан идэвхтэй болон хаагдсан ажлын байруудын жагсаалт.
          </p>
        </div>
        
        <Link
          href="/dashboard/company/post-job/add"
          className="w-full sm:w-auto px-6 py-3.5 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-center flex items-center justify-center gap-2"
        >
          <span className="text-base">+</span> Шинэ зар нэмэх
        </Link>
      </div>

      {/* ШҮҮЛТҮҮРИЙН ПАНЕЛЬ */}
      {!loading && jobs.length > 0 && (
        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-4xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Нэр, чиглэлээр хайх..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-gray-100 text-xs font-semibold rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-100 text-xs font-semibold rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                <option value="all">Бүх статус (Төлөв)</option>
                <option value="active">Идэвхтэй</option>
                <option value="draft">Ноорог</option>
                <option value="closed">Хаагдсан</option>
              </select>
            </div>

            <div>
              <select
                value={salaryFilter}
                onChange={(e) => { setSalaryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-100 text-xs font-semibold rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                <option value="all">Бүх цалингийн төрөл</option>
                <option value="specified">Цалин заасан зарууд</option>
                <option value="negotiate">Тохиролцох зарууд</option>
              </select>
            </div>

            <div>
              <select
                value={applicantFilter}
                onChange={(e) => { setApplicantFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-100 text-xs font-semibold rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                <option value="all">Бүх зар (Анкет хамаарахгүй)</option>
                <option value="has_applicants">📥 Зөвхөн анкет ирсэн</option>
              </select>
            </div>

            <div>
              <select
                value={dateSort}
                onChange={(e) => { setDateSort(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-100 text-xs font-semibold rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all"
              >
                <option value="newest">Сүүлд нэмэгдсэн</option>
                <option value="oldest">Анх нэмэгдсэн</option>
              </select>
            </div>
          </div>

          {isFilterActive && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition"
              >
                🔄 Шүүлтүүрүүдийг цэвэрлэх
              </button>
            </div>
          )}
        </div>
      )}

      {/* АЖЛЫН БАЙРНЫ ЛИСТ БОЛОН ХУУДАСЛАЛТ */}
      <div className="space-y-4">
        {!loading && (
          <div className="flex justify-between items-center px-1">
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {isFilterActive ? "Шүүгдсэн үр дүн" : "Нийт зарласан ажлууд"} ({filteredAndSortedJobs.length})
            </h2>
            {isFilterActive && (
              <span className="text-[10px] md:text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                Шүүлтүүр идэвхтэй
              </span>
            )}
          </div>
        )}

        {error ? (
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm">
            ❌ Алдаа гарлаа: {error}
          </div>
        ) : filteredAndSortedJobs.length > 0 ? (
          <>
            <div className="bg-white border border-gray-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden divide-y divide-gray-50">
              {currentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-all"
                >
                  <div className="space-y-2 w-full md:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base md:text-lg font-bold text-gray-950 wrap-break-word">{job.title}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 rounded-lg">
                        {getJobTypeLabel(job.job_type)}
                      </span>

                      {job.status === "active" ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">Идэвхтэй</span>
                      ) : job.status === "draft" ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-lg">Ноорог</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 rounded-lg">Хаагдсан</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] md:text-xs text-gray-400 font-medium">
                      <span>🏢 {job.category || "Ерөнхий"}</span>
                      <span className="text-slate-800 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md">
                        💰 {job.salary ? `${formatSalary(job.salary)} ₮ / ${job.salary_type === "hourly" ? "цаг" : "сар"}` : "Тохиролцоно"}
                      </span>
                      <span>📅 {new Date(job.created_at).toLocaleDateString("mn-MN")}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                    <div className="text-left md:text-right min-w-17.5">
                      <p className="text-[10px] md:text-xs text-gray-400 font-medium">Ирсэн анкет</p>
                      <p className="text-lg md:text-xl font-black text-gray-800 mt-0.5">{job.applicants_count}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      {job.applicants_count > 0 && (
                        <button
                          onClick={() => handleViewApplicants(job.id)}
                          className="px-3.5 py-2 md:px-4 md:py-2.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 rounded-xl transition text-center whitespace-nowrap cursor-pointer"
                        >
                          Анкет үзэх
                        </button>
                      )}
                      <Link
                        href={`/dashboard/company/post-job/edit/${job.id}`}
                        className="px-3.5 py-2 md:px-4 md:py-2.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition text-center whitespace-nowrap"
                      >
                        Засах ✏️
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ХУУДАСЛАЛТЫН КОНТЕЙНЕР */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 md:pt-6 animate-fade-in pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 order-2 sm:order-1">
                <span>Харуулах:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-gray-100 rounded-xl font-bold text-gray-700 shadow-sm outline-none"
                >
                  <option value={10}>10-аар</option>
                  <option value={20}>20-иор</option>
                  <option value={50}>50-иар</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 select-none order-1 sm:order-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 disabled:opacity-40 shadow-sm hover:border-gray-200 transition"
                  >
                    ← Өмнөх
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {getPaginationRange().map((page, index) => {
                      if (page === "...") {
                        return (
                          <span key={`dots-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs font-bold">
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 text-xs font-bold rounded-xl transition shadow-sm ${
                            currentPage === page
                              ? "bg-slate-950 text-white"
                              : "bg-white border border-gray-100 text-gray-600 hover:border-gray-200"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 disabled:opacity-40 shadow-sm hover:border-gray-200 transition"
                  >
                    Дараах →
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          !loading && (
            <div className="bg-white border border-gray-100 rounded-2xl md:rounded-[2.5rem] p-8 md:p-12 text-center shadow-sm space-y-4 pb-6">
              <div className="text-3xl md:text-4xl">📭</div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="font-bold text-gray-800 text-base md:text-lg">
                  {isFilterActive ? "Ийм илэрц олдсонгүй" : "Одоогоор зарласан ажил байхгүй байна"}
                </h3>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                  {isFilterActive 
                    ? "Та хайлтын нөхцөлөө өөрчлөөд дахин оролдоно уу."
                    : "Та баруун дээд булан дахь товчийг ашиглан анхны ажлын байрны зараа үүсгээрэй."}
                </p>
              </div>
              {isFilterActive ? (
                <button
                  onClick={handleResetFilters}
                  className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Бүх зарыг буцааж харах 🔄
                </button>
              ) : (
                <Link
                  href="/dashboard/company/post-job/add"
                  className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Анхны зараа оруулах 🚀
                </Link>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}