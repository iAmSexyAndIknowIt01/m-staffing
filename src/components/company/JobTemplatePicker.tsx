"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronLeft, FileText, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"
import type { JobTemplate } from "@/lib/jobTemplates"

interface JobTemplatePickerProps {
  templates: JobTemplate[]
  categoryLabel: string
  initialId?: string
  onClose: () => void
  onApply: (template: JobTemplate) => void
}

// Ангилалд тохирох загваруудаас урьдчилан харж сонгох цонх (эцэг нь нөхцөлтэйгөөр mount хийнэ)
export default function JobTemplatePicker({ templates, categoryLabel, initialId, onClose, onApply }: JobTemplatePickerProps) {
  const isClient = useIsClient()
  const [selectedId, setSelectedId] = useState(initialId ?? templates[0]?.id)
  // Mobile дээр жагсаалт эсвэл урьдчилсан харагдацын аль нэгийг харуулна
  const [mobileView, setMobileView] = useState<"list" | "preview">(initialId ? "preview" : "list")
  const selected = templates.find((tpl) => tpl.id === selectedId) ?? templates[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!isClient || !selected) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100000 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-template-title"
        className="relative w-full sm:max-w-3xl h-[88dvh] sm:h-[min(640px,88dvh)] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Толгой */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
          {mobileView === "preview" ? (
            <button
              type="button"
              onClick={() => setMobileView("list")}
              aria-label="Загварын жагсаалт руу буцах"
              className="sm:hidden w-9 h-9 -ml-2 shrink-0 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : null}
          <span className={`w-10 h-10 shrink-0 rounded-xl items-center justify-center bg-orange-50 text-orange-600 ${mobileView === "preview" ? "hidden sm:flex" : "flex"}`}>
            <FileText className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="job-template-title" className="text-base font-semibold text-gray-900 truncate">Загвар сонгох</h3>
            <p className="text-xs text-gray-400 truncate">{categoryLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* Жагсаалт */}
          <ul
            className={`sm:w-64 sm:shrink-0 sm:border-r border-gray-100 overflow-y-auto p-2 space-y-0.5 ${
              mobileView === "list" ? "w-full" : "hidden sm:block"
            }`}
            aria-label="Загварууд"
          >
            {templates.map((tpl) => {
              const active = tpl.id === selected.id
              return (
                <li key={tpl.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(tpl.id)
                      setMobileView("preview")
                    }}
                    aria-current={active}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-left text-sm transition ${
                      active ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{tpl.title}</span>
                    {active && <Check className="w-4 h-4 shrink-0 hidden sm:block" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Урьдчилсан харагдац */}
          <div className={`flex-1 min-w-0 overflow-y-auto p-5 space-y-5 ${mobileView === "preview" ? "block" : "hidden sm:block"}`}>
            <h4 className="text-lg font-semibold text-gray-900">{selected.title}</h4>
            {(
              [
                ["Ажлын үүрэг, тодорхойлолт", selected.description],
                ["Тавигдах шаардлага", selected.requirements],
              ] as const
            ).map(([label, text]) => (
              <section key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{text}</p>
              </section>
            ))}
            <p className="text-xs text-gray-400">Загварыг ашигласны дараа өөрийн байгууллагад тохируулан засах боломжтой.</p>
          </div>
        </div>

        <div className={`px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={() => onApply(selected)}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 inline-flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" /> Энэ загварыг ашиглах
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
