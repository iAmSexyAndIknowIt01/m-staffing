"use client"

import React, { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { SALARY_NEGOTIABLE } from "@/lib/jobPost"
import { Check, Heart, Share2, MapPin } from "lucide-react"

const VISITED_JOBS_KEY = "visited_jobs"
const VISITED_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 хоногийн дотор дарсан бол бор хүрэн өнгөтэй
const noopSubscribe = () => () => {}

function readVisitedJobs(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(VISITED_JOBS_KEY) || "{}")
  } catch {
    return {}
  }
}

function isRecentlyVisited(jobId: string): boolean {
  const visitTime = readVisitedJobs()[jobId]
  return typeof visitTime === "number" && Date.now() - visitTime <= VISITED_TTL_MS
}

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
  isBookmarked: boolean 
  onToggleBookmark: (e: React.MouseEvent) => void 
  href: string
  onClick?: () => void
  onCompanyClick: (e: React.MouseEvent, company: Company | undefined) => void
  getCompanyLogoUrl: (url: string | null | undefined) => string | null
  getJobTypeText: (type: string) => string
  getSalaryTypeText: (type: string) => string
  formatSalary: (salary: string) => string
  onShare: (e: React.MouseEvent, job: Job) => void
}

function getDaysAgo(dateString: string) {
  const created = new Date(dateString)
  if (!dateString || isNaN(created.getTime())) return ""
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return "Өнөөдөр"
  if (diffDays > 30) return `${Math.floor(diffDays / 30)} сарын өмнө`
  return `${diffDays} өдрийн өмнө`
}

function isNewJob(dateString: string) {
  const created = new Date(dateString)
  if (!dateString || isNaN(created.getTime())) return false
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  return diffDays <= 3 && diffDays >= 0
}

export default function JobCard({
  job,
  isJobApplied,
  isBookmarked,
  onToggleBookmark,
  onShare,
  href,
  onClick,
  getCompanyLogoUrl,
  getJobTypeText,
  getSalaryTypeText,
  formatSalary,
}: JobCardProps) {
  const logoFullUrl = getCompanyLogoUrl(job.mt_company?.logo_url)

  // Өмнө нь дарж үзсэн эсэхийг localStorage болон хугацаагаар шалгах (SSR үед false)
  const visitedRecently = useSyncExternalStore(
    noopSubscribe,
    () => isRecentlyVisited(job.id),
    () => false
  )
  const [clicked, setClicked] = useState(false)
  const hasVisited = clicked || visitedRecently

  const handleClick = () => {
    setClicked(true)
    try {
      const visitedJobs = readVisitedJobs()
      // Дарсан цаг/огноог хадгалах
      visitedJobs[job.id] = Date.now()
      localStorage.setItem(VISITED_JOBS_KEY, JSON.stringify(visitedJobs))
    } catch {
      // localStorage хаалттай (private горим гэх мэт) үед өнгө л өөрчлөгдөхгүй
    }

    onClick?.()
  }

  const numericSalary = Number(job.salary?.replace(/[^0-9.-]+/g, "")) || 0
  const isGoodSalary = 
    (job.job_type === "fulltime" && numericSalary >= 3500000) ||
    ((job.job_type === "parttime" || job.salary_type === "hourly") && numericSalary >= 12000)

  const isNew = isNewJob(job.created_at)
  const negotiable = !job.salary || job.salary.trim() === SALARY_NEGOTIABLE || job.salary_type === "negotiable"

  // Анкет илгээсэн картын зүүн улаан хүрээ: dark mode-ийн border-gray-100 дүрэм бүх талын
  // өнгийг солидог тул border-l-red-500!-ээр (important) хоёр горимд ижил харагдуулна
  return (
    <div
      className={`group relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all duration-200 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-orange-400 ${
        isJobApplied ? "border-l-4 border-l-red-500!" : ""
      }`}
    >
      {/* Карт бүхэлдээ холбоос: шинэ tab-д нээх, гараар (Tab/Enter) ажиллах боломжтой */}
      <Link
        href={href}
        onClick={handleClick}
        aria-label={`${job.title}${job.mt_company ? ` — ${job.mt_company.name}` : ""}`}
        className="absolute inset-0 rounded-2xl outline-none"
      />
      {/* Дээд хэсэг: Лого, Гарчиг, Үйлдэлүүд */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {logoFullUrl ? (
              <img
                src={logoFullUrl}
                alt={`${job.mt_company?.name || "Байгууллага"} лого`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : (
              <span className="text-sm font-bold text-orange-500 uppercase">
                {job.mt_company?.name?.substring(0, 2) || "CO"}
              </span>
            )}
          </div>

          <div>
            {/* Гарчиг: өмнө нь үзсэн бол вэбийн «үзсэн холбоос»-ын ягаан өнгөтэй байна */}
            <h3 className={`text-[16px] font-bold leading-snug transition ${
              hasVisited ? "text-purple-800" : "text-slate-900 group-hover:text-orange-600"
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

        <div className="relative z-10 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? "Хадгалснаас хасах" : "Хадгалах"}
            aria-pressed={isBookmarked}
            title={isBookmarked ? "Хадгалснаас хасах" : "Хадгалах"}
            className={`p-2 rounded-lg transition ${
              isBookmarked 
                ? "text-red-500 bg-red-50 hover:bg-red-100" 
                : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
            }`}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();       
              onShare(e, job);
            }}
            aria-label="Хуваалцах"
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
            title="Хуваалцах"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Дунд хэсэг: Цалин ба Оруулсан хугацаа */}
      <div className="mt-4 pt-1 flex items-baseline justify-between gap-2">
        <div className="text-[15px] font-bold text-slate-800">
          {/* formatSalary өөрөө "₮" нэмдэг; «Тохиролцоно» үед хугацааг харуулахгүй */}
          {negotiable ? SALARY_NEGOTIABLE : formatSalary(job.salary)}
          {!negotiable && job.salary_type && (
            <span className="text-xs font-normal text-gray-400 ml-1">
              / {getSalaryTypeText(job.salary_type)}
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-400 font-medium">
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
              <Check className="inline-block w-3 h-3 mr-0.5 align-[-0.1em]" aria-hidden="true" />Илгээсэн
            </span>
          )}
        </div>

        <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <span><MapPin size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></span> {job.location || "Улаанбаатар"}
        </div>
      </div>
    </div>
  )
}