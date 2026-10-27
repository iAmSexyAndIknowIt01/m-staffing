"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronsRight,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  Receipt,
  RotateCw,
  X,
} from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"

export interface BankAccount {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface InvoiceDetails extends BankAccount {
  invoiceNumber: string
  amount: number
}

// ---------------------------------------------------------------------------
// Нийтлэг хэсгүүд
// ---------------------------------------------------------------------------

function useEscape(onClose: () => void, disabled = false) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, disabled])
}

function ModalShell({
  labelledBy,
  onClose,
  busy,
  children,
}: {
  labelledBy: string
  onClose: () => void
  busy?: boolean
  children: React.ReactNode
}) {
  const isClient = useIsClient()
  useEscape(onClose, busy)
  if (!isClient) return null
  return createPortal(
    <div
      className="fixed inset-0 z-100000 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

function ModalHeader({
  id,
  icon: Icon,
  title,
  subtitle,
  onClose,
  onBack,
  busy,
}: {
  id: string
  icon: typeof CreditCard
  title: string
  subtitle?: string
  onClose: () => void
  onBack?: () => void
  busy?: boolean
}) {
  return (
    <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          aria-label="Буцах"
          className="w-9 h-9 -ml-2 shrink-0 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      ) : (
        <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
          <Icon className="w-5 h-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 id={id} className="text-base font-semibold text-gray-900 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        aria-label="Хаах"
        className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// Утгыг санах ой руу хуулах товчтой мөр
function CopyRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // Хуулах эрхгүй бол хэрэглэгч гараар хуулна
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 ${
        highlight ? "bg-orange-50 border border-orange-200 rounded-xl" : ""
      }`}
    >
      <div className="min-w-0">
        <p className={`text-xs ${highlight ? "text-orange-700 font-semibold" : "text-gray-500"}`}>{label}</p>
        <p className={`mt-0.5 text-sm font-semibold text-gray-900 break-all ${mono ? "font-mono tracking-wide" : ""} ${highlight ? "text-base text-orange-900" : ""}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`${label} хуулах`}
        className={`shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold transition ${
          copied ? "bg-emerald-50 text-emerald-700" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700"
        }`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Хуулсан" : "Хуулах"}
      </button>
    </div>
  )
}

function BankDetails({ details }: { details: InvoiceDetails }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
      <CopyRow label="Хүлээн авах банк" value={details.bankName} />
      <CopyRow label="Дансны дугаар" value={details.accountNumber} mono />
      <CopyRow label="Дансны нэр" value={details.accountName} />
      <CopyRow label="Шилжүүлэх дүн" value={`${details.amount.toLocaleString()}`} mono />
      <div className="p-2">
        <CopyRow label="Гүйлгээний утга (заавал)" value={details.invoiceNumber} highlight mono />
      </div>
    </div>
  )
}

// Чирж баталгаажуулах товч (хулгана, хуруу, гар — Enter/Space)
function SwipeToConfirm({ onConfirm, busy, label }: { onConfirm: () => void; busy: boolean; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const HANDLE = 52

  const max = () => (trackRef.current ? trackRef.current.clientWidth - HANDLE - 8 : 0)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX - x
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const next = Math.min(Math.max(e.clientX - startX.current, 0), max())
    setX(next)
  }
  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    if (x >= max() - 4) {
      setX(max())
      onConfirm()
    } else setX(0)
  }

  return (
    <div
      ref={trackRef}
      className="relative h-15 w-full rounded-2xl bg-gray-100 border border-gray-200 p-1 select-none overflow-hidden touch-none"
    >
      <div
        className="absolute inset-y-0 left-0 bg-orange-100"
        style={{ width: x + HANDLE + 4, transition: dragging ? "none" : "width .25s ease" }}
        aria-hidden="true"
      />
      <span
        className="absolute inset-0 flex items-center justify-center pl-12 text-sm font-semibold text-gray-500 pointer-events-none"
        style={{ opacity: busy ? 1 : Math.max(1 - x / 140, 0) }}
      >
        {busy ? "Илгээж байна..." : label}
      </span>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} (Enter дарж болно)`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault()
            onConfirm()
          }
        }}
        className="relative h-full rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/25 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
        style={{ width: HANDLE, transform: `translateX(${x}px)`, transition: dragging ? "none" : "transform .25s ease" }}
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronsRight className="w-5 h-5" />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Багц худалдаж авах цонх
// ---------------------------------------------------------------------------

export interface PurchasePlan {
  id: string
  name: string
  credits: number
  price: string
}

type LoadState = { status: "loading" } | { status: "ready"; details: InvoiceDetails } | { status: "error"; message: string }

export function PurchaseModal({
  plan,
  validityText,
  onClose,
  onCreated,
}: {
  plan: PurchasePlan
  validityText: string
  onClose: () => void
  onCreated: () => void
}) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" })
  const [reloadKey, setReloadKey] = useState(0)
  const [step, setStep] = useState<"pay" | "confirm" | "done">("pay")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Данс, гүйлгээний утгыг серверээс авна (алдааг заавал харуулна — өмнө нь гацдаг байсан)
  useEffect(() => {
    let cancelled = false
    fetch("/api/company/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_type: plan.id, init_only: true }),
    })
      .then(async (res) => {
        const result = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok && result.success && result.invoice) setLoad({ status: "ready", details: result.invoice })
        else setLoad({ status: "error", message: result.error || "Дансны мэдээллийг авч чадсангүй." })
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: "error", message: "Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу." })
      })
    return () => {
      cancelled = true
    }
  }, [plan.id, reloadKey])

  const confirm = async () => {
    if (load.status !== "ready" || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/company/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Цонхонд харуулсан гүйлгээний утгыг хадгална (шинээр үүсгэвэл шилжүүлсэн утгатай таарахгүй)
        body: JSON.stringify({ plan_type: plan.id, invoice_number: load.details.invoiceNumber }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok || !result.success) throw new Error(result.error || "Нэхэмжлэх үүсгэж чадсангүй.")
      setStep("done")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Серверийн алдаа гарлаа.")
    } finally {
      setSubmitting(false)
    }
  }

  const close = step === "done" ? onCreated : onClose

  return (
    <ModalShell labelledBy="purchase-title" onClose={close} busy={submitting}>
      <ModalHeader
        id="purchase-title"
        icon={CreditCard}
        title={step === "done" ? "Хүсэлт илгээгдлээ" : "Багц худалдаж авах"}
        subtitle={step === "done" ? undefined : `${plan.name} · ${plan.credits} зар нийтлэх эрх`}
        onClose={close}
        onBack={step === "confirm" ? () => setStep("pay") : undefined}
        busy={submitting}
      />

      {step !== "done" && (
        <ol className="px-5 sm:px-6 pt-4 flex items-center gap-2 text-xs font-semibold" aria-label="Алхам">
          {(["pay", "confirm"] as const).map((key, i) => {
            const active = step === key
            const done = step === "confirm" && key === "pay"
            return (
              <li key={key} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    active || done ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={active || done ? "text-gray-800" : "text-gray-400"}>
                  {key === "pay" ? "Шилжүүлэг хийх" : "Баталгаажуулах"}
                </span>
                {i === 0 && <span className="w-6 h-px bg-gray-200" aria-hidden="true" />}
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
        {step === "pay" && (
          <>
            <div className="flex items-end justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4">
              <div>
                <p className="text-xs text-slate-400">{plan.name}</p>
                <p className="text-sm text-slate-300 mt-0.5">{plan.credits} зар · {validityText}</p>
              </div>
              <p className="text-2xl font-extrabold text-orange-400 tabular-nums">{plan.price}</p>
            </div>

            {load.status === "loading" && (
              <div className="rounded-2xl border border-gray-100 p-4 space-y-3" aria-busy="true" aria-label="Дансны мэдээлэл ачаалж байна">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                    <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {load.status === "error" && (
              <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <p className="flex items-start gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> Дансны мэдээллийг харуулж чадсангүй
                </p>
                <p className="mt-1 text-red-600/90">{load.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoad({ status: "loading" })
                    setReloadKey((k) => k + 1)
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-red-200 text-red-700 font-semibold hover:bg-red-100"
                >
                  <RotateCw className="w-4 h-4" /> Дахин оролдох
                </button>
              </div>
            )}

            {load.status === "ready" && (
              <>
                <BankDetails details={load.details} />
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs leading-relaxed text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                  <span>
                    Шилжүүлэг хийхдээ <b>гүйлгээний утга</b>-д дээрх кодыг яг тэр хэлбэрээр нь бичнэ үү. Утга буруу бол төлбөрийг таньж,
                    багцыг идэвхжүүлэхэд удаашрал гарна.
                  </span>
                </p>
              </>
            )}
          </>
        )}

        {step === "confirm" && load.status === "ready" && (
          <>
            <div className="text-center px-2 py-2">
              <span className="mx-auto w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                <Receipt className="w-7 h-7" strokeWidth={1.8} />
              </span>
              <p className="mt-4 text-sm font-semibold text-gray-900">Шилжүүлгээ хийсэн үү?</p>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                <b className="text-gray-800">{load.details.amount.toLocaleString()} ₮</b>-г{" "}
                <span className="font-mono font-semibold text-gray-800">{load.details.invoiceNumber}</span> утгатай шилжүүлсэн бол
                баталгаажуулна уу. Админ шалгаад багцыг идэвхжүүлнэ.
              </p>
            </div>
            {submitError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {submitError}
              </p>
            )}
            <SwipeToConfirm onConfirm={confirm} busy={submitting} label="Баруун тийш чирж баталгаажуулах" />
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <span className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" strokeWidth={1.8} />
            </span>
            <p className="mt-5 text-base font-semibold text-gray-900">Төлбөрийн хүсэлт хүлээн авлаа</p>
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
              Админ таны шилжүүлгийг шалгаад ихэвчлэн 5–15 минутын дотор <b className="text-gray-800">{plan.name}</b>-ыг идэвхжүүлнэ.
              Явцыг «Төлбөрийн түүх» хэсгээс харна уу.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        {step === "pay" && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={load.status !== "ready"}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-600/20 transition"
            >
              Шилжүүлэг хийсэн
            </button>
          </>
        )}
        {step === "confirm" && (
          <button
            type="button"
            onClick={() => setStep("pay")}
            disabled={submitting}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Дансны мэдээлэл рүү буцах
          </button>
        )}
        {step === "done" && (
          <button
            type="button"
            onClick={onCreated}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 transition"
          >
            Ойлголоо
          </button>
        )}
      </div>
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// Төлбөрийн түүхийн дэлгэрэнгүй цонх
// ---------------------------------------------------------------------------

export interface InvoiceRow {
  id: string
  invoice_number: string
  plan_type: string
  amount: number
  status: string
  created_at: string
}

export const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Төлөгдсөн", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-50 text-amber-700 border-amber-200" },
  decline: { label: "Цуцлагдсан", className: "bg-red-50 text-red-600 border-red-200" },
}

export function InvoiceDetailModal({
  invoice,
  planLabel,
  bank,
  onClose,
}: {
  invoice: InvoiceRow
  planLabel: string
  bank: BankAccount | null
  onClose: () => void
}) {
  const status = INVOICE_STATUS[invoice.status] ?? INVOICE_STATUS.pending
  return (
    <ModalShell labelledBy="invoice-title" onClose={onClose}>
      <ModalHeader
        id="invoice-title"
        icon={Receipt}
        title="Гүйлгээний дэлгэрэнгүй"
        subtitle={new Date(invoice.created_at).toLocaleString("mn-MN")}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-4">
          <div>
            <p className="text-xs text-gray-500">{planLabel}</p>
            <p className="mt-0.5 text-xl font-extrabold text-gray-900 tabular-nums">{invoice.amount.toLocaleString()} ₮</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${status.className}`}>{status.label}</span>
        </div>

        {invoice.status === "pending" &&
          (bank ? (
            <>
              <BankDetails details={{ ...bank, invoiceNumber: invoice.invoice_number, amount: invoice.amount }} />
              <p className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs leading-relaxed text-sky-800">
                <Clock className="w-4 h-4 shrink-0 mt-px" />
                Шилжүүлгээ хийсэн бол админ шалгаад ихэвчлэн 5–15 минутын дотор багцыг идэвхжүүлнэ.
              </p>
            </>
          ) : (
            <p className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-600">
              Гүйлгээний утга: <span className="font-mono font-semibold text-gray-900">{invoice.invoice_number}</span>
            </p>
          ))}

        {invoice.status !== "pending" && (
          <p className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-600">
            Гүйлгээний утга: <span className="font-mono font-semibold text-gray-900">{invoice.invoice_number}</span>
          </p>
        )}
      </div>
      <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition w-full sm:w-auto"
        >
          Хаах
        </button>
      </div>
    </ModalShell>
  )
}
