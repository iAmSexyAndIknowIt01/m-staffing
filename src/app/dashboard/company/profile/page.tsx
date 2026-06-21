"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase" // Supabase storage ашиглахад хэрэгтэй

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
  logo_url?: string // Логоны линк нэмэв
}

export default function CompanyProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/company/profile")
        if (!response.ok) throw new Error("Профайл мэдээллийг авч чадсангүй.")
        
        const result = await response.json()
        if (result.data) {
          setFormData((prev) => ({
            ...prev,
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
          }))
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message })
      } finally {
        setPageLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Лого файл сонгох үед Supabase Storage руу upload хийх функц
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setUploadingLogo(true)
    setMessage(null)

    try {
      // Файлын өргөтгөлийг авах (png, jpg г.м)
      const fileExt = file.name.split('.').pop()
      // Давхцахгүй байх файлын нэр үүсгэх (жишээ нь: timestamp ашиглан)
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // 1. Supabase Storage-ийн 'company-logos' bucket рүү upload хийх
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Нийтийн хандах линкийг үүсгэж авах
      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath)

      // 3. State-ийг шинэчлэх (Хадгалах товч дарахад API руу хамт илгээгдэнэ)
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }))
      setMessage({ type: "success", text: "Лого түр хадгалагдлаа. 'Өөрчлөлтийг хадгалах' товчийг дарж баталгаажуулна уу." })
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

      setMessage({ type: "success", text: "Профайл мэдээлэл амжилттай шинэчлэгдлээ! 🎉" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-gray-400 font-medium">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-3xl w-full"></div>
          <div className="h-8 bg-gray-100 rounded-xl w-1/3"></div>
          <div className="h-48 bg-gray-100 rounded-3xl w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-4 sm:px-0 pb-16">
      
      {/* 1. БРЭНДИНГ ХЭСЭГ (COVER & LOGO) */}
      <div className="relative mb-24">
        {/* Ковер зураг */}
        <div className="h-40 md:h-48 bg-linear-to-r from-indigo-500 to-purple-600 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]"></div>
          <button type="button" className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 backdrop-blur-md rounded-xl transition">
            📸 Ковер солих
          </button>
        </div>

        {/* Далд харагдах файлын оролт */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLogoUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Лого оруулах хэсэг */}
        <div className="absolute -bottom-16 left-6 md:left-10 p-1 bg-[#f8faff] rounded-3xl">
          <div 
            onClick={() => !uploadingLogo && fileInputRef.current?.click()}
            className="w-28 h-28 md:w-32 md:h-32 bg-white border-4 border-white rounded-3xl shadow-md flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer"
          >
            {formData.logo_url ? (
              <img 
                src={formData.logo_url} 
                alt="Company Logo" 
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-4xl">🏢</span>
            )}
            
            <div className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold">
              {uploadingLogo ? "Уншиж байна..." : "Лого засах"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ТОЛГОЙ МЭДЭЕЦ */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Профайл тохиргоо</h1>
        <p className="text-gray-500 mt-1 text-xs md:text-sm">
          Ажил хайгчдад харагдах танай компанийн нүүр хуудас болон мэдээлэл.
        </p>
      </div>

      {/* МЭДЭЭЛЭЛ / АЛДАА */}
      {message && (
        <div className={`p-4 mb-6 rounded-2xl font-bold text-sm shadow-sm ${
          message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
        }`}>
          {message.text}
        </div>
      )}

      {/* ҮНДСЭН ФОРМ */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* А: Ерөнхий мэдээлэл */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
            <span>📝</span> Ерөнхий мэдээлэл
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Компанийн нэр *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: Мэргэжилтэн ХХК"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Товч уриа (Tagline)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: Хамгийн хурдан өсөж буй Финтек хамт олон"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Компанийн тухай дэлгэрэнгүй</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition resize-none"
              placeholder="Компанийн үйл ажиллагаа, соёл, алсын харааны талаар ажил горилогчдод танилцуулж бичнэ үү..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Үйл ажиллагааны чиглэл</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ажилтны тоо</label>
              <select
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
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

        {/* Б: Холбоо барих болон Цахим хаяг */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
            <span>📞</span> Холбоо барих & Холбоосууд
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Утасны дугаар</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: 9911****"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Вэбсайт линк</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: https://company.mn"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facebook хуудас</label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="facebook.com/company"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn хуудас</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="linkedin.com/company"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Нэвтрэх имэйл (Өөрчлөх боломжгүй)</label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {/* ХАДГАЛАХ ТОВЧ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={actionLoading || uploadingLogo}
            className="w-full sm:w-auto px-8 py-3.5 bg-gray-950 hover:bg-gray-900 text-white font-bold text-sm rounded-2xl transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
          >
            {actionLoading ? "Түр хүлээнэ үү..." : "Өөрчлөлтийг хадгалах 💾"}
          </button>
        </div>
      </form>
    </div>
  )
}