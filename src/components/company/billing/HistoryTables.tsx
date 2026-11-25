"use client"

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { CalendarPlus, ChevronRight, FileText, RotateCcw, Send, type LucideIcon } from "lucide-react"
import { INVOICE_STATUS, type InvoiceRow } from "@/components/company/billing/BillingModals"
import CountUp from "@/components/landing/CountUp"
import { PLANS, TOKEN_ACTION_LABELS, isPlanType, type TokenAction } from "@/lib/planCatalog"

// Billing хуудас болон дэлгэрэнгүй хуудсуудад нийтлэг хүснэгт, толгой, skeleton

export interface TokenUsageRow {
  id: string
  reason: string
  tokens: number
  createdAt: string
  jobTitle: string | null
}

export const planName = (type: string) => (isPlanType(type) ? PLANS[type].name : type)

export const tokenActionLabel = (reason: string) =>
  Object.hasOwn(TOKEN_ACTION_LABELS, reason) ? TOKEN_ACTION_LABELS[reason as TokenAction] : reason

// Үйлдэл бүрийн өнгөт дүрс
const ACTION_STYLE: Record<TokenAction, { icon: LucideIcon; tone: string }> = {
  post: { icon: FileText, tone: "bg-orange-50 text-orange-600" },
  reopen: { icon: RotateCcw, tone: "bg-sky-50 text-sky-600" },
  extend: { icon: CalendarPlus, tone: "bg-violet-50 text-violet-600" },
  contact_unlock: { icon: Send, tone: "bg-emerald-50 text-emerald-600" },
}

// Мөр гарч ирэх хоцрогдол: хуудаслалтын багц бүр 0-ээс эхэлнэ (шинэ ачаалсан мөрүүд шууд гарна)
const rowStyle = (index: number, batch: number) =>
  ({ "--d": Math.min((index % batch) * 35, 500) }) as CSSProperties

// Хүснэгтийн гарчиг + «Дэлгэрэнгүй» холбоос
export function HistoryHeader({
  icon: Icon,
  title,
  total,
  href,
}: {
  icon: LucideIcon
  title: string
  total?: number
  href?: string
}) {
  return (
    <div className="px-1 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-5 h-5 shrink-0 text-orange-500" aria-hidden="true" />
        <h3 className="text-xl font-bold text-gray-900 truncate">{title}</h3>
        {typeof total === "number" && total > 0 && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{total}</span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition"
        >
          Дэлгэрэнгүй <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

// Дэлгэрэнгүй хуудасны толгой: градиент карт + тоолж өсөх статистик
export function HistoryHero({
  icon: Icon,
  title,
  description,
  stats,
}: {
  icon: LucideIcon
  title: string
  description: string
  stats: { label: string; value: number; suffix?: string }[]
}) {
  return (
    <section className="dash-hero relative overflow-hidden rounded-4xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <span className="dash-pop grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/20" style={{ "--d": 150 } as CSSProperties}>
            <Icon className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <h1 className="dash-in text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ "--d": 120 } as CSSProperties}>{title}</h1>
            <p className="dash-in mt-1 text-sm text-slate-300" style={{ "--d": 200 } as CSSProperties}>{description}</p>
          </div>
        </div>
        <dl className="flex gap-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="dash-in min-w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
              style={{ "--d": 280 + i * 90 } as CSSProperties}
            >
              <dt className="text-xs text-slate-400">{stat.label}</dt>
              <dd className="mt-0.5 text-xl font-extrabold tabular-nums">
                {/* key — шүүлтүүр солигдоход тоог дахин тоолно */}
                <CountUp key={stat.value} value={`${stat.value.toLocaleString("en-US")}${stat.suffix ?? ""}`} duration={900} delay={150} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

// scrollable — billing хуудсанд өндрийг хязгаарлаж дотор нь гүйлгэнэ
const wrapperClass = (scrollable?: boolean) =>
  `bg-white border border-gray-100 rounded-4xl shadow-sm overflow-x-auto ${scrollable ? "max-h-112 overflow-y-auto" : ""}`

const theadClass = "sticky top-0 z-1 bg-slate-50 text-gray-500 uppercase font-bold border-b border-gray-100"

export function TokenUsageTable({
  rows,
  scrollable,
  batch = 20,
}: {
  rows: TokenUsageRow[]
  scrollable?: boolean
  // Нэг удаа ачаалах мөрийн тоо (хөдөлгөөний хоцрогдлыг багц бүрт 0-ээс эхлүүлнэ)
  batch?: number
}) {
  return (
    <div className={wrapperClass(scrollable)}>
      <table className="w-full min-w-120 text-left text-xs">
        <thead className={theadClass}>
          <tr>
            <th className="p-4">Огноо</th>
            <th className="p-4">Үйлдэл</th>
            <th className="p-4">Зар</th>
            <th className="p-4 text-right">Токен</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
          {rows.map((row, i) => {
            const style = Object.hasOwn(ACTION_STYLE, row.reason) ? ACTION_STYLE[row.reason as TokenAction] : null
            const Icon = style?.icon ?? FileText
            return (
              <tr key={row.id} className="row-in transition-colors hover:bg-orange-50/30" style={rowStyle(i, batch)}>
                <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${style?.tone ?? "bg-gray-100 text-gray-500"}`}>
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    {tokenActionLabel(row.reason)}
                  </span>
                </td>
                <td className="p-4 text-gray-500 max-w-60 truncate">{row.jobTitle ?? "—"}</td>
                <td className="p-4 text-right whitespace-nowrap">
                  <span className="inline-flex rounded-lg bg-red-50 px-2 py-1 font-bold text-red-600 tabular-nums">
                    −{row.tokens.toLocaleString("en-US")}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function InvoiceTable({
  rows,
  onDetail,
  scrollable,
  batch = 20,
}: {
  rows: InvoiceRow[]
  onDetail: (invoice: InvoiceRow) => void
  scrollable?: boolean
  batch?: number
}) {
  return (
    <div className={wrapperClass(scrollable)}>
      <table className="w-full min-w-140 text-left text-xs">
        <thead className={theadClass}>
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
          {rows.map((inv, i) => {
            const status = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.pending
            return (
              <tr key={inv.id} className="row-in transition-colors hover:bg-orange-50/30" style={rowStyle(i, batch)}>
                <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                <td className="p-4 whitespace-nowrap">{planName(inv.plan_type)}</td>
                <td className="p-4 font-bold whitespace-nowrap">{inv.amount.toLocaleString()} ₮</td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${status.className}`}>{status.label}</span>
                </td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => onDetail(inv)}
                    className="text-xs font-bold text-orange-600 bg-orange-50/60 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-xl transition duration-150 active:scale-95"
                  >
                    Дэлгэрэнгүй
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Ачаалж байх үеийн гялалзах орлуулагч мөрүүд
export function HistorySkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-4xl shadow-sm p-4 space-y-3" aria-busy="true" aria-label="Ачаалж байна">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4" style={{ opacity: 1 - r * 0.12 }}>
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className={`skeleton-shimmer h-8 rounded-lg ${c === 1 ? "flex-2" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Шүүлтүүрийн товчнууд (дэлгэрэнгүй хуудсанд)
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  delayBase = 0,
}: {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
  // Товч бүр дараалан гарч ирэх хоцрогдлын эхлэл (ms)
  delayBase?: number
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option, i) => {
        const active = option.value === value
        return (
          <button
            key={option.value || "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            style={{ "--d": delayBase + i * 50 } as CSSProperties}
            className={`dash-in inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              active
                ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/25"
                : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-700 hover:shadow-sm"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
