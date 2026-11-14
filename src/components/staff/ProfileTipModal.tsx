"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowRight, Check, Eye, EyeOff, Search, Send, X } from "lucide-react"
import FoalIllustration from "@/components/common/FoalIllustration"
import { useIsClient } from "@/lib/useIsClient"
import { delay } from "@/app/dashboard/components/dashMotion"

interface Props {
  percent: number
  missing: string[]
  // «Ажил олгогчдод ил тод харуулах» зөвшөөрөл идэвхтэй эсэх
  visible: boolean
  // dontShowAgain — «Дахин харуулахгүй» сонгосон эсэх
  onClose: (dontShowAgain: boolean) => void
}

const RING_R = 30
const RING_C = 2 * Math.PI * RING_R

// Ажилтан нэвтэрсний дараа хяналтын самбар дээр гарах зөвлөмж:
// профайлаа бөглөх, «ил тод харуулах» зөвшөөрлийн ач холбогдол.
export default function ProfileTipModal({ percent, missing, visible, onClose }: Props) {
  const isClient = useIsClient()
  const [dontShow, setDontShow] = useState(false)
  const primaryRef = useRef<HTMLAnchorElement>(null)
  const titleId = useId()
  const checkboxId = useId()

  useEffect(() => {
    primaryRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(dontShow)
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose, dontShow])

  if (!isClient) return null

  const complete = missing.length === 0
  const safePercent = Math.max(0, Math.min(100, percent))

  const benefits = [
    {
      icon: Search,
      tone: "bg-orange-100 text-orange-600",
      title: "Ажил олгогчид таныг олно",
      text: "Профайлаа 100% бөглөсөн ажилтан л ажил олгогчдын «Ажилтан хайх» хэсэгт харагдана.",
    },
    {
      icon: Send,
      tone: "bg-sky-100 text-sky-600",
      title: "Анкет илгээх боломж",
      text: "Нэр, утас, төрсөн огноо, танилцуулга, ур чадвар, туршлага, боловсролоо бөглөөгүй бол анкет илгээх боломжгүй.",
    },
    {
      icon: visible ? Eye : EyeOff,
      tone: visible ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600",
      title: "«Ил тод харуулах» зөвшөөрөл",
      text: "Профайлын «Хувийн мэдээлэл» хэсэгт энэ сонголтыг идэвхжүүлбэл ажил олгогчид таныг хайлтаар олж, ажлын санал илгээнэ.",
      status: visible ? "Идэвхтэй" : "Идэвхгүй",
      statusTone: visible ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200",
    },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in"
      onClick={() => onClose(dontShow)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
      >
        {/* ТОЛГОЙ: градиент, явцын бөгж, унага */}
        <div className="relative overflow-hidden bg-linear-to-br from-orange-500 via-orange-500 to-amber-400 px-6 pt-6 pb-7 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[14px_14px]"
          />
          <button
            type="button"
            onClick={() => onClose(dontShow)}
            aria-label="Хаах"
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-4">
            {/* Профайлын явц */}
            <div className="dash-pop relative shrink-0 w-20 h-20" style={delay(150)}>
              <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="36" cy="36" r={RING_R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
                <circle
                  cx="36"
                  cy="36"
                  r={RING_R}
                  fill="none"
                  stroke="white"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - safePercent / 100)}
                  // 0-ээс одоогийн хувь хүртэл дүүрнэ (globals.css .ring-fill)
                  style={{ "--ring-from": RING_C } as React.CSSProperties}
                  className="ring-fill"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-lg font-extrabold">{safePercent}%</span>
            </div>
            <div className="min-w-0 pr-16 sm:pr-20">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Зөвлөмж</p>
              <h2 id={titleId} className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight">
                {complete ? "Профайл бэлэн боллоо!" : "Профайлаа бөглөөд ажилд хурдан ороорой"}
              </h2>
            </div>
          </div>
          <FoalIllustration
            variant="search"
            size={104}
            className="pointer-events-none absolute -bottom-3 right-2 hidden sm:block drop-shadow-lg"
          />
        </div>

        {/* АГУУЛГА */}
        <div className="px-6 pt-5 pb-6">
          {!complete && (
            <div className="dash-in mb-5" style={delay(220)}>
              <p className="text-xs font-semibold text-gray-500">Дутуу байгаа:</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((item) => (
                  <li key={item} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-3">
            {benefits.map((b, i) => (
              <li
                key={b.title}
                className="dash-in flex gap-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5"
                style={delay(280 + i * 90)}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${b.tone}`}>
                  <b.icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{b.title}</p>
                    {b.status && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${b.statusTone}`}>{b.status}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* ДООД ХЭСЭГ */}
          {/* Утсан дээр доод талд бэхлэгдэнэ — гүйлгэхгүйгээр товч харагдана */}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-5 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <label htmlFor={checkboxId} className="group inline-flex shrink-0 cursor-pointer select-none items-center gap-2.5 whitespace-nowrap text-sm text-gray-600">
              <span className="relative grid h-5 w-5 place-items-center">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                  className="peer absolute inset-0 appearance-none rounded-md border-2 border-gray-300 bg-white transition checked:border-orange-500 checked:bg-orange-500 group-hover:border-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                />
                <Check className="pointer-events-none relative w-3.5 h-3.5 text-white opacity-0 scale-50 transition peer-checked:opacity-100 peer-checked:scale-100" strokeWidth={3} />
              </span>
              Дахин харуулахгүй
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onClose(dontShow)}
                className="h-11 flex-1 sm:flex-none rounded-2xl px-4 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                Дараа
              </button>
              <Link
                ref={primaryRef}
                href="/dashboard/staff/profile"
                onClick={() => onClose(dontShow)}
                className="orange-btn btn-shine inline-flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 whitespace-nowrap px-5 text-sm font-semibold"
              >
                {complete ? "Профайл харах" : "Профайл бөглөх"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
