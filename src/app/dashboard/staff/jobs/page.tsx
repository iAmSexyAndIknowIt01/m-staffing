"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"

interface Company {
  id?: string
  company_id?: string 
  name: string
  logo_url: string | null
}

interface Job {
  id: string
  title: string
  category: string
  job_type: string
  salary_type: string
  location: string
  salary: string
  description: string
  requirements: string
  created_at: string
  is_applied: boolean
  mt_company?: Company
}

export default function StaffJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false) 
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedJobType, setSelectedJobType] = useState("")
  const [filterApplied, setFilterApplied] = useState("all")
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [submitting, setSubmitting] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false) 
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)

  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: "",
    title: "Мэдэгдэл"
  })

  // --- SLIDE TO CONFIRM STATES & REFS ---
  const [sliderX, setSliderX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  const jobsPerPage = 10
  const jobsTopRef = useRef<HTMLDivElement>(null)

  const showAlert = (message: string, title: string = "Анхааруулга") => {
    setAlertModal({ show: true, message, title })
  }

  const formatSalary = (salaryStr: string | null | undefined) => {
    if (!salaryStr) return "Тохиролцоно"
    const numericSalary = parseInt(salaryStr.replace(/\D/g, ""), 10)
    if (isNaN(numericSalary)) return salaryStr
    return `${numericSalary.toLocaleString()} ₮`
  }

  const getCompanyLogoUrl = (logoUrl: string | null | undefined) => {
    if (!logoUrl) return null
    if (logoUrl.startsWith("http")) return logoUrl
    
    const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co" 
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/company-logos/${logoUrl}`
  }

  // ШИНЭЧЛЭГДСЭН: Үзэлт бүртгэх API дуудаж, хуудас шилжүүлэх функц
  const handleCompanyClick = (e: React.MouseEvent, company: Company | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    
    if (!company) return
    const actualCompanyId = company.id || company.company_id

    if (actualCompanyId) {
      // Background-аар үзэлт логдох API руу хүсэлт шиднэ
      fetch("/api/staff/companyView", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: actualCompanyId })
      }).catch(err => console.error("Үзэлт бүртгэхэд алдаа гарлаа:", err))

      // Хэрэглэгчийг хүлээлгэлгүй шууд профайл руу нь үсэргэнэ
      router.push(`/dashboard/company/profile/${actualCompanyId}`)
    } else {
      console.warn("Компанийн ID олдсонгүй:", company)
    }
  }

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

  const handleApplyJob = async () => {
    if (!pendingJobId) return
    
    setSubmitting(true)
    setShowConfirmModal(false)
    setSliderX(0)
    
    try {
      const applicationData = {
        job_id: pendingJobId,
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

      setAppliedJobIds((prev) => [...prev, pendingJobId])
      setSelectedJob(null)
      setShowSuccessModal(true)
    } catch (err: any) {
      showAlert(err.message, "Алдаа гарлаа")
    } finally {
      setSubmitting(false)
      setPendingJobId(null)
    }
  }

  // --- SLIDER EVENT HANDLERS ---
  const handleDragStart = (clientX: number) => {
    if (submitting) return
    setIsDragging(true)
    startXRef.current = clientX - sliderX
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || !handleRef.current) return

    const trackWidth = trackRef.current.clientWidth
    const handleWidth = handleRef.current.clientWidth
    const maxSlide = trackWidth - handleWidth - 8

    let currentX = clientX - startXRef.current
    if (currentX < 0) currentX = 0
    if (currentX > maxSlide) currentX = maxSlide

    setSliderX(currentX)

    if (currentX >= maxSlide - 2) {
      setIsDragging(false)
      handleApplyJob()
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (trackRef.current && handleRef.current) {
      const trackWidth = trackRef.current.clientWidth
      const handleWidth = handleRef.current.clientWidth
      const maxSlide = trackWidth - handleWidth - 8
      
      if (sliderX < maxSlide - 2) {
        setSliderX(0)
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX)
    }
    const handleEnd = () => handleDragEnd()

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, sliderX])

  const triggerApplyConfirmation = async (jobId: string) => {
    if (checkingProfile) return
    setCheckingProfile(true)

    try {
      const response = await fetch("/api/staff/jobs/profileCheck")
      const result = await response.json()

      if (!response.ok || result.isComplete === false) {
        showAlert(result.error || "Профайл мэдээлэл дутуу байна. Та профайлаа бүрэн бөглөнө үү.", "Профайл дутуу")
        return
      }

      setPendingJobId(jobId)
      setSliderX(0)
      setShowConfirmModal(true)
    } catch (err: any) {
      showAlert("Профайл шалгахад алдаа гарлаа. Дахин оролдоно уу.", "Алдаа")
    } finally {
      setCheckingProfile(false)
    }
  }

  const categories = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.category)))
  }, [jobs])

  const getJobTypeText = (type: string) => {
    switch (type) {
      case "fulltime": return "Бүтэн цаг"
      case "parttime": return "Хагас цаг"
      case "remote": return "Зайнаас (Remote)"
      default: return type
    }
  }

  const getSalaryTypeText = (type: string) => {
    switch (type) {
      case "monthly": return "Сарын"
      case "hourly": return "Цагийн"
      case "yearly": return "Жилийн"
      case "negotiable": return "Тохиролцоно"
      default: return type || ""
    }
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const isJobApplied = job.is_applied || appliedJobIds.includes(job.id)

      if (filterApplied === "applied" && !isJobApplied) return false
      if (filterApplied === "not_applied" && isJobApplied) return false

      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.mt_company?.name && job.mt_company.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        selectedCategory === "" || job.category === selectedCategory

      const matchesType =
        selectedJobType === "" || job.job_type === selectedJobType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [jobs, searchQuery, selectedCategory, selectedJobType, filterApplied, appliedJobIds])

  useEffect(() => {    
    setIsFiltering(true)
    const timer = setTimeout(() => setIsFiltering(false), 350) 
    setCurrentPage(1)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, selectedJobType, filterApplied])

  useEffect(() => {
    setIsFiltering(true)
    const timer = setTimeout(() => setIsFiltering(false), 300)
    
    jobsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
    return () => clearTimeout(timer)
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
      <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
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
    )
  }

  return (
    <div ref={jobsTopRef} className="space-y-8 min-h-screen pb-12">
      
      {checkingProfile && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-indigo-100 z-100 overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-1/2 animate-[bounce_1.5s_infinite] origin-left" style={{ animationDuration: '1s' }} />
        </div>
      )}

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

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative flex items-center col-span-1 md:col-span-1">
            <span className="absolute left-4 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Ажил, компани, байршлаар..."
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

          <select
            value={filterApplied}
            onChange={(e) => setFilterApplied(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer font-medium"
          >
            <option value="all">Бүх ажлыг харуулах</option>
            <option value="applied">Хүсэлт илгээсэн ажил</option>
            <option value="not_applied">Хүсэлт илгээгээгүй ажил</option>
          </select>
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

      {isFiltering ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center shadow-sm flex flex-col items-center justify-center min-h-87.5 animate-fade-in">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-lg animate-pulse" />
            <div className="absolute inset-0 border border-dashed border-indigo-200 rounded-full animate-[spin_6s_linear_infinite]" />
            <div className="absolute inset-1.5 border-t border-b border-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
              <span className="text-[9px] font-black tracking-wider text-indigo-950 uppercase animate-pulse">
                mstaffing
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-4 animate-pulse">
            Жагсаалтыг шинэчилж байна...
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 shadow-sm flex flex-col items-center">
          <span className="text-5xl mb-3">🔍</span>
          <p className="font-semibold text-gray-600">Илэрц олдсонгүй</p>
          <p className="text-xs text-gray-400 mt-1">Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedJobs.map((job, index) => {
            const isJobApplied = job.is_applied || appliedJobIds.includes(job.id);
            const logoFullUrl = getCompanyLogoUrl(job.mt_company?.logo_url);

            return (
              <React.Fragment key={job.id}>
                <div
                  onClick={() => setSelectedJob(job)}
                  className={`relative overflow-hidden bg-white border rounded-3xl p-6 hover:border-indigo-200 hover:shadow-lg transition cursor-pointer ${
                    isJobApplied ? "border-l-4 border-l-red-500 border-gray-100" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex items-start gap-4 flex-1">
                      
                      <div 
                        onClick={(e) => handleCompanyClick(e, job.mt_company)}
                        className="w-25 h-25 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs hover:scale-105 transition cursor-pointer"
                      >
                        {logoFullUrl ? (
                          <img 
                            src={logoFullUrl} 
                            alt={job.mt_company?.name || "Company logo"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg font-black text-indigo-500 uppercase">
                            {job.mt_company?.name?.substring(0, 2) || "CO"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {isJobApplied && (
                            <span className="px-3 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-xl flex items-center gap-1 animate-fade-in">
                              ✓ Хүсэлт илгээсэн
                            </span>
                          )}
                          <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-xl">{job.category}</span>
                          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-xl">
                            {getJobTypeText(job.job_type)}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition">{job.title}</h3>
                        
                        <p className="text-sm font-semibold mt-0.5">
                          {job.mt_company ? (
                            <span 
                              onClick={(e) => handleCompanyClick(e, job.mt_company)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              {job.mt_company.name} 🏢
                            </span>
                          ) : (
                            <span className="text-gray-500 font-medium">Байгууллагын нэр нууцалсан</span>
                          )}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                          <span>📍 {job.location || "Улаанбаатар"}</span>
                          <span className="text-emerald-600 font-semibold">
                            💰 {getSalaryTypeText(job.salary_type)}: {formatSalary(job.salary)}
                          </span>
                          <span>📅 {new Date(job.created_at).toLocaleDateString("mn-MN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-end justify-between lg:justify-center min-w-45 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-50">
                      <div className="text-xs text-gray-400 hidden lg:block">Нээлттэй ажлын байр</div>
                      <button className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xs transition">
                        Дэлгэрэнгүй →
                      </button>
                    </div>
                  </div>
                </div>

                {(index + 1) % 5 === 0 && (
                  <div className="bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-3xl p-6 shadow-md my-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="bg-white/20 text-xs px-2.5 py-1 rounded-lg font-bold tracking-wide uppercase">Онцлох боломж</span>
                        <h3 className="text-lg font-bold mt-2">✨ CV-гээ үнэгүй зөвлүүлэх үйлчилгээ</h3>
                        <p className="text-xs text-white/80 mt-1">Мэргэжлийн рекрутерүүд таны анкетыг засаж, зөвлөгөө өгөх болно.</p>
                      </div>
                      <button className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-xs shrink-0 self-end sm:self-center">
                        Анкет засуулах
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* PAGINATION */}
      {filteredJobs.length > 0 && totalPages > 1 && !isFiltering && (
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
        const modalLogoUrl = getCompanyLogoUrl(selectedJob.mt_company?.logo_url);
        
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-50 flex flex-col justify-between">
              
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                  <div 
                    onClick={(e) => handleCompanyClick(e, selectedJob.mt_company)}
                    className="w-25 h-25 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition cursor-pointer"
                  >
                    {modalLogoUrl ? (
                      <img src={modalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-500 uppercase">
                        {selectedJob.mt_company?.name?.substring(0, 2) || "CO"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {isModalJobApplied && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Хүсэлт илгээсэн ✓</span>
                      )}
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">{selectedJob.category}</span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                        {getJobTypeText(selectedJob.job_type)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-gray-800">{selectedJob.title}</h2>
                    
                    <p className="text-sm font-semibold mt-0.5">
                      {selectedJob.mt_company ? (
                        <span 
                          onClick={(e) => handleCompanyClick(e, selectedJob.mt_company)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          {selectedJob.mt_company.name} 🏢
                        </span>
                      ) : (
                        <span className="text-gray-500 font-medium">Байгууллагын нэр нууцалсан</span>
                      )}
                    </p>

                    <div className="flex gap-4 text-xs text-gray-400 mt-2">
                      <span>📍 {selectedJob.location}</span>
                      <span className="text-emerald-600 font-bold">
                        💵 {getSalaryTypeText(selectedJob.salary_type)}: {formatSalary(selectedJob.salary)}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition">✕</button>
              </div>

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
                      onClick={() => triggerApplyConfirmation(selectedJob.id)}
                      disabled={submitting || checkingProfile} 
                      className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-50 min-w-35 flex items-center justify-center gap-2"
                    >
                      {checkingProfile ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Шалгаж байна...</span>
                        </>
                      ) : (
                        "Анкет илгээх 🚀"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* --- БАТАЛГААЖУУЛАХ МОДАЛ ЦОНХ --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">
              ❓
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900">Илгээхдээ итгэлтэй байна уу?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Анкет илгээх үйлдлийг баталгаажуулахын тулд баруун тийш чирнэ үү. Илгээсэн анкетыг цуцлах боломжгүй.
            </p>

            <div className="w-full mt-6 space-y-4">
              <div 
                ref={trackRef}
                className="relative w-full h-14 bg-gray-100 rounded-2xl p-1 flex items-center select-none overflow-hidden border border-gray-200/60"
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400 transition-opacity"
                  style={{ opacity: Math.max(1 - sliderX / 100, 0) }}
                >
                  Баруун тийш чирж илгээх ➔
                </div>

                <div
                  ref={handleRef}
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  className="absolute top-1 bottom-1 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing shadow-lg transition-transform"
                  style={{
                    transform: `translateX(${sliderX}px)`,
                    transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  {submitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "🚀"
                  )}
                </div>
              </div>

              <button
                onClick={() => { setShowConfirmModal(false); setPendingJobId(null); setSliderX(0); }}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-500 text-xs md:text-sm font-bold rounded-2xl transition"
              >
                Үгүй, буцах
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- АМЖИЛТТАЙ ИЛГЭЭГДСЭН ҮЕИЙН МОДАЛ --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner animate-bounce">🚀</div>
            <h3 className="text-xl font-black text-gray-900">Амжилттай илгээгдлээ!</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Таны анкетыг хүлээн авлаа. Бид таны мэдээллийг хянаж үзээд эргэж холбогдох болно.
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

      {/* --- МЭДЭГДЭЛ БОЛОН АЛДААНЫ НЭГДСЭН МОДАЛ --- */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-black text-gray-900">{alertModal.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal((prev) => ({ ...prev, show: false }))}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition text-center"
            >
              Хаах
            </button>
          </div>
        </div>
      )}

    </div>
  )
}