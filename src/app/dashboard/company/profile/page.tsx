"use client"

import { useState, useEffect, useRef } from "react"
import { uploadImage } from "@/lib/uploadImage"
import { getErrorMessage } from "@/lib/errors"
import { Pencil } from "lucide-react"
import CompanyProfileView from "@/components/company/CompanyProfileView"
import CompanyProfileEditForm from "@/components/company/CompanyProfileEditForm"
import type { CompanyPublicJob } from "@/lib/companyJobs"

interface CompanyProfileData {
  company_name: string
  email: string
  phone: string
  website: string
  tagline?: string
  description?: string
  industry?: string
  company_size?: string
  facebook_url?: string
  linkedin_url?: string
  logo_url?: string
}

export default function CompanyProfilePage() {
  const isFetched = useRef(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [jobs, setJobs] = useState<CompanyPublicJob[]>([])
  const [formData, setFormData] = useState<CompanyProfileData>({
    company_name: "",
    email: "",
    phone: "",
    website: "",
    tagline: "",
    description: "",
    industry: "Технологи, Мэдээллийн технологи",
    company_size: "11-50 ажилтан",
    facebook_url: "",
    linkedin_url: "",
    logo_url: "",
  })
  
  const [initialData, setInitialData] = useState<CompanyProfileData | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        const response = await fetch("/api/company/profile")
        if (!response.ok) throw new Error("Профайл мэдээллийг авч чадсангүй.")
        
        const result = await response.json()
        if (result.data) {
          const profile = {
            company_name: result.data.company_name || "",
            email: result.data.email || "",
            phone: result.data.phone || "",
            website: result.data.website || "",
            tagline: result.data.tagline || "",
            description: result.data.description || "",
            industry: result.data.industry || "Технологи, Мэдээллийн технологи",
            company_size: result.data.company_size || "11-50 ажилтан",
            facebook_url: result.data.facebook_url || "",
            linkedin_url: result.data.linkedin_url || "",
            logo_url: result.data.logo_url || "",
          }
          setFormData(profile)
          setInitialData(profile)
          setJobs(result.jobs ?? [])
        }
      } catch (err) {
        setMessage({ type: "error", text: getErrorMessage(err) })
        isFetched.current = false
      } finally {
        setPageLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    setMessage(null)

    try {
      const publicUrl = await uploadImage(file, "company-logos")

      setFormData((prev) => ({ ...prev, logo_url: publicUrl }))
      setMessage({ type: "success", text: "Лого ачаалагдлаа. Хадгалах товчийг дарж баталгаажуулна уу." })
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "Лого хуулахад алдаа гарлаа.") })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Шинэчлэхэд алдаа гарлаа.")

      setInitialData(formData)
      setIsEditMode(false)
      setMessage({ type: "success", text: "Профайл мэдээлэл амжилттай шинэчлэгдлээ! 🎉" })
      
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = () => {
    if (initialData) setFormData(initialData)
    setIsEditMode(false)
    setMessage(null)
  }

  const showLoader = pageLoading || actionLoading || uploadingLogo

  // Харах горим: ажил хайгчид харагдах албан ёсны профайл (ачаалж байх үед доорх loader-тай хэсэг)
  if (!isEditMode && !pageLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <p className="pt-2 text-sm text-slate-500">
          Ажил хайгчид таны профайлыг яг ийм байдлаар харна.
        </p>

        {message && (
          <div className={`p-4 rounded-2xl font-bold text-sm shadow-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
          }`}>
            {message.text}
          </div>
        )}

        <CompanyProfileView
          profile={formData}
          jobs={jobs}
          jobHref={(jobId) => `/dashboard/company/post-job/${jobId}/applicants`}
          actions={
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-sm inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Мэдээлэл засах
            </button>
          }
        />
      </div>
    )
  }

  // Засах горим (эсвэл анх ачаалж байх үе)
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6 relative">
      {showLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
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
            {pageLoading && "Профайл мэдээллийг ачаалж байна..."}
            {uploadingLogo && "Лого зургийг шинэчилж байна..."}
            {actionLoading && "Өөрчлөлтийг хадгалж байна..."}
          </p>
        </div>
      )}

      {!pageLoading && (
        <>
          {message && (
            <div className={`p-4 rounded-2xl font-bold text-sm shadow-sm ${
              message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}>
              {message.text}
            </div>
          )}

          <CompanyProfileEditForm
            value={formData}
            onChange={(next) => setFormData((prev) => ({ ...prev, ...next }))}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onLogoSelect={handleLogoUpload}
            uploadingLogo={uploadingLogo}
            saving={actionLoading}
          />
        </>
      )}
    </div>
  )
}
