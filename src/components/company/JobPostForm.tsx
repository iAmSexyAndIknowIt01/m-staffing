"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, Eye, Loader2, MapPin, RotateCcw, Send, Sparkles, X, XCircle } from "lucide-react"
import LocationModal from "@/components/common/LocationModal"
import Select from "@/components/common/Select"
import Combobox from "@/components/common/Combobox"
import JobDetailView from "@/components/staff/jobs/JobDetailView"
import JobTemplatePicker from "@/components/company/JobTemplatePicker"
import { getJobTemplates, type JobTemplate } from "@/lib/jobTemplates"
import { showAlert, showConfirm } from "@/components/common/AppDialog"
import { getCompanyLogoUrl } from "@/components/staff/jobs/CompanyIdentity"
import { getErrorMessage } from "@/lib/errors"
import { useIsClient } from "@/lib/useIsClient"
import {
  CUSTOM_CATEGORY_MAX,
  JOB_CATEGORIES,
  JOB_FIELD_LIMITS,
  JOB_TYPE_OPTIONS,
  SALARY_NEGOTIABLE,
  formatSalaryInput,
  getJobCategoryLabel,
  isJobCategory,
  getJobTypeLabel,
  jobFormErrors,
  salaryDigits,
  type JobFormValues,
} from "@/lib/jobPost"

type SalaryMode = "monthly" | "hourly" | "negotiable"
type Field = keyof JobFormValues

const DRAFT_KEY = "mstaffing:job-post-draft"

const EMPTY: JobFormValues = {
  title: "",
  category: "",
  jobType: "fulltime",
  location: "",
  salary: "",
  salaryType: "monthly",
  description: "",
  requirements: "",
}

const STATUS_OPTIONS = [
  { value: "active", label: "Идэвхтэй — ажил хайгчдад харагдана" },
  { value: "draft", label: "Ноорог — түр хадгална, харагдахгүй" },
  { value: "closed", label: "Хаагдсан — анкет хүлээж авахгүй" },
]

function fieldClass(state: "error" | "valid" | "idle") {
  const base = "w-full rounded-xl border bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-2"
  if (state === "error") return `${base} border-red-300 focus:border-red-500 focus:ring-red-500/15`
  if (state === "valid") return `${base} border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/15`
  return `${base} border-gray-200 focus:border-orange-500 focus:ring-orange-500/15`
}

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function FieldError({ id, error }: { id: string; error?: string | null }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-500">
      <XCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" /> {error}
    </p>
  )
}

function Counter({ value, max }: { value: string; max: number }) {
  const near = value.length > max * 0.9
  return (
    <span className={`text-xs tabular-nums ${near ? "text-amber-600" : "text-gray-400"}`}>
      {value.length.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

interface JobPostFormProps {
  mode: "create" | "edit"
  jobId?: string
  // Засах үед DB-ийн мөр (mt_openjob)
  initial?: {
    title?: string | null
    category?: string | null
    job_type?: string | null
    location?: string | null
    salary?: string | null
    salary_type?: string | null
    description?: string | null
    requirements?: string | null
    status?: string | null
  }
}

function fromInitial(initial: JobPostFormProps["initial"]): { values: JobFormValues; mode: SalaryMode } {
  if (!initial) return { values: EMPTY, mode: "monthly" }
  const negotiable = (initial.salary ?? "").trim() === SALARY_NEGOTIABLE || !initial.salary
  const salaryType = initial.salary_type === "hourly" ? "hourly" : "monthly"
  return {
    values: {
      title: initial.title ?? "",
      category: initial.category ?? "",
      jobType: initial.job_type ?? "fulltime",
      location: initial.location ?? "",
      salary: negotiable ? SALARY_NEGOTIABLE : salaryDigits(initial.salary ?? ""),
      salaryType,
      description: initial.description ?? "",
      requirements: initial.requirements ?? "",
    },
    mode: negotiable ? "negotiable" : salaryType,
  }
}

type Draft = { values: JobFormValues; salaryMode: SalaryMode }

// Хадгалсан ноорог (зөвхөн хөтөч дээр; форм нь клиент дээр л зурагдана)
function readDraft(): Draft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as { values?: Partial<JobFormValues>; salaryMode?: SalaryMode }
    const values = { ...EMPTY, ...draft.values }
    const meaningful = (["title", "category", "location", "description", "requirements"] as const).some((f) => values[f].trim())
      || (values.salary && values.salary !== SALARY_NEGOTIABLE)
    return meaningful ? { values, salaryMode: draft.salaryMode ?? "monthly" } : null
  } catch {
    return null
  }
}

export default function JobPostForm({ mode, jobId, initial }: JobPostFormProps) {
  const router = useRouter()
  const isClient = useIsClient()
  const [draft] = useState<Draft | null>(() => (mode === "create" ? readDraft() : null))
  const start = draft ? { values: draft.values, mode: draft.salaryMode } : fromInitial(initial)

  const [values, setValues] = useState<JobFormValues>(start.values)
  const [salaryMode, setSalaryMode] = useState<SalaryMode>(start.mode)
  const [lastAmount, setLastAmount] = useState(start.mode === "negotiable" ? "" : start.values.salary)
  const [status, setStatus] = useState(initial?.status || "active")
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [draftRestored, setDraftRestored] = useState(!!draft)
  const [locationOpen, setLocationOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  // Нээлттэй загвар сонгох цонх: эхлээд харуулах загварын id ("" бол эхнийх), null бол хаалттай
  const [templatePickerId, setTemplatePickerId] = useState<string | null>(null)
  const [company, setCompany] = useState<{ name: string; logo_url: string | null } | null>(null)
  const [limitInfo, setLimitInfo] = useState<{ approved: boolean; reached: boolean; limit: number; expired: boolean } | null>(null)
  const doneRef = useRef(false)

  const errors = jobFormErrors(values)
  const hasErrors = Object.keys(errors).length > 0
  const visible = (field: Field) => (touched[field] || submitted ? errors[field] ?? null : null)
  const state = (field: Field): "error" | "valid" | "idle" =>
    visible(field) ? "error" : (touched[field] || submitted) && !errors[field] ? "valid" : "idle"
  const blur = (field: Field) => setTouched((prev) => ({ ...prev, [field]: true }))

  const update = (patch: Partial<JobFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  // Шинэ зар: зар нэмэх эрх, багцын лимитийг урьдчилан шалгана
  useEffect(() => {
    if (mode !== "create") return
    fetch("/api/company/check-approval")
      .then((res) => res.json())
      .then((result) => {
        if (result?.success) {
          setLimitInfo({
            approved: result.is_approved === "approved",
            reached: !!result.job_limit?.reached,
            limit: result.job_limit?.limit ?? 0,
            expired: !!result.job_limit?.expired,
          })
        }
      })
      .catch(() => {})
  }, [mode])

  // Ноорог автоматаар хадгалах (шинэ зар үед)
  useEffect(() => {
    if (mode !== "create" || !dirty || doneRef.current) return
    const t = setTimeout(() => {
      // Нийтэлсний дараа хүлээгдэж байсан хадгалалт ноорог сэргээхээс сэргийлнэ
      if (doneRef.current) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, salaryMode }))
      } catch {
        // хадгалж чадахгүй бол алгасна
      }
    }, 400)
    return () => clearTimeout(t)
  }, [mode, dirty, values, salaryMode])

  // Хадгалаагүй өөрчлөлттэй үед хуудсыг хаах/refresh хийхэд анхааруулна
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (doneRef.current) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const clearDraft = async () => {
    const ok = await showConfirm("Бөглөсөн бүх мэдээлэл устна.", {
      title: "Ноорог цэвэрлэх үү?",
      confirmLabel: "Цэвэрлэх",
      danger: true,
    })
    if (!ok) return
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
    setValues(EMPTY)
    setSalaryMode("monthly")
    setLastAmount("")
    setTouched({})
    setSubmitted(false)
    setDirty(false)
    setDraftRestored(false)
  }

  const chooseSalaryMode = (next: SalaryMode) => {
    setSalaryMode(next)
    if (next === "negotiable") update({ salary: SALARY_NEGOTIABLE })
    else update({ salary: lastAmount, salaryType: next })
  }

  const blocked = mode === "create" && limitInfo !== null && (!limitInfo.approved || limitInfo.reached)

  const openPreview = async () => {
    setPreviewOpen(true)
    if (company) return
    try {
      const res = await fetch("/api/company/profile")
      const result = await res.json()
      if (result?.data) setCompany({ name: result.data.company_name || "Танай байгууллага", logo_url: result.data.logo_url || null })
    } catch {
      setCompany({ name: "Танай байгууллага", logo_url: null })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors) {
      const order: Field[] = ["title", "category", "location", "salary", "description", "requirements"]
      const first = order.find((f) => errors[f])
      if (first) document.getElementById(first === "category" && categoryChoice === "other" ? "job-category-custom" : `job-${first}`)?.focus()
      return
    }
    if (blocked) return

    setSaving(true)
    try {
      const payload = {
        ...values,
        title: values.title.trim(),
        category: values.category.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
        requirements: values.requirements.trim(),
        salaryType: values.salaryType,
      }
      const response = await fetch(mode === "create" ? "/api/jobs" : `/api/jobs/${jobId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? payload : { ...payload, salary_type: payload.salaryType, status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Хадгалж чадсангүй")

      doneRef.current = true
      if (mode === "create") {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {}
      }
      await showAlert(
        mode === "create"
          ? "Зар идэвхжиж, ажил хайгчдад харагдаж эхэллээ."
          : "Зарын өөрчлөлт хадгалагдлаа.",
        { title: mode === "create" ? "Зар нийтлэгдлээ" : "Хадгалагдлаа", tone: "success" }
      )
      router.push("/dashboard/company/post-job")
      router.refresh()
    } catch (err) {
      showAlert(getErrorMessage(err, "Серверт алдаа гарлаа. Дараа дахин оролдоно уу."), { tone: "error" })
    } finally {
      setSaving(false)
    }
  }

  // Ноорог localStorage-оос уншдаг тул серверт зурахгүй (hydration зөрөхөөс сэргийлнэ)
  if (!isClient) return <div className="min-h-96" aria-busy="true" />

  // values.category: жагсаалтын утга, «Бусад»-аар бичсэн салбар эсвэл (бичээгүй үед) "other"
  const categoryChoice = isJobCategory(values.category) ? values.category : values.category ? "other" : ""
  const customCategory = categoryChoice === "other" && values.category !== "other" ? values.category : ""
  const templates = getJobTemplates(categoryChoice)
  const categoryLabel = categoryChoice && categoryChoice !== "other" ? getJobCategoryLabel(categoryChoice) : "Ерөнхий загварууд"

  // Загвар ашиглах: бичсэн текст байвал солих эсэхийг асууна; нэр хоосон бол загварын нэрийг оруулна
  const applyTemplate = async (template: JobTemplate) => {
    setTemplatePickerId(null)
    if (values.description.trim() || values.requirements.trim()) {
      const ok = await showConfirm("Одоо бичсэн «Ажлын үүрэг» болон «Тавигдах шаардлага»-ыг загвараар солих уу?", {
        title: "Загвараар солих",
        confirmLabel: "Солих",
      })
      if (!ok) return
    }
    update({
      description: template.description,
      requirements: template.requirements,
      ...(values.title.trim() ? {} : { title: template.title }),
    })
    setTouched((prev) => ({ ...prev, description: true, requirements: true }))
  }

  return (
    <>
      <LocationModal
        isOpen={locationOpen}
        value={values.location}
        onClose={() => {
          setLocationOpen(false)
          blur("location")
        }}
        onSelect={(name: string) => {
          update({ location: name })
          setLocationOpen(false)
          blur("location")
        }}
      />

      {blocked && limitInfo && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Одоогоор зар нийтлэх боломжгүй</p>
            <p className="mt-0.5">
              {!limitInfo.approved
                ? "Таны компани админаар баталгаажаагүй байна. Баталгаажсаны дараа зар нийтлэх боломжтой болно."
                : limitInfo.expired
                  ? "Таны багцын хугацаа дууссан байна. Шинэ зар нийтлэхийн тулд багц худалдаж авна уу."
                  : `Таны зар нийтлэх эрх (${limitInfo.limit}) дууссан байна. Шинэ зар нийтлэхийн тулд багц худалдаж авна уу.`}
            </p>
            {limitInfo.approved && (
              <a href="/dashboard/company/billing" className="mt-2 inline-block font-semibold text-amber-900 underline">
                Багц худалдаж авах
              </a>
            )}
          </div>
        </div>
      )}

      {draftRestored && (
        <div role="status" className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
          <span className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 shrink-0" /> Өмнө бөглөж байсан ноорог сэргээгдлээ.
          </span>
          <button type="button" onClick={clearDraft} className="self-start sm:self-auto font-semibold text-sky-900 hover:underline">
            Цэвэрлэж шинээр эхлэх
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Ажлын байрны нэр */}
        <div>
          <div className="flex items-end justify-between gap-2">
            <Label htmlFor="job-title" required>Ажлын байрны нэр</Label>
            <span className="mb-2"><Counter value={values.title} max={JOB_FIELD_LIMITS.title} /></span>
          </div>
          <input
            id="job-title"
            type="text"
            placeholder="Жишээ нь: Кассчин, Бариста, Агуулахын ажилтан"
            className={`${fieldClass(state("title"))} h-12`}
            value={values.title}
            maxLength={JOB_FIELD_LIMITS.title}
            onChange={(e) => update({ title: e.target.value })}
            onBlur={() => blur("title")}
            aria-invalid={!!visible("title")}
            aria-describedby="job-title-error"
          />
          <FieldError id="job-title-error" error={visible("title")} />
        </div>

        {/* Ангилал */}
        <div>
          <Label htmlFor="job-category" required>Ангилал</Label>
          <Combobox
            id="job-category"
            options={[...JOB_CATEGORIES]}
            value={categoryChoice}
            onChange={(choice) => update({ category: choice === "other" ? customCategory || "other" : choice })}
            onBlur={() => {
              if (categoryChoice !== "other") blur("category")
            }}
            placeholder="Ангилал сонгох..."
            searchPlaceholder="Ангилал эсвэл албан тушаалаар хайх (жишээ: кассчин)"
            emptyText="Олдсонгүй. «Бусад»-ыг сонгоод салбараа бичнэ үү."
            invalid={!!visible("category") && categoryChoice !== "other"}
            describedBy="job-category-error"
          />
          {categoryChoice === "other" && (
            <div className="mt-3">
              <label htmlFor="job-category-custom" className="sr-only">Салбарын нэр</label>
              <input
                id="job-category-custom"
                type="text"
                autoFocus={!customCategory}
                value={customCategory}
                maxLength={CUSTOM_CATEGORY_MAX}
                onChange={(e) => update({ category: e.target.value || "other" })}
                onBlur={() => blur("category")}
                placeholder="Салбараа бичнэ үү (жишээ: Хөдөө аж ахуй, Уул уурхай)"
                aria-invalid={!!visible("category")}
                aria-describedby="job-category-error"
                className={`${fieldClass(state("category"))} h-12`}
              />
            </div>
          )}
          <FieldError id="job-category-error" error={visible("category")} />
        </div>

        {/* Ажлын цагийн төрөл */}
        <fieldset>
          <legend className="block text-sm font-semibold text-gray-700 mb-2">Ажлын цагийн төрөл</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {JOB_TYPE_OPTIONS.map((t) => {
              const selected = values.jobType === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ jobType: t.value })}
                  className={`h-10 px-4 rounded-full text-sm font-medium border transition ${
                    selected
                      ? "bg-orange-600 border-orange-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Байршил */}
        <div>
          <Label htmlFor="job-location" required>Ажиллах байршил</Label>
          <button
            id="job-location"
            type="button"
            onClick={() => setLocationOpen(true)}
            aria-describedby="job-location-error"
            className={`${fieldClass(state("location"))} h-12 flex items-center gap-2 text-left`}
          >
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className={values.location ? "text-gray-900" : "text-gray-400"}>
              {values.location || "Байршил сонгох..."}
            </span>
          </button>
          <FieldError id="job-location-error" error={visible("location")} />
        </div>

        {/* Цалин */}
        <div>
          <Label htmlFor="job-salary" required>Цалин</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex p-1 bg-gray-100 rounded-xl sm:w-80 shrink-0" role="radiogroup" aria-label="Цалингийн нөхцөл">
              {(
                [
                  ["monthly", "Сараар"],
                  ["hourly", "Цагаар"],
                  ["negotiable", "Тохиролцоно"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={salaryMode === value}
                  onClick={() => chooseSalaryMode(value)}
                  className={`flex-1 h-10 text-sm font-semibold rounded-lg transition ${
                    salaryMode === value ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {salaryMode !== "negotiable" ? (
              <div className="relative flex-1">
                <input
                  id="job-salary"
                  type="text"
                  inputMode="numeric"
                  placeholder={salaryMode === "monthly" ? "Жишээ нь: 2,500,000" : "Жишээ нь: 15,000"}
                  className={`${fieldClass(state("salary"))} h-12 pr-20 font-semibold tabular-nums`}
                  value={formatSalaryInput(values.salary === SALARY_NEGOTIABLE ? "" : values.salary)}
                  onChange={(e) => {
                    const digits = salaryDigits(e.target.value).slice(0, 10)
                    setLastAmount(digits)
                    update({ salary: digits, salaryType: salaryMode })
                  }}
                  onBlur={() => blur("salary")}
                  aria-invalid={!!visible("salary")}
                  aria-describedby="job-salary-error"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">
                  {salaryMode === "monthly" ? "₮ / сар" : "₮ / цаг"}
                </span>
              </div>
            ) : (
              <p className="flex-1 flex items-center h-12 px-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-500">
                Цалинг ярилцлагын үеэр тохиролцоно
              </p>
            )}
          </div>
          <FieldError id="job-salary-error" error={visible("salary")} />
        </div>

        {mode === "edit" && (
          <div>
            <Label htmlFor="job-status">Зарын төлөв</Label>
            <Select id="job-status" value={status} onChange={(e) => { setStatus(e.target.value); setDirty(true) }} className="h-12">
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Ангилалд тохирох бэлэн загвар */}
        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Бэлэн загвараас эхлэх</p>
                <p className="text-xs text-gray-500">
                  {categoryChoice && categoryChoice !== "other"
                    ? `«${categoryLabel}» ангилалд тохирох үүрэг, шаардлагын загвар`
                    : "Ангиллаа сонговол тухайн салбарт тохирох загварууд гарна"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTemplatePickerId("")}
              className="shrink-0 self-start sm:self-auto text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Бүгдийг үзэх
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {templates.slice(0, 4).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setTemplatePickerId(tpl.id)}
                className="h-9 px-3.5 rounded-full border border-orange-200 bg-white text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-700 transition"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {templatePickerId !== null && (
          <JobTemplatePicker
            templates={templates}
            categoryLabel={categoryLabel}
            initialId={templatePickerId || undefined}
            onClose={() => setTemplatePickerId(null)}
            onApply={applyTemplate}
          />
        )}

        {/* Тайлбар, шаардлага */}
        {(
          [
            ["description", "Ажлын үүрэг, тодорхойлолт", "Гүйцэтгэх үндсэн үүрэг, ажлын цаг, ажлын орчин, олгох хангамжийн талаар бичнэ үү..."],
            ["requirements", "Тавигдах шаардлага", "Шаардлагатай туршлага, боловсрол, ур чадвар, хувь хүний чанарыг жагсааж бичнэ үү..."],
          ] as const
        ).map(([field, label, placeholder]) => (
          <div key={field}>
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor={`job-${field}`} required>{label}</Label>
              <span className="mb-2"><Counter value={values[field]} max={JOB_FIELD_LIMITS[field]} /></span>
            </div>
            <textarea
              id={`job-${field}`}
              rows={6}
              placeholder={placeholder}
              className={`${fieldClass(state(field))} py-3 resize-y min-h-32 leading-relaxed`}
              value={values[field]}
              maxLength={JOB_FIELD_LIMITS[field]}
              onChange={(e) => update({ [field]: e.target.value })}
              onBlur={() => blur(field)}
              aria-invalid={!!visible(field)}
              aria-describedby={`job-${field}-error`}
            />
            <FieldError id={`job-${field}-error`} error={visible(field)} />
          </div>
        ))}

        {submitted && hasErrors && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <XCircle className="w-4 h-4 shrink-0" /> Улаанаар тэмдэглэсэн талбаруудыг засна уу.
          </p>
        )}

        <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={openPreview}
            className="h-12 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2 transition"
          >
            <Eye className="w-4 h-4" /> Урьдчилан харах
          </button>
          <button
            type="submit"
            disabled={saving || blocked}
            className="h-12 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-orange-600/20 inline-flex items-center justify-center gap-2 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "create" ? <Send className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Хадгалж байна..." : mode === "create" ? "Зар нийтлэх" : "Өөрчлөлт хадгалах"}
          </button>
        </div>
      </form>

      {/* Урьдчилан харах: ажил хайгчид харагдах хэлбэрээр */}
      {previewOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-100000 bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-6"
            onClick={() => setPreviewOpen(false)}
          >
            <div className="max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Зарын урьдчилсан харагдац">
              <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-600" /> Ажил хайгчид ингэж харагдана
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Хаах"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-3xl bg-gray-50 p-2 sm:p-4">
                <JobDetailView
                  job={{
                    id: "preview",
                    title: values.title.trim() || "Ажлын байрны нэр",
                    category: values.category,
                    job_type: values.jobType,
                    salary_type: values.salaryType,
                    location: values.location || "Байршил сонгоогүй",
                    salary: values.salary,
                    description: values.description,
                    requirements: values.requirements,
                    created_at: new Date().toISOString(),
                    is_applied: false,
                    mt_company: company ? { id: "", name: company.name, logo_url: company.logo_url } : undefined,
                  }}
                  appliedJobIds={[]}
                  submitting={false}
                  checkingProfile={false}
                  getCompanyLogoUrl={getCompanyLogoUrl}
                  getJobTypeText={getJobTypeLabel}
                  getSalaryTypeText={(t) => (t === "hourly" ? "Цагийн" : "Сарын")}
                  formatSalary={(s) => (s && /^\d+$/.test(s) ? `${Number(s).toLocaleString()} ₮` : s || SALARY_NEGOTIABLE)}
                  handleCompanyClick={(e) => e.preventDefault()}
                  triggerApplyConfirmation={async () => {}}
                  onClose={() => setPreviewOpen(false)}
                  action={() => (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600/90 text-white text-sm font-bold opacity-80 cursor-default">
                      Анкет илгээх
                    </span>
                  )}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
