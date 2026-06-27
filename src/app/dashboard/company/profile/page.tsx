"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isFetched = useRef(false)

  const [isEditMode, setIsEditMode] = useState(false)
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
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message })
        isFetched.current = false
      } finally {
        setPageLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setUploadingLogo(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, logo_url: publicUrl }))
      setMessage({ type: "success", text: "Лого ачаалагдлаа. Хадгалах товчийг дарж баталгаажуулна уу." })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Лого хуулахад алдаа гарлаа." })
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
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
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

  // 🔄 Ямар нэгэн loading идэвхтэй байгаа эсэхийг шалгах
  const showLoader = pageLoading || actionLoading || uploadingLogo;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-4 sm:px-0 pb-16 relative">
      
      {/* 🔄 БРЭНДИНГ LOADER ДЭЛГЭЦ */}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
          <div className="relative flex items-center justify-center h-32 w-32">
            {/* 1. Ард талын зөөлөн гэрэлтэлт */}
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            
            {/* 2. Гадуурх нарийн тасархай эргэлдэх шугам */}
            <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
            
            {/* 3. Үндсэн хурдан эргэлдэх тод зураас */}
            <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
            
            {/* 4. Гол хэсэгт байрлах брэндийн нэр */}
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

      {/* 1. БРЭНДИНГ ХЭСЭГ (COVER & LOGO) */}
      <div className="relative mb-24">
        <div className="h-40 md:h-48 bg-linear-to-r from-indigo-500 to-purple-600 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]"></div>
          {isEditMode && (
            <button type="button" className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 backdrop-blur-md rounded-xl transition">
              📸 Ковер солих
            </button>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLogoUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Лого */}
        <div className="absolute -bottom-16 left-6 md:left-10 p-1 bg-[#f8faff] rounded-3xl">
          <div 
            onClick={() => isEditMode && !showLoader && fileInputRef.current?.click()}
            className={`w-28 h-28 md:w-32 md:h-32 bg-white border-4 border-white rounded-3xl shadow-md flex flex-col items-center justify-center relative group overflow-hidden ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-4xl">🏢</span>
            )}
            
            {isEditMode && (
              <div className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold">
                Лого засах
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ТОЛГОЙ МЭДЭЭЛЭЛ & РЕЖИМ СОЛИХ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {formData.company_name || "Компанийн нэр"}
          </h1>
          {formData.tagline && <p className="text-gray-500 mt-1 text-sm font-medium">{formData.tagline}</p>}
        </div>
        <div>
          {!isEditMode ? (
            <button
              type="button"
              disabled={showLoader}
              onClick={() => setIsEditMode(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <span>✏️</span> Мэдээлэл засах
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={showLoader}
                onClick={handleCancel}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition disabled:opacity-50"
              >
                Цуцлах
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-2xl font-bold text-sm shadow-sm ${
          message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
        }`}>
          {message.text}
        </div>
      )}

      {/* ҮНДСЭН ХАРАГДАЦ / ФОРМ */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* А: Ерөнхий мэдээлэл карт */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
            <span>📝</span> Ерөнхий мэдээлэл
          </h3>
          
          {isEditMode ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Компанийн нэр *</label>
                  <input
                    type="text" required value={formData.company_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Товч уриа (Tagline)</label>
                  <input
                    type="text" value={formData.tagline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Компанийн тухай</label>
                <textarea
                  rows={4} value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Үйл ажиллагааны чиглэл</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white transition"
                  >
                    <option>Технологи, Мэдээллийн технологи</option>
                    <option>Банк, Санхүү, Даатгал</option>
                    <option>Барилга, Үл хөдлөх хөрөнгө</option>
                    <option>Боловсрол, Сургалт</option>
                    <option>Худалдаа, Үйлчилгээ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ажилтны тоо</label>
                  <select
                    value={formData.company_size}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company_size: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white transition"
                  >
                    <option>1-10 ажилтан</option>
                    <option>11-50 ажилтан</option>
                    <option>51-200 ажилтан</option>
                    <option>201+ ажилтан</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">{formData.industry}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">👥 {formData.company_size}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Компанийн тухай</h4>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {formData.description || "Танилцуулга мэдээлэл оруулаагүй байна."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Б: Холбоо барих карт */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
            <span>📞</span> Холбоо барих & Холбоосууд
          </h3>

          {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Утасны дугаар</label>
                  <input
                    type="text" value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Вэбсайт линк</label>
                  <input
                    type="url" value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Facebook хуудас</label>
                  <input
                    type="url" value={formData.facebook_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, facebook_url: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">LinkedIn хуудас</label>
                  <input
                    type="url" value={formData.linkedin_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Нэвтрэх имэйл</label>
                <input type="email" disabled value={formData.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Имэйл хаяг</span>
                  <span className="text-sm font-semibold text-gray-800">{formData.email}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Утас</span>
                  <span className="text-sm font-semibold text-gray-800">{formData.phone || "—"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Цахим хуудас</span>
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline block">{formData.website}</a>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Сошиал холбоос</span>
                  <div className="flex gap-3 mt-1">
                    {formData.facebook_url ? (
                      <a href={formData.facebook_url} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">Facebook</a>
                    ) : null}
                    {formData.linkedin_url ? (
                      <a href={formData.linkedin_url} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition">LinkedIn</a>
                    ) : null}
                    {!formData.facebook_url && !formData.linkedin_url && <span className="text-sm text-gray-400">—</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ХАДГАЛАХ ТОВЧ */}
        {isEditMode && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={showLoader}
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-950 hover:bg-gray-900 text-white font-bold text-sm rounded-2xl transition shadow-md disabled:opacity-50 active:scale-[0.98]"
            >
              Өөрчлөлтийг хадгалах 💾
            </button>
          </div>
        )}
      </form>
    </div>
  )
}