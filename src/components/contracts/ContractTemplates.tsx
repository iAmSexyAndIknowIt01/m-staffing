"use client"

import Link from "next/link"
import { Copy, Pencil, Star, Trash2, Briefcase, ClipboardList, Clock, FileText, FolderOpen, Hourglass, Plus, Search, Wallet } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import { MAX_TEMPLATES_PER_COMPANY } from "@/lib/contractTemplates"
import { getErrorMessage } from "@/lib/errors"
import { workHoursLines } from "@/lib/workSchedule"
import type { ContractTemplate, ContractTemplateInput } from "@/types/contract"
import ConfirmDialog from "./ConfirmDialog"
import ContractTemplateForm from "./ContractTemplateForm"
import { STARTER_TEMPLATES } from "./starterTemplates"
import { createTemplate, deleteTemplate, updateTemplate, useContractTemplates } from "./templateApi"
import { formatDate, formatSalary } from "./format"

// Компанийн "Гэрээ" хуудасны "Загварууд" таб: ижил агуулгатай гэрээг дахин дахин бичихгүйн тулд
// нөхцөл, ажлын цаг, хугацааг загвар болгон хадгална.

type Editing = { kind: "new"; initial?: ContractTemplateInput } | { kind: "edit"; template: ContractTemplate } | null

const SEARCH_THRESHOLD = 4 // үүнээс олон загвартай үед хайлт харуулна
const NOTICE_MS = 4000
const HIGHLIGHT_MS = 2500

const copyName = (name: string) => `${name.slice(0, 90)} (хуулбар)`

const iconButtonBase =
  "w-9 h-9 inline-flex items-center justify-center rounded-xl transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
const iconButtonClass = `${iconButtonBase} text-gray-400 hover:bg-gray-100 hover:text-gray-700`

// Жагсаалтын багана (md-ээс дээш). Толгой мөр тусдаа grid тул тогтмол өргөнтэй баганаар зэрэгцүүлнэ.
// Гар утсанд баганууд нуугдаж, мөрийн доор товч мэдээлэл болно.
const LIST_COLUMNS =
  "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_4.5rem_minmax(0,1.2fr)_15.5rem] md:items-center md:gap-4"

// Загварын утга, хоосон бол fallback-ийг бүдэг харуулна
function Value({ value, fallback = "Ажлын зараас" }: { value: string | null; fallback?: string }) {
  return (
    <span className={value ? "font-semibold text-gray-700" : "text-gray-400"} title={value ?? undefined}>
      {value ?? fallback}
    </span>
  )
}

export default function ContractTemplates() {
  const { templates, loading, error, reload } = useContractTemplates()
  const [editing, setEditing] = useState<Editing>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ContractTemplate | null>(null)
  const [query, setQuery] = useState("")

  // Амжилтын мэдэгдэл, шинэ/зассан картын тодруулга хэсэг хугацааны дараа арилна
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!highlightId) return
    document.getElementById(`template-${highlightId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [highlightId, templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => [t.name, t.position, t.terms].some((v) => v?.toLowerCase().includes(q)))
  }, [templates, query])

  const atLimit = templates.length >= MAX_TEMPLATES_PER_COMPANY

  // Амжилттай бол буцаасан загварыг тодруулна
  async function run(task: () => Promise<ContractTemplate | void>, success: string, onError: (message: string) => void) {
    setBusy(true)
    setNotice(null)
    setActionError(null)
    try {
      const result = await task()
      await reload()
      setNotice(success)
      if (result) setHighlightId(result.id)
      return true
    } catch (err) {
      onError(getErrorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (input: ContractTemplateInput) => {
    if (!editing) return
    setFormError(null)
    const ok = await run(
      () => (editing.kind === "new" ? createTemplate(input) : updateTemplate(editing.template.id, input)),
      editing.kind === "new" ? `«${input.name}» загвар нэмэгдлээ.` : `«${input.name}» загвар хадгалагдлаа.`,
      setFormError
    )
    if (ok) setEditing(null)
  }

  const toggleDefault = (t: ContractTemplate) =>
    run(
      () => updateTemplate(t.id, { ...t, is_default: !t.is_default }),
      t.is_default ? `«${t.name}» үндсэн загвар биш боллоо.` : `«${t.name}» үндсэн загвар боллоо. Шинэ гэрээнд автоматаар сонгогдоно.`,
      setActionError
    )

  const duplicate = (t: ContractTemplate) =>
    run(() => createTemplate({ ...t, name: copyName(t.name), is_default: false }), `«${t.name}» загварыг хуулбарлалаа.`, setActionError)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await run(() => deleteTemplate(pendingDelete.id), `«${pendingDelete.name}» загвар устлаа.`, setActionError)
    setPendingDelete(null)
  }

  const openEditor = (next: Editing) => {
    setFormError(null)
    setActionError(null)
    setNotice(null)
    setEditing(next)
  }

  if (editing) {
    return (
      <ContractTemplateForm
        key={editing.kind === "edit" ? editing.template.id : "new"}
        initial={editing.kind === "edit" ? editing.template : editing.initial}
        isNew={editing.kind === "new"}
        busy={busy}
        error={formError}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />
    )
  }

  if (loading) return <LoadingLayout loading={true} />

  if (error) return <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{error}</div>

  const newButton = (
    <button
      onClick={() => openEditor({ kind: "new" })}
      disabled={atLimit}
      title={atLimit ? `${MAX_TEMPLATES_PER_COMPANY} хүртэл загвар хадгална` : undefined}
      className="shrink-0 text-sm font-bold px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50"
    >
      <Plus size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Шинэ загвар
    </button>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      {notice && <div role="status" className="p-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl text-sm animate-fade-in">{notice}</div>}
      {actionError && <div role="alert" className="p-4 bg-red-50 text-red-500 font-bold rounded-2xl text-sm">{actionError}</div>}

      {templates.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl sm:rounded-4xl shadow-sm p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-md mx-auto">
            <span className="text-3xl sm:text-4xl block mb-3"><FolderOpen size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></span>
            <h2 className="font-black text-gray-900 text-base sm:text-lg">Гэрээгээ дахин дахин бичих хэрэггүй</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Байнга хэрэглэдэг нөхцөл, ажлын цаг, хугацааг загвар болгоод гэрээ үүсгэхдээ нэг товшилтоор бөглөнө.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 mb-2 text-center">Жишээнээс эхлэх</div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STARTER_TEMPLATES.map((s) => (
                <li key={s.title}>
                  <button
                    onClick={() => openEditor({ kind: "new", initial: s.template })}
                    className="w-full h-full text-left p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  >
                    <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center" aria-hidden><s.icon className="w-5 h-5" /></span>
                    <div className="font-bold text-sm text-gray-900 mt-2">{s.title}</div>
                    <div className="text-xs text-gray-500">{s.description}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center gap-2">
            {newButton}
            <p className="text-[11px] text-gray-400 text-center">Эсвэл бэлэн гэрээний ноорог дээрээс «<FolderOpen size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Загвар болгож хадгалах» дарна.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {templates.length > SEARCH_THRESHOLD ? (
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden><Search size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Загварын нэр, албан тушаал, нөхцлөөр хайх..."
                  aria-label="Загвар хайх"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"
                />
              </div>
            ) : (
              <p className="flex-1 text-xs text-gray-500">
                Гэрээ үүсгэхдээ загвар сонгох, эсвэл ноорог дээр «<ClipboardList size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Загвар хэрэглэх» дарж бөглөнө.
              </p>
            )}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                {templates.length} / {MAX_TEMPLATES_PER_COMPANY} загвар
              </span>
              {newButton}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 bg-white border border-gray-100 rounded-3xl text-center text-gray-400 shadow-sm text-sm">
              «{query}» хайлтад тохирох загвар алга.{" "}
              <button onClick={() => setQuery("")} className="font-bold text-orange-600">Цэвэрлэх</button>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl sm:rounded-4xl shadow-sm overflow-hidden">
              <div className={`hidden ${LIST_COLUMNS} px-6 py-4 border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider`} aria-hidden>
                <span>Загвар</span>
                <span>Албан тушаал, цалин</span>
                <span>Хугацаа</span>
                <span>Ажлын цаг</span>
                <span className="text-right">Үйлдэл</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {filtered.map((t) => {
                  const hours = workHoursLines(t.work_hours)
                  const highlighted = highlightId === t.id
                  const salary = t.salary !== null ? formatSalary(t.salary, t.salary_type) : null
                  const duration = t.duration_months ? `${t.duration_months} сар` : null
                  return (
                    <li
                      key={t.id}
                      id={`template-${t.id}`}
                      className={`${LIST_COLUMNS} px-4 sm:px-6 py-4 transition-colors duration-500 ${highlighted ? "bg-emerald-50" : "hover:bg-gray-50/50"}`}
                    >
                      {/* Загварын нэр + нөхцлийн эхлэл */}
                      <div className="min-w-0 flex items-start justify-between gap-3">
                        <button
                          onClick={() => openEditor({ kind: "edit", template: t })}
                          disabled={busy}
                          className="min-w-0 text-left group focus:outline-none"
                          title="Загвар засах"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 truncate group-hover:text-orange-600 group-focus-visible:underline transition">{t.name}</span>
                            {t.is_default && (
                              <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5"><Star size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Үндсэн</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5" title={t.terms}>{t.terms.split("\n")[0]}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5" suppressHydrationWarning>Шинэчилсэн: {formatDate(t.updated_at)}</p>
                        </button>
                      </div>
  
                      {/* Гар утсанд: товч мэдээлэл нэг хэсэгт */}
                      <div className="md:hidden mt-2 text-xs space-y-0.5">
                        <div className="truncate"><Briefcase size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> <Value value={t.position} /> · <Wallet size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> <Value value={salary} /></div>
                        <div className="truncate"><Hourglass size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> <Value value={duration} fallback="Хугацаа гэрээ бүрт" /> · <Clock size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> <Value value={hours.length ? hours.join(", ") : null} fallback="Цаг гэрээ бүрт" /></div>
                      </div>
  
                      <div className="hidden md:block min-w-0 text-xs space-y-0.5">
                        <div className="truncate"><Value value={t.position} /></div>
                        <div className="truncate"><Value value={salary} /></div>
                      </div>
                      <div className="hidden md:block text-xs">
                        <Value value={duration} fallback="Гэрээ бүрт" />
                      </div>
                      <div className="hidden md:block min-w-0 text-xs space-y-0.5">
                        {hours.length ? hours.map((h) => <div key={h} className="truncate font-semibold text-gray-700" title={h}>{h}</div>) : <Value value={null} fallback="Гэрээ бүрт" />}
                      </div>
  
                      <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end gap-1">
                        <Link
                          href={`/dashboard/company/contracts?tab=new&n_tpl=${encodeURIComponent(t.id)}`}
                          title="Энэ загвараар гэрээ үүсгэх"
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition md:mr-1"
                        >
                          <FileText size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Гэрээ үүсгэх
                        </Link>
                        <div className="flex shrink-0">
                          <button onClick={() => openEditor({ kind: "edit", template: t })} disabled={busy} className={iconButtonClass} title="Засах" aria-label={`«${t.name}» засах`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => duplicate(t)} disabled={busy || atLimit} className={iconButtonClass} title="Хуулбарлах" aria-label={`«${t.name}» хуулбарлах`}>
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleDefault(t)}
                            disabled={busy}
                            className={t.is_default ? `${iconButtonBase} text-amber-500 hover:bg-amber-50 hover:text-amber-600` : iconButtonClass}
                            title={t.is_default ? "Үндсэнээс хасах" : "Үндсэн загвар болгох"}
                            aria-label={t.is_default ? `«${t.name}» үндсэнээс хасах` : `«${t.name}» үндсэн болгох`}
                            aria-pressed={t.is_default}
                          >
                            <Star className="w-4 h-4" fill={t.is_default ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={() => setPendingDelete(t)}
                            disabled={busy}
                            className={`${iconButtonBase} text-gray-400 hover:bg-rose-50 hover:text-rose-600`}
                            title="Устгах"
                            aria-label={`«${t.name}» устгах`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Загвар устгах уу?"
          description={`«${pendingDelete.name}» загвар устгагдана. Энэ загвараар үүсгэсэн гэрээнүүдэд нөлөөлөхгүй.`}
          confirmLabel="Устгах"
          tone="danger"
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
