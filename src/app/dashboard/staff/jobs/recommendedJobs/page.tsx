"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import ProfileIncompleteModal from "@/components/staff/common/ProfileIncompleteModal" // <-- Импортлох

interface Job {
  id: string
  company_id?: string
  title: string
  company: string
  type: string
  location: string
  salary: string
  category: string
  description?: string
}

export default function RecommendedJobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId") || ""

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([])

  // ШҮҮЛТҮҮРИЙН ТӨЛӨВҮҮД
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // SLIDER БАТАЛГААЖУУЛАЛТЫН ТӨЛӨВҮҮД болон ПРОФАЙЛ МОДАЛ
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // --- Профайл дутуу модалын state-үүд ---
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false)
  const [profileIncompleteMessage, setProfileIncompleteMessage] = useState("")

  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [sliderX, setSliderX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: "",
    title: "Мэдэгдэл"
  })

  const showAlert = (message: string, title: string = "Анхааруулга") => {
    setAlertModal({ show: true, message, title })
  }

  useEffect(() => {
    async function fetchJobs() {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
        const res = await fetch(`${baseUrl}/api/staff/dashboard?userId=${userId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Ажлын байрны өгөгдлийг татаж чадсангүй.")
        const result = await res.json()
        setJobs(result.recommendedJobs || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [userId])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = 
        categoryFilter === "all" || 
        job.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [jobs, searchTerm, categoryFilter])

  const categories = useMemo(() => {
    const set = new Set(jobs.map(j => j.category).filter(Boolean))
    return Array.from(set)
  }, [jobs])

  const handleCompanyClick = (e: React.MouseEvent, companyId: string | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    if (!companyId) return

    fetch("/api/staff/companyView", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId })
    }).catch(err => console.error("Үзэлт бүртгэхэд алдаа:", err))

    router.push(`/dashboard/company/profile/${companyId}`)
  }

  const triggerApplyConfirmation = async (jobId: string) => {
    if (checkingProfile) return
    setCheckingProfile(true)
    try {
      const response = await fetch("/api/staff/jobs/profileCheck")
      const result = await response.json()
      
      if (!response.ok || result.isComplete === false) {
        setProfileIncompleteMessage(result.error || "Профайл мэдээлэл дутуу байна. Та профайлаа бүрэн бөглөнө үү.")
        setSelectedJob(null) // Нээгдсэн ажлын дэлгэрэнгүй модалыг хаах
        setShowProfileIncompleteModal(true) // Профайл дутуу модалыг нээх
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

  const handleApplyJob = async () => {
    if (!pendingJobId) return
    setIsSubmitting(true)
    setShowConfirmModal(false)
    setSliderX(0)
    try {
      const response = await fetch("/api/jobRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: pendingJobId, resume_url: "" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Анкет илгээхэд алдаа гарлаа")

      fetch("/api/mail/job-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: pendingJobId }),
      }).catch((err) => console.error("Мэйл илгээх API-д алдаа гарлаа:", err))

      setAppliedJobIds((prev) => [...prev, pendingJobId])
      setSelectedJob(null)
      setShowSuccessModal(true)
    } catch (err: any) {
      showAlert(err.message, "Алдаа гарлаа")
    } finally {
      setIsSubmitting(false)
      setPendingJobId(null)
    }
  }

  const handleDragStart = (clientX: number) => {
    if (isSubmitting) return
    setIsDragging(true)
    startXRef.current = clientX - sliderX
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || !handleRef.current) return
    const maxSlide = trackRef.current.clientWidth - handleRef.current.clientWidth - 8
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
      const maxSlide = trackRef.current.clientWidth - handleRef.current.clientWidth - 8
      if (sliderX < maxSlide - 2) setSliderX(0)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => { if (e.touches.length > 0) handleDragMove(e.touches[0].clientX) }
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleDragEnd)
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleDragEnd)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleDragEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleDragEnd)
    }
  }, [isDragging, sliderX])

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

  if (!userId) {
    return (
      <div className="text-center py-12 max-w-md mx-auto space-y-4">
        <p className="text-gray-500 font-medium">Хэрэглэгч баталгаажаагүй байна. Үндсэн хуудас руу шилжинэ үү.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Буцах</button>
      </div>
    )
  }

  if (error) return <div className="text-center py-12 text-red-500 font-medium">{error}</div>

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Буцах
        </button>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Танд санал болгох ажлын байрууд</h1>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Ажлын нэр эсвэл компаниар хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all text-gray-900"
            />
          </div>
          <div className="w-full sm:w-52">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all font-bold text-gray-700 cursor-pointer"
            >
              <option value="all">📂 Бүх салбар, ангилал</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* АЖЛЫН БАЙРНУУД */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const isJobApplied = appliedJobIds.includes(job.id);
          return (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="w-full text-left bg-white border border-gray-100 hover:border-indigo-100 p-6 rounded-4xl shadow-xs hover:shadow-md transition-all group cursor-pointer animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isJobApplied && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Хүсэлт илгээсэн ✓</span>}
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg uppercase">{job.category}</span>
                    <span className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg">{job.type}</span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                  <div onClick={(e) => handleCompanyClick(e, job.company_id)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block">🏢 {job.company}</div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-medium pt-1">
                    <span>📍 {job.location}</span>
                    <span className="text-emerald-600 font-bold">💰 {job.salary}</span>
                  </div>
                </div>
                <div className="flex justify-end sm:block">
                  <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-sm font-bold transition-all">→</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* МОДАЛУУД */}
      {selectedJob ? (() => {
        const isModalJobApplied = appliedJobIds.includes(selectedJob.id);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl relative space-y-4">
              <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg uppercase">{selectedJob.category}</span>
                  <span className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg">{selectedJob.type}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">{selectedJob.title}</h3>
                <div>
                  <span 
                    onClick={(e) => handleCompanyClick(e, selectedJob.company_id)}
                    className="text-base font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block"
                  >
                    🏢 {selectedJob.company}
                  </span>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div className="space-y-3 text-sm text-gray-600 font-medium">
                <p>📍 <b>Байршил:</b> {selectedJob.location}</p>
                <p className="text-emerald-600">💰 <b>Цалин:</b> {selectedJob.salary}</p>
                <div className="bg-gray-50 p-4 rounded-2xl mt-2 text-xs text-gray-600 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                  <b className="text-gray-900 block mb-1">Ажлын тайлбар:</b> 
                  {selectedJob.description || "Ажлын тайлбар байхгүй байна."}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                {isModalJobApplied ? (
                  <button disabled className="flex-1 py-3 bg-red-100 text-red-700 font-bold text-sm text-center rounded-xl cursor-not-allowed">Хүсэлт илгээгдсэн ✓</button>
                ) : (
                  <button
                    disabled={isSubmitting || checkingProfile}
                    onClick={() => triggerApplyConfirmation(selectedJob.id)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm text-center rounded-xl transition"
                  >
                    {checkingProfile ? "Шалгаж байна..." : "Анкет илгээх 🚀"}
                  </button>
                )}
                <button onClick={() => setSelectedJob(null)} className="px-5 py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl">Хаах</button>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* Баталгаажуулах Modal */}
      {showConfirmModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
             <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">❓</div>
             <h3 className="text-lg font-black text-gray-900">Илгээхдээ итгэлтэй байна уу?</h3>
             <div ref={trackRef} className="relative w-full h-14 bg-gray-100 rounded-2xl mt-6 p-1 flex items-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400" style={{ opacity: Math.max(1 - sliderX / 100, 0) }}>Баруун тийш чирж илгээх ➔</div>
                <div
                  ref={handleRef}
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  className="absolute top-1 bottom-1 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing"
                  style={{ transform: `translateX(${sliderX}px)`, transition: isDragging ? "none" : "transform 0.25s ease" }}
                >
                  {isSubmitting ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "🚀"}
                </div>
             </div>
             <button onClick={() => setShowConfirmModal(false)} className="mt-4 w-full py-2 text-gray-500 font-bold text-sm">Үгүй, буцах</button>
           </div>
         </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto animate-bounce">🚀</div>
            <h3 className="text-xl font-black text-gray-900">Амжилттай илгээгдлээ!</h3>
            <button onClick={() => setShowSuccessModal(false)} className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold">Ойлголоо 👍</button>
          </div>
        </div>
      )}

      {/* ПРОФАЙЛ ДУТУУ ЕСӨХИЙГ САНУУЛАХ МОДАЛ */}
      <ProfileIncompleteModal
        show={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message={profileIncompleteMessage}
      />

    </div>
  )
}