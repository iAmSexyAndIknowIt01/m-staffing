"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronLeft, FileText, Search, Sparkles, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"
import { adaptTemplateToJobType, type JobTemplate } from "@/lib/jobTemplates"

interface JobTemplatePickerProps {
  templates: JobTemplate[]
  categoryLabel: string
  // Сонгосон ажлын төрөл (parttime г.м.) — урьдчилсан харагдацад тухайн төрлийн мөрүүдийг нэмж харуулна
  jobType: string
  initialId?: string
  onClose: () => void
  // Үндсэн (тааруулаагүй) загварыг буцаана — форм өөрөө ажлын төрөлд тааруулна
  onApply: (template: JobTemplate) => void
}

// «• мөр» хэлбэрийн текстийг мөр болгон задлана
function bulletLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean)
}

// Ангилалд тохирох загваруудаас урьдчилан харж сонгох цонх (эцэг нь нөхцөлтэйгөөр mount хийнэ)
export default function JobTemplatePicker({ templates, categoryLabel, jobType, initialId, onClose, onApply }: JobTemplatePickerProps) {
  const isClient = useIsClient()
  const [selectedId, setSelectedId] = useState(initialId ?? templates[0]?.id)
  const [query, setQuery] = useState("")
  // Mobile дээр жагсаалт эсвэл урьдчилсан харагдацын аль нэгийг харуулна
  const [mobileView, setMobileView] = useState<"list" | "preview">(initialId ? "preview" : "list")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? templates.filter((tpl) => tpl.title.toLowerCase().includes(q)) : templates
  }, [templates, query])

  const base = templates.find((tpl) => tpl.id === selectedId) ?? templates[0]
  const adapted = base ? adaptTemplateToJobType(base, jobType) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!isClient || !base || !adapted) return null

  const sections = [
    { label: "Ажлын үүрэг, тодорхойлолт", lines: bulletLines(base.description), added: adapted.added.description },
    { label: "Тавигдах шаардлага", lines: bulletLines(base.requirements), added: adapted.added.requirements },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-100000 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-template-title"
        className="relative w-full sm:max-w-3xl h-[88dvh] sm:h-[min(680px,88dvh)] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
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
            <p className="text-xs text-gray-400 truncate">
              {categoryLabel} · {templates.length} загвар
            </p>
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
          {/* Жагсаалт + хайлт */}
          <div className={`sm:w-64 sm:shrink-0 sm:border-r border-gray-100 flex-col min-h-0 ${mobileView === "list" ? "flex w-full" : "hidden sm:flex"}`}>
            <div className="p-2 pb-1">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Албан тушаал хайх..."
                  aria-label="Албан тушаалаар хайх"
                  className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                />
              </label>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 pt-1 space-y-0.5" aria-label="Загварууд">
              {filtered.map((tpl) => {
                const active = tpl.id === base.id
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(tpl.id)
                        setMobileView("preview")
                      }}
                      aria-current={active}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition ${
                        active ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{tpl.title}</span>
                      {active && <Check className="w-4 h-4 shrink-0 hidden sm:block" aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-gray-400">«{query}» олдсонгүй</li>
              )}
            </ul>
          </div>

          {/* Урьдчилсан харагдац */}
          <div className={`flex-1 min-w-0 overflow-y-auto p-5 space-y-5 ${mobileView === "preview" ? "block" : "hidden sm:block"}`}>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{base.title}</h4>
              {adapted.jobTypeLabel && (
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                  <Sparkles className="w-3 h-3" aria-hidden="true" /> «{adapted.jobTypeLabel}» ажилд тааруулсан мөрүүд ногоон өнгөтэй
                </p>
              )}
            </div>
            {sections.map((section) => (
              <section key={section.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{section.label}</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                  {section.lines.map((line) => (
                    <li key={line} className="flex gap-2 text-gray-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                  {section.added.map((line) => (
                    <li key={line} className="flex gap-2 rounded-lg bg-emerald-50/70 px-2 py-1 -mx-2 text-emerald-800">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
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
            onClick={() => onApply(base)}
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
