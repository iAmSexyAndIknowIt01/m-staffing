"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, DollarSign, Briefcase, Calendar, Clock, CheckCircle, XCircle, Users, Copy, Check, CheckCheck } from "lucide-react"

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
  status: string
  mt_company?: Company
}

export default function StaffRequestDetailPage({ params }: { params: Promise<{ jobid: string }> }) {
  const unwrappedParams = use(params)
  const jobId = unwrappedParams.jobid
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [updating, setUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Өгөгдөл татах (API-аар дамжуулж авна)
  useEffect(() => {
    async function fetchJobDetail() {
      try {
        setLoading(true)
        const res = await fetch(`/api/staff/requests/${jobId}`)
        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.error || "Мэдээлэл авахад алдаа гарлаа")
        }

        const item = result.data || result
        
        // API-аас ирж буй `tr_job_request` болон түүний доторх холбогдсон `mt_openjob`, `mt_company` бүтцийг зөв задлах
        const openJob = item.mt_openjob || {}
        const companyData = openJob.mt_company || {}

        const formattedJob: Job = {
          id: item.id,
          title: openJob.title || item.title || "Тодорхойгүй ажлын байр",
          category: openJob.category || item.category || "Ерөнхий",
          job_type: openJob.job_type || item.job_type || "full_time",
          salary_type: openJob.salary_type || item.salary_type || "fixed",
          location: openJob.location || item.location || "Улаанбаатар",
          salary: openJob.salary || item.salary || "0",
          description: openJob.description || item.description || "Мэдээлэл байхгүй",
          requirements: openJob.requirements || item.requirements || "Шаардлага байхгүй",
          created_at: item.created_at || new Date().toISOString(),
          status: item.status || "pending",
          mt_company: {
            name: companyData.company_name || item.companyName || "Компанийн нэр байхгүй",
            logo_url: companyData.logo_url || null,
          }
        }

        setJob(formattedJob)
      } catch (err: any) {
        console.error("Error fetching detail:", err)
        setError(err.message || "Серверийн алдаа гарлаа")
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchJobDetail()
    }
  }, [jobId])

  // Ярилцлагыг баталгаажуулж status-г accepted болгох функц (API руу хандана)
  const handleAcceptInterview = async () => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/staff/requests/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Төлөв шинэчлэхэд алдаа гарлаа")
      }

      setJob((prev) => (prev ? { ...prev, status: "accepted" } : null))
    } catch (err: any) {
      console.error("Error updating status:", err)
      alert(err.message || "Серверийн алдаа гарлаа")
    } finally {
      setUpdating(false)
    }
  }

  // Туслах функцүүд
  const getJobTypeText = (type: string) => {
    const types: Record<string, string> = {
      full_time: "Бүтэн цагийн",
      part_time: "Цагийн ажил",
      internship: "Дадлагажигч",
      contract: "Гэрээт",
    }
    return types[type] || type
  }

  const getSalaryTypeText = (type: string) => {
    const types: Record<string, string> = {
      fixed: "Сарын",
      hourly: "Цагийн",
      negotiable: "Тохиролцоно",
    }
    return types[type] || type
  }

  const formatSalary = (salaryStr: string | null | undefined) => {
    if (!salaryStr) return "Тохиролцоно"
    const num = Number(salaryStr)
    if (isNaN(num)) return salaryStr
    return num.toLocaleString()
  }

  const handleCopyDetails = async () => {
    if (!job) return
    const textToCopy = `
Ажлын байр: ${job.title}
Компани: ${job.mt_company?.name || "Байгууллагын нэр нууцалсан"}
Ангилал: ${job.category}
Байршил: ${job.location || "Улаанбаатар"}
Төрөл: ${getJobTypeText(job.job_type)}
Цалин: ₮ ${formatSalary(job.salary)} (${getSalaryTypeText(job.salary_type)})

--- Ажлын үүрэг, тодорхойлолт ---
${job.description}

--- Тавигдах шаардлага ---
${job.requirements}
    `.trim()

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Хуулж чадсангүй:", err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Мэдээллийг ачаалж байна...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center bg-white rounded-3xl border border-rose-100 shadow-sm p-6 my-6">
        <p className="text-rose-500 text-sm font-medium mb-4">{error || "Мэдээлэл олдсонгүй"}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-semibold transition"
        >
          Буцах
        </button>
      </div>
    )
  }

  const modalLogoUrl = job.mt_company?.logo_url

  // Статусаас хамаарч харагдах элемент болон загварыг тодорхойлох функц
  const renderStatusBadge = () => {
    switch (job.status) {
      case "accepted":
        return (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 rounded-2xl border border-blue-200/50 shadow-xs">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Баталгаажсан
          </div>
        )
      case "approved":
        return (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200/60 shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Амжилттай тэнцсэн
          </div>
        )
      case "interview":
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptInterview}
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-2xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {updating ? "Шинэчилж байна..." : "Баталгаажуулах"}
            </button>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 rounded-2xl border border-indigo-200/60 shadow-xs">
              <Users className="w-4 h-4 text-indigo-600" />
              Ярилцлагад урьж байна
            </div>
          </div>
        )
      case "rejected":
        return (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200/60 shadow-xs">
            <XCircle className="w-4 h-4 text-rose-600" />
            Татгалзсан
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 rounded-2xl border border-amber-200/60 shadow-xs">
            <Clock className="w-4 h-4 text-amber-600" />
            Хүлээгдэж буй
          </div>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-3 sm:px-0 py-6">
      {/* Буцах товч */}
      <div className="mb-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-indigo-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Буцах
        </button>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex justify-between items-start gap-4 bg-white shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {modalLogoUrl ? (
                <img src={modalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-black text-indigo-500 uppercase">
                  {job.mt_company?.name?.substring(0, 2) || "CO"}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-100/60 uppercase tracking-wider">
                {job.category}
              </span>
              
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {job.title}
              </h2>

              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {job.mt_company?.name}
                </span>
                <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyDetails}
              title="Мэдээллийг хуулах"
              className="p-2.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline text-emerald-600">Хуулсан</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Хуулах</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-7 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Байршил</span>
                <span className="text-xs font-bold text-slate-800">{job.location || "Улаанбаатар"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <Briefcase className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ажлын төрөл</span>
                <span className="text-xs font-bold text-slate-800">{getJobTypeText(job.job_type)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 sm:col-span-2 pt-2 border-t border-slate-200/50">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Цалингийн нөхцөл ({getSalaryTypeText(job.salary_type)})
                </span>
                <span className="text-sm font-black text-emerald-600">
                  ₮ {formatSalary(job.salary)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
              Ажлын үүрэг, тодорхойлолт
            </h4>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/40 rounded-2xl p-4 border border-slate-100">
              {job.description}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
              Тавигдах шаардлага
            </h4>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/40 rounded-2xl p-4 border border-slate-100">
              {job.requirements}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Нийтэлсэн огноо: {new Date(job.created_at).toLocaleDateString("mn-MN")}</span>
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {renderStatusBadge()}
          </div>
        </div>

      </div>
    </div>
  )
}