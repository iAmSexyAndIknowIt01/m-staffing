"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import JobDetailModal from "@/components/JobDetailModal"
import AlertModal from "@/components/AlertModal"
import SuccessModal from "@/components/SuccessModal"
import ConfirmModal from "@/components/ConfirmModal"
import Pagination from "@/components/Pagination"
import LoadingLayout from "@/components/LoadingLayout"

// Таны шинээр үүсгэсэн компонентууд
import JobFilterBar from "@/components/JobFilterBar"
import JobCard from "@/components/JobCard"

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

  const handleCompanyClick = (e: React.MouseEvent, company: Company | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    
    if (!company) return
    const actualCompanyId = company.id || company.company_id

    if (actualCompanyId) {
      fetch("/api/staff/companyView", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: actualCompanyId })
      }).catch(err => console.error("Үзэлт бүртгэхэд алдаа гарлаа:", err))

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Анкет илгээхэд алдаа гарлаа")

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

      const matchesCategory = selectedCategory === "" || job.category === selectedCategory
      const matchesType = selectedJobType === "" || job.job_type === selectedJobType

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
    return <LoadingLayout loading={loading} />
  }

  return (
    <div ref={jobsTopRef} className="space-y-8 min-h-screen pb-12">
      
      {checkingProfile && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-indigo-100 z-100 overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-1/2 animate-[bounce_1.5s_infinite] origin-left" style={{ animationDuration: '1s' }} />
        </div>
      )}

      {/* ТОЛГОЙ ХЭСЭГ */}
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

      {/* 1. ШҮҮЛТҮҮРИЙН КОМПОНЕНТ */}
      <JobFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedJobType={selectedJobType}
        setSelectedJobType={setSelectedJobType}
        filterApplied={filterApplied}
        setFilterApplied={setFilterApplied}
        categories={categories}
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-center">
          ⚠️ Алдаа гарлаа: {error}
        </div>
      )}

      {/* ЯПОН АЖЛЫН БАННЕР */}
      <div className="bg-linear-to-r from-orange-500 to-red-500 text-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">🇯🇵 Японд ажиллах боломж</h2>
            <p className="mt-2 text-white/90">IT, Engineer, Tokutei Ginou ажлын байр</p>
          </div>
          <button className="px-6 py-3 bg-white text-orange-600 rounded-2xl font-bold">Дэлгэрэнгүй</button>
        </div>
      </div>

      {/* ЖАГСААЛТЫН ТӨЛӨВҮҮД */}
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

            return (
              <React.Fragment key={job.id}>
                {/* 2. АЖЛЫН КАРТ КОМПОНЕНТ */}
                <JobCard
                  job={job}
                  isJobApplied={isJobApplied}
                  onClick={() => setSelectedJob(job)}
                  onCompanyClick={handleCompanyClick}
                  getCompanyLogoUrl={getCompanyLogoUrl}
                  getJobTypeText={getJobTypeText}
                  getSalaryTypeText={getSalaryTypeText}
                  formatSalary={formatSalary}
                />

                {/* ОНЦЛОХ БОЛОМЖ БАННЕР (Хуудас бүрийн 5 дахь ажил тутамд) */}
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

      {/* ХУУДАСЛАЛТ (PAGINATION) */}
      <Pagination
        filteredJobsCount={filteredJobs.length}
        totalPages={totalPages}
        isFiltering={isFiltering}
        currentPage={currentPage}
        visiblePages={visiblePages}
        setCurrentPage={setCurrentPage}
      />

      {/* --- МОДАЛ ЦОНХНУУД --- */}
      <JobDetailModal
        selectedJob={selectedJob}
        onClose={() => setSelectedJob(null)}
        appliedJobIds={appliedJobIds}
        submitting={submitting}
        checkingProfile={checkingProfile}
        getCompanyLogoUrl={getCompanyLogoUrl}
        getJobTypeText={getJobTypeText}
        getSalaryTypeText={getSalaryTypeText}
        formatSalary={formatSalary}
        handleCompanyClick={handleCompanyClick}
        triggerApplyConfirmation={triggerApplyConfirmation}
      />

      <ConfirmModal
        show={showConfirmModal}
        submitting={submitting}
        sliderX={sliderX}
        isDragging={isDragging}
        trackRef={trackRef}
        handleRef={handleRef}
        onDragStart={handleDragStart}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingJobId(null);
          setSliderX(0);
        }}
      />

      <SuccessModal
          show={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
      />

      <AlertModal
        alertModal={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, show: false }))}
      />

    </div>
  )
}