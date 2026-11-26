"use client"

import { useEffect, useId, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CalendarClock, Check, Coins, FileText, RotateCcw, Send, Sparkles, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"
import { PLANS, TOKEN_COSTS, formatTokens } from "@/lib/planCatalog"

// M токен системийн танилцуулга (компанийн хяналтын самбар, billing). Нэг удаа автоматаар гарна,
// billing хуудасны «Танилцуулга» товчоор дахин нээнэ.

export const TOKEN_INTRO_SEEN_KEY = "mstaffing:token-intro-seen:v1"

export function hasSeenTokenIntro(): boolean {
  try {
    return localStorage.getItem(TOKEN_INTRO_SEEN_KEY) === "1"
  } catch {
    // Storage хаалттай (хувийн цонх г.м.) бол давтан гарахаас сэргийлж үзсэн гэж үзнэ
    return true
  }
}

export function markTokenIntroSeen() {
  try {
    localStorage.setItem(TOKEN_INTRO_SEEN_KEY, "1")
  } catch {
    // storage хаалттай — энэ удаад л хаана
  }
}

const d = (ms: number) => ({ "--d": ms }) as CSSProperties

function StepConvert() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-600">
        Багц одоо «хэдэн зар нийтлэх эрх» биш, <b className="text-gray-900">M токен</b> олгоно. Токеноо зар нийтлэх, ажилтанд хүсэлт
        илгээхэд хүссэнээрээ хуваарилна.
      </p>
      <div className="dash-in flex items-center justify-center gap-3 rounded-3xl bg-orange-50/70 p-5" style={d(80)}>
        <div className="text-center">
          <p className="text-3xl font-extrabold text-gray-400 line-through decoration-2">1 зар</p>
          <p className="mt-1 text-xs text-gray-400">Өмнө</p>
        </div>
        <ArrowRight className="w-6 h-6 shrink-0 text-orange-500" aria-hidden="true" />
        <div className="text-center">
          <p className="text-3xl font-extrabold text-orange-600">1,000</p>
          <p className="mt-1 text-xs font-semibold text-orange-700">M токен</p>
        </div>
      </div>
      <p className="dash-in flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" style={d(160)}>
        <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        Таны өмнөх үлдэгдэл алдагдаагүй — 1 зар = 1,000 токеноор хөрвүүлэгдсэн.
      </p>
      <p className="dash-in text-xs text-gray-500" style={d(220)}>
        Жишээ: {PLANS.starter.name} — {formatTokens(PLANS.starter.tokens)} ({PLANS.starter.price.toLocaleString("en-US")} ₮)
      </p>
    </div>
  )
}

function StepCosts() {
  const items = [
    { icon: FileText, tone: "bg-orange-100 text-orange-600", label: "Зар нийтлэх", cost: TOKEN_COSTS.post },
    { icon: RotateCcw, tone: "bg-sky-100 text-sky-600", label: "Зар дахин нээх, сунгах", cost: TOKEN_COSTS.reopen },
    { icon: Send, tone: "bg-emerald-100 text-emerald-600", label: "Ажилтанд хүсэлт илгээх", cost: TOKEN_COSTS.contact_unlock },
  ]
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-600">Үйлдэл бүр өөрийн үнэтэй. Хайх, профайл үзэх, анкет хүлээн авах үнэгүй.</p>
      <ul className="space-y-2.5">
        {items.map(({ icon: Icon, tone, label, cost }, i) => (
          <li
            key={label}
            className="dash-in flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3"
            style={d(80 + i * 80)}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
            <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-gray-900 ring-1 ring-gray-200 tabular-nums">
              {cost.toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
      <p className="dash-in text-xs text-gray-500" style={d(340)}>
        Жишээ: {formatTokens(PLANS.starter.tokens)} ≈ {Math.floor(PLANS.starter.tokens / TOKEN_COSTS.post)} зар эсвэл{" "}
        {Math.floor(PLANS.starter.tokens / TOKEN_COSTS.contact_unlock)} хүсэлт.
      </p>
    </div>
  )
}

function StepExpiry() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-600">
        Худалдаж авсан багц бүр <b className="text-gray-900">өөрийн 1 жилийн</b> хугацаатай. Шинэ багц авахад өмнөхийн хугацаа сунгагдахгүй.
      </p>
      {/* Хоёр багцын жишээ: эрт дуусах багцаас эхэлж зарцуулна */}
      <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50/60 p-4">
        {[
          { name: "1-р багц", date: "2027.01.15", fill: 40, tone: "bg-amber-400", first: true },
          { name: "2-р багц", date: "2027.06.20", fill: 100, tone: "bg-orange-500", first: false },
        ].map((lot, i) => (
          <div key={lot.name} className="dash-in" style={d(100 + i * 100)}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800">
                {lot.name}
                {lot.first && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">эхлээд эндээс</span>
                )}
              </span>
              <span className="text-gray-500">дуусах {lot.date}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-gray-200 overflow-hidden">
              <div className={`dash-bar h-full rounded-full ${lot.tone}`} style={{ width: `${lot.fill}%`, ...d(250 + i * 100) }} />
            </div>
          </div>
        ))}
      </div>
      <ul className="space-y-2 text-sm text-gray-600">
        <li className="dash-in flex items-start gap-2" style={d(320)}>
          <Coins className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
          Токен хамгийн түрүүнд дуусах багцаас эхэлж хасагдана — таны токен дэмий дуусахгүй.
        </li>
        <li className="dash-in flex items-start gap-2" style={d(400)}>
          <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
          30 хоногийн дотор дуусах токен байвал «Багц, төлбөр» хэсэгт сануулга гарна.
        </li>
      </ul>
    </div>
  )
}

const STEPS = [
  { title: "Зарын эрх → M токен", body: StepConvert },
  { title: "Үйлдэл бүрийн үнэ", body: StepCosts },
  { title: "Багц бүр 1 жил хүчинтэй", body: StepExpiry },
]

export default function TokenIntroModal({ onClose }: { onClose: () => void }) {
  const isClient = useIsClient()
  const [step, setStep] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const last = step === STEPS.length - 1

  const close = () => {
    markTokenIntroSeen()
    onClose()
  }

  useEffect(() => {
    nextRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        markTokenIntroSeen()
        onClose()
      }
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1))
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0))
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  if (!isClient) return null
  const Body = STEPS[step].body

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
      >
        {/* Толгой */}
        <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-5 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-500/25 blur-3xl" />
          <button
            type="button"
            onClick={close}
            aria-label="Хаах"
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="relative inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-200">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Шинэчлэл · M токен
          </p>
          <h2 id={titleId} className="relative mt-3 text-xl sm:text-2xl font-extrabold">
            {STEPS[step].title}
          </h2>
          {/* Алхмын заалт */}
          <div className="relative mt-4 flex gap-1.5" aria-label={`${step + 1}/${STEPS.length}-р алхам`}>
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`${i + 1}-р алхам: ${s.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-orange-400" : i < step ? "w-4 bg-orange-400/50" : "w-4 bg-white/20"}`}
              />
            ))}
          </div>
        </div>

        {/* Агуулга (key — алхам солигдоход дахин гарч ирнэ) */}
        <div key={step} className="px-6 py-5 animate-fade-in">
          <Body />
        </div>

        {/* Доод хэсэг */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:invisible transition"
          >
            <ArrowLeft className="w-4 h-4" /> Өмнөх
          </button>
          {last ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/company/billing"
                onClick={close}
                className="hidden sm:inline-flex h-11 items-center rounded-2xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Багц харах
              </Link>
              <button
                ref={nextRef}
                type="button"
                onClick={close}
                className="orange-btn inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                <Check className="w-4 h-4" /> Ойлголоо
              </button>
            </div>
          ) : (
            <button
              ref={nextRef}
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="orange-btn inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold"
            >
              Дараах <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
