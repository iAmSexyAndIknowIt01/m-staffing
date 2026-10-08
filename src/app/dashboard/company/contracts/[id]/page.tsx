"use client"

import BackToListLink from "@/components/contracts/BackToListLink"
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import ContractDocument from "@/components/contracts/ContractDocument"
import {
  ApplicantError,
  ApplicantJobSection,
  ApplicantLoading,
  ApplicantProfileSection,
  useApplicantDetail,
} from "@/components/contracts/ApplicantDetail"
import ConfirmDialog from "@/components/contracts/ConfirmDialog"
import ContractReasonDialog from "@/components/contracts/ContractReasonDialog"
import ContractStatusBadge from "@/components/contracts/ContractStatusBadge"
import TabSwitch, { tabPanelProps } from "@/components/contracts/TabSwitch"
import { useUnsavedChangesGuard } from "@/components/contracts/useUnsavedChangesGuard"
import { downloadContractPdf, formatDate, formatDateTime } from "@/components/contracts/format"
import {
  CONTRACT_ACTOR_LABELS,
  CONTRACT_EVENT_LABELS,
  RECREATABLE_STATUSES,
  SALARY_TYPE_LABELS,
  allowedActions,
  expiresSoonDays,
  sendBlockers,
  todayISO,
} from "@/lib/contracts"
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

type DetailTab = "contract" | "staff" | "job"
type DraftView = "edit" | "preview"
type PendingConfirm = "send" | "revise" | "cancel" | null

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "contract", label: "📑 Гэрээ" },
  { key: "staff", label: "👤 Ажилтан" },
  { key: "job", label: "💼 Ажлын байр" },
]

function toDetailTab(value: string | null): DetailTab {
  return value === "staff" || value === "job" ? value : "contract"
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

function toPayload(form: TermsForm): ContractTerms {
  return {
    ...form,
    salary: Number(form.salary),
    end_date: form.end_date || null,
    work_hours: form.work_hours || null,
    location: form.location || null,
  }
}

const sameForm = (a: TermsForm, b: TermsForm) => JSON.stringify(a) === JSON.stringify(b)

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
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null)
  const [draftView, setDraftView] = useState<DraftView>("edit")
  const [exporting, setExporting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  // Сонгосон таб URL-д (?tab=staff) хадгалагдана — хуудас сэргээхэд хэвээр үлдэнэ
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = toDetailTab(searchParams.get("tab"))
  const selectTab = (next: DetailTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "contract") params.delete("tab")
    else params.set("tab", next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Ажилтан / Ажлын байр табыг анх нээх үед л татна. Татсан мэдээлэл хадгалагдах тул
  // табуудын хооронд шилжихэд дахин хүсэлт явахгүй (хоёр таб нэг хүсэлтийг хуваалцана).
  const applicant = useApplicantDetail(contract?.job_request_id, tab !== "contract")

  // Ноорогт хадгалаагүй өөрчлөлт байгаа эсэх — хуудаснаас гарахаас өмнө асууна
  const isDraft = contract?.status === "draft"
  const dirty = Boolean(isDraft && contract && form && !sameForm(form, toForm(contract)))
  const leaveGuard = useUnsavedChangesGuard(dirty)

  function apply(result: { data: Contract; events: ContractEvent[] }) {
    setContract(result.data)
    setEvents(result.events)
    setForm(toForm(result.data))
  }

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

  async function saveTerms() {
    if (!form) return
    const res = await fetch(`/api/company/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || "Хадгалахад алдаа гарлаа")
    setContract((prev) => (prev ? { ...result.data, viewed_at: prev.viewed_at } : result.data))
    setForm(toForm(result.data))
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

  // Үйлдэл амжилттай болсны дараа мэдээллийг дахин татна. Дахин татахад алдаа гарсан ч
  // үйлдэл өөрөө амжилттай болсныг харуулна (өмнө нь бүхэлдээ алдаа гэж харагддаг байсан).
  async function handle(task: () => Promise<void>, successMessage: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await task()
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
      return false
    }
    setNotice(successMessage)
    try {
      apply(await fetchContract(id))
    } catch {
      setError("Мэдээллийг шинэчилж чадсангүй. Хуудсаа сэргээнэ үү.")
    } finally {
      setBusy(false)
    }
    return true
  }

  const handleSave = () => handle(saveTerms, "Ноорог хадгалагдлаа.")

  const confirmAction = async () => {
    const kind = pendingConfirm
    if (!kind) return
    const ok =
      kind === "send"
        ? await handle(async () => {
            if (dirty) await saveTerms()
            await runAction("send")
          }, "Гэрээ ажилтанд илгээгдлээ.")
        : kind === "revise"
          ? await handle(() => runAction("revise"), "Гэрээ ноорог төлөвт орлоо. Ажилтанд мэдэгдлээ.")
          : await handle(() => runAction("cancel"), "Гэрээ цуцлагдлаа.")
    if (ok) setDraftView("edit")
    setPendingConfirm(null)
  }

  const handleTerminate = (reason: string) =>
    handle(async () => {
      await runAction("terminate", reason)
      setShowTerminate(false)
    }, "Гэрээ цуцлагдлаа.")

  // Татгалзсан / цуцалсан / хугацаа дууссан гэрээний анкетаас шинэ ноорог үүсгэнэ
  async function handleRecreate() {
    if (!contract) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/company/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_request_id: contract.job_request_id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Гэрээ үүсгэж чадсангүй")
      router.push(`/dashboard/company/contracts/${result.data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setBusy(false)
    }
  }

  async function handleDownload() {
    if (!contract) return
    setExporting(true)
    setError(null)
    try {
      // PDF нь Гэрээ табын баримтаас үүснэ — өөр таб нээлттэй бол эхлээд түүнийг харуулна
      if (tab !== "contract") {
        selectTab("contract")
        for (let i = 0; i < 20 && !documentRef.current; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }
      if (!documentRef.current) throw new Error("Гэрээний баримт ачаалагдаагүй байна")
      await downloadContractPdf(documentRef.current, contract.contract_number)
    } catch (err) {
      console.error("PDF үүсгэхэд алдаа гарлаа:", err)
      setError("PDF татахад алдаа гарлаа. Дахин оролдоно уу.")
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
  const canRecreate = RECREATABLE_STATUSES.includes(contract.status)
  const blockers = isDraft ? sendBlockers(toPayload(form)) : []
  const startInPast = isDraft && form.start_date !== "" && form.start_date < todayISO()
  const expiresIn = expiresSoonDays(contract)
  const previewContract: Contract = { ...contract, ...toPayload(form) }
  const set = (key: keyof TermsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const buttonClass = "text-sm font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-4 sm:px-0 pb-10 space-y-6">
      <div className="pt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <BackToListLink href="/dashboard/company/contracts" className="text-xs font-bold text-gray-400 hover:text-indigo-600">← Гэрээ</BackToListLink>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">{contract.position}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-mono">{contract.contract_number}</span>
            <span>·</span>
            <span>{contract.staff_name}</span>
            <ContractStatusBadge status={contract.status} />
            {contract.status === "sent" && (
              <span className={contract.viewed_at ? "text-emerald-600 font-semibold" : "text-gray-400"} suppressHydrationWarning>
                {contract.viewed_at ? `👁 Ажилтан нээж үзсэн: ${formatDateTime(contract.viewed_at)}` : "👁 Ажилтан хараахан нээгээгүй"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <button onClick={handleSave} disabled={busy || !dirty} className={`${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-700`}>
                {dirty ? "Хадгалах" : "Хадгалсан"}
              </button>
              <button
                onClick={() => setPendingConfirm("send")}
                disabled={busy || blockers.length > 0}
                title={blockers[0]}
                className={`${buttonClass} bg-emerald-500 hover:bg-emerald-600 text-white`}
              >
                Ажилтанд илгээх
              </button>
            </>
          )}
          {actions.includes("revise") && (
            <button onClick={() => setPendingConfirm("revise")} disabled={busy} className={`${buttonClass} bg-indigo-50 hover:bg-indigo-100 text-indigo-600`}>
              Засварлах
            </button>
          )}
          {actions.includes("cancel") && (
            <button onClick={() => setPendingConfirm("cancel")} disabled={busy} className={`${buttonClass} bg-rose-50 hover:bg-rose-100 text-rose-600`}>
              Цуцлах
            </button>
          )}
          {actions.includes("terminate") && (
            <button onClick={() => setShowTerminate(true)} disabled={busy} className={`${buttonClass} bg-rose-50 hover:bg-rose-100 text-rose-600`}>
              Гэрээ цуцлах
            </button>
          )}
          {canRecreate && (
            <button onClick={handleRecreate} disabled={busy} className={`${buttonClass} bg-indigo-500 hover:bg-indigo-600 text-white`}>
              📑 Шинэ гэрээ үүсгэх
            </button>
          )}
          {!isDraft && (
            <button onClick={handleDownload} disabled={busy || exporting} className={`${buttonClass} bg-gray-900 hover:bg-gray-800 text-white`}>
              {exporting ? "Бэлдэж байна..." : "PDF татах"}
            </button>
          )}
        </div>
      </div>

      {error && <div role="alert" className="p-4 bg-red-50 text-red-500 font-bold rounded-2xl text-sm">{error}</div>}
      {notice && <div role="status" className="p-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl text-sm">{notice}</div>}

      {expiresIn !== null && (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-sm" suppressHydrationWarning>
          ⏳ Гэрээ {formatDate(contract.end_date)}-нд дуусна ({expiresIn === 0 ? "өнөөдөр" : `${expiresIn} хоног үлдлээ`}).
          Үргэлжлүүлэн хамтран ажиллах бол хугацаа дуусахаас өмнө шинэ гэрээ байгуулна уу.
        </div>
      )}

      <TabSwitch idPrefix="contract-detail" ariaLabel="Гэрээний мэдээлэл" tabs={DETAIL_TABS} value={tab} onChange={selectTab} />

      {tab === "staff" && (
        <div {...tabPanelProps("contract-detail", "staff")} className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-sm">
          {applicant.loading ? (
            <ApplicantLoading />
          ) : applicant.error || !applicant.profile ? (
            <ApplicantError message={applicant.error} />
          ) : (
            <ApplicantProfileSection profile={applicant.profile} />
          )}
        </div>
      )}

      {tab === "job" && (
        <div {...tabPanelProps("contract-detail", "job")} className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-sm">
          {applicant.loading ? (
            <ApplicantLoading />
          ) : applicant.error ? (
            <ApplicantError message={applicant.error} />
          ) : (
            <ApplicantJobSection application={applicant.application} full />
          )}
        </div>
      )}

      {tab === "contract" && (
        <div {...tabPanelProps("contract-detail", "contract")} className="space-y-6">
          {contract.status === "declined" && (
            <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm">
              Ажилтан гэрээнээс татгалзсан{contract.decline_reason ? `: ${contract.decline_reason}` : "."} Нөхцлийг өөрчилж дахин санал болгох бол «Шинэ гэрээ үүсгэх» дарна уу.
            </div>
          )}

          {isDraft && (
            <div className="inline-flex bg-gray-100/80 p-1 rounded-xl text-xs font-bold">
              {(["edit", "preview"] as DraftView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setDraftView(view)}
                  aria-pressed={draftView === view}
                  className={`px-4 py-2 rounded-lg transition ${draftView === view ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {view === "edit" ? "✏️ Засах" : "👁 Ажилтанд харагдах байдал"}
                </button>
              ))}
            </div>
          )}

          {isDraft && draftView === "edit" ? (
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
                  {startInPast && (
                    <span className="block text-[11px] font-semibold text-amber-600">
                      ⚠️ Эхлэх огноо өнгөрсөн өдөр байна. Зориуд биш бол шинэчилнэ үү.
                    </span>
                  )}
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
              {blockers.length > 0 && (
                <ul className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs font-semibold text-amber-700 space-y-1">
                  {blockers.map((b) => (
                    <li key={b}>⚠️ Илгээхийн өмнө: {b}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-400">
                Илгээх үед таны нэрийн өмнөөс гарын үсэг зурсанд тооцогдоно. Ажилтан гарын үсэг зурсны дараа нөхцлийг өөрчлөх боломжгүй.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-x-auto">
              {isDraft ? (
                // Урьдчилан харах: хадгалаагүй өөрчлөлтийг ч оруулж, илгээсний дараа ажилтанд яг ингэж харагдана
                <ContractDocument contract={previewContract} />
              ) : (
                <ContractDocument contract={contract} ref={documentRef} />
              )}
            </div>
          )}

          {events.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 mb-3">Түүх</h2>
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap gap-x-3 text-xs text-gray-600">
                    <span className="text-gray-400 w-36 shrink-0" suppressHydrationWarning>{formatDateTime(e.created_at)}</span>
                    <span className="font-bold">{CONTRACT_ACTOR_LABELS[e.actor_role] || e.actor_role}</span>
                    <span>{CONTRACT_EVENT_LABELS[e.action] || e.action}</span>
                    {typeof e.meta?.reason === "string" && <span className="text-gray-400">— {e.meta.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {pendingConfirm === "send" && (
        <ConfirmDialog
          title="Гэрээг ажилтанд илгээх үү?"
          description={
            <>
              <p>Илгээснээр таны нэрийн өмнөөс гарын үсэг зурсанд тооцогдоно. Дахин засахын тулд «Засварлах» дарж ноорог болгох шаардлагатай.</p>
              {dirty && <p className="text-gray-700 font-semibold">Хадгалаагүй өөрчлөлтийг хадгалаад илгээнэ.</p>}
              {startInPast && <p className="text-amber-600 font-semibold">⚠️ Эхлэх огноо ({formatDate(form.start_date)}) өнгөрсөн өдөр байна.</p>}
            </>
          }
          confirmLabel="Илгээх"
          busy={busy}
          onConfirm={confirmAction}
          onClose={() => setPendingConfirm(null)}
        />
      )}

      {pendingConfirm === "revise" && (
        <ConfirmDialog
          title="Гэрээг засварлах уу?"
          description="Гэрээ ноорог болж ажилтны гарын үсэг зурах боломж хаагдана. Ажилтанд имэйлээр мэдэгдэнэ. Засаад дахин илгээхэд ажилтан шинэ хувилбарыг хүлээж авна."
          confirmLabel="Ноорог болгох"
          busy={busy}
          onConfirm={confirmAction}
          onClose={() => setPendingConfirm(null)}
        />
      )}

      {pendingConfirm === "cancel" && (
        <ConfirmDialog
          title="Гэрээг цуцлах уу?"
          description={
            contract.status === "sent"
              ? "Ажилтанд илгээсэн гэрээ цуцлагдаж, ажилтанд имэйлээр мэдэгдэнэ. Буцаах боломжгүй."
              : "Энэ ноорог цуцлагдана. Буцаах боломжгүй."
          }
          confirmLabel="Цуцлах"
          tone="danger"
          busy={busy}
          onConfirm={confirmAction}
          onClose={() => setPendingConfirm(null)}
        />
      )}

      {leaveGuard.blocked && (
        <ConfirmDialog
          title="Хадгалаагүй өөрчлөлт байна"
          description="Ноорогт хийсэн өөрчлөлт хадгалагдаагүй байна. Хадгалахгүйгээр гарвал өөрчлөлт устна."
          confirmLabel="Хадгалахгүй гарах"
          cancelLabel="Үлдэх"
          tone="danger"
          onConfirm={leaveGuard.proceed}
          onClose={leaveGuard.stay}
        />
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
