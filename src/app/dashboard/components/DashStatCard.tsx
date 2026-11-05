"use client"

import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import CountUp from "@/components/landing/CountUp"
import { delay } from "./dashMotion"

export { ARROW_HOVER, CARD_HOVER, ICON_HOVER } from "@/lib/cardMotion"

// Картын өнгө: хулганаар очиход хүрээ, гэрэлтэлт энэ өнгөөр тодорно
const STAT_ACCENTS = {
  orange: { icon: "bg-orange-50 text-orange-600", hover: "hover:border-orange-200 hover:shadow-orange-500/10", glow: "bg-orange-400/20", value: "group-hover:text-orange-600" },
  sky: { icon: "bg-sky-50 text-sky-600", hover: "hover:border-sky-200 hover:shadow-sky-500/10", glow: "bg-sky-400/20", value: "group-hover:text-sky-600" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", hover: "hover:border-emerald-200 hover:shadow-emerald-500/10", glow: "bg-emerald-400/20", value: "group-hover:text-emerald-600" },
} as const

export default function StatCard({
  icon: Icon,
  accent,
  label,
  value,
  hint,
  href,
  delayMs = 0,
}: {
  icon: LucideIcon
  accent: keyof typeof STAT_ACCENTS
  label: string
  value: number
  hint: string
  href?: string
  delayMs?: number
}) {
  const tone = STAT_ACCENTS[accent]
  const body = (
    <>
      {/* Хулганаар очиход булангаас зөөлөн гэрэлтэнэ */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl opacity-0 scale-75 transition duration-500 group-hover:opacity-100 group-hover:scale-100 ${tone.glow}`}
      />
      <span
        style={delay(delayMs + 180)}
        className={`dash-pop relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 ${tone.icon}`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 leading-snug">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold text-gray-900 leading-tight transition-colors duration-300 ${tone.value}`}>
          <CountUp value={String(value)} duration={1400} delay={delayMs + 250} />
        </p>
        <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
      {href && (
        <ChevronRight
          aria-hidden="true"
          className="relative hidden sm:block w-4 h-4 shrink-0 self-center text-gray-300 opacity-0 -translate-x-1 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-gray-500"
        />
      )}
    </>
  )
  const className = `dash-in group relative overflow-hidden bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${tone.hover}`
  return href ? (
    <Link href={href} style={delay(delayMs)} className={className}>
      {body}
    </Link>
  ) : (
    <div style={delay(delayMs)} className={className}>
      {body}
    </div>
  )
}

