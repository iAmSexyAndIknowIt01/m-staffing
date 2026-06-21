"use client"

import { useEffect, useState, Suspense } from "react"
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

const initialAvailability = {
  monday: { enabled: false, from: "", to: "" },
  tuesday: { enabled: false, from: "", to: "" },
  wednesday: { enabled: false, from: "", to: "" },
  thursday: { enabled: false, from: "", to: "" },
  friday: { enabled: false, from: "", to: "" },
  saturday: { enabled: false, from: "", to: "" },
  sunday: { enabled: false, from: "", to: "" },
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

  // ========================================
  // DATA STATE
  // ========================================
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState<{ technical: string[]; languages: string[] }>({
    technical: [],
    languages: [],
  })
  const [experience, setExperience] = useState<Experience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [availability, setAvailability] = useState(initialAvailability)

  // ========================================
  // FETCH APPLICANT PROFILE
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
          setFullName(result.profile.full_name || "")
          setEmail(result.profile.email || "")
          setPhone(result.profile.phone || "")
          setBio(result.profile.bio || "")
          setSkills(result.profile.skills || { technical: [], languages: [] })
          setExperience(Array.isArray(result.profile.experience) ? result.profile.experience : [])
          setEducation(Array.isArray(result.profile.education) ? result.profile.education : [])
          
          // Дата дутуу ирэхээс сэргийлж нэгтгэх (Deep Merge fallback)
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

    fetchProfile()
  }, [applicantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="h-10 w-10 border-b-2 border-indigo-600 rounded-full animate-spin" />
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
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">Ажил горилогчийн профайл</h1>
        <p className="text-sm text-gray-400 mt-1">Ирүүлсэн анкетын дэлгэрэнгүй мэдээлэл</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT PANEL - ХУВИЙН МЭДЭЭЛЭЛ */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 self-start">
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-50">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-3">
              {fullName ? fullName.charAt(0) : "👤"}
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{fullName || "Нэргүй"}</h3>
            <p className="text-xs text-gray-400">Ажил хайгч</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Бүтэн нэр</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {fullName || "-"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Утас</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {phone || "-"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Имэйл</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-800 font-medium">
              {email || "-"}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - CV МЭДЭЭЛЛҮҮД */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {/* BIO */}
          <div>
            <label className="text-sm font-bold block mb-2">🚀 Товч танилцуулга (Bio)</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm border border-gray-100 text-gray-700 min-h-20 whitespace-pre-wrap">
              {bio || "Танилцуулга бичээгүй байна."}
            </div>
          </div>

          {/* SKILLS */}
          <div>
            <label className="text-sm font-bold block mb-2">🛠️ Ур чадвар</label>
            <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Техникийн ур чадвар</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.technical && skills.technical.length > 0 ? (
                    skills.technical.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-700">{skill}</span>
                    ))
                  ) : <span className="text-xs text-gray-400">Байхгүй</span>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Хэлний мэдлэг</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.languages && skills.languages.length > 0 ? (
                    skills.languages.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-700">{skill}</span>
                    ))
                  ) : <span className="text-xs text-gray-400">Байхгүй</span>}
                </div>
              </div>
            </div>
          </div>

          {/* EXPERIENCE */}
          <div>
            <label className="text-sm font-bold block mb-2">💼 Ажлын туршлага</label>
            {experience.length > 0 ? (
              <div className="space-y-3">
                {experience.map((item, idx) => (
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

          {/* EDUCATION */}
          <div>
            <label className="text-sm font-bold block mb-2">🎓 Боловсрол</label>
            {education.length > 0 ? (
              <div className="space-y-3">
                {education.map((item, idx) => (
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

          {/* AVAILABILITY (ЗАСВАР ОРСОН ХЭСЭГ) */}
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
                // optional chaining (?.) болон fallback хоосон объект ашиглан undefined болохоос сэргийлэв
                const currentAvailability = availability || initialAvailability
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