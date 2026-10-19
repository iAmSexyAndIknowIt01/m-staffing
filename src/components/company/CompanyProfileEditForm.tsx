"use client"

import { useRef, type FormEvent, type ReactNode } from "react"
import { Building2, Camera, Loader2 } from "lucide-react"
import type { CompanyProfileInfo } from "./CompanyProfileView"

interface Props {
  value: CompanyProfileInfo
  onChange: (next: CompanyProfileInfo) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  onLogoSelect: (file: File) => void
  uploadingLogo?: boolean
  saving?: boolean
}

const INDUSTRIES = [
  "Технологи, Мэдээллийн технологи",
  "Банк, Санхүү, Даатгал",
  "Барилга, Үл хөдлөх хөрөнгө",
  "Боловсрол, Сургалт",
  "Худалдаа, Үйлчилгээ",
]

const COMPANY_SIZES = ["1-10 ажилтан", "11-50 ажилтан", "51-200 ажилтан", "201+ ажилтан"]

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition"

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block mt-1.5 text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
      <div className="pb-4 mb-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

// Хадгалсан утга жагсаалтад байхгүй бол (хуучин өгөгдөл) алдагдахгүйн тулд сонголтод нэмнэ
function withCurrent(options: string[], current?: string) {
  return current && !options.includes(current) ? [current, ...options] : options
}

// Компанийн профайл засах форм — CompanyProfileView-тэй ижил албан ёсны загвартай
export default function CompanyProfileEditForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  onLogoSelect,
  uploadingLogo = false,
  saving = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const set = (field: keyof CompanyProfileInfo) => (
    e: { target: { value: string } }
  ) => onChange({ ...value, [field]: e.target.value })
  const busy = saving || uploadingLogo

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ТОЛГОЙ: лого солих + үйлдлүүд */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-24 sm:h-28 bg-slate-900 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500" />
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 -mt-12 sm:-mt-14">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onLogoSelect(file)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm p-1.5 flex items-center justify-center overflow-hidden disabled:cursor-wait"
              title="Лого солих"
            >
              {value.logo_url ? (
                <img src={value.logo_url} alt="Лого" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
              )}
              <span className={`absolute inset-0 bg-slate-900/60 text-white flex flex-col items-center justify-center gap-1 text-xs font-medium transition ${uploadingLogo ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                {uploadingLogo ? "Хуулж байна" : "Лого солих"}
              </span>
            </button>

            <div className="flex-1 min-w-0 sm:mt-16">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Профайл засах</h1>
              <p className="mt-1 text-sm text-slate-500">
                Энд оруулсан мэдээлэл ажил хайгчдад таны байгууллагын профайл дээр харагдана.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section title="Үндсэн мэдээлэл">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Компанийн нэр *">
            <input type="text" required value={value.company_name} onChange={set("company_name")} className={inputClass} />
          </Field>
          <Field label="Товч уриа" hint="Нэрний доор харагдах нэг өгүүлбэр">
            <input type="text" value={value.tagline ?? ""} onChange={set("tagline")} className={inputClass} />
          </Field>
        </div>
        <Field label="Байгууллагын танилцуулга" hint="Үйл ажиллагаа, түүх, соёл, ажилтнуудад олгох боломжийн талаар бичнэ үү.">
          <textarea rows={6} value={value.description ?? ""} onChange={set("description")} className={`${inputClass} resize-y leading-6`} />
        </Field>
      </Section>

      <Section title="Байгууллагын мэдээлэл">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Үйл ажиллагааны чиглэл">
            <select value={value.industry ?? ""} onChange={set("industry")} className={inputClass}>
              {withCurrent(INDUSTRIES, value.industry).map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Ажилтны тоо">
            <select value={value.company_size ?? ""} onChange={set("company_size")} className={inputClass}>
              {withCurrent(COMPANY_SIZES, value.company_size).map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Холбоо барих">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Утасны дугаар">
            <input type="text" value={value.phone} onChange={set("phone")} className={inputClass} />
          </Field>
          <Field label="Цахим хуудас" hint="Жишээ: https://company.mn">
            <input type="url" value={value.website} onChange={set("website")} className={inputClass} />
          </Field>
          <Field label="Facebook хуудас">
            <input type="url" value={value.facebook_url ?? ""} onChange={set("facebook_url")} className={inputClass} />
          </Field>
          <Field label="LinkedIn хуудас">
            <input type="url" value={value.linkedin_url ?? ""} onChange={set("linkedin_url")} className={inputClass} />
          </Field>
        </div>
        <Field label="Нэвтрэх имэйл" hint="Нэвтрэх имэйлийг энд өөрчлөх боломжгүй.">
          <input type="email" disabled value={value.email} className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`} />
        </Field>
      </Section>

      {/* ҮЙЛДЛҮҮД */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          Цуцлах
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Хадгалж байна..." : "Өөрчлөлтийг хадгалах"}
        </button>
      </div>
    </form>
  )
}
