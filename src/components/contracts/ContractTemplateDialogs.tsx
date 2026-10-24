"use client"

import { Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { workHoursLines } from "@/lib/workSchedule"
import type { ContractTemplate } from "@/types/contract"
import { useDialogEscape } from "./ConfirmDialog"
import { formatSalary } from "./format"
import { useContractTemplates } from "./templateApi"

// Гэрээний ноорог дээрх загварын цонхнууд: загвар хэрэглэх, одоогийн нөхцлийг загвар болгох

const overlayClass = "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs px-4"
const cancelClass = "text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50"

function templateSummary(t: ContractTemplate): string {
  return [
    t.position,
    t.salary !== null && formatSalary(t.salary, t.salary_type),
    t.duration_months && `${t.duration_months} сар`,
    ...workHoursLines(t.work_hours),
  ].filter(Boolean).join(" · ")
}

interface TemplatePickerDialogProps {
  onApply: (template: ContractTemplate) => void
  onClose: () => void
}

export function TemplatePickerDialog({ onApply, onClose }: TemplatePickerDialogProps) {
  const { templates, loading, error } = useContractTemplates()
  useDialogEscape(onClose, false)

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="template-picker-title" className="text-lg font-bold text-gray-900">Загвар хэрэглэх</h3>
          <p className="text-sm text-gray-500 mt-1">
            Гэрээний нөхцөл загвараар солигдоно. Загварт хоосон талбар (албан тушаал, цалин г.м.) одоогийн утгаараа үлдэнэ.
          </p>
        </div>

        <div className="overflow-y-auto -mx-2 px-2 flex-1">
          {loading ? (
            <p className="text-sm text-gray-400 py-6 text-center">Ачаалж байна...</p>
          ) : error ? (
            <p role="alert" className="p-3 bg-red-50 text-red-500 font-bold rounded-xl text-sm">{error}</p>
          ) : templates.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center space-y-2">
              <p>Хадгалсан загвар алга.</p>
              <Link href="/dashboard/company/contracts?tab=templates" className="font-bold text-orange-600">Загвар үүсгэх →</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => onApply(t)}
                    className="w-full text-left p-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate">{t.name}</span>
                      {t.is_default && <span className="shrink-0 text-xs font-bold text-orange-600 bg-orange-50 rounded-md px-1.5 py-0.5"><Star size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Үндсэн</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{templateSummary(t) || "Зөвхөн гэрээний нөхцөл"}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className={cancelClass}>Болих</button>
        </div>
      </div>
    </div>
  )
}

interface SaveTemplateDialogProps {
  defaultName: string
  busy: boolean
  error: string | null
  onConfirm: (name: string, isDefault: boolean) => void
  onClose: () => void
}

export function SaveTemplateDialog({ defaultName, busy, error, onConfirm, onClose }: SaveTemplateDialogProps) {
  const [name, setName] = useState(defaultName.slice(0, 100))
  const [isDefault, setIsDefault] = useState(false)
  useDialogEscape(onClose, busy)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onConfirm(name.trim(), isDefault)
  }

  return (
    <div className={overlayClass} onClick={() => !busy && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-title"
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="save-template-title" className="text-lg font-bold text-gray-900">Загвар болгож хадгалах</h3>
          <p className="text-sm text-gray-500 mt-1">
            Албан тушаал, цалин, ажлын цаг, байршил, нөхцлийг загварт хадгална. Хугацааг «Загварууд» хэсэгт тохируулж болно.
          </p>
        </div>
        {error && <p role="alert" className="p-3 bg-red-50 text-red-500 font-bold rounded-xl text-sm">{error}</p>}
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-gray-500">Загварын нэр</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 rounded accent-orange-600" />
          <Star size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Үндсэн загвар болгох (шинэ гэрээнд автоматаар)
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={cancelClass}>Болих</button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="text-sm font-bold px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50"
          >
            {busy ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </form>
    </div>
  )
}
