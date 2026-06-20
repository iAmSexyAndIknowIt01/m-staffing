"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"

interface Job {
  id: string
  title: string
  category: string
  job_type: string
  location: string
  salary: string
  description: string
  requirements: string
  created_at: string
  is_applied: boolean // API-аас ирэх шинэ талбар
}

export default function StaffJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Хайлт болон шүүлтүүрийн state-үүд
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedJobType, setSelectedJobType] = useState("")
  const [showApplied, setShowApplied] = useState(true) // Хүсэлт илгээсэн ажлыг харуулах эсэх state
  
  // Модалд сонгогдсон ажлын байр
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Анкет илгээх үед ашиглах state-үүд
  const [submitting, setSubmitting] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]) // Шинээр анкет илгээсэн ажлын ID-нуудыг түр хадгалах
  const [showSuccessModal, setShowSuccessModal] = useState(false) // Амжилттай болсон модалыг удирдах state

  const jobsPerPage = 10
  const jobsTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/staff/jobs")
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Алдаа гарлаа")
        setJobs(result.jobs || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  // Анкет илгээх функц
  const handleApplyJob = async (jobId: string) => {
    setSubmitting(true)
    try {
      const applicationData = {
        job_id: jobId,
        applicant_name: "Бат-Эрдэнэ", 
        applicant_email: "bat@example.com",
        applicant_phone: "99112233",
        resume_url: "" 
      }

      const response = await fetch("/api/jobRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Анкет илгээхэд алдаа гарлаа")
      }

      setAppliedJobIds((prev) => [...prev, jobId]) // Амжилттай болбол ID-г жагсаалтад нэмнэ
      setSelectedJob(null) // Үндсэн дэлгэрэнгүй модалыг хаана
      setShowSuccessModal(true) // Амжилтын модалыг нээнэ
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Датабаазаас ирсэн датаг ашиглан динамикаар категориудыг ялгаж авах
  const categories = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.category)))
  }, [jobs])

  // Хайлт болон шүүлтүүр хийх логик (Client-side)
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const isJobApplied = job.is_applied || appliedJobIds.includes(job.id)

      // Хэрэв хүсэлт илгээсэн ажлыг харуулахгүй гэж сонгосон бөгөөд тухайн ажилд хүсэлт илгээсэн бол алгасна
      if (!showApplied && isJobApplied) {
        return false
      }

      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "" || job.category === selectedCategory

      const matchesType =
        selectedJobType === "" || job.job_type === selectedJobType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [jobs, searchQuery, selectedCategory, selectedJobType, showApplied, appliedJobIds])

  // Шүүлтүүр өөрчлөгдөх бүрт хуудаслалтыг 1 болгоно
  useEffect(() => {    
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedJobType, showApplied])

  useEffect(() => {
    jobsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [currentPage])

  const totalPages = useMemo(
    () => Math.ceil(filteredJobs.length / jobsPerPage),
    [filteredJobs.length]
  )

  const visiblePages = useMemo(() => {
    const maxVisible = 5
    let startPage = Math.max(currentPage - Math.floor(maxVisible / 2), 1)
    let endPage = startPage + maxVisible - 1

    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(totalPages - maxVisible + 1, 1)
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }, [currentPage, totalPages])

  const paginatedJobs = useMemo(
    () => filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage),
    [filteredJobs, currentPage]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="h-10 w-10 border-b-2 border-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div ref={jobsTopRef} className="space-y-8 min-h-screen pb-12">
      
      {/* ТӨРӨЛ, ГАРЧИГ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Нээлттэй ажлын байрууд</h1>
          <p className="text-sm text-gray-400 mt-1">
            Танд тохирох {filteredJobs.length} ажлын санал байна
            {" • "}
            Хуудас {currentPage} / {totalPages || 1}
          </p>
        </div>
      </div>

      {/* ХАЙЛТ БОЛОН ШҮҮЛТҮҮРИЙН СЕКЦ */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Ажлын нэр, түлхүүр үгээр хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer"
          >
            <option value="">Бүх чиглэл (Category)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={selectedJobType}
            onChange={(e) => setSelectedJobType(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer"
          >
            <option value="">Ажлын цагийн төрөл</option>
            <option value="fulltime">Бүтэн цаг</option>
            <option value="parttime">Хагас цаг</option>
            <option value="remote">Зайнаас (Remote)</option>
          </select>
        </div>

        {/* ХҮСЭЛТ ИЛГЭЭСЭН АЖЛЫГ ХАРАХ / НУУХ ТОГГЛ ШҮҮЛТҮҮР */}
        <div className="flex justify-end px-2">
          <label className="inline-flex items-center cursor-pointer bg-white border border-gray-100 rounded-2xl py-2 px-4 shadow-sm select-none hover:border-gray-200 transition">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={showApplied}
              onChange={(e) => setShowApplied(e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ms-3 text-sm font-semibold text-gray-600">
              Хүсэлт илгээсэн ажлуудыг хамт харуулах
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-center">
          ⚠️ Алдаа гарлаа: {error}
        </div>
      )}

      <div className="bg-linear-to-r from-orange-500 to-red-500 text-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">🇯🇵 Японд ажиллах боломж</h2>
            <p className="mt-2 text-white/90">IT, Engineer, Tokutei Ginou ажлын байр</p>
          </div>
          <button className="px-6 py-3 bg-white text-orange-600 rounded-2xl font-bold">Дэлгэрэнгүй</button>
        </div>
      </div>

      {/* АЖЛЫН БАЙРНЫ ЖАГСААЛТ */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 shadow-sm flex flex-col items-center">
          <span className="text-5xl mb-3">🔍</span>
          <p className="font-semibold text-gray-600">Илэрц олдсонгүй</p>
          <p className="text-xs text-gray-400 mt-1">Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedJobs.map((job) => {
            const isJobApplied = job.is_applied || appliedJobIds.includes(job.id);
            
            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`relative overflow-hidden bg-white border rounded-3xl p-6 hover:border-indigo-200 hover:shadow-lg transition cursor-pointer ${
                  isJobApplied ? "border-l-4 border-l-red-500 border-gray-100" : "border-gray-100"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* ХАМГИЙН ЗҮҮН ТАЛД УЛААН СТАТУС */}
                      {isJobApplied ? (
                        <span className="px-3 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-xl flex items-center gap-1 animate-fade-in">
                          ✓ Хүсэлт илгээсэн
                        </span>
                      ) : null}
                      
                      <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-xl">{job.category}</span>
                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-xl">
                        {job.job_type === "fulltime" ? "Бүтэн цаг" : job.job_type === "parttime" ? "Хагас цаг" : "Remote"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <span>📍 {job.location || "Улаанбаатар"}</span>
                      <span className="text-emerald-600 font-semibold">💰 {job.salary || "Тохиролцоно"}</span>
                      <span>📅 {new Date(job.created_at).toLocaleDateString("mn-MN")}</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between min-w-45">
                    <div className="text-xs text-gray-400">Нээлттэй ажлын байр</div>
                    <button className="mt-4 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold">
                      Дэлгэрэнгүй →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PAGINATION */}
      {filteredJobs.length > 0 && totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Өмнөх
          </button>
          
          {visiblePages[0] > 1 && (
            <>
              <button onClick={() => setCurrentPage(1)} className="w-10 h-10 rounded-xl border bg-white">1</button>
              {visiblePages[0] > 2 && <span className="px-2">...</span>}
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                currentPage === page ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 hover:border-indigo-300"
              }`}
            >
              {page}
            </button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="px-2">...</span>}
              <button onClick={() => setCurrentPage(totalPages)} className="w-10 h-10 rounded-xl border bg-white">{totalPages}</button>
            </>
          )}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Дараах →
          </button>
        </div>
      )}

      {/* --- ДЭЛГЭРЭНГҮЙ ХАРАХ МОДАЛ ЦОНХ --- */}
      {selectedJob && (() => {
        const isModalJobApplied = selectedJob.is_applied || appliedJobIds.includes(selectedJob.id);
        
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-50 flex flex-col justify-between">
              {/* Модал Header */}
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* МОДАЛЫН ДЭЭД СТАТУС */}
                    {isModalJobApplied && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Хүсэлт илгээсэн ✓</span>
                    )}
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">{selectedJob.category}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{selectedJob.job_type}</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-800">{selectedJob.title}</h2>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span>📍 {selectedJob.location}</span>
                    <span className="text-emerald-600 font-bold">💵 {selectedJob.salary}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition">✕</button>
              </div>

              {/* Модал Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📋 Ажлын үүрэг, тодорхойлолт</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎯 Тавигдах шаардлага</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              </div>

              {/* Модал Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex items-center justify-between">
                <span className="text-xs text-gray-400">Нийтлэгдсэн: {new Date(selectedJob.created_at).toLocaleDateString("mn-MN")}</span>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedJob(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-200 rounded-xl transition">
                    Хаах
                  </button>
                  
                  {isModalJobApplied ? (
                    <button 
                      disabled
                      className="px-6 py-2.5 text-sm font-bold text-red-700 bg-red-100 rounded-xl cursor-not-allowed shadow-inner"
                    >
                      Хүсэлт илгээгдсэн ✓
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApplyJob(selectedJob.id)}
                      disabled={submitting}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {submitting ? "Илгээж байна..." : "Анкет илгээх 🚀"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* --- АМЖИЛТТАЙ ИЛГЭЭГДСЭН ҮЕИЙН МОДАЛ ЦОНХ --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center transform scale-100 transition-all">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner animate-bounce">
              🚀
            </div>
            <h3 className="text-xl font-black text-gray-900">Амжилттай илгээгдлээ!</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Таны анкетыг хүлээн авлаа. Бид таны мэдээллийг хянаж үзээд эргэж холбогдох болно. Тасралтгүй урагшилсаар байгаарай!
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-600/20 transition"
            >
              Ойлголоо 👍
            </button>
          </div>
        </div>
      )}

    </div>
  )
}