"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Info, X } from "lucide-react"

// Мэдэгдэл автоматаар хаагдах хугацаа (секунд). Хулгана дээр нь байх/фокуслах үед зогсоно.
const AUTO_CLOSE_SECONDS = 10

// proxy.ts өөр төрлийн бүртгэлийн хэсгээс шилжүүлсэн үед (?notice=...) шалтгааныг тайлбарлана
const MESSAGES: Record<string, { title: string; text: string }> = {
  "staff-only": {
    title: "Энэ хэсэг ажил хайгчид зориулагдсан",
    text: "«Ажил хайх», анкет илгээх зэрэг хэсгүүдийг зөвхөн ажил хайгчийн бүртгэлээр ашиглана. Та ажил олгогчийн бүртгэлээр нэвтэрсэн тул өөрийн хянах самбар руу шилжлээ.",
  },
  "company-only": {
    title: "Энэ хэсэг ажил олгогчид зориулагдсан",
    text: "Ажилтан хайх, зар нийтлэх, анкет хүлээн авах хэсгүүдийг зөвхөн ажил олгогчийн бүртгэлээр ашиглана. Та ажил хайгчийн бүртгэлээр нэвтэрсэн тул өөрийн хянах самбар руу шилжлээ.",
  },
}

export default function RoleNotice() {
  const notice = useSearchParams().get("notice")
  const [dismissed, setDismissed] = useState(false)
  const message = notice ? MESSAGES[notice] : undefined
  if (!message || dismissed) return null

  const close = () => {
    setDismissed(true)
    // Хуудсаа шинэчлэхэд дахин гарахгүйн тул URL-ээс параметрийг арилгана
    const url = new URL(window.location.href)
    url.searchParams.delete("notice")
    window.history.replaceState(null, "", url.pathname + url.search)
  }

  return <NoticeBanner key={notice} title={message.title} text={message.text} onClose={close} />
}

function NoticeBanner({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [paused])

  useEffect(() => {
    if (secondsLeft === 0) onClose()
  }, [secondsLeft, onClose])

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative mb-6 flex items-start gap-3 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900"
    >
      <Info className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sky-800">{text}</p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="text-xs tabular-nums text-sky-700" aria-hidden="true" title={paused ? "Түр зогссон" : undefined}>
          {secondsLeft}с
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Мэдэгдэл хаах (${secondsLeft} секундын дараа автоматаар хаагдана)`}
          className="rounded-lg p-1 text-sky-700 hover:bg-sky-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Үлдсэн хугацааг харуулах зураас */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1 bg-sky-400/60 transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
        style={{ width: `${(secondsLeft / AUTO_CLOSE_SECONDS) * 100}%` }}
      />
    </div>
  )
}
