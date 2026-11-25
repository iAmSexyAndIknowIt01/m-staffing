"use client"

import { useEffect, useState } from "react"
import { Coins, Loader2 } from "lucide-react"
import BackLink from "@/components/common/BackLink"
import EmptyState from "@/components/common/EmptyState"
import { FilterChips, HistoryHero, HistorySkeleton, TokenUsageTable, type TokenUsageRow } from "@/components/company/billing/HistoryTables"
import { TOKEN_ACTION_LABELS, TOKEN_COSTS, type TokenAction } from "@/lib/planCatalog"

const PAGE_SIZE = 20

type ReasonFilter = "" | TokenAction

const REASON_OPTIONS: { value: ReasonFilter; label: string }[] = [
  { value: "", label: "Бүгд" },
  ...(Object.keys(TOKEN_COSTS) as TokenAction[]).map((action) => ({ value: action, label: TOKEN_ACTION_LABELS[action] })),
]

// M токен зарцуулалтын бүрэн түүх — үйлдлийн төрлөөр шүүж, 20-оор цааш ачаална
export default function TokenHistoryPage() {
  const [reason, setReason] = useState<ReasonFilter>("")
  const [rows, setRows] = useState<TokenUsageRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (reason) params.set("reason", reason)
    fetch(`/api/company/billing/tokens?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (!data.success) throw new Error(data.error || "Түүх татахад алдаа гарлаа.")
        setRows((prev) => (offset === 0 ? data.usage : [...prev, ...data.usage]))
        setTotal(data.total ?? 0)
        setError(null)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Сүлжээний алдаа гарлаа."))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [reason, offset])

  const changeReason = (next: ReasonFilter) => {
    if (next === reason) return
    setLoading(true)
    setRows([])
    setOffset(0)
    setReason(next)
  }

  const loadMore = () => {
    setLoading(true)
    setOffset(rows.length)
  }

  const spent = rows.reduce((sum, row) => sum + row.tokens, 0)

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <BackLink href="/dashboard/company/billing" label="Багц, төлбөр" />

      <HistoryHero
        icon={Coins}
        title="Токен зарцуулалт"
        description="Зар нийтлэх, дахин нээх, сунгах, ажилтанд хүсэлт илгээхэд зарцуулсан M токен."
        stats={[
          { label: "Нийт бичлэг", value: total },
          { label: "Харагдаж буй токен", value: spent },
        ]}
      />

      <FilterChips label="Үйлдлийн төрөл" options={REASON_OPTIONS} value={reason} onChange={changeReason} delayBase={360} />

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : rows.length > 0 ? (
        // key — шүүлтүүр солигдоход мөрүүд дахин гарч ирнэ
        <TokenUsageTable key={reason || "all"} rows={rows} batch={PAGE_SIZE} />
      ) : loading ? (
        <HistorySkeleton columns={4} />
      ) : (
        <EmptyState
          compact
          illustration="folder"
          title="Зарцуулалт олдсонгүй"
          description={reason ? "Энэ төрлийн зарцуулалт алга. Өөр шүүлтүүр сонгоно уу." : "Зарцуулсан токен энд харагдана."}
        />
      )}

      {rows.length > 0 && rows.length < total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="group inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-700 hover:shadow-md hover:shadow-orange-500/10 active:scale-95 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Цааш үзэх ({total - rows.length})
          </button>
        </div>
      )}
    </div>
  )
}
