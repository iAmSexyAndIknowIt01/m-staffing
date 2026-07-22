"use client"

import React, { useState } from "react"
import { X, MapPin, DollarSign, Briefcase, Calendar, CheckCircle2, Copy, Check } from "lucide-react"

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

interface JobDetailModalProps {
  selectedJob: Job | null
  onClose: () => void
  appliedJobIds: string[]
  submitting: boolean
  checkingProfile: boolean
  getCompanyLogoUrl: (logoUrl: string | null | undefined) => string | null
  getJobTypeText: (type: string) => string
  getSalaryTypeText: (type: string) => string
  formatSalary: (salaryStr: string | null | undefined) => string
  handleCompanyClick: (e: React.MouseEvent, company: Company | undefined) => void
  triggerApplyConfirmation: (jobId: string) => Promise<void>
}

export default function JobDetailModal({
  selectedJob,
  onClose,
  appliedJobIds,
  submitting,
  checkingProfile,
  getCompanyLogoUrl,
  getJobTypeText,
  getSalaryTypeText,
  formatSalary,
  handleCompanyClick,
  triggerApplyConfirmation,
}: JobDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!selectedJob) return null

  const isModalJobApplied = selectedJob.is_applied || appliedJobIds.includes(selectedJob.id)
  const modalLogoUrl = getCompanyLogoUrl(selectedJob.mt_company?.logo_url)

  const handleCopyDetails = async () => {
    const textToCopy = `
Ажлын байр: ${selectedJob.title}
Компани: ${selectedJob.mt_company?.name || "Байгууллагын нэр нууцалсан"}
Ангилал: ${selectedJob.category}
Байршил: ${selectedJob.location || "Улаанбаатар"}
Төрөл: ${getJobTypeText(selectedJob.job_type)}
Цалин: ₮ ${formatSalary(selectedJob.salary)} (${getSalaryTypeText(selectedJob.salary_type)})

--- Ажлын үүрэг, тодорхойлолт ---
${selectedJob.description}

--- Тавигдах шаардлага ---
${selectedJob.requirements}
    `.trim()

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Хуулж чадсангүй:", err)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-9999 flex items-center justify-center p-3 sm:p-4 transition-all duration-300">
      <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start gap-4 bg-white">
          <div className="flex items-start gap-4">
            {/* Компанийн Лого */}
            <div
              onClick={(e) => handleCompanyClick(e, selectedJob.mt_company)}
              className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition duration-200 cursor-pointer shadow-sm"
            >
              {modalLogoUrl ? (
                <img src={modalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-black text-indigo-500 uppercase">
                  {selectedJob.mt_company?.name?.substring(0, 2) || "CO"}
                </span>
              )}
            </div>

            {/* Гарчиг болон Багцууд */}
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {isModalJobApplied && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Хүсэлт илгээсэн ✓
                  </span>
                )}
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/70 px-2.5 py-0.5 rounded-full border border-indigo-100/50 uppercase tracking-wide">
                  {selectedJob.category}
                </span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                {selectedJob.title}
              </h2>

              <div className="flex items-center gap-1.5 pt-0.5">
                {selectedJob.mt_company ? (
                  <span
                    onClick={(e) => handleCompanyClick(e, selectedJob.mt_company)}
                    className="text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {selectedJob.mt_company.name}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 font-medium">Байгууллагын нэр нууцалсан</span>
                )}
                {selectedJob.mt_company && (
                  <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Баруун дээд товчнууд (Copy & Close) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyDetails}
              title="Мэдээллийг хуулах"
              className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition flex items-center gap-1 text-xs font-semibold"
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

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Ажлын үндсэн нөхцөлүүд (Grid хэлбэрээр) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-600">
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 shadow-xs">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Байршил</span>
                <span className="text-xs font-bold text-slate-800">{selectedJob.location || "Улаанбаатар"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 shadow-xs">
                <Briefcase className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Төрөл</span>
                <span className="text-xs font-bold text-slate-800">{getJobTypeText(selectedJob.job_type)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600 col-span-2 mt-1 border-t border-slate-200/40 pt-3">
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 shadow-xs">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Цалингийн нөхцөл ({getSalaryTypeText(selectedJob.salary_type)})
                </span>
                <span className="text-sm font-black text-emerald-600">
                  ₮ {formatSalary(selectedJob.salary)}
                </span>
              </div>
            </div>
          </div>

          {/* Үүрэг хариуцлага */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-indigo-500 rounded-full" />
              Ажлын үүрэг, тодорхойлолт
            </h4>
            <div className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-line bg-white rounded-xl p-1">
              {selectedJob.description}
            </div>
          </div>

          {/* Тавигдах шаардлага */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
              Тавигдах шаардлага
            </h4>
            <div className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-line bg-white rounded-xl p-1">
              {selectedJob.requirements}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Нийтэлсэн: {new Date(selectedJob.created_at).toLocaleDateString("mn-MN")}</span>
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/60 shadow-xs transition duration-200"
            >
              Хаах
            </button>

            {isModalJobApplied ? (
              <button
                disabled
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-100 rounded-xl cursor-not-allowed border border-emerald-200/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Илгээгдсэн
              </button>
            ) : (
              <button
                onClick={() => triggerApplyConfirmation(selectedJob.id)}
                disabled={submitting || checkingProfile}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/10 active:scale-98 disabled:opacity-50 min-w-35 flex items-center justify-center gap-2"
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
}