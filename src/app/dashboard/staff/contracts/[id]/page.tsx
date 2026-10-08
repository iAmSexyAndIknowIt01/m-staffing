"use client"

import BackToListLink from "@/components/contracts/BackToListLink"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import ContractDocument from "@/components/contracts/ContractDocument"
import ContractReasonDialog from "@/components/contracts/ContractReasonDialog"
import ContractStatusBadge from "@/components/contracts/ContractStatusBadge"
import { downloadContractPdf } from "@/components/contracts/format"
import { allowedActions } from "@/lib/contracts"
import { getErrorMessage } from "@/lib/errors"
import type { Contract, ContractAction } from "@/types/contract"

async function fetchContract(id: string): Promise<Contract> {
  const res = await fetch(`/api/staff/contracts/${id}`)
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || "Гэрээ татахад алдаа гарлаа")
  return result.data
}

export default function StaffContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [signedName, setSignedName] = useState("")
  const [agree, setAgree] = useState(false)
  const [dialog, setDialog] = useState<"decline" | "terminate" | null>(null)
  const [exporting, setExporting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchContract(id)
      .then(setContract)
      .catch((err) => setError(getErrorMessage(err, "Серверийн алдаа гарлаа")))
      .finally(() => setLoading(false))
  }, [id])

  async function runAction(action: ContractAction, extra: Record<string, unknown>, successMessage: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/staff/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Үйлдэл амжилтгүй боллоо")
      setContract(result.data)
      setDialog(null)
      setNotice(successMessage)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSign = () =>
    runAction("sign", { signed_name: signedName.trim(), agree, content_hash: contract?.content_hash }, "Гэрээнд амжилттай гарын үсэг зурлаа. 🎉")

  async function handleDownload() {
    if (!contract || !documentRef.current) return
    setExporting(true)
    setError(null)
    try {
      await downloadContractPdf(documentRef.current, contract.contract_number)
    } catch (err) {
      console.error("PDF үүсгэхэд алдаа гарлаа:", err)
      setError("PDF татахад алдаа гарлаа. Дахин оролдоно уу.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingLayout loading={true} />

  if (!contract) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 space-y-4">
        <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{error || "Гэрээ олдсонгүй."}</div>
        <BackToListLink href="/dashboard/staff/contracts" className="text-sm font-bold text-indigo-600">← Миний гэрээ рүү буцах</BackToListLink>
      </div>
    )
  }

  const actions = allowedActions(contract.status, "staff")
  const canSign = actions.includes("sign")

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-4 sm:px-0 pb-10 space-y-6">
      <div className="pt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <BackToListLink href="/dashboard/staff/contracts" className="text-xs font-bold text-gray-400 hover:text-indigo-600">← Миний гэрээ</BackToListLink>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">{contract.position}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-mono">{contract.contract_number}</span>
            <span>·</span>
            <span>{contract.company_name}</span>
            <ContractStatusBadge status={contract.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.includes("terminate") && (
            <button onClick={() => setDialog("terminate")} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition disabled:opacity-50">
              Гэрээ цуцлах
            </button>
          )}
          <button onClick={handleDownload} disabled={exporting} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition disabled:opacity-50">
            {exporting ? "Бэлдэж байна..." : "PDF татах"}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-500 font-bold rounded-2xl text-sm">{error}</div>}
      {notice && <div className="p-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl text-sm">{notice}</div>}

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-x-auto">
        <ContractDocument contract={contract} ref={documentRef} />
      </div>

      {canSign && (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">Гарын үсэг зурах</h2>
            <p className="text-sm text-gray-500 mt-1">
              Гэрээг анхааралтай уншаад зөвшөөрч байвал бүтэн нэрээ бичиж баталгаажуулна уу.
            </p>
          </div>
          <input
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            maxLength={200}
            placeholder={`Жишээ: ${contract.staff_name}`}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"
          />
          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            <span>Би гэрээний бүх нөхцлийг уншиж танилцсан бөгөөд зөвшөөрч байна.</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSign}
              disabled={busy || !agree || signedName.trim().length < 2}
              className="text-sm font-bold px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
            >
              {busy ? "Түр хүлээнэ үү..." : "Гарын үсэг зурах"}
            </button>
            <button
              onClick={() => setDialog("decline")}
              disabled={busy}
              className="text-sm font-bold px-5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition disabled:opacity-50"
            >
              Татгалзах
            </button>
          </div>
        </div>
      )}

      {dialog === "decline" && (
        <ContractReasonDialog
          title="Гэрээнээс татгалзах"
          description="Татгалзсан шалтгаанаа ажил олгогчид мэдэгдэх боломжтой."
          confirmLabel="Татгалзах"
          required={false}
          busy={busy}
          onConfirm={(reason) => runAction("decline", { reason }, "Гэрээнээс татгалзлаа.")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "terminate" && (
        <ContractReasonDialog
          title="Гэрээ цуцлах"
          description="Цуцалсан шалтгааныг ажил олгогчид мэдэгдэнэ."
          confirmLabel="Цуцлах"
          busy={busy}
          onConfirm={(reason) => runAction("terminate", { reason }, "Гэрээ цуцлагдлаа.")}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
