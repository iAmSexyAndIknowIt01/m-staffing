"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Receipt,
  RotateCw,
  Search,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import PendingCompanies from "@/components/admin/PendingCompanies"
import { showAlert, showConfirm } from "@/components/common/AppDialog"
import { PLANS, isPlanType } from "@/lib/planCatalog"

interface AdminInvoice {
  id: string
  invoice_number: string
  plan_type: string
  amount: number
  status: string
  created_at: string
  user_id: string
  company_name: string | null
  company_email: string | null
  company_phone: string | null
}

type StatusFilter = "pending" | "paid" | "decline" | "all"

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Төлөгдсөн", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  decline: { label: "Цуцлагдсан", className: "bg-red-50 text-red-600 border-red-200" },
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "paid", label: "Төлөгдсөн" },
  { key: "decline", label: "Цуцлагдсан" },
  { key: "all", label: "Бүгд" },
]

const planName = (type: string) => (isPlanType(type) ? PLANS[type].name : type)
const money = (n: number) => `${n.toLocaleString()} ₮`

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Дөнгөж сая"
  if (min < 60) return `${min} минутын өмнө`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} цагийн өмнө`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d} өдрийн өмнө` : new Date(iso).toLocaleDateString("mn-MN")
}

function StatCard({ icon: Icon, tone, label, value, hint }: { icon: LucideIcon; tone: string; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
      <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 text-base sm:text-xl font-bold text-gray-900 tabular-nums whitespace-nowrap">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-400 truncate">{hint}</p>}
      </div>
    </div>
  )
}

function CopyCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {}
      }}
      title="Хуулах"
      className="group inline-flex items-center gap-1.5 font-mono font-semibold text-gray-900 hover:text-orange-700"
    >
      {value}
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="Хуулсан" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500" aria-hidden="true" />
      )}
    </button>
  )
}

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>("pending")
  const [query, setQuery] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/invoices", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return
        if (result.success) {
          setInvoices(result.invoices)
          setError(null)
        } else setError(result.error || "Өгөгдөл татахад алдаа гарлаа.")
      })
      .catch(() => !cancelled && setError("Сүлжээний алдаа гарлаа."))
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        setRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refresh = () => {
    setRefreshing(true)
    setReloadKey((k) => k + 1)
  }

  const stats = useMemo(() => {
    const now = new Date()
    const pending = invoices.filter((i) => i.status === "pending")
    const paid = invoices.filter((i) => i.status === "paid")
    const thisMonth = paid.filter((i) => {
      const d = new Date(i.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
      revenue: paid.reduce((s, i) => s + i.amount, 0),
      monthRevenue: thisMonth.reduce((s, i) => s + i.amount, 0),
      monthCount: thisMonth.length,
      paidCount: paid.length,
    }
  }, [invoices])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { pending: 0, paid: 0, decline: 0, all: invoices.length }
    for (const inv of invoices) if (inv.status in c) c[inv.status as StatusFilter]++
    return c
  }, [invoices])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter((inv) => filter === "all" || inv.status === filter)
      .filter(
        (inv) =>
          !q ||
          [inv.invoice_number, inv.company_name, inv.company_email, inv.company_phone, inv.user_id].some((v) =>
            v?.toLowerCase().includes(q)
          )
      )
      // Хүлээгдэж буйг хамгийн эрт ирснээс нь эхэлж шийдвэрлэнэ
      .sort((a, b) =>
        filter === "pending"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [invoices, filter, query])

  const decide = async (inv: AdminInvoice, status: "paid" | "decline") => {
    const approve = status === "paid"
    const ok = await showConfirm(
      approve
        ? `Гүйлгээний утга ${inv.invoice_number}, дүн ${money(inv.amount)} бүхий шилжүүлэг данс руу орсныг шалгасан уу? Баталгаажуулахад багц шууд идэвхжинэ.`
        : `${inv.invoice_number} нэхэмжлэхийг цуцлах уу? Компанийн багц идэвхжихгүй.`,
      {
        title: approve ? "Төлбөр баталгаажуулах" : "Нэхэмжлэх цуцлах",
        confirmLabel: approve ? "Баталгаажуулах" : "Цуцлах",
        danger: !approve,
        icon: approve ? CheckCircle2 : XCircle,
        subject: {
          name: inv.company_name || "Нэр тодорхойгүй компани",
          details: [planName(inv.plan_type), money(inv.amount)],
        },
      }
    )
    if (!ok) return

    setActionId(inv.id)
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: inv.id, status }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Алдаа гарлаа.")
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status } : i)))
      showAlert(approve ? `${inv.company_name || "Компани"}-ийн ${planName(inv.plan_type)} идэвхжлээ.` : "Нэхэмжлэхийг цуцаллаа.", {
        tone: approve ? "success" : "info",
      })
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Серверийн алдаа гарлаа.", { tone: "error" })
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingLayout loading />

  const actions = (inv: AdminInvoice, full = false) =>
    inv.status === "pending" ? (
      <div className={`flex gap-2 ${full ? "w-full" : "justify-end"}`}>
        <button
          type="button"
          onClick={() => decide(inv, "decline")}
          disabled={actionId !== null}
          className={`h-9 px-3 rounded-lg text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 transition ${full ? "flex-1" : ""}`}
        >
          Цуцлах
        </button>
        <button
          type="button"
          onClick={() => decide(inv, "paid")}
          disabled={actionId !== null}
          className={`h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition ${full ? "flex-2" : ""}`}
        >
          {actionId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Баталгаажуулах
        </button>
      </div>
    ) : null

  const badge = (status: string) => {
    const s = STATUS[status] ?? STATUS.pending
    return <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${s.className}`}>{s.label}</span>
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Админ самбар</h1>
          <p className="text-sm text-gray-500 mt-1">Байгууллага болон багц худалдан авалтын нэхэмжлэхийг шалгаж баталгаажуулна.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Шинэчлэх
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      <PendingCompanies reloadKey={reloadKey} />

      {/* ТОЙМ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Clock} tone="bg-amber-50 text-amber-600" label="Хүлээгдэж буй" value={`${stats.pendingCount}`} hint={money(stats.pendingAmount)} />
        <StatCard icon={TrendingUp} tone="bg-orange-50 text-orange-600" label="Энэ сарын орлого" value={money(stats.monthRevenue)} hint={`${stats.monthCount} төлбөр`} />
        <StatCard icon={Banknote} tone="bg-emerald-50 text-emerald-600" label="Нийт орлого" value={money(stats.revenue)} hint={`${stats.paidCount} төлбөр`} />
        <StatCard icon={Receipt} tone="bg-slate-100 text-slate-600" label="Нийт нэхэмжлэх" value={`${invoices.length}`} />
      </div>

      {stats.pendingCount > 0 && filter !== "pending" && (
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className="w-full flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100/70"
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" /> {stats.pendingCount} төлбөр баталгаажуулалт хүлээж байна
          </span>
          <span className="font-semibold">Харах</span>
        </button>
      )}

      {/* ШҮҮЛТҮҮР */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Гүйлгээний утга, компанийн нэр, имэйл, утсаар хайх..."
            aria-label="Нэхэмжлэх хайх"
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Төлөвөөр шүүх">
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(key)}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition ${
                  selected ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {label}
                <span className={`text-xs ${selected ? "text-orange-100" : "text-gray-400"}`}>{counts[key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ЖАГСААЛТ */}
      {invoices.length === 0 ? (
        <EmptyState illustration="folder" title="Нэхэмжлэх алга" description="Компани багц худалдаж авахад энд харагдана." />
      ) : visible.length === 0 ? (
        <EmptyState
          illustration="search"
          title={query ? "Хайлтад тохирох нэхэмжлэх олдсонгүй" : "Энэ төлөвт нэхэмжлэх алга"}
          description={query ? "Хайлтын үг эсвэл төлөвийн шүүлтүүрээ өөрчилнө үү." : filter === "pending" ? "Бүх төлбөрийг шийдвэрлэсэн байна." : undefined}
        />
      ) : (
        <>
          {/* Desktop: хүснэгт */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Компани</th>
                  <th className="px-4 py-3 font-semibold">Гүйлгээний утга</th>
                  <th className="px-4 py-3 font-semibold">Багц</th>
                  <th className="px-4 py-3 font-semibold text-right">Дүн</th>
                  <th className="px-4 py-3 font-semibold">Огноо</th>
                  <th className="px-4 py-3 font-semibold">Төлөв</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 align-middle">
                    <td className="px-4 py-3 max-w-56">
                      <p className="font-semibold text-gray-900 truncate">{inv.company_name || "Нэр тодорхойгүй"}</p>
                      <p className="text-xs text-gray-400 truncate">{inv.company_email || inv.company_phone || inv.user_id}</p>
                    </td>
                    <td className="px-4 py-3"><CopyCode value={inv.invoice_number} /></td>
                    <td className="px-4 py-3 text-gray-700">{planName(inv.plan_type)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">{money(inv.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap" title={new Date(inv.created_at).toLocaleString("mn-MN")}>
                      {timeAgo(inv.created_at)}
                    </td>
                    <td className="px-4 py-3">{badge(inv.status)}</td>
                    <td className="px-4 py-3">{actions(inv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: карт */}
          <ul className="md:hidden space-y-3">
            {visible.map((inv) => (
              <li key={inv.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{inv.company_name || "Нэр тодорхойгүй"}</p>
                    <p className="text-xs text-gray-400 truncate">{inv.company_email || inv.company_phone || inv.user_id}</p>
                  </div>
                  {badge(inv.status)}
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="text-sm space-y-1">
                    <CopyCode value={inv.invoice_number} />
                    <p className="text-gray-500">{planName(inv.plan_type)} · {timeAgo(inv.created_at)}</p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-gray-900 tabular-nums whitespace-nowrap">{money(inv.amount)}</p>
                </div>
                {actions(inv, true)}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
