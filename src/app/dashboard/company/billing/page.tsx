"use client"

import { ArrowLeft, Check, ChevronDown, Lightbulb } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import {
  INVOICE_STATUS,
  InvoiceDetailModal,
  PurchaseModal,
  type BankAccount,
  type InvoiceRow,
  type PurchasePlan,
} from "@/components/company/billing/BillingModals"
import { PAID_PLAN_DAYS, PAID_PLAN_TYPES, PLANS, isPlanType, pricePerPost, type PaidPlanType } from "@/lib/planCatalog"
import EmptyState from "@/components/common/EmptyState"

// Багцын нэрийг каталогоос (хуучин нэхэмжлэхийн төрөл ч орно)
const planName = (type: string) => (isPlanType(type) ? PLANS[type].name : type)

// Бүх төлбөртэй багцад нийтлэг боломжууд
const PLAN_FEATURES = [
  `Худалдаж авснаас хойш ${PAID_PLAN_DAYS / 365} жил хүчинтэй`,
  "Ирсэн анкетуудыг шүүж удирдах",
  "Ажил хайгчдын профайл, CV үзэх",
  "Зарын хандалт, статистик",
]
interface SubscriptionInfo {
  plan_type: string
  status: string
  job_limit: number
  used: number
  remaining: number
  expires_at: string | null
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  // Худалдаж авах цонх (сонгосон багц) болон түүхийн дэлгэрэнгүй цонх
  const [purchasePlan, setPurchasePlan] = useState<PurchasePlan | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [bank, setBank] = useState<BankAccount | null>(null)
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)
  const isFetched = useRef(false)

  // 1. Өгөгдөл татах (Багц болон Төлбөрийн түүх)
  useEffect(() => {
    async function fetchData() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        const resSub = await fetch("/api/company/dashboard")
        const resultSub = await resSub.json()
        if (resultSub.success && resultSub.subscription) {
          setSub({
            plan_type: resultSub.subscription.planType || "free",
            status: resultSub.subscription.status === "Идэвхтэй" ? "active" : "expired",
            job_limit: resultSub.subscription.jobLimit,
            used: resultSub.subscription.used ?? 0,
            remaining: resultSub.subscription.remaining ?? 0,
            expires_at: resultSub.subscription.expiresAt === "Хугацаагүй" ? null : resultSub.subscription.expiresAt
          })
        }

        const resInv = await fetch("/api/company/billing/upgrade")
        const resultInv = await resInv.json()
        if (resultInv.success) {
          setInvoices(resultInv.invoices)
          setBank(resultInv.bank ?? null)
        }
      } catch (err) {
        console.error("Дата татахад алдаа гарлаа:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <LoadingLayout loading />
  }

  const plans = PAID_PLAN_TYPES.map((id: PaidPlanType) => ({
    id,
    name: PLANS[id].name,
    credits: PLANS[id].jobLimit,
    price: `${PLANS[id].price.toLocaleString()} ₮`,
    perPost: pricePerPost(id),
  }))
  const basePerPost = pricePerPost("starter")
  const expired = sub?.status === "expired"
  const usedPercent = sub && sub.job_limit > 0 ? Math.min(100, Math.round((sub.used / sub.job_limit) * 100)) : 0

  return (
    <div className="animate-fade-in space-y-8 p-1 relative">
      {/* Толгой хэсэг */}
      <div className="space-y-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition">
          <ArrowLeft className="w-4 h-4" /> Хянах самбар
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Багц болон Төлбөр тооцоо</h1>
        <p className="text-gray-500 text-sm">Танай байгууллагын систем ашиглах эрх болон багцын мэдээлэл.</p>
      </div>

      {/* Төлбөр төлөлт болон буцаалтын тухай санамж (Dropdown) */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsNoticeOpen(!isNoticeOpen)}
          aria-expanded={isNoticeOpen}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-amber-900 hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-base"><Lightbulb size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></span>
            <span>Багц хэрхэн ажилладаг вэ? (Анхаарах зүйлс)</span>
          </div>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 text-amber-700 ${isNoticeOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {isNoticeOpen && (
          <div className="px-5 pb-5 pt-1 text-xs text-amber-950 space-y-2.5 border-t border-amber-200/50 leading-relaxed font-medium animate-fade-in">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Багц бүр нь тодорхой тооны зар нийтлэх эрх юм. Шинэ зар нийтлэх бүрт 1 эрх хасагдана.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Зараа хаасан ч ашигласан эрх буцаж ирэхгүй. Хаасан зараа дахин идэвхжүүлэхэд эрх хасагдахгүй.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Багц худалдаж авснаас хойш 365 хоног хүчинтэй. Хугацаа дуусахад ашиглаагүй эрх хүчингүй болно.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Хүчинтэй багцтай үед шинэ багц авбал үлдсэн эрх шинэ багц дээр нэмэгдэж, хугацаа шинэ багцаас эхэлж тоологдоно.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Төлбөр шилжүүлэхдээ дансны дугаар, гүйлгээний утгыг сайтар шалгана уу. Баталгаажсан төлбөрийг буцаах боломжгүй.</p>
            </div>
          </div>
        )}
      </div>

      {/* ОДООГИЙН ТӨЛӨВ */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Одоогийн багц</p>
            <h2 className="text-2xl font-extrabold text-orange-400">{planName(sub?.plan_type || "free")}</h2>
            <p className="text-xs text-slate-300">
              Дуусах хугацаа: <b className="text-white">{sub?.expires_at || "Хугацаагүй"}</b>
            </p>
          </div>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-lg ${
              expired ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {expired ? "Хугацаа дууссан" : "Идэвхтэй"}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Үлдсэн нийтлэх эрх</p>
              <p className="mt-1 text-3xl font-extrabold text-white tabular-nums">
                {sub?.remaining ?? 0}
                <span className="text-base font-semibold text-slate-400"> / {sub?.job_limit ?? 0} зар</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 text-right">Ашигласан: <b className="text-slate-200">{sub?.used ?? 0}</b></p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-700 overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-full ${usedPercent >= 90 || expired ? "bg-red-400" : "bg-orange-400"}`}
              style={{ width: `${expired ? 100 : usedPercent}%` }}
            />
          </div>
          {(expired || (sub && sub.remaining <= 0)) && (
            <p className="mt-3 text-xs text-red-300">
              {expired ? "Багцын хугацаа дууссан тул шинэ зар нийтлэх боломжгүй." : "Нийтлэх эрх дууссан."} Доорх багцаас сонгоно уу.
            </p>
          )}
        </div>
      </div>

      {/* БАГЦУУДЫН СОНГОЛТ */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="text-xl font-bold text-gray-900">Зар нийтлэх багц</h3>
          <p className="text-sm text-gray-500 mt-1">
            Шинэ компани {PLANS.free.jobLimit} зар үнэгүй нийтлэх туршилтын эрхтэй. Илүү олон зар нийтлэхэд доорх багцаас сонгоно уу.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const popular = plan.id === "standard"
            const saving = Math.round((1 - plan.perPost / basePerPost) * 100)
            return (
              <div
                key={plan.id}
                className={`relative bg-white border p-6 rounded-3xl flex flex-col justify-between transition ${
                  popular ? "border-orange-300 shadow-lg ring-1 ring-orange-200" : "border-gray-200 shadow-sm"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full shadow">
                    Түгээмэл сонголт
                  </span>
                )}
                <div className="space-y-5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-lg text-gray-900">{plan.name}</h4>
                    {sub?.plan_type === plan.id && !expired && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">Ашиглаж буй</span>
                    )}
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {plan.credits}
                      <span className="text-base font-semibold text-gray-500"> зар</span>
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-600">{plan.price}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Нэг зар ≈ {plan.perPost.toLocaleString()} ₮
                      {saving > 0 && <span className="ml-1.5 font-semibold text-emerald-600">{saving}% хэмнэлт</span>}
                    </p>
                  </div>
                  <hr className="border-gray-100" />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{plan.credits} ажлын байрны зар нийтлэх эрх</span>
                    </li>
                    {PLAN_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setPurchasePlan({ id: plan.id, name: plan.name, credits: plan.credits, price: plan.price })}
                  className={`mt-8 w-full h-12 rounded-xl font-semibold text-sm transition ${
                    popular ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Худалдаж авах
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ТӨЛБӨРИЙН ТҮҮХ ХЭСЭГ */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 px-1">Төлбөр төлөлтийн түүх</h3>
        {invoices.length === 0 ? (
          <EmptyState
            compact
            illustration="folder"
            title="Төлбөрийн түүх алга"
            description="Багц худалдаж авахад нэхэмжлэх, төлбөрийн явц энд харагдана."
          />
        ) : (
          <div className="bg-white border border-gray-100 rounded-4xl overflow-x-auto shadow-sm">
            <table className="w-full min-w-140 text-left text-xs">
              <thead className="bg-slate-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Огноо</th>
                  <th className="p-4">Гүйлгээний утга</th>
                  <th className="p-4">Багц</th>
                  <th className="p-4">Төлөх дүн</th>
                  <th className="p-4 text-center">Төлөв</th>
                  <th className="p-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4">{planName(inv.plan_type)}</td>
                    <td className="p-4 font-bold">{inv.amount.toLocaleString()} ₮</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${(INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.pending).className}`}>
                        {(INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.pending).label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-xs font-bold text-orange-600 bg-orange-50/60 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-xl transition duration-150"
                      >
                        Дэлгэрэнгүй
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {purchasePlan && (
        <PurchaseModal
          plan={purchasePlan}
          validityText={`${PAID_PLAN_DAYS / 365} жил хүчинтэй`}
          onClose={() => setPurchasePlan(null)}
          onCreated={() => window.location.reload()}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          planLabel={planName(selectedInvoice.plan_type)}
          bank={bank}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  )
}