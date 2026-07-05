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
  if (!selectedJob) return null

  const isModalJobApplied = selectedJob.is_applied || appliedJobIds.includes(selectedJob.id)
  const modalLogoUrl = getCompanyLogoUrl(selectedJob.mt_company?.logo_url)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-50 flex flex-col justify-between">
        
        {/* Modal Header */}
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
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                    Хүсэлт илгээсэн ✓
                  </span>
                )}
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">
                  {selectedJob.category}
                </span>
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              📋 Ажлын үүрэг, тодорхойлолт
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {selectedJob.description}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              🎯 Тавигдах шаардлага
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {selectedJob.requirements}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Нийтлэгдсэн: {new Date(selectedJob.created_at).toLocaleDateString("mn-MN")}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-200 rounded-xl transition"
            >
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
}