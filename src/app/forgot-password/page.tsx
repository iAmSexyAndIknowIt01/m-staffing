"use client"

import Link from "next/link"
import { useState } from "react"
import { validateNewPassword } from "@/lib/password"

type Step = "email" | "reset" | "done"

const inputClass =
  "mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4 outline-none focus:border-orange-400"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function requestCode() {
    setError(null)
    if (!email.trim()) {
      setError("Имэйл хаягаа оруулна уу.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Код илгээхэд алдаа гарлаа.")
        return
      }

      setInfo(data.message)
      setStep("reset")
    } catch {
      setError("Системд алдаа гарлаа. Та дараа дахин оролдоно уу.")
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    setError(null)
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Имэйлээр ирсэн 6 оронтой кодыг оруулна уу.")
      return
    }
    const passwordError = validateNewPassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== passwordConfirm) {
      setError("Нууц үг таарахгүй байна.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/password-reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Нууц үг шинэчлэхэд алдаа гарлаа.")
        return
      }

      setInfo(data.message)
      setStep("done")
    } catch {
      setError("Системд алдаа гарлаа. Та дараа дахин оролдоно уу.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 pb-8">
      <Link
        href="/login"
        className="fixed top-4 left-4 sm:top-8 sm:left-8 glass rounded-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base flex items-center gap-3 transition hover:-translate-y-1 z-30"
      >
        ← Нэвтрэх
      </Link>

      <div className="glass w-full max-w-lg rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_40px_100px_rgba(255,122,0,.08)]">
        <p className="orange-text font-bold tracking-[6px] text-sm">MSTAFFING</p>
        <h1 className="text-2xl sm:text-3xl font-black mt-4">Нууц үг сэргээх</h1>

        {step === "email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              requestCode()
            }}
          >
            <p className="mt-3 text-gray-500">
              Бүртгэлтэй имэйл хаягаа оруулбал нууц үг сэргээх 6 оронтой код илгээнэ.
            </p>

            <div className="mt-8">
              <label htmlFor="email">Имэйл</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="orange-btn w-full mt-8 disabled:opacity-50" disabled={loading}>
              {loading ? "Түр хүлээнэ үү..." : "Код илгээх"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              resetPassword()
            }}
          >
            {info && <p className="mt-3 text-sm text-gray-500">{info}</p>}

            <div className="mt-8">
              <label htmlFor="code">Баталгаажуулах код</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className={`${inputClass} tracking-[8px] text-center text-xl font-bold`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="password">Шинэ нууц үг</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-400">Хамгийн багадаа 8 тэмдэгт, үсэг болон тоо агуулсан байна.</p>
            </div>

            <div className="mt-6">
              <label htmlFor="password-confirm">Шинэ нууц үг давтах</label>
              <input
                id="password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputClass}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>

            <button type="submit" className="orange-btn w-full mt-8 disabled:opacity-50" disabled={loading}>
              {loading ? "Түр хүлээнэ үү..." : "Нууц үг шинэчлэх"}
            </button>

            <button
              type="button"
              className="w-full mt-4 text-sm text-gray-500 hover:underline disabled:opacity-50"
              disabled={loading}
              onClick={() => {
                setCode("")
                requestCode()
              }}
            >
              Код ирээгүй юу? Дахин илгээх
            </button>
          </form>
        )}

        {step === "done" && (
          <div>
            <div className="mx-auto mt-8 flex items-center justify-center h-14 w-14 rounded-full bg-green-50">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-4 text-center text-gray-600">{info}</p>
            <p className="mt-2 text-center text-xs text-gray-400">
              Аюулгүй байдлын үүднээс бусад төхөөрөмж дээрх нэвтрэлт таны бүртгэлээс гарсан.
            </p>
            <Link href="/login" className="orange-btn w-full mt-8 block text-center">
              Нэвтрэх
            </Link>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
