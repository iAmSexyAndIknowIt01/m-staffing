"use client"

import { AlertTriangle, Star } from "lucide-react"
import { useState } from "react"
import { DEFAULT_CONTRACT_TERMS, SALARY_TYPE_LABELS } from "@/lib/contracts"
import { MIN_TEMPLATE_TERMS, validateTemplate } from "@/lib/contractTemplates"
import { toWorkHoursDraft, workHoursErrors, workHoursFromDraft, type WorkHoursDraft } from "@/lib/workSchedule"
import type { ContractSalaryType, ContractTemplateInput } from "@/types/contract"
import ConfirmDialog from "./ConfirmDialog"
import TemplatePreview from "./TemplatePreview"
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard"
import WorkScheduleInput from "./WorkScheduleInput"

// Гэрээний загвар үүсгэх / засах. Зүүн талд хэсэгчилсэн форм, баруун талд гэрээнд хэрхэн
// бөглөгдөхийг шууд харуулна (гар утсанд таб-аар солино). Хоосон талбар ажлын зараас бөглөгдөнө.

interface TemplateForm {
  name: string
  is_default: boolean
  position: string
  salary: string
  salary_type: ContractSalaryType
  duration_months: string
  work_hours: WorkHoursDraft
  location: string
  terms: string
}

type TextField = Exclude<keyof TemplateForm, "work_hours" | "is_default">
type MobileView = "edit" | "preview"

const DURATION_PRESETS = [3, 6, 12, 24]

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50/30"

function toForm(t?: ContractTemplateInput): TemplateForm {
  return {
    name: t?.name ?? "",
    is_default: t?.is_default ?? false,
    position: t?.position ?? "",
    salary: t?.salary !== null && t?.salary !== undefined ? String(t.salary) : "",
    salary_type: t?.salary_type ?? "monthly",
    duration_months: t?.duration_months ? String(t.duration_months) : "",
    work_hours: toWorkHoursDraft(t?.work_hours),
    location: t?.location ?? "",
    terms: t?.terms ?? DEFAULT_CONTRACT_TERMS,
  }
}

const toPayload = (form: TemplateForm) => ({ ...form, work_hours: workHoursFromDraft(form.work_hours) })
const snapshot = (form: TemplateForm) => JSON.stringify(toPayload(form))

// Дутуу бөглөсөн форм ч урьдчилан харагдана (шалгалтгүйгээр)
function previewOf(form: TemplateForm): ContractTemplateInput {
  const salary = form.salary === "" ? null : Number(form.salary)
  return {
    name: form.name,
    is_default: form.is_default,
    position: form.position.trim() || null,
    salary: salary !== null && Number.isFinite(salary) ? salary : null,
    salary_type: form.salary_type,
    duration_months: Number(form.duration_months) || null,
    work_hours: workHoursFromDraft(form.work_hours),
    location: form.location.trim() || null,
    terms: form.terms,
  }
}

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="w-5 h-5 rounded-full bg-orange-50 text-orange-600 text-xs grid place-items-center" aria-hidden>{step}</span>
          {title}
        </h3>
        {hint && <p className="text-xs text-gray-400 mt-0.5 ml-7">{hint}</p>}
      </div>
      <div className="sm:ml-7">{children}</div>
    </section>
  )
}

const Label = ({ children }: { children: React.ReactNode }) => <span className="text-xs font-bold text-gray-500">{children}</span>

interface ContractTemplateFormProps {
  initial?: ContractTemplateInput
  isNew: boolean
  busy: boolean
  error: string | null
  onSubmit: (input: ContractTemplateInput) => void
  onCancel: () => void
}

export default function ContractTemplateForm({ initial, isNew, busy, error, onSubmit, onCancel }: ContractTemplateFormProps) {
  const [form, setForm] = useState(() => toForm(initial))
  const [initialSnapshot] = useState(() => snapshot(toForm(initial)))
  const [showErrors, setShowErrors] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>("edit")

  const dirty = snapshot(form) !== initialSnapshot
  const leaveGuard = useUnsavedChangesGuard(dirty && !busy)

  const set = (key: TextField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const hoursErrors = workHoursErrors(form.work_hours)
  const validation = validateTemplate(toPayload(form))
  const problems = [...hoursErrors, ...(validation.ok ? [] : [validation.error])]
  const nameInvalid = showErrors && !form.name.trim()
  const termsLength = form.terms.trim().length
  const termsInvalid = showErrors && termsLength < MIN_TEMPLATE_TERMS

  // Хадгалах товч үргэлж идэвхтэй — дарахад дутууг тодруулж, гар утсанд формыг харуулна
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validation.ok && hoursErrors.length === 0) return onSubmit(validation.data)
    setShowErrors(true)
    setMobileView("edit")
  }

  const cancel = () => (dirty ? setConfirmDiscard(true) : onCancel())

  return (
    <>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button type="button" onClick={cancel} className="text-xs font-bold text-gray-400 hover:text-orange-600">← Загварууд</button>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{isNew ? "Шинэ загвар" : form.name.trim() || "Загвар засах"}</h2>
          </div>
          <div className="lg:hidden inline-flex bg-gray-100/80 p-1 rounded-xl text-xs font-bold">
            {(["edit", "preview"] as MobileView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                aria-pressed={mobileView === view}
                className={`px-3 py-1.5 rounded-lg transition ${mobileView === view ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
              >
                {view === "edit" ? "Засах" : "Харах"}
              </button>
            ))}
          </div>
        </div>
  
        {error && <div role="alert" className="p-3 bg-red-50 text-red-500 font-bold rounded-xl text-sm">{error}</div>}
  
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
          <div className={`bg-white border border-gray-100 rounded-3xl shadow-sm ${mobileView === "edit" ? "" : "hidden lg:block"}`}>
            <div className="p-5 sm:p-8 space-y-8">
              <Section step={1} title="Загварын нэр">
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <Label>Нэр *</Label>
                    <input
                      value={form.name}
                      onChange={set("name")}
                      maxLength={100}
                      placeholder="Жишээ: Цагийн ажилтан — 3 сар"
                      aria-invalid={nameInvalid}
                      className={inputClass}
                      autoFocus={isNew}
                    />
                    {nameInvalid && <span className="block text-xs font-semibold text-rose-600">Загварын нэрийг оруулна уу.</span>}
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_default}
                      onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded accent-orange-600"
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-800"><Star size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Үндсэн загвар</span>
                      <span className="block text-xs text-gray-500">Шинэ гэрээ үүсгэхэд автоматаар сонгогдоно. Өмнөх үндсэн загвар энгийн болно.</span>
                    </span>
                  </label>
                </div>
              </Section>
  
              <Section step={2} title="Албан тушаал, цалин" hint="Хоосон үлдээвэл ажлын зар дээрх утгаар бөглөгдөнө — нэг загварыг өөр ажлын байранд ч ашиглана.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5 sm:col-span-2">
                    <Label>Албан тушаал</Label>
                    <input value={form.position} onChange={set("position")} maxLength={200} placeholder="Ажлын зарын нэр" className={inputClass} />
                  </label>
                  <label className="space-y-1.5">
                    <Label>Цалин (₮)</Label>
                    <input type="number" min={0} value={form.salary} onChange={set("salary")} placeholder="Ажлын зарын цалин" className={inputClass} />
                  </label>
                  <label className="space-y-1.5">
                    <Label>Цалингийн төрөл</Label>
                    <select value={form.salary_type} onChange={set("salary_type")} disabled={form.salary === ""} className={`${inputClass} disabled:opacity-50`}>
                      {(Object.keys(SALARY_TYPE_LABELS) as ContractSalaryType[]).map((t) => (
                        <option key={t} value={t}>{SALARY_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </Section>
  
              <Section step={3} title="Хугацаа, байршил">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Гэрээний хугацаа</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[null, ...DURATION_PRESETS].map((m) => {
                        const value = m ? String(m) : ""
                        const selected = form.duration_months === value
                        return (
                          <button
                            key={value || "none"}
                            type="button"
                            onClick={() => setForm({ ...form, duration_months: value })}
                            aria-pressed={selected}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                              selected ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600"
                            }`}
                          >
                            {m ? `${m} сар` : "Заахгүй"}
                          </button>
                        )
                      })}
                      <div className="relative w-28">
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={form.duration_months}
                          onChange={set("duration_months")}
                          placeholder="Бусад"
                          aria-label="Гэрээний хугацаа (сар)"
                          className={`${inputClass} pr-10`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">сар</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Дуусах огноог гэрээний эхлэх огнооноос тооцно. «Заахгүй» бол гэрээ бүрт гараар оруулна.</p>
                  </div>
                  <label className="block space-y-1.5">
                    <Label>Ажлын байршил</Label>
                    <input value={form.location} onChange={set("location")} maxLength={200} placeholder="Ажлын зар дээрх байршил" className={inputClass} />
                  </label>
                </div>
              </Section>
  
              <Section step={4} title="Ажлын өдөр, цаг">
                <WorkScheduleInput value={form.work_hours} onChange={(work_hours) => setForm({ ...form, work_hours })} />
              </Section>
  
              <Section step={5} title="Гэрээний нөхцөл *">
                <div className="space-y-1.5">
                  <textarea
                    value={form.terms}
                    onChange={set("terms")}
                    rows={14}
                    maxLength={20000}
                    aria-label="Гэрээний нөхцөл"
                    aria-invalid={termsInvalid}
                    className={`${inputClass} leading-relaxed`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={termsInvalid ? "font-semibold text-rose-600" : "text-gray-400"}>
                      {termsInvalid ? `Дор хаяж ${MIN_TEMPLATE_TERMS} тэмдэгт бичнэ үү. ` : ""}
                      {termsLength.toLocaleString("mn-MN")} / 20,000 тэмдэгт
                    </span>
                    {form.terms !== DEFAULT_CONTRACT_TERMS && (
                      <button type="button" onClick={() => setForm({ ...form, terms: DEFAULT_CONTRACT_TERMS })} className="font-bold text-gray-400 hover:text-orange-600">
                        ↺ Анхны нөхцлөөр солих
                      </button>
                    )}
                  </div>
                </div>
              </Section>
            </div>
  
            {/* Урт формын доод хэсэгт ч үйлдлийн товч харагдана */}
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 px-5 sm:px-8 py-3 bg-white/95 backdrop-blur border-t border-gray-100 rounded-b-3xl">
              {showErrors && problems.length > 0 ? (
                <span role="alert" className="mr-auto text-xs font-semibold text-rose-600"><AlertTriangle size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> {problems[0]}</span>
              ) : (
                dirty && <span className="mr-auto text-xs font-semibold text-amber-600">● Хадгалаагүй өөрчлөлт</span>
              )}
              <button type="button" onClick={cancel} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50">
                Болих
              </button>
              <button type="submit" disabled={busy} className="text-sm font-bold px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50">
                {busy ? "Хадгалж байна..." : isNew ? "Загвар үүсгэх" : "Хадгалах"}
              </button>
            </div>
          </div>
  
          <aside className={`lg:sticky lg:top-4 ${mobileView === "preview" ? "" : "hidden lg:block"}`}>
            <TemplatePreview template={previewOf(form)} />
          </aside>
        </div>
      </form>

      {/* Цонхнууд формоос гадуур: ConfirmDialog-ийн товч type-гүй тул форм дотор submit болно */}
      {confirmDiscard && (
        <ConfirmDialog
          title="Хадгалаагүй өөрчлөлт байна"
          description="Загварт хийсэн өөрчлөлт хадгалагдаагүй байна. Хадгалахгүйгээр гарвал өөрчлөлт устна."
          confirmLabel="Хадгалахгүй гарах"
          cancelLabel="Үлдэх"
          tone="danger"
          onConfirm={onCancel}
          onClose={() => setConfirmDiscard(false)}
        />
      )}

      {leaveGuard.blocked && (
        <ConfirmDialog
          title="Хадгалаагүй өөрчлөлт байна"
          description="Загварт хийсэн өөрчлөлт хадгалагдаагүй байна. Хадгалахгүйгээр гарвал өөрчлөлт устна."
          confirmLabel="Хадгалахгүй гарах"
          cancelLabel="Үлдэх"
          tone="danger"
          onConfirm={leaveGuard.proceed}
          onClose={leaveGuard.stay}
        />
      )}
    </>
  )
}
