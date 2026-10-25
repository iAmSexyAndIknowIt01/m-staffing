"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, Loader2, SearchX, Send } from "lucide-react"
import { getErrorMessage } from "@/lib/errors"
import { showAlert, showConfirm } from "@/components/common/AppDialog"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import JobDetailView from "@/components/staff/jobs/JobDetailView"
import {
  Progress,
  STATUS,
  STATUS_DESCRIPTIONS,
  formatDate,
  timeAgo,
  toRequestStatus,
  type RequestStatus,
} from "@/components/staff/requests/requestStatus"
import type { JobCompany, JobDetail } from "@/types/job"

// /api/staff/requests/[id]-ийн буцаах мөр (tr_job_request -> mt_openjob -> mt_company)
interface ApiRequestDetail {
  id: string
  status: string | null
  created_at: string
  mt_openjob: {
    id: string
    title: string | null
    category: string | null
    job_type: string | null
    salary_type: string | null
    location: string | null
    salary: string | null
    description: string | null
    requirements: string | null
    created_at: string | null
    mt_company: { id: string; company_name: string | null; logo_url: string | null } | null
  } | null
}

const JOB_TYPES: Record<string, string> = {
  fulltime: "Бүтэн цаг",
  full_time: "Бүтэн цаг",
  parttime: "Хагас цаг",
  part_time: "Хагас цаг",
  intern: "Дадлагажигч",
  internship: "Дадлагажигч",
  remote: "Зайнаас (Remote)",
  contract: "Гэрээт",
}

const SALARY_TYPES: Record<string, string> = {
  monthly: "Сарын",
  fixed: "Сарын",
  hourly: "Цагийн",
  yearly: "Жилийн",
  negotiable: "Тохиролцоно",
}

function getCompanyLogoUrl(logoUrl: string | null | undefined) {
  if (!logoUrl) return null
  if (logoUrl.startsWith("http")) return logoUrl
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return base ? `${base}/storage/v1/object/public/company-logos/${logoUrl}` : logoUrl
}

function formatSalary(salaryStr: string | null | undefined) {
  if (!salaryStr) return "Тохиролцоно"
  const numeric = parseInt(salaryStr.replace(/\D/g, ""), 10)
  if (isNaN(numeric)) return salaryStr
  return `${numeric.toLocaleString()} ₮`
}

export default function StaffRequestDetailPage({ params }: { params: Promise<{ jobid: string }> }) {
  const { jobid: requestId } = use(params)
  const router = useRouter()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [status, setStatus] = useState<RequestStatus>("pending")
  const [appliedAt, setAppliedAt] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [updating, setUpdating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRequest() {
      try {
        const res = await fetch(`/api/staff/requests/${requestId}`)
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || "Мэдээлэл авахад алдаа гарлаа")

        const item = (result.data || result) as ApiRequestDetail
        const openJob = item.mt_openjob
        const company = openJob?.mt_company

        setJob({
          id: openJob?.id || item.id,
          title: openJob?.title || "Тодорхойгүй ажлын байр",
          category: openJob?.category || "",
          job_type: openJob?.job_type || "",
          salary_type: openJob?.salary_type || "",
          location: openJob?.location || "",
          salary: openJob?.salary || "",
          description: openJob?.description || "",
          requirements: openJob?.requirements || "",
          created_at: openJob?.created_at || item.created_at,
          is_applied: true,
          mt_company: company
            ? { id: company.id, name: company.company_name || "Компанийн нэр байхгүй", logo_url: company.logo_url }
            : undefined,
        })
        setStatus(toRequestStatus(item.status))
        setAppliedAt(item.created_at)
      } catch (err) {
        console.error("Error fetching detail:", err)
        setError(getErrorMessage(err, "Серверийн алдаа гарлаа"))
      } finally {
        setLoading(false)
      }
    }

    if (requestId) fetchRequest()
  }, [requestId])

  // Ярилцлагад оролцохоо баталгаажуулж төлвийг accepted болгоно
  const handleAcceptInterview = async () => {
    const ok = await showConfirm("Ярилцлагад оролцохоо баталгаажуулах уу? Ажил олгогчид мэдэгдэнэ.", {
      title: "Ярилцлага баталгаажуулах",
      confirmLabel: "Баталгаажуулах",
      icon: CalendarCheck,
    })
    if (!ok) return

    try {
      setUpdating(true)
      const res = await fetch(`/api/staff/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Төлөв шинэчлэхэд алдаа гарлаа")
      setStatus("accepted")
    } catch (err) {
      console.error("Error updating status:", err)
      showAlert(getErrorMessage(err, "Серверийн алдаа гарлаа"), { tone: "error" })
    } finally {
      setUpdating(false)
    }
  }

  const handleCompanyClick = (e: React.MouseEvent, company: JobCompany | undefined) => {
    e.preventDefault()
    const companyId = company?.id || company?.company_id
    if (companyId) router.push(`/dashboard/company/profile/${companyId}`)
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  if (error || !job) {
    return (
      <EmptyState
        icon={SearchX}
        title="Хүсэлт олдсонгүй"
        description={error || "Энэ хүсэлт устгагдсан эсвэл танд харагдах эрхгүй байж болно."}
        action={{ label: "Миний хүсэлтүүд", href: "/dashboard/staff/requests" }}
        className="max-w-lg mx-auto mt-10"
      />
    )
  }

  const info = STATUS[status]
  const StatusIcon = info.icon

  const acceptButton = (className: string) => (
    <button
      type="button"
      onClick={handleAcceptInterview}
      disabled={updating}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
      {updating ? "Шинэчилж байна..." : "Оролцохоо баталгаажуулах"}
    </button>
  )

  return (
    <JobDetailView
      job={job}
      appliedJobIds={[job.id]}
      submitting={false}
      checkingProfile={false}
      getCompanyLogoUrl={getCompanyLogoUrl}
      getJobTypeText={(type) => JOB_TYPES[type] || type}
      getSalaryTypeText={(type) => SALARY_TYPES[type] || type || ""}
      formatSalary={formatSalary}
      handleCompanyClick={handleCompanyClick}
      triggerApplyConfirmation={async () => {}}
      onClose={() => router.push("/dashboard/staff/requests")}
      action={(variant) =>
        variant === "header" ? (
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-sm font-bold ${info.badge}`}>
              <StatusIcon className="w-4 h-4" /> {info.label}
            </span>
            {status === "interview" && acceptButton("px-5 py-2.5 bg-white text-orange-700 hover:bg-orange-50 shadow-md shadow-slate-950/30")}
          </div>
        ) : status === "interview" ? (
          acceptButton("shrink-0 px-4 py-3 bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20")
        ) : (
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-sm font-bold ${info.badge}`}>
            <StatusIcon className="w-4 h-4" /> {info.label}
          </span>
        )
      }
      topSection={
        <section className="bg-white border border-gray-100 rounded-4xl shadow-sm p-6 sm:p-8" aria-labelledby="request-status-title">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <span className={`w-12 h-12 shrink-0 rounded-2xl border flex items-center justify-center ${info.badge}`}>
                <StatusIcon className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Хүсэлтийн төлөв</p>
                <h2 id="request-status-title" className="mt-0.5 text-xl font-bold text-gray-900">{info.label}</h2>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{STATUS_DESCRIPTIONS[status]}</p>
              </div>
            </div>
            {status === "interview" &&
              acceptButton("w-full sm:w-auto shrink-0 px-5 py-3 bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20")}
          </div>

          <div className="mt-6">
            <Progress status={status} />
          </div>

          <p className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <Send className="w-4 h-4 text-gray-400 shrink-0" />
              Анкет илгээсэн: <span className="font-semibold text-gray-700">{formatDate(appliedAt)}</span>
            </span>
            <span className="text-gray-400 whitespace-nowrap">· {timeAgo(appliedAt)}</span>
          </p>
        </section>
      }
    />
  )
}
