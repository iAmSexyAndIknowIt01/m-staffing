"use client"

import type { CSSProperties } from "react"
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Coins, FileText, Receipt, RotateCcw, Send, Sparkles } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import TokenIntroModal, { hasSeenTokenIntro } from "@/components/company/billing/TokenIntroModal"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import CountUp from "@/components/landing/CountUp"
import {
  InvoiceDetailModal,
  PurchaseModal,
  type BankAccount,
  type InvoiceRow,
  type PurchasePlan,
} from "@/components/company/billing/BillingModals"
import { InvoiceTable, TokenUsageTable, planName, type TokenUsageRow } from "@/components/company/billing/HistoryTables"
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
import { EXPIRY_WARNING_DAYS, LOT_SOURCE_LABELS, daysUntilExpiry, isLotActive, type TokenLot } from "@/lib/tokenLots"
import { CARD_HOVER } from "@/lib/cardMotion"

// Billing хуудсанд харуулах сүүлийн мөрийн тоо (бүгдийг дэлгэрэнгүй хуудсаас)
const PREVIEW_ROWS = 10

// "2027-10-27T…" → "2027.10.27"
const ymd = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// CountUp-д өгөх тоон текст
const fmt = (value: number, suffix = "") => `${Math.max(0, Math.round(value)).toLocaleString("en-US")}${suffix}`

// Бүх багцад нийтлэг боломжууд (картуудад давтахгүй, нэг удаа харуулна)
const PLAN_FEATURES = [
  `Худалдаж авснаас хойш ${PAID_PLAN_DAYS / 365} жил хүчинтэй`,
  "Анкет шүүж удирдах",
  "Ажилтны профайл, CV үзэх",
  "Зарын статистик",
]

// Үйлдлийн үнэ (хар карт дотор нэг мөрөөр)
const COST_ITEMS: { action: TokenAction; icon: typeof FileText }[] = [
  { action: "post", icon: FileText },
  { action: "contact_unlock", icon: Send },
  { action: "reopen", icon: RotateCcw },
]

interface SubscriptionInfo {
  status: "active" | "expired"
  remaining: number
  // Хамгийн түрүүнд дуусах токены огноо, 30 хоногт дуусах үлдэгдэл
  next_expiry: string | null
  expiring_soon: number
}

// Багцын нэр, олгосон огнооны тайлбар (эх сурвалжаар нь)
function lotTitle(lot: TokenLot) {
  if ((lot.source === "migration" || lot.source === "purchase") && lot.planType) return planName(lot.planType)
  return LOT_SOURCE_LABELS[lot.source] ?? lot.source
}

function lotDateLabel(lot: TokenLot) {
  if (lot.source === "migration") return `Өмнөх үлдэгдэл · M токенд шилжүүлсэн ${ymd(lot.createdAt)}`
  if (lot.source === "purchase") return `Худалдаж авсан: ${ymd(lot.createdAt)}`
  return `Олгосон: ${ymd(lot.createdAt)}`
}

type HistoryTab = "usage" | "invoices"

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [lots, setLots] = useState<TokenLot[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [usage, setUsage] = useState<TokenUsageRow[]>([])
  const [usageTotal, setUsageTotal] = useState(0)
  const [bank, setBank] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyTab, setHistoryTab] = useState<HistoryTab>("usage")
  // Худалдаж авах цонх (сонгосон багц) болон нэхэмжлэхийн дэлгэрэнгүй цонх
  const [purchasePlan, setPurchasePlan] = useState<PurchasePlan | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  // M токен системийн танилцуулга (анх удаа автоматаар, дараа нь товчоор)
  const [showTokenIntro, setShowTokenIntro] = useState(false)
  const isFetched = useRef(false)

  useEffect(() => {
    async function fetchData() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        const [resSub, resInv, resUsage, resLots] = await Promise.all([
          fetch("/api/company/dashboard"),
          fetch(`/api/company/billing/upgrade?limit=${PREVIEW_ROWS}`),
          fetch(`/api/company/billing/tokens?limit=${PREVIEW_ROWS}`),
          fetch("/api/company/billing/lots"),
        ])

        const resultSub = await resSub.json()
        if (resultSub.success && resultSub.subscription) {
          if (!hasSeenTokenIntro()) setShowTokenIntro(true)
          setSub({
            status: resultSub.subscription.status === "Идэвхтэй" ? "active" : "expired",
            remaining: resultSub.subscription.remaining ?? 0,
            next_expiry: resultSub.subscription.nextExpiry ?? null,
            expiring_soon: resultSub.subscription.expiringSoon ?? 0,
          })
        }

        const resultLots = await resLots.json().catch(() => null)
        if (resultLots?.success) setLots(resultLots.lots ?? [])

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
  const cannotPost = expired || remaining < TOKEN_COSTS.post
  // Хүчинтэй багцуудыг эхэнд, дууссаныг сүүлд
  const sortedLots = [...lots].sort((a, b) => Number(isLotActive(b)) - Number(isLotActive(a)))

  return (
    <div className="animate-fade-in space-y-8 p-1 relative">
      {/* ТОЛГОЙ */}
      <div className="space-y-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition">
          <ArrowLeft className="w-4 h-4" /> Хянах самбар
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Багц, төлбөр</h1>
            <p className="text-gray-500 text-sm">M токены үлдэгдэл, багц худалдан авалт, түүх.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTokenIntro(true)}
            className="group self-start sm:self-auto inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 hover:border-orange-300 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" aria-hidden="true" /> M токен хэрхэн ажилладаг вэ?
          </button>
        </div>
      </div>

      {showTokenIntro && <TokenIntroModal onClose={() => setShowTokenIntro(false)} />}

      {/* 1. ТАНЫ M ТОКЕН: үлдэгдэл + багц бүрийн задаргаа + үйлдлийн үнэ */}
      <section className="dash-hero rounded-4xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-5">
          {/* Үлдэгдэл */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Үлдсэн M токен</p>
            <p className="text-5xl font-extrabold tabular-nums tracking-tight">
              <CountUp value={fmt(remaining)} duration={1400} delay={200} />
            </p>
            {!expired && (
              <p className="text-sm text-slate-300">
                ≈ <b className="text-white"><CountUp value={fmt(actionsFor(remaining, "post"))} duration={1200} delay={350} /></b> зар нийтлэх эсвэл{" "}
                <b className="text-white"><CountUp value={fmt(actionsFor(remaining, "contact_unlock"))} duration={1200} delay={350} /></b> ажилтанд хүсэлт
              </p>
            )}
            {cannotPost && (
              <p className="inline-flex items-start gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {expired ? "Багцын хугацаа дууссан." : "Зар нийтлэхэд токен хүрэлцэхгүй."} Доороос токен нэмж авна уу.
              </p>
            )}
            {sub && sub.expiring_soon > 0 && sub.next_expiry && (
              <p className="inline-flex items-start gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {formatTokens(sub.expiring_soon)} {EXPIRY_WARNING_DAYS} хоногт ({ymd(sub.next_expiry)}) дуусна — эхэлж энэ зарцуулагдана.
              </p>
            )}

            {/* Үйлдлийн үнэ */}
            <ul className="flex flex-wrap gap-2 pt-2">
              {COST_ITEMS.map(({ action, icon: Icon }) => (
                <li key={action} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                  <Icon className="w-3.5 h-3.5 text-orange-300" aria-hidden="true" />
                  {TOKEN_ACTION_LABELS[action]}
                  <b className="text-white tabular-nums">{TOKEN_COSTS[action].toLocaleString("en-US")}</b>
                </li>
              ))}
            </ul>
          </div>

          {/* Багц бүрийн задаргаа */}
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Токены багцууд</p>
              <p className="hidden sm:block text-xs text-slate-500">Эрт дуусахаас нь эхэлж зарцуулна</p>
            </div>
            {sortedLots.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400">
                Токен алга. Доороос багц сонгож токен нэмж авна уу.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {sortedLots.map((lot, i) => {
                  const active = isLotActive(lot)
                  const days = daysUntilExpiry(lot.expiresAt)
                  const soon = active && days !== null && days <= EXPIRY_WARNING_DAYS && lot.remaining > 0
                  const percent = lot.tokens > 0 ? Math.round((lot.remaining / lot.tokens) * 100) : 0
                  return (
                    <li
                      key={lot.id}
                      style={{ "--d": 200 + i * 70 } as CSSProperties}
                      className={`row-in rounded-2xl border border-white/10 bg-white/5 p-4 ${active ? "" : "opacity-50"}`}
                    >
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{lotTitle(lot)}</p>
                          <p className="text-xs text-slate-400">{lotDateLabel(lot)}</p>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 sm:block sm:shrink-0 sm:text-right">
                          <p className="font-bold tabular-nums whitespace-nowrap">
                            {lot.remaining.toLocaleString("en-US")}
                            <span className="text-xs font-medium text-slate-400"> / {lot.tokens.toLocaleString("en-US")}</span>
                          </p>
                          <p className={`text-xs font-semibold whitespace-nowrap ${!active ? "text-slate-500" : soon ? "text-amber-300" : "text-emerald-300"}`}>
                            {!active
                              ? `Дууссан: ${ymd(lot.expiresAt!)}`
                              : days === null
                                ? "Хугацаагүй"
                                : `${ymd(lot.expiresAt!)} · ${days} хоног`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                        <div
                          className={`dash-bar h-full rounded-full ${!active ? "bg-slate-500" : soon ? "bg-amber-400" : "bg-orange-400"}`}
                          style={{ width: `${active ? percent : 100}%`, "--d": 300 + i * 70 } as CSSProperties}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 2. ТОКЕН НЭМЖ АВАХ */}
      <section className="space-y-4">
        <div className="px-1">
          <h2 className="text-xl font-bold text-gray-900">Токен нэмж авах</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="stagger-in grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const popular = plan.id === "standard"
            const saving = Math.round((1 - plan.perThousand / basePerThousand) * 100)
            return (
              <div
                key={plan.id}
                className={`relative bg-white border p-6 rounded-3xl flex flex-col ${CARD_HOVER} ${
                  popular ? "border-orange-300 shadow-lg ring-1 ring-orange-200" : "border-gray-200 shadow-sm"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full shadow">
                    Түгээмэл сонголт
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                  {saving > 0 && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{saving}% хэмнэлт</span>
                  )}
                </div>
                <p className="mt-4 flex items-baseline gap-1.5 text-4xl font-extrabold text-gray-900 tracking-tight">
                  <CountUp value={fmt(plan.tokens)} duration={1400} />
                  <span className="text-base font-semibold text-gray-500">M токен</span>
                </p>
                <p className="mt-1 text-2xl font-bold text-orange-600">
                  <CountUp value={fmt(PLANS[plan.id].price, " ₮")} duration={1400} delay={100} />
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                    <dt className="text-xs text-gray-500">1 зар</dt>
                    <dd className="mt-0.5 text-sm font-bold text-gray-800 whitespace-nowrap">≈ {plan.perPost.toLocaleString("en-US")} ₮</dd>
                    <dd className="text-xs text-gray-400">нийт ≈ {actionsFor(plan.tokens, "post")} зар</dd>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
                    <dt className="text-xs text-gray-500">1 хүсэлт</dt>
                    <dd className="mt-0.5 text-sm font-bold text-gray-800 whitespace-nowrap">≈ {plan.perRequest.toLocaleString("en-US")} ₮</dd>
                    <dd className="text-xs text-gray-400">нийт ≈ {actionsFor(plan.tokens, "contact_unlock")} хүсэлт</dd>
                  </div>
                </dl>

                <button
                  onClick={() => setPurchasePlan({ id: plan.id, name: plan.name, tokens: plan.tokens, price: plan.price })}
                  className={`mt-6 w-full h-12 rounded-xl font-semibold text-sm transition active:scale-[0.98] ${
                    popular ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Худалдаж авах
                </button>
              </div>
            )
          })}
        </div>
        <p className="px-1 text-xs text-gray-400">
          Төлбөр шилжүүлэхдээ дансны дугаар, гүйлгээний утгыг сайтар шалгана уу. Токен төлбөр баталгаажмагц нэмэгдэх бөгөөд баталгаажсан төлбөрийг буцаах боломжгүй.
        </p>
      </section>

      {/* 3. ТҮҮХ: токен зарцуулалт / төлбөр (табаар) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div role="tablist" aria-label="Түүх" className="inline-flex rounded-2xl bg-gray-100 p-1">
            {(
              [
                { id: "usage", label: "Токен зарцуулалт", icon: Coins, total: usageTotal },
                { id: "invoices", label: "Төлбөр", icon: Receipt, total: invoiceTotal },
              ] as const
            ).map((tab) => {
              const active = historyTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setHistoryTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${active ? "text-orange-500" : ""}`} aria-hidden="true" />
                  {tab.label}
                  {tab.total > 0 && (
                    <span className={`rounded-full px-1.5 text-xs ${active ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"}`}>{tab.total}</span>
                  )}
                </button>
              )
            })}
          </div>
          <Link
            href={historyTab === "usage" ? "/dashboard/company/billing/tokens" : "/dashboard/company/billing/invoices"}
            className="group self-start sm:self-auto inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition"
          >
            Бүгдийг харах <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div key={historyTab} role="tabpanel" className="animate-fade-in">
          {historyTab === "usage" ? (
            usage.length === 0 ? (
              <EmptyState compact illustration="folder" title="Зарцуулалт алга" description="Зар нийтлэх, ажилтанд хүсэлт илгээхэд зарцуулсан токен энд харагдана." />
            ) : (
              <TokenUsageTable rows={usage} scrollable batch={PREVIEW_ROWS} />
            )
          ) : invoices.length === 0 ? (
            <EmptyState compact illustration="folder" title="Төлбөрийн түүх алга" description="Багц худалдаж авахад нэхэмжлэх, төлбөрийн явц энд харагдана." />
          ) : (
            <InvoiceTable rows={invoices} onDetail={setSelectedInvoice} scrollable batch={PREVIEW_ROWS} />
          )}
        </div>
      </section>

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
