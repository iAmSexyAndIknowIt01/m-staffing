"use client"

import { ArrowLeft, Check, ChevronDown, Coins, FileText, Lightbulb, Receipt, RotateCcw, Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import {
  InvoiceDetailModal,
  PurchaseModal,
  type BankAccount,
  type InvoiceRow,
  type PurchasePlan,
} from "@/components/company/billing/BillingModals"
import {
  PAID_PLAN_DAYS,
  PAID_PLAN_TYPES,
  PLANS,
  TOKEN_ACTION_LABELS,
  TOKEN_COSTS,
  actionsFor,
  formatTokens,
  priceForAction,
  pricePerThousandTokens,
  type PaidPlanType,
  type TokenAction,
} from "@/lib/planCatalog"
import EmptyState from "@/components/common/EmptyState"
import {
  HistoryHeader,
  InvoiceTable,
  TokenUsageTable,
  planName,
  type TokenUsageRow,
} from "@/components/company/billing/HistoryTables"

// Billing хуудсанд харуулах сүүлийн мөрийн тоо (бүгдийг дэлгэрэнгүй хуудсаас)
const PREVIEW_ROWS = 10
import { CARD_HOVER } from "@/lib/cardMotion"

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
  // M токен
  token_limit: number
  used: number
  remaining: number
  expires_at: string | null
}

// Үйлдлийн үнийн карт (billing хуудасны дээд хэсэг)
const COST_ITEMS: { action: TokenAction; icon: typeof FileText; note: string }[] = [
  { action: "post", icon: FileText, note: "Шинэ ажлын зар" },
  { action: "contact_unlock", icon: Send, note: "Утас, имэйл 10 цаг нээгдэнэ" },
  { action: "reopen", icon: RotateCcw, note: "Дахин нээх, хугацаа сунгах" },
]

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [usage, setUsage] = useState<TokenUsageRow[]>([])
  const [usageTotal, setUsageTotal] = useState(0)
  const [invoiceTotal, setInvoiceTotal] = useState(0)
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
            token_limit: resultSub.subscription.tokenLimit ?? 0,
            used: resultSub.subscription.used ?? 0,
            remaining: resultSub.subscription.remaining ?? 0,
            expires_at: resultSub.subscription.expiresAt === "Хугацаагүй" ? null : resultSub.subscription.expiresAt
          })
        }

        const [resInv, resUsage] = await Promise.all([
          fetch(`/api/company/billing/upgrade?limit=${PREVIEW_ROWS}`),
          fetch(`/api/company/billing/tokens?limit=${PREVIEW_ROWS}`),
        ])
        const resultInv = await resInv.json()
        if (resultInv.success) {
          setInvoices(resultInv.invoices)
          setInvoiceTotal(resultInv.total ?? resultInv.invoices.length)
          setBank(resultInv.bank ?? null)
        }
        const resultUsage = await resUsage.json().catch(() => null)
        if (resultUsage?.success) {
          setUsage(resultUsage.usage ?? [])
          setUsageTotal(resultUsage.total ?? 0)
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
    tokens: PLANS[id].tokens,
    price: `${PLANS[id].price.toLocaleString()} ₮`,
    perThousand: pricePerThousandTokens(id),
    perPost: priceForAction(id, "post"),
    perRequest: priceForAction(id, "contact_unlock"),
  }))
  const basePerThousand = pricePerThousandTokens("starter")
  const expired = sub?.status === "expired"
  const remaining = sub?.remaining ?? 0
  const usedPercent = sub && sub.token_limit > 0 ? Math.min(100, Math.round((sub.used / sub.token_limit) * 100)) : 0
  const cannotPost = expired || remaining < TOKEN_COSTS.post

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
              <p>Багц бүр нь тодорхой хэмжээний M токен юм. Зар нийтлэхэд {formatTokens(TOKEN_COSTS.post)}, ажилтанд хүсэлт илгээхэд {formatTokens(TOKEN_COSTS.contact_unlock)} хасагдана.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Зараа хаасан ч зарцуулсан токен буцаж ирэхгүй. Хаагдсан зарыг дахин нээх, хугацааг сунгахад {formatTokens(TOKEN_COSTS.reopen)} хасагдана.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Багц худалдаж авснаас хойш 365 хоног хүчинтэй. Хугацаа дуусахад ашиглаагүй токен хүчингүй болно.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Хүчинтэй багцтай үед шинэ багц авбал үлдсэн токен шинэ багц дээр нэмэгдэж, хугацаа шинэ багцаас эхэлж тоологдоно.</p>
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
              <p className="text-xs font-bold text-slate-400 uppercase">Үлдсэн M токен</p>
              <p className="mt-1 text-3xl font-extrabold text-white tabular-nums">
                {remaining.toLocaleString("en-US")}
                <span className="text-base font-semibold text-slate-400"> / {(sub?.token_limit ?? 0).toLocaleString("en-US")}</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 text-right">Ашигласан: <b className="text-slate-200">{(sub?.used ?? 0).toLocaleString("en-US")}</b></p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-700 overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-full ${usedPercent >= 90 || expired ? "bg-red-400" : "bg-orange-400"}`}
              style={{ width: `${expired ? 100 : usedPercent}%` }}
            />
          </div>
          {!expired && (
            <p className="mt-3 text-xs text-slate-300">
              ≈ <b className="text-white">{actionsFor(remaining, "post")}</b> зар нийтлэх эсвэл{" "}
              <b className="text-white">{actionsFor(remaining, "contact_unlock")}</b> ажилтанд хүсэлт илгээх боломжтой
            </p>
          )}
          {cannotPost && (
            <p className="mt-2 text-xs text-red-300">
              {expired ? "Багцын хугацаа дууссан тул токен зарцуулах боломжгүй." : "Зар нийтлэхэд токен хүрэлцэхгүй байна."} Доорх багцаас сонгоно уу.
            </p>
          )}
        </div>

        {/* Үйлдлийн үнэ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COST_ITEMS.map(({ action, icon: Icon, note }) => (
            <div key={action} className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-300">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{TOKEN_ACTION_LABELS[action]}</p>
                <p className="text-sm font-bold text-white">{formatTokens(TOKEN_COSTS[action])}</p>
                <p className="text-xs text-slate-500 truncate">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* БАГЦУУДЫН СОНГОЛТ */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="text-xl font-bold text-gray-900">M токен багц</h3>
        </div>
        <div className="stagger-in grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const popular = plan.id === "standard"
            const saving = Math.round((1 - plan.perThousand / basePerThousand) * 100)
            return (
              <div
                key={plan.id}
                className={`relative bg-white border p-6 rounded-3xl flex flex-col justify-between ${CARD_HOVER} ${
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
                    <p className="flex items-baseline gap-1.5 text-4xl font-extrabold text-gray-900 tracking-tight">
                      {plan.tokens.toLocaleString("en-US")}
                      <span className="text-base font-semibold text-gray-500">M токен</span>
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-600">{plan.price}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <p>
                        1 зар ({TOKEN_COSTS.post.toLocaleString("en-US")} токен) ≈{" "}
                        <b className="font-semibold text-gray-700">{plan.perPost.toLocaleString("en-US")} ₮</b>
                      </p>
                      <p>
                        1 хүсэлт ({TOKEN_COSTS.contact_unlock.toLocaleString("en-US")} токен) ≈{" "}
                        <b className="font-semibold text-gray-700">{plan.perRequest.toLocaleString("en-US")} ₮</b>
                      </p>
                      {saving > 0 && <p className="font-semibold text-emerald-600">{saving}% хэмнэлт</p>}
                    </div>
                  </div>
                  <hr className="border-gray-100" />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>≈ {actionsFor(plan.tokens, "post")} зар нийтлэх</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>эсвэл ≈ {actionsFor(plan.tokens, "contact_unlock")} ажилтанд хүсэлт илгээх</span>
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
                  onClick={() => setPurchasePlan({ id: plan.id, name: plan.name, tokens: plan.tokens, price: plan.price })}
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

      {/* M ТОКЕН ЗАРЦУУЛАЛТЫН ТҮҮХ: сүүлийн 10, бүгдийг дэлгэрэнгүй хуудаснаас */}
      <div className="space-y-4">
        <HistoryHeader icon={Coins} title="Токен зарцуулалт" total={usageTotal} href="/dashboard/company/billing/tokens" />
        {usage.length === 0 ? (
          <EmptyState
            compact
            illustration="folder"
            title="Зарцуулалт алга"
            description="Зар нийтлэх, ажилтанд хүсэлт илгээхэд зарцуулсан токен энд харагдана."
          />
        ) : (
          <TokenUsageTable rows={usage} scrollable />
        )}
      </div>

      {/* ТӨЛБӨРИЙН ТҮҮХ: сүүлийн 10, бүгдийг дэлгэрэнгүй хуудаснаас */}
      <div className="space-y-4">
        <HistoryHeader icon={Receipt} title="Төлбөр төлөлтийн түүх" total={invoiceTotal} href="/dashboard/company/billing/invoices" />
        {invoices.length === 0 ? (
          <EmptyState
            compact
            illustration="folder"
            title="Төлбөрийн түүх алга"
            description="Багц худалдаж авахад нэхэмжлэх, төлбөрийн явц энд харагдана."
          />
        ) : (
          <InvoiceTable rows={invoices} onDetail={setSelectedInvoice} scrollable />
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