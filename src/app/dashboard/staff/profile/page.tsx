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
  action?: { label: string; onClick: () => void; busy?: boolean }
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
        {action &&
          (action.busy ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Хадгалж байна...
            </span>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition"
            >
              <Pencil className="w-3.5 h-3.5" /> {action.label}
            </button>
          ))}
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

type SectionKey = "personal" | "avatar" | "bio" | "skills" | "experience" | "education" | "availability"

const EMPTY_DAY: DayAvailability = { enabled: false, from: "", to: "" }

// Ажиллах цагийн шалгалт (сервертэй ижил дүрэм)
function validateAvailability(value: typeof initialAvailability): string | null {
  const enabled = Object.values(value).filter((day) => day?.enabled)
  if (enabled.length === 0) return "Дор хаяж нэг ажиллах өдөр сонгоно уу."
  if (enabled.some((day) => !day.from || !day.to)) return "Ажиллах цагийг бүрэн оруулна уу."
  if (enabled.some((day) => day.from >= day.to)) return "Эхлэх цаг дуусах цагаас бага байх ёстой."
  return null
}

// Хадгалах товчнуудын мөр (хувийн мэдээлэл, ажиллах цагийн картын доор)
function CardActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2 justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-50"
      >
        Болих
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white shadow-sm transition"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </button>
    </div>
  )
}

export default function StaffProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Аль карт засагдаж / хадгалагдаж байгаа
  const [editing, setEditing] = useState<"personal" | "availability" | null>(null)
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null)
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({})
  const [activeModal, setActiveModal] = useState<"bio" | "skills" | "experience" | "education" | null>(null)

  // ========================================
  // ХАДГАЛАГДСАН ПРОФАЙЛ
  // ========================================
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [gender, setGender] = useState("")
  const [agreement, setAgreement] = useState(false)
  const [skills, setSkills] = useState<{ technical: string[]; languages: string[] }>({ technical: [], languages: [] })
  const [experience, setExperience] = useState<Experience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [availability, setAvailability] = useState(initialAvailability)

  // Засаж буй картын түр утга (Болих дарахад хаягдана)
  const [personalDraft, setPersonalDraft] = useState({ fullName: "", phone: "", gender: "", agreement: false })
  const [personalErrors, setPersonalErrors] = useState<{ fullName?: string; phone?: string }>({})
  const [availabilityDraft, setAvailabilityDraft] = useState(initialAvailability)

  // ========================================
  // FETCH PROFILE
  // ========================================
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
          languages: result.profile.skills?.languages || [],
        })
        setExperience(Array.isArray(result.profile.experience) ? result.profile.experience : [])
        setEducation(Array.isArray(result.profile.education) ? result.profile.education : [])
        setAvailability({ ...initialAvailability, ...(result.profile.availability || {}) })
      }
    } catch (err) {
      setLoadError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const flash = (text: string) => {
    setToast(text)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // ========================================
  // НЭГ КАРТЫГ ХАДГАЛАХ (PATCH)
  // ========================================
  async function saveSection(section: SectionKey, payload: Record<string, unknown>): Promise<boolean> {
    setSavingSection(section)
    setSectionErrors((prev) => ({ ...prev, [section]: undefined }))
    try {
      const response = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Хадгалахад алдаа гарлаа.")
      flash("Амжилттай хадгалагдлаа")
      return true
    } catch (err) {
      setSectionErrors((prev) => ({ ...prev, [section]: getErrorMessage(err, "Хадгалахад алдаа гарлаа.") }))
      return false
    } finally {
      setSavingSection(null)
    }
  }

  // Модалаар засах хэсгүүд: шууд харуулж хадгална, алдаа гарвал өмнөх утгыг сэргээнэ
  async function saveFromModal<T>(section: SectionKey, payload: Record<string, unknown>, next: T, prev: T, set: (v: T) => void) {
    set(next)
    setActiveModal(null)
    const ok = await saveSection(section, payload)
    if (!ok) set(prev)
  }

  // ========================================
  // ЗУРАГ
  // ========================================
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const previous = avatarUrl
    setSavingSection("avatar")
    setSectionErrors((prev) => ({ ...prev, avatar: undefined }))
    try {
      const publicUrl = await uploadImage(file, "avatars")
      setAvatarUrl(publicUrl)
      const ok = await saveSection("avatar", { avatarUrl: publicUrl })
      if (!ok) setAvatarUrl(previous)
    } catch (err) {
      setSectionErrors((prev) => ({ ...prev, avatar: getErrorMessage(err, "Зураг хуулахад алдаа гарлаа.") }))
      setSavingSection(null)
    }
  }

  // ========================================
  // ХУВИЙН МЭДЭЭЛЭЛ
  // ========================================
  const startPersonalEdit = () => {
    setPersonalDraft({ fullName, phone, gender, agreement })
    setPersonalErrors({})
    setSectionErrors((prev) => ({ ...prev, personal: undefined }))
    setEditing("personal")
  }

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { fullName?: string; phone?: string } = {}
    if (!personalDraft.fullName.trim()) errors.fullName = "Бүтэн нэрээ оруулна уу"
    if (!personalDraft.phone.trim()) errors.phone = "Утасны дугаараа оруулна уу"
    setPersonalErrors(errors)
    if (Object.keys(errors).length > 0) return

    const ok = await saveSection("personal", {
      fullName: personalDraft.fullName.trim(),
      phone: personalDraft.phone.trim(),
      gender: personalDraft.gender,
      agreement: personalDraft.agreement,
    })
    if (ok) {
      setFullName(personalDraft.fullName.trim())
      setPhone(personalDraft.phone.trim())
      setGender(personalDraft.gender)
      setAgreement(personalDraft.agreement)
      setEditing(null)
    }
  }

  // ========================================
  // АЖИЛЛАХ ЦАГ
  // ========================================
  const startAvailabilityEdit = () => {
    setAvailabilityDraft({ ...initialAvailability, ...availability })
    setSectionErrors((prev) => ({ ...prev, availability: undefined }))
    setEditing("availability")
  }

  const updateDay = (key: DayKey, patch: Partial<DayAvailability>) => {
    setAvailabilityDraft((prev) => ({ ...prev, [key]: { ...(prev[key] || EMPTY_DAY), ...patch } }))
    setSectionErrors((prev) => ({ ...prev, availability: undefined }))
  }

  const saveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = validateAvailability(availabilityDraft)
    if (problem) {
      setSectionErrors((prev) => ({ ...prev, availability: problem }))
      return
    }
    const ok = await saveSection("availability", { availability: availabilityDraft })
    if (ok) {
      setAvailability(availabilityDraft)
      setEditing(null)
    }
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  if (loadError) {
    return (
      <div role="alert" className="max-w-5xl mx-auto flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {loadError}
      </div>
    )
  }

  const enabledDays = DAYS.filter(([key]) => availability?.[key]?.enabled)
  const completeness = getCompleteness({ fullName, phone, bio, avatarUrl, gender, skills, experience, education, enabledDays: enabledDays.length })
  const busy = savingSection !== null

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 sm:space-y-6 pb-6">
      {/* ТОЛГОЙ */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Миний профайл</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ажил олгогчдод харагдах таны мэдээлэл. Карт бүрийн «Засах» товчоор тухайн хэсгийг засна.
        </p>
      </div>

      {/* Хадгалсан мэдэгдэл */}
      {toast && (
        <div
          role="status"
          className="fixed z-50 left-1/2 -translate-x-1/2 bottom-5 sm:bottom-8 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {toast}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* ЗҮҮН: ХУВИЙН МЭДЭЭЛЭЛ */}
        <aside className="lg:sticky lg:top-6 space-y-5 sm:space-y-6">
          <section
            className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
              sectionErrors.personal || sectionErrors.avatar ? "border-red-300" : "border-gray-100"
            }`}
          >
            <div className="h-20 bg-linear-to-r from-orange-500 to-amber-400" />
            <div className="px-5 sm:px-6 pb-5 -mt-12 flex flex-col items-center text-center">
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  aria-label="Зураг солих"
                  title="Зураг солих"
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-700 text-white ring-4 ring-white dark:ring-(--dk-surface) flex items-center justify-center shadow transition disabled:opacity-60"
                >
                  {savingSection === "avatar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>
              <h2 className="mt-3 text-lg font-bold text-gray-900 wrap-break-word">{fullName || "Таны нэр"}</h2>
              <p className="text-sm text-gray-500">Ажил хайгч</p>

              <span
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  agreement ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {agreement ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {agreement ? "Ажил олгогчдод харагдана" : "Ажил олгогчдод нуугдсан"}
              </span>
              {sectionErrors.avatar && <p role="alert" className="mt-2 text-xs text-red-600">{sectionErrors.avatar}</p>}
            </div>

            <div className="border-t border-gray-100 px-5 sm:px-6 py-4">
              {editing === "personal" ? (
                <form onSubmit={savePersonal} noValidate className="space-y-4 text-left">
                  <Field label="Бүтэн нэр" htmlFor="profile-fullname" error={personalErrors.fullName}>
                    <input
                      id="profile-fullname"
                      type="text"
                      autoComplete="name"
                      value={personalDraft.fullName}
                      onChange={(e) => {
                        setPersonalDraft((d) => ({ ...d, fullName: e.target.value }))
                        setPersonalErrors((er) => ({ ...er, fullName: undefined }))
                      }}
                      className={inputClass(!!personalErrors.fullName)}
                    />
                  </Field>
                  <Field label="Утас" htmlFor="profile-phone" error={personalErrors.phone}>
                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={personalDraft.phone}
                      onChange={(e) => {
                        setPersonalDraft((d) => ({ ...d, phone: e.target.value }))
                        setPersonalErrors((er) => ({ ...er, phone: undefined }))
                      }}
                      className={inputClass(!!personalErrors.phone)}
                    />
                  </Field>
                  <Field label="Хүйс" htmlFor="profile-gender">
                    <select
                      id="profile-gender"
                      value={personalDraft.gender}
                      onChange={(e) => setPersonalDraft((d) => ({ ...d, gender: e.target.value }))}
                      className={inputClass(false)}
                    >
                      <option value="">Сонгох...</option>
                      <option value="male">Эрэгтэй</option>
                      <option value="female">Эмэгтэй</option>
                    </select>
                  </Field>
                  <Field label="Имэйл" htmlFor="profile-email" hint="Нэвтрэх имэйлийг энд өөрчлөх боломжгүй.">
                    <input id="profile-email" type="email" value={email} readOnly className={`${inputClass(false)} text-gray-500 cursor-not-allowed`} />
                  </Field>
                  <label
                    htmlFor="profile-agreement"
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      personalDraft.agreement ? "border-orange-200 bg-orange-50/60" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <input
                      id="profile-agreement"
                      type="checkbox"
                      checked={personalDraft.agreement}
                      onChange={(e) => setPersonalDraft((d) => ({ ...d, agreement: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 shrink-0 accent-orange-600"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      Цагийн ажилтан хайж байгаа ажил олгогчдод миний профайлыг ил тод харуулахыг зөвшөөрч байна.
                    </span>
                  </label>
                  {sectionErrors.personal && (
                    <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {sectionErrors.personal}
                    </p>
                  )}
                  <CardActions saving={savingSection === "personal"} onCancel={() => setEditing(null)} />
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Хувийн мэдээлэл</h3>
                    <button
                      type="button"
                      onClick={startPersonalEdit}
                      disabled={editing !== null}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Засах
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <InfoLine icon={Phone} label="Утас" value={phone} />
                    <InfoLine icon={Mail} label="Имэйл" value={email} />
                    <InfoLine icon={UserRound} label="Хүйс" value={GENDER_LABELS[gender]} />
                  </dl>
                </>
              )}
            </div>
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
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">Дутуу: {completeness.missing.join(", ")}</p>
            ) : (
              <p className="mt-3 text-xs text-emerald-600">Профайл бүрэн бөглөгдсөн байна.</p>
            )}
          </section>
        </aside>

        {/* БАРУУН: ДЭЛГЭРЭНГҮЙ */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* ТАНИЛЦУУЛГА */}
          <Section
            icon={UserRound}
            title="Товч танилцуулга"
            error={sectionErrors.bio}
            action={{ label: bio ? "Засах" : "Нэмэх", onClick: () => setActiveModal("bio"), busy: savingSection === "bio" }}
          >
            {bio ? (
              <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed whitespace-pre-line wrap-break-word">{bio}</p>
            ) : (
              <EmptyHint text="Өөрийгөө товч танилцуулна уу." />
            )}
          </Section>

          {/* УР ЧАДВАР */}
          <Section
            icon={Wrench}
            title="Ур чадвар"
            error={sectionErrors.skills}
            action={{ label: "Засах", onClick: () => setActiveModal("skills"), busy: savingSection === "skills" }}
          >
            <div className="space-y-4">
              <ChipGroup title="Ур чадвар" items={skills.technical} />
              <ChipGroup title="Хэлний мэдлэг" items={skills.languages} />
            </div>
          </Section>

          {/* АЖЛЫН ТУРШЛАГА */}
          <Section
            icon={Briefcase}
            title="Ажлын туршлага"
            error={sectionErrors.experience}
            action={{ label: experience.length ? "Засах" : "Нэмэх", onClick: () => setActiveModal("experience"), busy: savingSection === "experience" }}
          >
            {experience.length > 0 ? (
              <ol className="relative space-y-5 before:absolute before:left-1.75 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                {experience.map((item, idx) => (
                  <li key={idx} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 w-3.75 h-3.75 rounded-full bg-white border-2 border-orange-500" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 wrap-break-word">{item.position}</h4>
                        <p className="text-sm text-orange-600 font-medium wrap-break-word">{item.company}</p>
                      </div>
                      <span className="text-xs text-gray-500 sm:shrink-0 sm:pt-0.5">
                        {item.startDate} — {item.endDate || "Одоог хүртэл"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap wrap-break-word">{item.description}</p>
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
            error={sectionErrors.education}
            action={{ label: education.length ? "Засах" : "Нэмэх", onClick: () => setActiveModal("education"), busy: savingSection === "education" }}
          >
            {education.length > 0 ? (
              <ul className="space-y-3">
                {education.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 wrap-break-word">{item.school}</h4>
                      <p className="text-sm text-gray-600 wrap-break-word">
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
            description={editing === "availability" ? "Ажиллах өдрөө асааж, цагаа оруулна уу." : undefined}
            error={editing === "availability" ? undefined : sectionErrors.availability}
            action={
              editing === "availability"
                ? undefined
                : { label: enabledDays.length ? "Засах" : "Нэмэх", onClick: startAvailabilityEdit }
            }
          >
            {editing === "availability" ? (
              <form onSubmit={saveAvailability} noValidate>
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
                  {DAYS.map(([key, label]) => {
                    const day = availabilityDraft[key] || EMPTY_DAY
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
                {sectionErrors.availability && (
                  <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {sectionErrors.availability}
                  </p>
                )}
                <CardActions saving={savingSection === "availability"} onCancel={() => setEditing(null)} />
              </form>
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
        </div>
      </div>

      {/* МОДАЛУУД — хадгалах дарахад тухайн хэсгийг шууд хадгална */}
      <BioModal
        open={activeModal === "bio"}
        value={bio}
        onSave={(value) => saveFromModal("bio", { bio: value }, value, bio, setBio)}
        onClose={() => setActiveModal(null)}
      />

      <SkillsModal
        open={activeModal === "skills"}
        value={skills}
        onSave={(data) => saveFromModal("skills", { skills: data }, data, skills, setSkills)}
        onClose={() => setActiveModal(null)}
      />

      <ExperienceModal
        open={activeModal === "experience"}
        value={experience}
        onSave={(list) => saveFromModal("experience", { experience: list }, list, experience, setExperience)}
        onClose={() => setActiveModal(null)}
      />

      <EducationModal
        open={activeModal === "education"}
        value={education}
        onSave={(list) => saveFromModal("education", { education: list }, list, education, setEducation)}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}
