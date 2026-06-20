"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface JobItem {
  id: string
  title: string
  category: string
  salary: string
  status: string
  created_at: string
}

const ITEMS_PER_PAGE = 5 // Нэг хуудсанд харагдах зарын тоо

export default function PostJobPage() {
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Хайлт болон Хуудаслалтын state-үүд
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // API-аас дата татах хэсэг
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true)
        const response = await fetch("/api/jobs")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Датаг татаж чадсангүй")
        }

        setJobs(result.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  // Хайлтын утга өөрчлөгдөх бүрт хуудсыг 1-ээс эхлүүлнэ
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  };

  // 1. ШҮҮЛТҮҮР: Хайлтын үгэнд тохирох ажлуудыг шүүх
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase()
    return (
      job.title?.toLowerCase().includes(query) ||
      job.category?.toLowerCase().includes(query)
    )
  })

  // 2. ХУУДАСЛАЛТ: Шүүгдсэн дата дээр суурилан хуудасны өгөгдлийг салгах
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem)

  // 3. УХААЛАГ ХУУДАСНЫ ДУГААРЛАЛТ СҮҮДЭРЛЭХ ЛОГИК
  const getPaginationRange = () => {
    const current = currentPage
    const total = totalPages
    
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const range: (number | string)[] = []
    
    // Эхний хуудсыг үргэлж харуулна
    range.push(1)

    // Гол хэсгийн логик
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

    // Сүүлийн хуудсыг үргэлж харуулна
    range.push(total)

    return range
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
      
      {/* ТОЛГОЙ ХΕΣЭГ & БАРУУН ДЭЭД БУЛАНД БАЙРЛАХ ТОВЧ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ажлын байрны удирдлага 💼</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Танай компанийн зарласан идэвхтэй болон хаагдсан ажлын байруудын жагсаалт.
          </p>
        </div>
        
        <Link
          href="/dashboard/company/post-job/add"
          className="w-full sm:w-auto px-6 py-3.5 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-center flex items-center justify-center gap-2"
        >
          <span className="text-base">+</span> Шинэ зар нэмэх
        </Link>
      </div>

      {/* ХАЙЛТЫН ХЭСЭГ */}
      {!loading && jobs.length > 0 && (
        <div className="relative max-w-md animate-fade-in">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Ажлын байрны нэрээр хайх..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-5 py-3.5 bg-white border border-gray-100 text-sm font-medium rounded-2xl outline-none focus:border-indigo-400 shadow-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Арилгах
            </button>
          )}
        </div>
      )}

      {/* АЖЛЫН БАЙРНЫ ЛИСТ */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-gray-800">
            {searchQuery ? "Олдсон үр дүн" : "Нийт зарласан ажлууд"} ({loading ? "..." : filteredJobs.length})
          </h2>
          {searchQuery && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
              Хайлт идэвхтэй байна
            </span>
          )}
        </div>

        {/* 1. УНШИЖ БАЙХ ҮЕИЙН ТӨЛӨВ */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2.5rem] animate-pulse flex flex-col md:flex-row justify-between gap-4">
                <div className="h-16 bg-gray-100 rounded-2xl w-2/3"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-1/4 md:self-center"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* 2. АЛДAA ГАРАХ ҮЕИЙН ТӨЛӨВ */
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl font-semibold">
            ❌ Алдаа гарлаа: {error}
          </div>
        ) : filteredJobs.length > 0 ? (
          /* 3. БОДИТ ДАТА ХАРАГДАХ ХЭСЭГ */
          <>
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden divide-y divide-gray-50">
              {currentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-950">{job.title}</h3>
                      
                      {job.status === "active" ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                          Идэвхтэй
                        </span>
                      ) : job.status === "draft" ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-gray-100 text-gray-600 rounded-lg">
                          Ноорог
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-red-50 text-red-500 border border-red-100 rounded-lg">
                          Хаагдсан
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 font-medium">
                      <span>🏢 {job.category || "Ерөнхий"}</span>
                      <span>💰 {job.salary || "Тохиролцоно"}</span>
                      <span>📅 {new Date(job.created_at).toLocaleDateString("mn-MN")}-нд тавьсан</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                    <div className="text-left md:text-right min-w-20">
                      <p className="text-xs text-gray-400 font-medium">Ирсэн анкет</p>
                      <p className="text-xl font-black text-gray-800 mt-0.5">0</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/company/post-job/edit/${job.id}`}
                        className="px-4 py-2.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition"
                      >
                        Засах ✏️
                      </Link>
                      <Link
                        href={`/dashboard/company/jobs/${job.id}/applicants`}
                        className="px-4 py-2.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 rounded-xl transition"
                      >
                        Анкет үзэх →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ХУУДАСЛАЛТЫН ТОВЧНУУД (Шинэ ухаалаг загвартай хэсэг) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6 animate-fade-in">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 disabled:opacity-40 shadow-sm hover:border-gray-200 transition select-none"
                >
                  ← Өмнөх
                </button>
                
                <div className="flex items-center gap-1.5">
                  {getPaginationRange().map((page, index) => {
                    if (page === "...") {
                      return (
                        <span key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm font-bold select-none">
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-9 h-9 text-xs font-bold rounded-xl transition shadow-sm ${
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
                  className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 disabled:opacity-40 shadow-sm hover:border-gray-200 transition select-none"
                >
                  Дараах →
                </button>
              </div>
            )}
          </>
        ) : (
          /* 4. ХООСОН ҮЕИЙН ТӨЛӨВ */
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-sm space-y-4">
            <div className="text-4xl">📭</div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="font-bold text-gray-800 text-lg">
                {searchQuery ? "Ийм илэрц олдсонгүй" : "Одоогоор зарласан ажил байхгүй байна"}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {searchQuery 
                  ? "Та хайлтын үгээ өөрчлөөд эсвэл 'Арилгах' товчийг дарж дахин оролдоно уу."
                  : "Та баруун дээд булан дахь товчийг ашиглан анхны ажлын байрны зараа үүсгээрэй."}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/dashboard/company/post-job/add"
                className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Анхны зараа оруулах 🚀
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  )
}