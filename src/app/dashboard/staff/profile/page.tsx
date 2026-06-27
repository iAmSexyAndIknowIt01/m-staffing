"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase" // Supabase импорт нэмэв
import BioModal from "@/components/profile/modals/BioModal"
import SkillsModal from "@/components/profile/modals/SkillsModal"
import ExperienceModal from "@/components/profile/modals/ExperienceModal"
import EducationModal from "@/components/profile/modals/EducationModal"

type Experience = {
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

type Education = {
  school: string
  degree: string
  field: string
  graduationYear: string
  isCurrent?: boolean 
}

const initialAvailability = {
  monday: { enabled: false, from: "", to: "" },
  tuesday: { enabled: false, from: "", to: "" },
  wednesday: { enabled: false, from: "", to: "" },
  thursday: { enabled: false, from: "", to: "" },
  friday: { enabled: false, from: "", to: "" },
  saturday: { enabled: false, from: "", to: "" },
  sunday: { enabled: false, from: "", to: "" },
}

export default function StaffProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null) // Зураг сонгох ref
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false) // Зураг хуулж буй төлөв
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // ========================================
  // FORM STATE
  // ========================================
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("") // Зургийн URL state

  const [skills, setSkills] = useState<{
    technical: string[]
    languages: string[]
  }>({
    technical: [],
    languages: [],
  })

  const [experience, setExperience] = useState<Experience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [availability, setAvailability] = useState(initialAvailability)

  // ========================================
  // FETCH PROFILE
  // ========================================
  async function fetchProfile() {
    try {
      setLoading(true)
      const response = await fetch("/api/staff/profile")
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      if (result.profile) {
        setFullName(result.profile.full_name || "")
        setEmail(result.profile.email || "")
        setPhone(result.profile.phone || "")
        setBio(result.profile.bio || "")
        setAvatarUrl(result.profile.avatar_url || "") // Зургийн URL оноох
        setSkills(result.profile.skills || { technical: [], languages: [] })
        setExperience(Array.isArray(result.profile.experience) ? result.profile.experience : [])
        setEducation(Array.isArray(result.profile.education) ? result.profile.education : [])
        
        setAvailability({
          ...initialAvailability,
          ...(result.profile.availability || {})
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // AVATAR UPLOAD HANDLER
  // ========================================
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setUploadingAvatar(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Supabase storage руу зураг хуулах (Bucket нэр: "avatars")
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl) // Шинэ зургийн URL-ийг state-д хадгалах
      setMessage("Зураг түр ачаалагдлаа. 'Профайл хадгалах' товчийг дарж баталгаажуулна уу.")
    } catch (err: any) {
      setError(err.message || "Зураг хуулахад алдаа гарлаа.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  function validateForm() {
    const errors: Record<string, string> = {}

    if (!fullName.trim()) errors.fullName = "Бүтэн нэрээ оруулна уу"
    if (!email.trim()) {
      errors.email = "Имэйлээ оруулна уу"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Имэйл хаяг буруу байна"
    }
    if (!phone.trim()) errors.phone = "Утасны дугаараа оруулна уу"
    if (!bio.trim()) errors.bio = "Bio бөглөнө үү"
    if (skills.technical.length === 0 && skills.languages.length === 0) {
      errors.skills = "Ур чадвараа оруулна уу"
    }
    if (experience.length === 0) {
      errors.experience = "Ажлын туршлагаа оруулна уу"
    }
    if (education.length === 0) errors.education = "Боловсролын мэдээллээ оруулна уу"

    const currentAvailability = availability || initialAvailability
    const enabledDays = Object.values(currentAvailability).filter((day) => day?.enabled)
    
    if (enabledDays.length === 0) errors.availability = "Дор хаяж нэг ажиллах өдөр сонгоно уу"

    enabledDays.forEach((day) => {
      if (!day.from || !day.to) errors.availability = "Ажиллах цагийг бүрэн оруулна уу"
      if (day.from && day.to && day.from >= day.to) {
        errors.availability = "Эхлэх цаг дуусах цагаас бага байх ёстой"
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ========================================
  // SAVE PROFILE
  // ========================================
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      setError("Улаанаар тэмдэглэгдсэн мэдээллүүдийг шалгана уу.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const response = await fetch("/api/staff/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          bio,
          avatarUrl, // Бааз руу шинэ зургийн URL хамт илгээнэ
          skills,
          experience,
          education, 
          availability,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      await fetchProfile()
      setIsEditMode(false)
      setMessage("Профайл амжилттай хадгалагдлаа 🎉")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
          <div className="relative flex items-center justify-center h-32 w-32">
            
            {/* 1. Ард талын зөөлөн гэрэлтэлт (Glow effect) */}
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
          
          {/* Доор уншиж буйг илтгэх жижиг текст */}
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
            Түр хүлээнэ үү...
          </p>
        </div>
      )
    }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Миний профайл</h1>
          <p className="text-sm text-gray-400 mt-1">Ажил олгогчдод харагдах таны мэдээлэл</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (isEditMode) {
              await fetchProfile()
              setValidationErrors({})
              setError(null)
              setIsEditMode(false)
            } else {
              setIsEditMode(true)
            }
          }}
          className="px-5 py-2 rounded-2xl text-sm font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          {isEditMode ? "Харах горим" : "Засах"}
        </button>
      </div>

      {message && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">⚠️ {error}</div>}

      {/* Далд байрлах File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* FORM */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          
          {/* PROFILE AVATAR UPLOAD SECTION */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-50">
            {/* Хэмжээг w-24 h-24 -> w-32 h-32 болгож томруулав */}
            <div 
              onClick={() => isEditMode && !uploadingAvatar && fileInputRef.current?.click()}
              className={`w-45 h-45 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border border-gray-100 ${isEditMode ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                /* Текст иконы хэмжээг мөн text-3xl -> text-4xl болгож томруулав */
                <span className="text-4xl font-black text-indigo-600">
                  {fullName ? fullName.charAt(0) : "👤"}
                </span>
              )}
              
              {isEditMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 text-[10px] text-white font-bold backdrop-blur-xs px-2">
                  {uploadingAvatar ? "Уншиж байна..." : "Зураг солих 📸"}
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-800 text-lg mt-3">{fullName || "Таны нэр"}</h3>
            <p className="text-xs text-gray-400">Ажил хайгч ажилтан</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Бүтэн нэр</label>
            <input
              type="text"
              value={fullName}
              disabled={!isEditMode}
              onChange={(e) => {
                setFullName(e.target.value)
                setValidationErrors((prev) => ({ ...prev, fullName: "" }))
              }}
              className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none ${validationErrors.fullName ? "border border-red-500 bg-red-50" : "border border-gray-200"}`}
            />
            {validationErrors.fullName && <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Утас</label>
            <input
              type="text"
              value={phone}
              disabled={!isEditMode}
              onChange={(e) => {
                setPhone(e.target.value)
                setValidationErrors((prev) => ({ ...prev, phone: "" }))
              }}
              className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm ${validationErrors.phone ? "border border-red-500 bg-red-50" : "border border-gray-200"}`}
            />
            {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Имэйл</label>
            <input
              type="email"
              value={email}
              disabled={!isEditMode}
              onChange={(e) => {
                setEmail(e.target.value)
                setValidationErrors((prev) => ({ ...prev, email: "" }))
              }}
              className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm ${validationErrors.email ? "border border-red-500 bg-red-50" : "border border-gray-200"}`}
            />
            {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {/* BIO */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">🚀 Bio</label>
              {isEditMode && (
                <button type="button" onClick={() => setActiveModal("bio")} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center">✏️</button>
              )}
            </div>
            <textarea
              rows={3}
              value={bio}
              disabled
              className={`mt-2 w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm ${validationErrors.bio ? "border border-red-500 bg-red-50" : "border border-gray-200"}`}
            />
            {validationErrors.bio && <p className="text-red-500 text-xs mt-1">{validationErrors.bio}</p>}
          </div>

          {/* SKILLS */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">🛠️ Ур чадвар</label>
              {isEditMode && (
                <button type="button" onClick={() => setActiveModal("skills")} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center">✏️</button>
              )}
            </div>
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50 mt-2">
              <div className="mb-5">
                <h4 className="font-semibold mb-3">Техникийн ур чадвар</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.technical.map((skill) => (
                    <span key={skill} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Хэлний мэдлэг</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.languages.map((skill) => (
                    <span key={skill} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
            {validationErrors.skills && <p className="text-red-500 text-xs mt-1">{validationErrors.skills}</p>}
          </div>

          {/* EXPERIENCE */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">💼 Ажлын туршлага</label>
              {isEditMode && (
                <button 
                  type="button" 
                  onClick={() => setActiveModal("experience")} 
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                >
                  ✏️
                </button>
              )}
            </div>

            {experience.length > 0 ? (
              <div className="space-y-3 mt-2">
                {experience.map((item, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 bg-gray-50/50 relative border-gray-200`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{item.position}</h4>
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">{item.company}</p>
                      </div>
                      <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                        {item.startDate} — {item.endDate || "Одоог хүртэл"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-3 bg-white p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`mt-2 border border-dashed rounded-2xl p-6 text-center text-gray-400 text-sm bg-gray-50 ${validationErrors.experience ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
                Ажлын туршлага оруулаагүй байна. {isEditMode && "Туршлага удирдах товч дээр дарж оруулна уу."}
              </div>
            )}
            {validationErrors.experience && <p className="text-red-500 text-xs mt-1">{validationErrors.experience}</p>}
          </div>

          {/* EDUCATION */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">🎓 Боловсрол</label>
              {isEditMode && (
                <button 
                  type="button" 
                  onClick={() => setActiveModal("education")} 
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                >
                  ✏️
                </button>
              )}
            </div>

            {education.length > 0 ? (
              <div className="space-y-3 mt-2">
                {education.map((item, idx) => (
                  <div key={idx} className="border rounded-2xl p-5 bg-gray-50/50 relative border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{item.school}</h4>
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                          {item.degree} {item.field ? `— ${item.field}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${item.isCurrent ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 bg-gray-100'}`}>
                        {item.isCurrent ? "Одоо суралцаж буй" : `${item.graduationYear} онд төгссөн`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`mt-2 border border-dashed rounded-2xl p-6 text-center text-gray-400 text-sm bg-gray-50 ${validationErrors.education ? "border-red-500 bg-red-50" : "border-gray-200"}`}>
                Боловсролын мэдээлэл оруулаагүй байна. {isEditMode && "Боловсрол удирдах товч дээр дарж оруулна уу."}
              </div>
            )}
            {validationErrors.education && <p className="text-red-500 text-xs mt-1">{validationErrors.education}</p>}
          </div>

          {/* AVAILABILITY */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-bold">🕒 Ажиллах боломжтой цаг</label>
                <p className="text-xs text-gray-400 mt-1">Аль өдөр хэдээс хэдэн цагийн хооронд ажиллах боломжтой вэ?</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["monday", "Даваа"],
                ["tuesday", "Мягмар"],
                ["wednesday", "Лхагва"],
                ["thursday", "Пүрэв"],
                ["friday", "Баасан"],
                ["saturday", "Бямба"],
                ["sunday", "Ням"],
              ].map(([key, label]) => {
                const currentAvailability = availability || initialAvailability
                const day = currentAvailability[key as keyof typeof initialAvailability] || { enabled: false, from: "", to: "" }
                
                return (
                  <div key={key} className={`border rounded-2xl p-4 transition ${day.enabled ? "border-indigo-200 bg-indigo-50/50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center justify-between md:w-48">
                        <span className="font-semibold text-gray-800">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            disabled={!isEditMode}
                            checked={day.enabled}
                            onChange={(e) => {
                              setAvailability({
                                ...initialAvailability,
                                ...availability,
                                [key]: { ...day, enabled: e.target.checked },
                              })
                              setValidationErrors((prev) => ({ ...prev, availability: "" }))
                            }}
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 transition" />
                        </label>
                      </div>

                      {day.enabled ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <input
                            type="time"
                            disabled={!isEditMode}
                            value={day.from}
                            onChange={(e) => {
                              setAvailability({
                                ...initialAvailability,
                                ...availability,
                                [key]: { ...day, from: e.target.value },
                              })
                              setValidationErrors((prev) => ({ ...prev, availability: "" }))
                            }}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl"
                          />
                          <span className="text-gray-400">→</span>
                          <input
                            type="time"
                            disabled={!isEditMode}
                            value={day.to}
                            onChange={(e) =>
                              setAvailability({
                                ...initialAvailability,
                                ...availability,
                                [key]: { ...day, to: e.target.value },
                              })
                            }
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-200 text-gray-500">Амарна</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {validationErrors.availability && <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{validationErrors.availability}</div>}

          {/* SAVE BUTTON */}
          {isEditMode && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={saving || uploadingAvatar} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl text-sm font-bold transition">
                {saving ? "Хадгалж байна..." : "Профайл хадгалах ✨"}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* MODALS */}
      <BioModal
        open={activeModal === "bio"}
        value={bio}
        onSave={(value) => {
          setBio(value)
          setActiveModal(null)
        }}
        onClose={() => setActiveModal(null)}
      />

      <SkillsModal
        open={activeModal === "skills"}
        value={skills}
        onSave={(data) => {
          setSkills(data)
          setActiveModal(null)
        }}
        onClose={() => setActiveModal(null)}
      />

      <ExperienceModal
        open={activeModal === "experience"}
        value={experience}
        onSave={(updatedList) => {
          setExperience(updatedList)
          setValidationErrors((prev) => ({ ...prev, experience: "" }))
          setActiveModal(null)
        }}
        onClose={() => setActiveModal(null)}
      />

      <EducationModal
        open={activeModal === "education"}
        value={education} 
        onSave={(updatedList) => {
          setEducation(updatedList) 
          setValidationErrors((prev) => ({ ...prev, education: "" }))
          setActiveModal(null)
        }}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}