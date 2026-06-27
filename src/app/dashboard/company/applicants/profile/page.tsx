"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"

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

type AvailabilityDay = {
  enabled: boolean
  from: string
  to: string
}

type Availability = {
  monday: AvailabilityDay
  tuesday: AvailabilityDay
  wednesday: AvailabilityDay
  thursday: AvailabilityDay
  friday: AvailabilityDay
  saturday: AvailabilityDay
  sunday: AvailabilityDay
}

type ProfileDataType = {
  fullName: string
  email: string
  phone: string
  bio: string
  avatarUrl: string
  skills: { technical: string[]; languages: string[] }
  experience: Experience[]
  education: Education[]
  availability: Availability
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

const initialProfileState: ProfileDataType = {
  fullName: "",
  email: "",
  phone: "",
  bio: "",
  avatarUrl: "",
  skills: { technical: [], languages: [] },
  experience: [],
  education: [],
  availability: initialAvailability
}

export default function ApplicantProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-100">
        <div className="h-10 w-10 border-b-2 border-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ApplicantProfileContent />
    </Suspense>
  )
}

function ApplicantProfileContent() {
  const searchParams = useSearchParams()
  const applicantId = searchParams.get("id")


  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 💡 ШИНЭЧЛЭЛТ: Олон жижиг state-үүдийг нэг объект болгов
  const [profile, setProfile] = useState<ProfileDataType>(initialProfileState)

  const viewRecorded = useRef(false)

  // ========================================
  // FETCH APPLICANT PROFILE & RECORD VIEW
  // ========================================
  useEffect(() => {
    async function fetchProfile() {
      if (!applicantId) {
        setError("Ажил горилогчийн ID олдсонгүй.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/company/staffprofile?id=${applicantId}`)
        const result = await response.json()

        if (!response.ok) throw new Error(result.error || "Датаг уншиж чадсангүй")

        if (result.profile) {
          // 💡 ШИНЭЧЛЭЛТ: Бүх датаг ганцхан удаа set хийснээр re-render маш багасна
          setProfile({
            fullName: result.profile.full_name || "",
            email: result.profile.email || "",
            phone: result.profile.phone || "",
            bio: result.profile.bio || "",
            avatarUrl: result.profile.avatar_url || "",
            skills: result.profile.skills || { technical: [], languages: [] },
            experience: Array.isArray(result.profile.experience) ? result.profile.experience : [],
            education: Array.isArray(result.profile.education) ? result.profile.education : [],
            availability: {
              ...initialAvailability,
              ...(result.profile.availability || {})
            }
          })

          // Үзэлтийг бүртгэх
          if (!viewRecorded.current) {
            viewRecorded.current = true
            
            await fetch("/api/company/cvView", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ staffId: applicantId }),
            })
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [applicantId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
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
          Түр хүлээнэ үү...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto mt-8 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
        ⚠️ Алдаа гарлаа: {error}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Ажил горилогчийн профайл</h1>
        <p className="text-sm text-gray-400 mt-1">Ирүүлсэн анкетын дэлгэрэнгүй мэдээлэл</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 self-start">
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-50">
            <div className="w-32 h-32 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-100 shadow-inner">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-4xl font-black text-indigo-600">
                  {profile.fullName ? profile.fullName.charAt(0) : "👤"}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-800 text-lg mt-3">{profile.fullName || "Нэргүй"}</h3>
            <p className="text-xs text-gray-400">Ажил хайгч ажилтан</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Бүтэн нэр</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {profile.fullName || "-"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Утас</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {profile.phone || "-"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Имэйл</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {profile.email || "-"}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <label className="text-sm font-bold block mb-2">🚀 Товч танилцуулга (Bio)</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-700 min-h-20 whitespace-pre-wrap">
              {profile.bio || "Танилцуулга бичээгүй байна."}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold block mb-2">🛠️ Ур чадвар</label>
            <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Техникийн ур чадвар</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.technical && profile.skills.technical.length > 0 ? (
                    profile.skills.technical.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-700">{skill}</span>
                    ))
                  ) : <span className="text-xs text-gray-400">Байхгүй</span>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Хэлний мэдлэг</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.languages && profile.skills.languages.length > 0 ? (
                    profile.skills.languages.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-700">{skill}</span>
                    ))
                  ) : <span className="text-xs text-gray-400">Байхгүй</span>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold block mb-2">💼 Ажлын туршлага</label>
            {profile.experience.length > 0 ? (
              <div className="space-y-3">
                {profile.experience.map((item, idx) => (
                  <div key={idx} className="border rounded-2xl p-5 bg-gray-50/30 border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{item.position}</h4>
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">{item.company}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
                        {item.startDate} — {item.endDate || "Одоог хүртэл"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-3 bg-white p-3 rounded-xl border border-gray-50 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-2xl p-6 text-center text-gray-400 text-sm bg-gray-50">
                Ажлын туршлага оруулаагүй байна.
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-bold block mb-2">🎓 Боловсрол</label>
            {profile.education.length > 0 ? (
              <div className="space-y-3">
                {profile.education.map((item, idx) => (
                  <div key={idx} className="border rounded-2xl p-5 bg-gray-50/30 border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{item.school}</h4>
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                          {item.degree} {item.field ? `— ${item.field}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${item.isCurrent ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 bg-gray-100'}`}>
                        {item.isCurrent ? "Одоо суралцаж буй" : `${item.graduationYear} онд төгссөн`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-2xl p-6 text-center text-gray-400 text-sm bg-gray-50">
                Боловсролын мэдээлэл оруулаагүй байна.
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-bold block mb-1">🕒 Ажиллах боломжтой цаг</label>
            <div className="space-y-2.5 mt-2">
              {[
                ["monday", "Даваа"],
                ["tuesday", "Мягмар"],
                ["wednesday", "Лхагва"],
                ["thursday", "Пүрэв"],
                ["friday", "Баасан"],
                ["saturday", "Бямба"],
                ["sunday", "Ням"],
              ].map(([key, label]) => {
                const currentAvailability = profile.availability || initialAvailability
                const day = currentAvailability[key as keyof typeof initialAvailability] || { enabled: false, from: "", to: "" }
                
                return (
                  <div key={key} className={`border rounded-xl px-4 py-3 flex items-center justify-between text-sm ${day?.enabled ? "border-indigo-100 bg-indigo-50/30" : "border-gray-50 bg-gray-50/50"}`}>
                    <span className="font-semibold text-gray-700">{label}</span>
                    {day?.enabled ? (
                      <div className="flex items-center gap-2 font-bold text-indigo-600">
                        <span>{day?.from}</span>
                        <span className="text-gray-400">→</span>
                        <span>{day?.to}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Амарна</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}