"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react"
import { showAlert, showConfirm } from "@/components/common/AppDialog"
import { CONTACT_UNLOCK_HOURS, formatRemaining } from "@/lib/staffContact"
import { TOKEN_COSTS, formatTokens } from "@/lib/planCatalog"

const COST = TOKEN_COSTS.contact_unlock

export type ContactAccessState =
  | { status: "applicant" }
  | { status: "unlocked"; expiresAt: string }
  | { status: "locked" }

interface Props {
  staffId: string
  staffName: string
  access: ContactAccessState
  // Амжилттай нээсний дараа бодит утас, имэйлийг дамжуулна
  onUnlocked: (data: { access: ContactAccessState; phone: string; email: string }) => void
  // 10 цаг дуусахад профайлыг дахин татаж нуух
  onExpired: () => void
}

// Ажилтны профайлын баруун дээд буланд: «Ажиллах хүсэлт илгээх» → M токен хасаж утас, имэйлийг 10 цаг нээнэ
export default function ContactUnlockButton({ staffId, staffName, access, onUnlocked, onExpired }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Үлдсэн M токен (товчны доор харуулна)
  useEffect(() => {
    if (access.status !== "locked") return
    let cancelled = false
    fetch("/api/company/searchStaff/contact")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setRemaining(data.remainingCredits)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [access.status])

  // Нээлттэй хугацааг минут тутам шинэчилж, дуусахад нууна
  const expiresAt = access.status === "unlocked" ? access.expiresAt : null
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (new Date(expiresAt).getTime() <= t) onExpired()
    }
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [expiresAt, onExpired])

  const handleClick = async () => {
    if (remaining !== null && remaining < COST) {
      await showAlert(`Хүсэлт илгээхэд ${formatTokens(COST)} хэрэгтэй, танд ${formatTokens(remaining)} үлдсэн байна. «Төлбөр, багц» хэсгээс шинэ багц худалдаж авна уу.`, {
        title: "Эрх хүрэлцэхгүй",
        tone: "warning",
      })
      return
    }

    const ok = await showConfirm(
      `Ажиллах хүсэлт илгээхэд ${formatTokens(COST)} хасагдана. Үүний дараа ажилтны утас, имэйлийг ${CONTACT_UNLOCK_HOURS} цагийн турш харах боломжтой.`,
      {
        title: `${formatTokens(COST)} хасагдана`,
        confirmLabel: "Зөвшөөрч байна",
        cancelLabel: "Болих",
        icon: Send,
        subject: {
          name: staffName || "Ажилтан",
          details: remaining !== null ? [`Одоо үлдсэн: ${formatTokens(remaining)}`, `Хасагдсаны дараа: ${formatTokens(remaining - COST)}`] : undefined,
        },
      }
    )
    if (!ok) return

    setBusy(true)
    try {
      const res = await fetch("/api/company/searchStaff/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        await showAlert(data.error || "Хүсэлт илгээж чадсангүй. Дахин оролдоно уу.", { tone: "error" })
        return
      }
      setRemaining(data.remainingCredits)
      setNow(Date.now())
      onUnlocked({ access: data.contactAccess, phone: data.phone, email: data.email })
    } catch {
      await showAlert("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.", { tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  if (access.status === "applicant") {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" /> Танай зарт анкет илгээсэн
      </div>
    )
  }

  if (access.status === "unlocked") {
    return (
      <div className="flex flex-col items-start sm:items-end gap-1">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Хүсэлт илгээсэн
        </div>
        <p className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" /> Холбоо барих мэдээлэл {formatRemaining(access.expiresAt, now)} харагдана
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="orange-btn inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-semibold disabled:opacity-70"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Ажиллах хүсэлт илгээх
      </button>
      <p className="text-xs text-gray-500">
        {formatTokens(COST)} хасагдана
        {remaining !== null && (
          <>
            {" · "}Үлдсэн: <span className={`font-semibold ${remaining < COST ? "text-red-600" : "text-gray-700"}`}>{formatTokens(remaining)}</span>
            {remaining < COST && (
              <>
                {" · "}
                <Link href="/dashboard/company/billing" className="font-semibold text-orange-600 hover:underline">Багц авах</Link>
              </>
            )}
          </>
        )}
      </p>
    </div>
  )
}
