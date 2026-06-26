"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface StaffViewProps {
  userId: string
}

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

interface Application {
  id: string
  company_id?: string
  title: string
  company: string
  date: string
  status: string
  statusColor: string
  description?: string
}

interface DashboardData {
  stats: {
    appliedCount: number
    appliedThisWeek: string
    viewedCompaniesCount: number
    cvViewRate: string
  }
  profileProgress: number
  recommendedJobs: Job[]
  recentApplications: Application[]
}

export default function StaffView({ userId }: StaffViewProps) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false) 
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([])

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: "",
    title: "Мэдэгдэл"
  })

  const [sliderX, setSliderX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  // ЦАЛИНГ ТАСЛАЛТАЙ БОЛГОХ ТУСЛАХ ФУНКЦ
  const formatSalary = (salaryStr: string) => {
    if (!salaryStr) return ""
    const numericValue = salaryStr.replace(/[^0-9]/g, "")
    if (!numericValue) return salaryStr 
    
    return Number(numericValue).toLocaleString() + " ₮"
  }

  // 🌟 ҮЗСЭН КОМПАНИЙН ТООНООС ХАМААРЧ СТАТУС БОДОХ ФУНКЦ
  const getCompanyViewStatus = (count: number) => {
    if (count === 0) return "Хандалт хийгээгүй(7 хоногт)"
    if (count <= 3) return "Идэвхтэй хандаж байна(7 хоногт)"
    return "Маш идэвхтэй хандалт(7 хоногт) 🚀"
  }

  const showAlert = (message: string, title: string = "Анхааруулга") => {
    setAlertModal({ show: true, message, title })
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
        const res = await fetch(`${baseUrl}/api/staff/dashboard?userId=${userId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Dashboard-ын өгөгдлийг татаж чадсангүй.")
        const result = await res.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  // CV Татах функц
  const handleDownloadCV = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/staff/cv/download?userId=${userId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("CV файлыг татахад алдаа гарлаа.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `CV_${userId}.pdf` 
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      showAlert(err.message || "CV татахад алдаа гарлаа. Та дараа дахин оролдоно уу.", "Алдаа")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCompanyClick = (e: React.MouseEvent, companyId: string | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    
    if (!companyId || typeof companyId !== "string") {
      console.warn("Компанийн ID олдсонгүй эсвэл буруу байна:", companyId)
      return
    }

    fetch("/api/staff/companyView", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId })
    }).catch(err => console.error("Үзэлт бүртгэхэд алдаа гарлаа:", err))

    router.push(`/dashboard/company/profile/${companyId}`)
  }

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

  const handleApplyJob = async () => {
    if (!pendingJobId) return
    
    setIsSubmitting(true)
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

  if (error) return <div className="text-center py-12 text-red-500 font-medium">{error}</div>
  if (!data) return null

  const { stats, profileProgress, recommendedJobs, recentApplications } = data
  const cleanCvViewRate = stats.cvViewRate.replace(/[^0-9]/g, "") || "0"

  return (
    <div className="animate-fade-in space-y-8 relative">
      
      {/* МЭНДЧИЛГЭЭНИЙ ХЭСЭГ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 rounded-4xl text-white shadow-xl shadow-indigo-950/10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Сайн байна уу? 👋</h1>
          <p className="text-indigo-200/90 text-sm md:text-base mt-2 font-medium">
            Өнөөдрийн байдлаар танд тохирох шинэ ажлын саналууд бэлэн байна.
          </p>
        </div>
        <Link 
          href="/dashboard/staff/jobs" 
          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/10 backdrop-blur-sm transition-all"
        >
          Aжил хайх 🔍
        </Link>
      </div>

      {/* СТАТИСТИК КАРТУУД */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Илгээсэн хүсэлт</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.appliedCount}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
              {stats.appliedThisWeek}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">✉️</div>
        </div>

        {/* 🌟 ҮЗСЭН КОМПАНИУД (ДИНАМИК СТАТУСТАЙ БОЛСОН ХЭСЭГ) */}
        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Үзсэн компаниуд</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.viewedCompaniesCount}</h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
              stats.viewedCompaniesCount === 0 
                ? "text-gray-500 bg-gray-50" 
                : stats.viewedCompaniesCount <= 3 
                ? "text-indigo-600 bg-indigo-50" 
                : "text-amber-600 bg-amber-50"
            }`}>
              {getCompanyViewStatus(stats.viewedCompaniesCount)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">🏢</div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CV хандалт</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{cleanCvViewRate}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Маш сайн 🚀</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">📊</div>
        </div>
      </div>

      {/* ГОЛ КОНТЕНТ СЕКЦ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ЗҮҮН ТАЛ */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* САНАЛ БОЛГОХ АЖЛУУД */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Санал болгож буй ажлын байрууд</h2>
              <Link href={`/dashboard/staff/jobs/recommendedJobs?userId=${userId}`} className="text-xs font-bold text-indigo-600 hover:underline">
                Бүгдийг үзэх ({recommendedJobs.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedJobs.slice(0, 2).map((job) => {
                const isJobApplied = appliedJobIds.includes(job.id);
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="w-full text-left block bg-white border border-gray-100 hover:border-indigo-100 p-6 rounded-4xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isJobApplied && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Хүсэлт илгээсэн ✓</span>
                          )}
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg uppercase">{job.category}</span>
                          <span className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg">{job.type}</span>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                        
                        <div>
                          <span 
                            onClick={(e) => handleCompanyClick(e, job.company_id)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block"
                          >
                            🏢 {job.company}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-medium pt-1">
                          <span>📍 {job.location}</span>
                          <span className="text-emerald-600 font-bold">💰 {formatSalary(job.salary)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end sm:block">
                        <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-sm font-bold transition-all shadow-sm">→</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ХҮСЭЛТҮҮДИЙН ТӨЛӨВ */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Илгээсэн анкетын төлөв</h2>
              <Link href={`/dashboard/staff/applications?userId=${userId}`} className="text-xs font-bold text-indigo-600 hover:underline">
                Түүх үзэх ({recentApplications.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentApplications.slice(0, 2).map((app) => (
                <div 
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="w-full text-left bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-4 hover:border-indigo-100 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">{app.title}</h4>
                    
                    <div>
                      <span 
                        onClick={(e) => handleCompanyClick(e, app.company_id)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block"
                      >
                        🏢 {app.company}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 font-medium pt-0.5">📅 {app.date}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 w-full">
                    <span className="text-xs text-gray-400">Статус:</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${app.statusColor}`}>{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* БАРУУН ТАЛ */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-lg text-gray-900">Миний Профайл</h3>
              <p className="text-xs text-gray-400 mt-1">Таны систем дэх бүртгэл баталгаажсан байна.</p>
            </div>
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500">Профайл бөглөлт</span>
                <span className="text-indigo-600">{profileProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${profileProgress}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/staff/profile" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm text-center rounded-2xl transition shadow-md shadow-indigo-600/10">Профайл засах ✏️</Link>
              <button 
                disabled={isDownloading}
                onClick={handleDownloadCV}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm text-center rounded-2xl transition border border-gray-100 block disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? "Татаж байна... ⏳" : "Миний CV татах 📄"}
              </button>
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-4xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h4 className="font-black text-sm text-amber-900">Амжилтын зөвлөгөө</h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Технологийн компаниуд анкет шалгахдаа хамгийн түрүүнд хийсэн төслүүд болон ашигласан технологиудын жагсаалтыг хардаг. Түүнчлэн үр дүнгээ тоогоор илэрхийлэх нь давуу тал болно.
            </p>
            <Link href="/staff/blog/tips" className="inline-block text-xs font-bold text-orange-600 hover:underline pt-1">Үргэлжлүүлж унших →</Link>
          </div>
        </div>

      </div>

      {/* 🏢 САНАЛ БОЛГОЖ БУЙ АЖЛЫН MODAL ЦОНХ */}
      {selectedJob && (() => {
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
                <p className="text-emerald-600">💰 <b>Цалин:</b> {formatSalary(selectedJob.salary)}</p>
                <div className="bg-gray-50 p-4 rounded-2xl mt-2 text-xs text-gray-600 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
                  <b className="text-gray-900 block mb-1">Ажлын тайлбар:</b> 
                  {selectedJob.description || "Ажлын тайлбар байхгүй байна."}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                {isModalJobApplied ? (
                  <button disabled className="flex-1 py-3 bg-red-100 text-red-700 font-bold text-sm text-center rounded-xl cursor-not-allowed shadow-inner">
                    Хүсэлт илгээгдсэн ✓
                  </button>
                ) : (
                  <button
                    disabled={isSubmitting || checkingProfile}
                    onClick={() => triggerApplyConfirmation(selectedJob.id)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm text-center rounded-xl transition shadow-md shadow-indigo-600/10"
                  >
                    {checkingProfile ? "Шалгаж байна..." : "Анкет илгээх 🚀"}
                  </button>
                )}
                <button onClick={() => setSelectedJob(null)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition">Хаах</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ✉️ ИЛГЭЭСЭН АНКЕТЫН ТӨЛӨВ БАЙДЛЫН MODAL ЦОНХ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setSelectedApp(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900">{selectedApp.title}</h3>
              
              <div>
                <span 
                  onClick={(e) => handleCompanyClick(e, selectedApp.company_id)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block"
                >
                  🏢 {selectedApp.company}
                </span>
              </div>

              <p className="text-xs text-gray-400 font-medium">📅 Илгээсэн огноо: {selectedApp.date}</p>
            </div>
            <hr className="border-gray-100" />
            <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
              <b className="text-gray-900 block mb-1">Ажлын тайлбар:</b>
              {selectedApp.description || "Ажлын тайлбар байхгүй байна."}
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="text-sm font-bold text-gray-500">Одоогийн статус:</span>
              <span className={`px-4 py-1.5 text-xs font-black rounded-xl border ${selectedApp.statusColor}`}>{selectedApp.status}</span>
            </div>
            <button onClick={() => setSelectedApp(null)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition text-center">Хаах</button>
          </div>
        </div>
      )}

      {/* --- БАТАЛГААЖУУЛАХ (SLIDER) МОДАЛ ЦОНХ --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">❓</div>
            <h3 className="text-lg md:text-xl font-black text-gray-900">Илгээхдээ итгэлтэй байна уу?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Анкет илгээх үйлдлийг баталгаажуулахын тулд баруун тийш чирнэ үү. Илгээсэн анкетыг цуцлах боломжгүй.
            </p>

            <div className="w-full mt-6 space-y-4">
              <div ref={trackRef} className="relative w-full h-14 bg-gray-100 rounded-2xl p-1 flex items-center select-none overflow-hidden border border-gray-200/60">
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400 transition-opacity" style={{ opacity: Math.max(1 - sliderX / 100, 0) }}>
                  Баруун тийш чирж илгээх ➔
                </div>

                <div
                  ref={handleRef}
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  className="absolute top-1 bottom-1 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing shadow-lg"
                  style={{
                    transform: `translateX(${sliderX}px)`,
                    transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  {isSubmitting ? (
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

      {/* --- АМЖИЛТТАЙ ИЛГЭЭГДСЭН ҮЕИЙН МОДАЛ ЦОНХ --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner animate-bounce">🚀</div>
            <h3 className="text-xl font-black text-gray-900">Амжилттай илгээгдлээ!</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Таны анкетыг хүлээн авлаа. Бид таны мэдээллийг хянаж үзээд эргэж холбогдох болно. Тасралтгүй урагшилсаар байгаарай!
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false)
                window.location.reload() 
              }}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-600/20 transition"
            >
              Ойлголоо 👍
            </button>
          </div>
        </div>
      )}

      {/* --- МЭДЭГДЭЛ БОЛОН АЛДААНЫ НЭГДСЭН МОДАЛ --- */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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