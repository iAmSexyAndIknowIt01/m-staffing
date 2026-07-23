"use client"

import React, { useState, useEffect } from "react"
import { Heart, Share2 } from "lucide-react"

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

interface JobCardProps {
  job: Job
  isJobApplied: boolean
  onClick: () => void
  onCompanyClick: (e: React.MouseEvent, company: Company | undefined) => void
  getCompanyLogoUrl: (url: string | null | undefined) => string | null
  getJobTypeText: (type: string) => string
  getSalaryTypeText: (type: string) => string
  formatSalary: (salary: string) => string
}

function getDaysAgo(dateString: string) {
  const created = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return "Өнөөдөр"
  if (diffDays > 30) return `${Math.floor(diffDays / 30)} сарын өмнө`
  return `${diffDays} өдрийн өмнө`
}

function isNewJob(dateString: string) {
  const created = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  return diffDays <= 3 && diffDays >= 0
}

export default function JobCard({
  job,
  isJobApplied,
  onClick,
  getCompanyLogoUrl,
  getJobTypeText,
  getSalaryTypeText,
  formatSalary,
}: JobCardProps) {
  const logoFullUrl = getCompanyLogoUrl(job.mt_company?.logo_url)

  // Өмнө нь дарж үзсэн эсэхийг localStorage-оос шалгах
  const [hasVisited, setHasVisited] = useState(false)

  useEffect(() => {
    const visitedJobs = JSON.parse(localStorage.getItem("visited_jobs") || "[]")
    if (visitedJobs.includes(job.id)) {
      setHasVisited(true)
    }
  }, [job.id])

  const handleClick = () => {
    // Дарсан үед visited болгож localStorage руу хадгалах
    setHasVisited(true)
    const visitedJobs = JSON.parse(localStorage.getItem("visited_jobs") || "[]")
    if (!visitedJobs.includes(job.id)) {
      visitedJobs.push(job.id)
      localStorage.setItem("visited_jobs", JSON.stringify(visitedJobs))
    }
    onClick()
  }

  const numericSalary = Number(job.salary?.replace(/[^0-9.-]+/g, "")) || 0
  const isGoodSalary = 
    (job.job_type === "fulltime" && numericSalary >= 3500000) ||
    ((job.job_type === "parttime" || job.salary_type === "hourly") && numericSalary >= 12000)

  const isNew = isNewJob(job.created_at)

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer ${
        isJobApplied ? "border-l-4 border-l-red-500" : ""
      }`}
    >
      {/* Дээд хэсэг: Лого, Гарчиг, Үйлдэлүүд */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {logoFullUrl ? (
              <img
                src={logoFullUrl}
                alt={job.mt_company?.name || "Company logo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : (
              <span className="text-sm font-black text-indigo-500 uppercase">
                {job.mt_company?.name?.substring(0, 2) || "CO"}
              </span>
            )}
          </div>

          <div>
            {/* Гарчиг: Хэрэв өмнө нь үзсэн бол бор хүрэн (brown-red), үгүй бол стандарт хар өнгөтэй байна */}
            <h3 className={`text-[16px] font-bold leading-snug transition ${
              hasVisited ? "text-[#8B263E]" : "text-slate-900 group-hover:text-indigo-600"
            }`}>
              {job.title}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1">
              {job.mt_company ? (
                <span className="text-xs font-semibold text-[#1877F2]">
                  {job.mt_company.name}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Байгууллагын нэр нууцалсан</span>
              )}
              
              {job.mt_company && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-[#1877F2] rounded-full text-white shrink-0">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg transition">
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Дунд хэсэг: Цалин ба Оруулсан хугацаа */}
      <div className="mt-4 pt-1 flex items-baseline justify-between gap-2">
        <div className="text-[15px] font-bold text-slate-800">
          ₮ {formatSalary(job.salary)}
          <span className="text-xs font-normal text-gray-400 ml-1">
            / {getSalaryTypeText(job.salary_type)}
          </span>
        </div>
        
        <div className="text-[11px] text-gray-400 font-medium">
          {getDaysAgo(job.created_at)}
        </div>
      </div>

      {/* Доод хэсэг: Төрөл бүрийн Badge-үүд */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {isNew && (
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              Шинэ
            </span>
          )}

          {isGoodSalary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 rounded-full border border-amber-100">
              <span>₮</span> Сайн цалин
            </span>
          )}
          
          <span className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-full border border-gray-100">
            {getJobTypeText(job.job_type)}
          </span>

          {isJobApplied && (
            <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100">
              ✓ Илгээсэн
            </span>
          )}
        </div>

        <div className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
          <span>📍</span> {job.location || "Улаанбаатар"}
        </div>
      </div>
    </div>
  )
}