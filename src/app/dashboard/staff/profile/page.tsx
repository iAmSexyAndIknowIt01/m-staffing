"use client"

import {
  AlertTriangle,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Phone,
  User,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { uploadImage } from "@/lib/uploadImage"
import BioModal from "@/components/profile/modals/BioModal"
import SkillsModal from "@/components/profile/modals/SkillsModal"
import ExperienceModal from "@/components/profile/modals/ExperienceModal"
import EducationModal from "@/components/profile/modals/EducationModal"
import { getErrorMessage } from "@/lib/errors"
import LoadingLayout from "@/components/common/LoadingLayout"

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

type DayKey = keyof typeof initialAvailability
type DayAvailability = { enabled: boolean; from: string; to: string }

const DAYS: [DayKey, string][] = [
  ["monday", "Даваа"],
  ["tuesday", "Мягмар"],
  ["wednesday", "Лхагва"],
  ["thursday", "Пүрэв"],
  ["friday", "Баасан"],
  ["saturday", "Бямба"],
  ["sunday", "Ням"],
]

const GENDER_LABELS: Record<string, string> = { male: "Эрэгтэй", female: "Эмэгтэй" }

// Профайлын бүрэн байдал: ажил олгогчид харагдах гол хэсгүүдээр тооцно
function getCompleteness(p: {
  fullName: string
  phone: string
  bio: string
  avatarUrl: string
  gender: string
  skills: { technical: string[]; languages: string[] }
  experience: unknown[]
  education: unknown[]
  enabledDays: number
}) {
  const checks: [boolean, string][] = [
    [!!p.fullName.trim(), "нэр"],
    [!!p.phone.trim(), "утас"],
    [!!p.avatarUrl, "зураг"],
    [!!p.gender, "хүйс"],
    [!!p.bio.trim(), "танилцуулга"],
    [p.skills.technical.length + p.skills.languages.length > 0, "ур чадвар"],
    [p.experience.length > 0, "ажлын туршлага"],
    [p.education.length > 0, "боловсрол"],
    [p.enabledDays > 0, "ажиллах цаг"],
  ]
  const done = checks.filter(([ok]) => ok).length
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  }
}

const inputClass = (hasError: boolean) =>
  `w-full h-11 px-4 bg-white rounded-xl text-sm outline-none border transition ${
    hasError ? "border-red-400 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-orange-500"
  }`

function Section({
  icon: Icon,
  title,
  description,
  error,
  action,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  error?: string
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
}) {
  return (
    <section
      className={`bg-white rounded-3xl border shadow-sm p-5 sm:p-6 ${error ? "border-red-300" : "border-gray-100"}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition"
          >
            <Pencil className="w-3.5 h-3.5" /> {action.label}
          </button>
        )}
      </div>
      {children}
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-400">{text}</p>
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</h4>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 border border-gray-200 text-gray-800">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Оруулаагүй байна</p>
      )}
    </div>
  )
}

function InfoLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Icon className="w-4 h-4 shrink-0 text-gray-400" />
      <dt className="sr-only">{label}</dt>
      <dd className={`min-w-0 truncate ${value ? "text-gray-700" : "text-gray-400"}`}>{value || `${label} оруулаагүй`}</dd>
    </div>
  )
}

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition ${checked ? "bg-orange-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  )
}

export default function StaffProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
  const [avatarUrl, setAvatarUrl] = useState("")
  const [gender, setGender] = useState("") 
  const [agreement, setAgreement] = useState(false) 
  

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
  // Дахин ачаалах (хадгалсны дараа гэх мэт) — loader харуулна
  async function fetchProfile() {
    setLoading(true)
    await loadProfile()
  }

  // Анх mount болоход дуудна. loading аль хэдийн true тул await-аас өмнө state өөрчлөхгүй
  async function loadProfile() {
    try {
      const response = await fetch("/api/staff/profile")
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      if (result.profile) {
        setFullName(result.profile.full_name || "")
        setEmail(result.profile.email || "")
        setPhone(result.profile.phone || "")
        setBio(result.profile.bio || "")
        setAvatarUrl(result.profile.avatar_url || "")
        setGender(result.profile.gender || "") 
        setAgreement(!!result.profile.agreement)
        
        setSkills({
          technical: result.profile.skills?.technical || [],
          languages: result.profile.skills?.languages || []
        })
        
        setExperience(Array.isArray(result.profile.experience) ? result.profile.experience : [])
        setEducation(Array.isArray(result.profile.education) ? result.profile.education : [])
        
        setAvailability({
          ...initialAvailability,
          ...(result.profile.availability || {})
        })
      }
    } catch (err) {
      setError(getErrorMessage(err))
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
      const publicUrl = await uploadImage(file, "avatars")

      setAvatarUrl(publicUrl)
      setMessage("Зураг түр ачаалагдлаа. 'Профайл хадгалах' товчийг дарж баталгаажуулна уу.")
    } catch (err) {
      setError(getErrorMessage(err, "Зураг хуулахад алдаа гарлаа."))
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ========================================
  // VALIDATION FORM
  // ========================================
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
    loadProfile()
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
          avatarUrl,
          skills,
          experience,
          education, 
          availability,
          gender,
          agreement,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      await fetchProfile()
      setIsEditMode(false)
      setMessage("Профайл амжилттай хадгалагдлаа")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setError(getErrorMessage(err))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  const enabledDays = DAYS.filter(([key]) => availability?.[key]?.enabled)
  const completeness = getCompleteness({ fullName, phone, bio, avatarUrl, gender, skills, experience, education, enabledDays: enabledDays.length })
  const errorCount = Object.values(validationErrors).filter(Boolean).length

  const cancelEdit = async () => {
    await fetchProfile()
    setValidationErrors({})
    setError(null)
    setIsEditMode(false)
  }

  const updateDay = (key: DayKey, patch: Partial<DayAvailability>) => {
    const current = availability?.[key] || { enabled: false, from: "", to: "" }
    setAvailability({ ...initialAvailability, ...availability, [key]: { ...current, ...patch } })
    setValidationErrors((prev) => ({ ...prev, availability: "" }))
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 sm:space-y-6 pb-6">
      {/* ТОЛГОЙ */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Миний профайл</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode ? "Мэдээллээ шинэчлээд хадгална уу." : "Ажил олгогчдод харагдах таны мэдээлэл"}
          </p>
        </div>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition"
          >
            <Pencil className="w-4 h-4" /> <span>Засах</span>
          </button>
        )}
      </div>

      {message && (
        <div role="status" className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {error}
            {errorCount > 0 && ` (${errorCount} талбар)`}
          </span>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      <form onSubmit={handleSave} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* ЗҮҮН: ХУРААНГУЙ */}
        <aside className="lg:sticky lg:top-6 space-y-5 sm:space-y-6">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-20 bg-linear-to-r from-orange-500 to-amber-400" />
            <div className="px-5 sm:px-6 pb-6 -mt-12 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-orange-50 ring-4 ring-white dark:ring-(--dk-surface) overflow-hidden flex items-center justify-center shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${fullName || "Ажил хайгч"} зураг`} className="w-full h-full object-cover" />
                  ) : fullName ? (
                    <span className="text-3xl font-bold text-orange-600">{fullName.charAt(0)}</span>
                  ) : (
                    <User className="w-10 h-10 text-orange-400" strokeWidth={1.5} />
                  )}
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Зураг солих"
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-700 text-white ring-4 ring-white dark:ring-(--dk-surface) flex items-center justify-center shadow transition disabled:opacity-60"
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900 break-words">{fullName || "Таны нэр"}</h2>
              <p className="text-sm text-gray-500">Ажил хайгч</p>

              <span
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  agreement ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {agreement ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {agreement ? "Ажил олгогчдод харагдана" : "Ажил олгогчдод нуугдсан"}
              </span>
            </div>

            {!isEditMode && (
              <dl className="border-t border-gray-100 px-5 sm:px-6 py-4 space-y-3 text-sm">
                <InfoLine icon={Phone} label="Утас" value={phone} />
                <InfoLine icon={Mail} label="Имэйл" value={email} />
                <InfoLine icon={UserRound} label="Хүйс" value={GENDER_LABELS[gender]} />
              </dl>
            )}
          </section>

          {/* ПРОФАЙЛЫН БҮРЭН БАЙДАЛ */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Профайлын бүрэн байдал</h3>
              <span className={`text-sm font-bold ${completeness.percent === 100 ? "text-emerald-600" : "text-orange-600"}`}>
                {completeness.percent}%
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completeness.percent === 100 ? "bg-emerald-500" : "bg-orange-500"}`}
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {completeness.missing.length > 0 ? (
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Дутуу: {completeness.missing.join(", ")}
              </p>
            ) : (
              <p className="mt-3 text-xs text-emerald-600">Профайл бүрэн бөглөгдсөн байна.</p>
            )}
          </section>
        </aside>

        {/* БАРУУН: ДЭЛГЭРЭНГҮЙ */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* ХУВИЙН МЭДЭЭЛЭЛ (засах горимд) */}
          {isEditMode && (
            <Section icon={User} title="Хувийн мэдээлэл">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Бүтэн нэр" htmlFor="profile-fullname" error={validationErrors.fullName} className="sm:col-span-2">
                  <input
                    id="profile-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setValidationErrors((prev) => ({ ...prev, fullName: "" }))
                    }}
                    className={inputClass(!!validationErrors.fullName)}
                  />
                </Field>
                <Field label="Утас" htmlFor="profile-phone" error={validationErrors.phone}>
                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setValidationErrors((prev) => ({ ...prev, phone: "" }))
                    }}
                    className={inputClass(!!validationErrors.phone)}
                  />
                </Field>
                <Field label="Хүйс" htmlFor="profile-gender">
                  <select
                    id="profile-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputClass(false)}
                  >
                    <option value="">Сонгох...</option>
                    <option value="male">Эрэгтэй</option>
                    <option value="female">Эмэгтэй</option>
                  </select>
                </Field>
                <Field label="Имэйл" htmlFor="profile-email" hint="Нэвтрэх имэйлийг энд өөрчлөх боломжгүй." className="sm:col-span-2">
                  <input id="profile-email" type="email" value={email} readOnly className={`${inputClass(false)} text-gray-500 cursor-not-allowed`} />
                </Field>
              </div>

              <label
                htmlFor="profile-agreement"
                className={`mt-4 flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  agreement ? "border-orange-200 bg-orange-50/60" : "border-gray-200 bg-gray-50"
                }`}
              >
                <input
                  id="profile-agreement"
                  type="checkbox"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                  className="w-5 h-5 mt-0.5 shrink-0 accent-orange-600"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  Цагийн ажилтан хайж байгаа ажил олгогчдод миний профайлыг ил тод харуулахыг зөвшөөрч байна.
                </span>
              </label>
            </Section>
          )}

          {/* ТАНИЛЦУУЛГА */}
          <Section
            icon={UserRound}
            title="Товч танилцуулга"
            error={validationErrors.bio}
            action={isEditMode ? { label: bio ? "Засах" : "Нэмэх", onClick: () => setActiveModal("bio") } : undefined}
          >
            {bio ? (
              <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed whitespace-pre-line break-words">{bio}</p>
            ) : (
              <EmptyHint text="Өөрийгөө товч танилцуулна уу." />
            )}
          </Section>

          {/* УР ЧАДВАР */}
          <Section
            icon={Wrench}
            title="Ур чадвар"
            error={validationErrors.skills}
            action={isEditMode ? { label: "Засах", onClick: () => setActiveModal("skills") } : undefined}
          >
            <div className="space-y-4">
              <ChipGroup title="Техникийн ур чадвар" items={skills.technical} />
              <ChipGroup title="Хэлний мэдлэг" items={skills.languages} />
            </div>
          </Section>

          {/* АЖЛЫН ТУРШЛАГА */}
          <Section
            icon={Briefcase}
            title="Ажлын туршлага"
            error={validationErrors.experience}
            action={isEditMode ? { label: experience.length ? "Засах" : "Нэмэх", onClick: () => setActiveModal("experience") } : undefined}
          >
            {experience.length > 0 ? (
              <ol className="relative space-y-5 before:absolute before:left-1.75 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                {experience.map((item, idx) => (
                  <li key={idx} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 w-3.75 h-3.75 rounded-full bg-white border-2 border-orange-500" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 break-words">{item.position}</h4>
                        <p className="text-sm text-orange-600 font-medium break-words">{item.company}</p>
                      </div>
                      <span className="text-xs text-gray-500 sm:shrink-0 sm:pt-0.5">
                        {item.startDate} — {item.endDate || "Одоог хүртэл"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{item.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyHint text="Ажлын туршлага оруулаагүй байна." />
            )}
          </Section>

          {/* БОЛОВСРОЛ */}
          <Section
            icon={GraduationCap}
            title="Боловсрол"
            error={validationErrors.education}
            action={isEditMode ? { label: education.length ? "Засах" : "Нэмэх", onClick: () => setActiveModal("education") } : undefined}
          >
            {education.length > 0 ? (
              <ul className="space-y-3">
                {education.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 break-words">{item.school}</h4>
                      <p className="text-sm text-gray-600 break-words">
                        {item.degree}
                        {item.field ? ` — ${item.field}` : ""}
                      </p>
                      <span
                        className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${
                          item.isCurrent ? "text-orange-700 bg-orange-50" : "text-gray-500 bg-gray-100"
                        }`}
                      >
                        {item.isCurrent ? "Одоо суралцаж буй" : `${item.graduationYear} онд төгссөн`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint text="Боловсролын мэдээлэл оруулаагүй байна." />
            )}
          </Section>

          {/* АЖИЛЛАХ БОЛОМЖТОЙ ЦАГ */}
          <Section
            icon={Clock}
            title="Ажиллах боломжтой цаг"
            description={isEditMode ? "Ажиллах өдрөө асааж, цагаа оруулна уу." : undefined}
            error={validationErrors.availability}
          >
            {isEditMode ? (
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
                {DAYS.map(([key, label]) => {
                  const day = availability?.[key] || { enabled: false, from: "", to: "" }
                  return (
                    <div key={key} className={`p-3 sm:p-4 transition ${day.enabled ? "bg-orange-50/40" : "bg-white"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center justify-between sm:w-40 sm:shrink-0">
                          <span className="font-medium text-gray-800">{label}</span>
                          <Switch
                            checked={day.enabled}
                            label={`${label} гариг ажиллах`}
                            onChange={(checked) => updateDay(key, { enabled: checked })}
                          />
                        </div>
                        {day.enabled ? (
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:gap-3">
                            <input
                              type="time"
                              aria-label={`${label} эхлэх цаг`}
                              value={day.from}
                              onChange={(e) => updateDay(key, { from: e.target.value })}
                              className="w-full sm:w-36 h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input
                              type="time"
                              aria-label={`${label} дуусах цаг`}
                              value={day.to}
                              onChange={(e) => updateDay(key, { to: e.target.value })}
                              className="w-full sm:w-36 h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Амарна</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : enabledDays.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DAYS.map(([key, label]) => {
                  const day = availability?.[key]
                  return (
                    <li
                      key={key}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                        day?.enabled ? "bg-orange-50 text-gray-900" : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      <span className="font-medium">{label}</span>
                      <span className={day?.enabled ? "font-semibold text-orange-700" : ""}>
                        {day?.enabled ? `${day.from || "--:--"} — ${day.to || "--:--"}` : "Амарна"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyHint text="Ажиллах боломжтой цагаа оруулаагүй байна." />
            )}
          </Section>

          {/* ХАДГАЛАХ — утсан дээр доод талд бэхлэгдэнэ */}
          {isEditMode && (
            <div
              data-mobile-bottom-bar
              className="fixed inset-x-0 bottom-0 z-40 sm:static sm:z-auto bg-white/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t border-gray-100 sm:border-0 px-4 py-3 sm:p-0 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] sm:shadow-none"
            >
              <div className="flex gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 sm:flex-none h-11 px-5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-50"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  className="flex-2 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white shadow-sm transition"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
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