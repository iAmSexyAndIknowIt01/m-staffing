"use client"

import { useEffect, useState } from "react"
import { Loader2, Receipt } from "lucide-react"
import BackLink from "@/components/common/BackLink"
import EmptyState from "@/components/common/EmptyState"
import { InvoiceDetailModal, type BankAccount, type InvoiceRow } from "@/components/company/billing/BillingModals"
import { FilterChips, HistoryHero, HistorySkeleton, InvoiceTable, planName } from "@/components/company/billing/HistoryTables"
import { PAID_PLAN_TYPES, PLANS, type PaidPlanType } from "@/lib/planCatalog"

const PAGE_SIZE = 20

type StatusFilter = "" | "paid" | "pending" | "decline"
type PlanFilter = "" | PaidPlanType

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Бүх төлөв" },
  { value: "paid", label: "Төлөгдсөн" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "decline", label: "Цуцлагдсан" },
]

const PLAN_OPTIONS: { value: PlanFilter; label: string }[] = [
  { value: "", label: "Бүх багц" },
  ...PAID_PLAN_TYPES.map((plan) => ({ value: plan, label: PLANS[plan].name })),
]

// Төлбөрийн бүрэн түүх — төлөв, багцаар шүүж, 20-оор цааш ачаална
export default function InvoiceHistoryPage() {
  const [status, setStatus] = useState<StatusFilter>("")
  const [plan, setPlan] = useState<PlanFilter>("")
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [bank, setBank] = useState<BankAccount | null>(null)
  const [selected, setSelected] = useState<InvoiceRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (status) params.set("status", status)
    if (plan) params.set("plan", plan)
    fetch(`/api/company/billing/upgrade?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (!data.success) throw new Error(data.error || "Түүх татахад алдаа гарлаа.")
        setRows((prev) => (offset === 0 ? data.invoices : [...prev, ...data.invoices]))
        setTotal(data.total ?? 0)
        setBank(data.bank ?? null)
        setError(null)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Сүлжээний алдаа гарлаа."))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [status, plan, offset])

  const resetAnd = (apply: () => void) => {
    setLoading(true)
    setRows([])
    setOffset(0)
    apply()
  }

  const paidSum = rows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <BackLink href="/dashboard/company/billing" label="Багц, төлбөр" />

      <HistoryHero
        icon={Receipt}
        title="Төлбөр төлөлтийн түүх"
        description="Багц худалдан авалтын нэхэмжлэх, төлбөрийн төлөв."
        stats={[
          { label: "Нийт нэхэмжлэх", value: total },
          { label: "Төлөгдсөн (харагдаж буй)", value: paidSum, suffix: " ₮" },
        ]}
      />

      <div className="space-y-3">
        <FilterChips
          label="Төлбөрийн төлөв"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(next) => next !== status && resetAnd(() => setStatus(next))}
          delayBase={360}
        />
        <FilterChips
          label="Багц"
          options={PLAN_OPTIONS}
          value={plan}
          onChange={(next) => next !== plan && resetAnd(() => setPlan(next))}
          delayBase={560}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : rows.length > 0 ? (
        // key — шүүлтүүр солигдоход мөрүүд дахин гарч ирнэ
        <InvoiceTable key={`${status}-${plan}`} rows={rows} onDetail={setSelected} batch={PAGE_SIZE} />
      ) : loading ? (
        <HistorySkeleton columns={6} />
      ) : (
        <EmptyState
          compact
          illustration="folder"
          title="Нэхэмжлэх олдсонгүй"
          description={status || plan ? "Шүүлтүүрт тохирох нэхэмжлэх алга. Өөр шүүлтүүр сонгоно уу." : "Багц худалдаж авахад нэхэмжлэх энд харагдана."}
        />
      )}

      {rows.length > 0 && rows.length < total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setOffset(rows.length)
            }}
            disabled={loading}
            className="group inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-700 hover:shadow-md hover:shadow-orange-500/10 active:scale-95 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Цааш үзэх ({total - rows.length})
          </button>
        </div>
      )}

      {selected && (
        <InvoiceDetailModal invoice={selected} planLabel={planName(selected.plan_type)} bank={bank} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
