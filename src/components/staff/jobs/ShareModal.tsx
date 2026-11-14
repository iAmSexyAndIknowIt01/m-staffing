"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Link2, Share2, X } from "lucide-react"
import { jobShareUrl } from "@/lib/jobShare"

interface ShareModalProps {
  show: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    salary?: string
    mt_company?: { name: string }
  } | null
  formatSalary: (salary: string | undefined) => string
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API хаалттай үед (http, хуучин browser) нууц textarea-аар хуулна
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none"
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

// Ажлын зар хуваалцах цонх: одоогоор зөвхөн линк хуулна (сошиал товчнуудыг дараа нэмнэ).
// Линк нь нэвтрэлтгүй нээгдэх /jobs/[id] хуудас руу заана.
// Утсан дээр доороос гарах sheet, компьютер дээр голд гарах цонх.
// Шинэ зар нээхэд төлөв цэвэрлэгдэхийн тул эх компонент key={job.id} өгнө.
export default function ShareModal({ show, onClose, job, formatSalary }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  // Дахин дарах бүрт хөдөлгөөнийг эхнээс нь тоглуулахын тулд key болгоно
  const [copyCount, setCopyCount] = useState(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [show, onClose])

  if (!show || !job) return null

  const salaryText = job.salary ? formatSalary(job.salary) : undefined
  const shareUrl = typeof window !== "undefined" ? jobShareUrl(window.location.origin, job.id) : ""

  const handleCopy = async () => {
    if (await copyText(shareUrl)) {
      setFailed(false)
      setCopied(true)
      setCopyCount((n) => n + 1)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setCopied(false), 2200)
    } else {
      setFailed(true)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Утсан дээрх чирэх бариул */}
        <div aria-hidden="true" className="sm:hidden mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 id="share-title" className="text-lg font-bold text-gray-900">Зар хуваалцах</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Хуваалцах зарын товч мэдээлэл */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="font-bold text-gray-900 line-clamp-2">{job.title}</p>
          <p className="mt-1 text-sm text-gray-500 truncate">
            {[job.mt_company?.name, salaryText].filter(Boolean).join(" · ")}
          </p>
        </div>

        <p className="mb-3 text-sm text-gray-500">Линкийг хуулж, хүссэн газраа буулгаж хуваалцаарай.</p>

        <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl">
          <input
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Зарын линк"
            onFocus={(e) => e.currentTarget.select()}
            className="w-full min-w-0 bg-transparent px-3 text-xs text-gray-600 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors duration-300 shrink-0 active:scale-95 ${
              copied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {/* key солигдоход дүрс эргэж томорч гарна */}
            <span key={copied ? `ok-${copyCount}` : "link"} className="animate-icon-pop inline-flex">
              {copied ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Link2 className="w-3.5 h-3.5" />}
            </span>
            {copied ? "Хуулсан" : "Линк хуулах"}
          </button>
        </div>

        {/* Хуулагдсаныг илтгэх хөдөлгөөнтэй шошго */}
        <div role="status" aria-live="polite" className="mt-4 flex min-h-10 items-center justify-center">
          {copied && (
            <span
              key={copyCount}
              className="animate-copied-toast inline-flex items-center gap-2.5 rounded-full bg-green-600 py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-lg shadow-green-600/30"
            >
              <span className="relative grid h-6 w-6 place-items-center rounded-full bg-white/20">
                {/* Чагтын эргэн тойронд цацрах цэгүүд */}
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <span
                    key={deg}
                    aria-hidden="true"
                    style={{ "--a": `${deg}deg` } as React.CSSProperties}
                    className="animate-copied-burst absolute left-1/2 top-1/2 -ml-0.5 -mt-0.5 h-1 w-1 rounded-full bg-white"
                  />
                ))}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path className="animate-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              Линк хуулагдлаа
            </span>
          )}
          {failed && (
            <span className="text-xs text-orange-700">Хуулж чадсангүй. Линкийг сонгоод гараар хуулна уу.</span>
          )}
        </div>
      </div>
    </div>
  )
}
