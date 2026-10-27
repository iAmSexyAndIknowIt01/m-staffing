"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, MailCheck, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SEC = 60

// Эцэг компонент нөхцөлтэйгөөр mount хийнэ ({show && <VerifyCodeModal />}) — нээгдэх бүрт state шинэчлэгдэнэ
interface VerifyCodeModalProps {
  email: string
  onClose: () => void
  // Алдаа гарвал хэрэглэгчид харуулах мессежийг буцаана, амжилттай бол null
  onSubmit: (code: string) => Promise<string | null>
  onResend: () => Promise<string | null>
}

// Имэйлээр ирсэн 6 оронтой кодыг оруулах цонх (нүд бүрт нэг цифр, paste дэмжинэ)
export default function VerifyCodeModal({ email, onClose, onSubmit, onResend }: VerifyCodeModalProps) {
  const mounted = useIsClient()
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join("")
  const busy = submitting || resending

  // Нээгдэхэд эхний нүд рүү шилжинэ
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [busy, onClose])

  if (!mounted) return null

  const focusAt = (i: number) => inputsRef.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus()

  const fillFrom = (start: number, value: string) => {
    const chars = value.replace(/\D/g, "").slice(0, CODE_LENGTH - start).split("")
    if (chars.length === 0) return
    setDigits((prev) => {
      const next = [...prev]
      chars.forEach((c, k) => (next[start + k] = c))
      return next
    })
    setError(null)
    focusAt(start + chars.length)
  }

  const submit = async () => {
    if (busy) return
    if (code.length !== CODE_LENGTH) {
      setError("6 оронтой кодоо бүрэн оруулна уу")
      focusAt(digits.findIndex((d) => !d))
      return
    }
    setSubmitting(true)
    setError(null)
    const message = await onSubmit(code)
    setSubmitting(false)
    if (message) {
      setError(message)
      setDigits(Array(CODE_LENGTH).fill(""))
      focusAt(0)
    }
  }

  const resend = async () => {
    if (busy || cooldown > 0) return
    setResending(true)
    setError(null)
    setInfo(null)
    const message = await onResend()
    setResending(false)
    if (message) setError(message)
    else {
      setInfo("Шинэ код илгээлээ")
      setCooldown(RESEND_COOLDOWN_SEC)
      setDigits(Array(CODE_LENGTH).fill(""))
      focusAt(0)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100000 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-code-title"
        aria-describedby="verify-code-desc"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Хаах"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="p-6 pb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600">
              <MailCheck className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <h3 id="verify-code-title" className="mt-4 pr-8 text-lg font-semibold text-gray-900">
              Имэйлээ баталгаажуулна уу
            </h3>
            <p id="verify-code-desc" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-800 break-all">{email}</span> хаяг руу 6 оронтой код илгээлээ.
            </p>

            <div className="mt-5 flex justify-between gap-2" role="group" aria-label="Баталгаажуулах код">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  value={digit}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`${i + 1}-р орон`}
                  aria-invalid={!!error}
                  maxLength={CODE_LENGTH}
                  disabled={busy}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    if (value.length > 1) fillFrom(i, value)
                    else {
                      setDigits((prev) => prev.map((d, k) => (k === i ? value : d)))
                      setError(null)
                      if (value) focusAt(i + 1)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && i > 0) {
                      e.preventDefault()
                      setDigits((prev) => prev.map((d, k) => (k === i - 1 ? "" : d)))
                      focusAt(i - 1)
                    } else if (e.key === "ArrowLeft") focusAt(i - 1)
                    else if (e.key === "ArrowRight") focusAt(i + 1)
                  }}
                  onPaste={(e) => {
                    e.preventDefault()
                    fillFrom(i, e.clipboardData.getData("text"))
                  }}
                  className={`w-full max-w-13 h-14 rounded-xl border-2 text-center text-xl font-bold text-gray-900 outline-none transition disabled:opacity-60 ${
                    error
                      ? "border-red-300 bg-red-50/40 focus:border-red-500"
                      : digit
                        ? "border-orange-300 bg-orange-50/40 focus:border-orange-500"
                        : "border-gray-200 bg-gray-50 focus:border-orange-500 focus:bg-white"
                  }`}
                />
              ))}
            </div>

            <div className="mt-3 min-h-5 text-sm" aria-live="polite">
              {error ? (
                <p role="alert" className="text-red-600">{error}</p>
              ) : info ? (
                <p className="text-emerald-600">{info}</p>
              ) : (
                <p className="text-gray-400 text-xs">Имэйл ирэхэд хэдэн секунд болж магадгүй. Спам хавтсаа мөн шалгаарай.</p>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Код ирээгүй юу?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={busy || cooldown > 0}
                className="font-semibold text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resending ? "Илгээж байна..." : cooldown > 0 ? `Дахин илгээх (${cooldown}с)` : "Дахин илгээх"}
              </button>
            </p>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 shadow-md shadow-orange-600/20 inline-flex items-center justify-center gap-2 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Бүртгэж байна..." : "Баталгаажуулах"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
