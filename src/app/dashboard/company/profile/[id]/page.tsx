"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { uploadImage } from "@/lib/uploadImage"
import { getErrorMessage } from "@/lib/errors"
import { Pencil } from "lucide-react"
import CompanyProfileView from "@/components/company/CompanyProfileView"
import CompanyProfileEditForm from "@/components/company/CompanyProfileEditForm"
import type { CompanyPublicJob } from "@/lib/companyJobs"

interface CompanyProfileData {
  id?: string
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
  const { id } = useParams()
  const router = useRouter()

  const [isEditMode, setIsEditMode] = useState(false)
  const [isOwner, setIsOwner] = useState(false) 
  const [viewerRole, setViewerRole] = useState<string | null>(null)
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

  const handleBack = () => {
    router.back();
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/company/profile/${id}`)
        
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Профайл мэдээллийг авч чадсангүй.")
        
        if (result.data) {
          const profile = {
            id: result.data.id || "",
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

          if (result.isOwner) {
            setIsOwner(true)
          }
          setViewerRole(result.viewerRole ?? null)
          setJobs(result.jobs ?? [])
        }
      } catch (err) {
        setMessage({ type: "error", text: getErrorMessage(err) })
      } finally {
        setPageLoading(false)
      }
    }
    if (id) fetchProfile()
  }, [id])

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
      const response = await fetch(`/api/company/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Шинэчлэхэд алдаа гарлаа.")

      setInitialData(formData)
      setIsEditMode(false)
      setMessage({ type: "success", text: "Профайл мэдээлэл амжилттай шинэчлэгдлээ!" })
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

  if (pageLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 text-center text-gray-400 font-medium">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-3xl w-full"></div>
          <div className="h-8 bg-gray-100 rounded-xl w-1/3"></div>
          <div className="h-48 bg-gray-100 rounded-3xl w-full"></div>
        </div>
      </div>
    )
  }

  // Харах горим: ажил хайгчид харагдах албан ёсны профайл
  if (!isEditMode) {
    // Ажил хайгч зар дээр дарвал зарын дэлгэрэнгүй, эзэмшигч бол тухайн зарын анкетууд руу
    const jobHref = isOwner
      ? (jobId: string) => `/dashboard/company/post-job/${jobId}/applicants`
      : viewerRole === "staff"
        ? (jobId: string) => `/dashboard/staff/jobs/${jobId}`
        : null

    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        <div className="pt-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs"
          >
            ← Буцах
          </button>
        </div>

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
          jobHref={jobHref}
          actions={isOwner ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-sm inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Мэдээлэл засах
            </button>
          ) : undefined}
        />
      </div>
    )
  }

  // Засах горим (зөвхөн эзэмшигч)
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-6 pt-4">
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
    </div>
  )
}
