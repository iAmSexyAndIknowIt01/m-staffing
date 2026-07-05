"use client"

import React from "react"

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

export default function JobCard({
  job,
  isJobApplied,
  onClick,
  onCompanyClick,
  getCompanyLogoUrl,
  getJobTypeText,
  getSalaryTypeText,
  formatSalary,
}: JobCardProps) {
  const logoFullUrl = getCompanyLogoUrl(job.mt_company?.logo_url)

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white border rounded-3xl p-6 hover:border-indigo-200 hover:shadow-lg transition cursor-pointer ${
        isJobApplied ? "border-l-4 border-l-red-500 border-gray-100" : "border-gray-100"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-4 flex-1">
          <div
            onClick={(e) => onCompanyClick(e, job.mt_company)}
            className="w-25 h-25 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs hover:scale-105 transition cursor-pointer"
          >
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
              <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-xl">
                {job.category}
              </span>
              <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-xl">
                {getJobTypeText(job.job_type)}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition">
              {job.title}
            </h3>

            <p className="text-sm font-semibold mt-0.5">
              {job.mt_company ? (
                <span
                  onClick={(e) => onCompanyClick(e, job.mt_company)}
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
          <button className="hidden lg:inline-flex px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xs transition">
            Дэлгэрэнгүй →
          </button>
        </div>
      </div>
    </div>
  )
}