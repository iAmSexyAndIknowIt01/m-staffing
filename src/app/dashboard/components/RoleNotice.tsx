"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Info, X } from "lucide-react"

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

  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
      <Info className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{message.title}</p>
        <p className="mt-0.5 text-sky-800">{message.text}</p>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Мэдэгдэл хаах"
        className="shrink-0 rounded-lg p-1 text-sky-700 hover:bg-sky-100 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
