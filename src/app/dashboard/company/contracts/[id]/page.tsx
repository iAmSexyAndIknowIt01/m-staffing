"use client"

import BackToListLink from "@/components/contracts/BackToListLink"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import ContractDocument from "@/components/contracts/ContractDocument"
import ContractReasonDialog from "@/components/contracts/ContractReasonDialog"
import ContractStatusBadge from "@/components/contracts/ContractStatusBadge"
import { downloadContractPdf, formatDateTime } from "@/components/contracts/format"
import { SALARY_TYPE_LABELS, allowedActions } from "@/lib/contracts"
import { getErrorMessage } from "@/lib/errors"
import type { Contract, ContractAction, ContractEvent, ContractSalaryType, ContractTerms } from "@/types/contract"

interface TermsForm {
  position: string
  salary: string
  salary_type: ContractSalaryType
  start_date: string
  end_date: string
  work_hours: string
  location: string
  terms: string
}

const EVENT_LABELS: Record<string, string> = {
  create: "Ноорог үүсгэсэн",
  edit: "Нөхцөл зассан",
  send: "Ажилтанд илгээсэн",
  revise: "Засварлахаар буцаасан",
  cancel: "Цуцалсан",
  sign: "Гарын үсэг зурсан",
  decline: "Татгалзсан",
  terminate: "Гэрээг цуцалсан",
}

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"

function toForm(c: Contract): TermsForm {
  return {
    position: c.position,
    salary: String(c.salary),
    salary_type: c.salary_type,
    start_date: c.start_date,
    end_date: c.end_date || "",
    work_hours: c.work_hours || "",
    location: c.location || "",
    terms: c.terms,
  }
}

async function fetchContract(id: string): Promise<{ data: Contract; events: ContractEvent[] }> {
  const res = await fetch(`/api/company/contracts/${id}`)
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || "Гэрээ татахад алдаа гарлаа")
  return { data: result.data, events: result.events || [] }
}

export default function CompanyContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [form, setForm] = useState<TermsForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showTerminate, setShowTerminate] = useState(false)
  const [exporting, setExporting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  function apply(result: { data: Contract; events: ContractEvent[] }) {
    setContract(result.data)
    setEvents(result.events)
    setForm(toForm(result.data))
  }

  const load = async () => apply(await fetchContract(id))

  useEffect(() => {
    fetchContract(id)
      .then((result) => {
        setContract(result.data)
        setEvents(result.events)
        setForm(toForm(result.data))
      })
      .catch((err) => setError(getErrorMessage(err, "Серверийн алдаа гарлаа")))
      .finally(() => setLoading(false))
  }, [id])

  async function saveTerms(): Promise<boolean> {
    if (!form) return false
    const payload: ContractTerms = {
      ...form,
      salary: Number(form.salary),
      end_date: form.end_date || null,
      work_hours: form.work_hours || null,
      location: form.location || null,
    }
    const res = await fetch(`/api/company/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Хадгалахад алдаа гарлаа")
    setContract(result.data)
    return true
  }

  async function runAction(action: ContractAction, reason?: string) {
    const res = await fetch(`/api/company/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Үйлдэл амжилтгүй боллоо")
  }

  async function handle(task: () => Promise<void>, successMessage: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await task()
      await load()
      setNotice(successMessage)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => handle(async () => { await saveTerms() }, "Ноорог хадгалагдлаа.")

  const handleSend = () => {
    if (!confirm("Гэрээг ажилтанд илгээх үү? Илгээсний дараа засахын тулд буцааж ноорог болгох шаардлагатай.")) return
    handle(async () => {
      await saveTerms()
      await runAction("send")
    }, "Гэрээ ажилтанд илгээгдлээ.")
  }

  const handleRevise = () => {
    if (!confirm("Гэрээг ноорог болгож засах уу? Ажилтан шинэ хувилбарыг дахин хүлээж авна.")) return
    handle(() => runAction("revise"), "Гэрээ ноорог төлөвт орлоо.")
  }

  const handleCancel = () => {
    if (!confirm("Энэ гэрээг цуцлах уу? Буцаах боломжгүй.")) return
    handle(() => runAction("cancel"), "Гэрээ цуцлагдлаа.")
  }

  const handleTerminate = (reason: string) =>
    handle(async () => {
      await runAction("terminate", reason)
      setShowTerminate(false)
    }, "Гэрээ цуцлагдлаа.")

  async function handleDownload() {
    if (!contract || !documentRef.current) return
    setExporting(true)
    try {
      await downloadContractPdf(documentRef.current, contract.contract_number)
    } catch (err) {
      console.error("PDF үүсгэхэд алдаа гарлаа:", err)
      alert("PDF татахад алдаа гарлаа.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingLayout loading={true} />

  if (!contract || !form) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 space-y-4">
        <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{error || "Гэрээ олдсонгүй."}</div>
        <BackToListLink href="/dashboard/company/contracts" className="text-sm font-bold text-indigo-600">← Гэрээ рүү буцах</BackToListLink>
      </div>
    )
  }

  const actions = allowedActions(contract.status, "company")
  const isDraft = contract.status === "draft"
  const set = (key: keyof TermsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-4 sm:px-0 pb-10 space-y-6">
      <div className="pt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <BackToListLink href="/dashboard/company/contracts" className="text-xs font-bold text-gray-400 hover:text-indigo-600">← Гэрээ</BackToListLink>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">{contract.position}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-mono">{contract.contract_number}</span>
            <span>·</span>
            <span>{contract.staff_name}</span>
            <ContractStatusBadge status={contract.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <button onClick={handleSave} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50">
                Хадгалах
              </button>
              <button onClick={handleSend} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50">
                Ажилтанд илгээх
              </button>
            </>
          )}
          {actions.includes("revise") && (
            <button onClick={handleRevise} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition disabled:opacity-50">
              Засварлах
            </button>
          )}
          {actions.includes("cancel") && (
            <button onClick={handleCancel} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition disabled:opacity-50">
              Цуцлах
            </button>
          )}
          {actions.includes("terminate") && (
            <button onClick={() => setShowTerminate(true)} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition disabled:opacity-50">
              Гэрээ цуцлах
            </button>
          )}
          {!isDraft && (
            <button onClick={handleDownload} disabled={exporting} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition disabled:opacity-50">
              {exporting ? "Бэлдэж байна..." : "PDF татах"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-500 font-bold rounded-2xl text-sm">{error}</div>}
      {notice && <div className="p-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl text-sm">{notice}</div>}

      {contract.status === "declined" && (
        <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm">
          Ажилтан гэрээнээс татгалзсан{contract.decline_reason ? `: ${contract.decline_reason}` : "."} Шаардлагатай бол анкетаас шинэ гэрээ үүсгэнэ үү.
        </div>
      )}

      {isDraft ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-gray-500">Албан тушаал *</span>
              <input value={form.position} onChange={set("position")} maxLength={200} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Цалин (₮) *</span>
              <input type="number" min={0} value={form.salary} onChange={set("salary")} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Цалингийн төрөл *</span>
              <select value={form.salary_type} onChange={set("salary_type")} className={inputClass}>
                {(Object.keys(SALARY_TYPE_LABELS) as ContractSalaryType[]).map((t) => (
                  <option key={t} value={t}>{SALARY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Эхлэх огноо *</span>
              <input type="date" value={form.start_date} onChange={set("start_date")} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Дуусах огноо (хоосон = хугацаагүй)</span>
              <input type="date" value={form.end_date} min={form.start_date} onChange={set("end_date")} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Ажлын цаг</span>
              <input value={form.work_hours} onChange={set("work_hours")} maxLength={200} placeholder="Даваа-Баасан 09:00-18:00" className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500">Ажлын байршил</span>
              <input value={form.location} onChange={set("location")} maxLength={200} className={inputClass} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-gray-500">Гэрээний нөхцөл *</span>
              <textarea value={form.terms} onChange={set("terms")} rows={12} maxLength={20000} className={inputClass} />
            </label>
          </div>
          <p className="text-xs text-gray-400">
            Илгээх үед таны нэрийн өмнөөс гарын үсэг зурсанд тооцогдоно. Ажилтан гарын үсэг зурсны дараа нөхцлийг өөрчлөх боломжгүй.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-x-auto">
          <ContractDocument contract={contract} ref={documentRef} />
        </div>
      )}

      {events.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-black text-gray-900 mb-3">Түүх</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3 text-xs text-gray-600">
                <span className="text-gray-400 w-36 shrink-0" suppressHydrationWarning>{formatDateTime(e.created_at)}</span>
                <span className="font-bold">{e.actor_role === "staff" ? "Ажилтан" : "Компани"}</span>
                <span>{EVENT_LABELS[e.action] || e.action}</span>
                {typeof e.meta?.reason === "string" && <span className="text-gray-400">— {e.meta.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showTerminate && (
        <ContractReasonDialog
          title="Гэрээ цуцлах"
          description="Цуцалсан шалтгааныг ажилтанд мэдэгдэнэ."
          confirmLabel="Цуцлах"
          busy={busy}
          onConfirm={handleTerminate}
          onClose={() => setShowTerminate(false)}
        />
      )}
    </div>
  )
}
