"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import PasswordInput from "@/components/common/PasswordInput"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass = (hasError: boolean) => `
  w-full
  rounded-2xl
  border
  px-5
  py-4
  outline-none
  ${hasError ? "border-red-400 focus:border-red-500" : "border-orange-100 focus:border-orange-500"}
`

export default function LoginPage() {
  const [role, setRole] = useState<"staff" | "company">("staff")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Modal-д зориулсан state
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Талбар тус бүрийн шалгалтын алдаа (сервер рүү явуулахаас өмнө)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const errors: { email?: string; password?: string } = {}
    const trimmed = email.trim()

    if (!trimmed) errors.email = "Имэйл хаягаа оруулна уу."
    else if (!EMAIL_RE.test(trimmed)) errors.email = "Имэйл хаяг буруу байна. Жишээ нь: name@email.com"

    if (!password) errors.password = "Нууц үгээ оруулна уу."

    setFieldErrors(errors)
    if (errors.email) document.getElementById("login-email")?.focus()
    else if (errors.password) document.getElementById("login-password")?.focus()
    return !errors.email && !errors.password
  }

  function closeErrorModal() {
    setErrorMessage(null)
    // Дахин оролдоход бэлэн болгож нууц үгийн талбар руу буцаана
    const passwordInput = document.getElementById("login-password") as HTMLInputElement | null
    passwordInput?.focus()
    passwordInput?.select()
  }

  // Алдааны цонх нээлттэй үед Esc-ээр хаана
  useEffect(() => {
    if (!errorMessage) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeErrorModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [errorMessage])

  async function login() {
    // Алдааны цонх харагдаж байхад Enter дарахад дахин илгээхгүй
    if (loading || errorMessage) return
    if (!validate()) return

    try {
      setLoading(true)

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна.")
        return
      }

      window.location.href = data.redirect

    } catch {
      setErrorMessage("Нэвтрэх үед системд алдаа гарлаа. Та дараа дахин оролдоно уу.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 pb-8 lg:py-0">
      {/* BG — бүртгүүлэх хуудастай ижил */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#fffaf6] to-white" />

      {/* GLOW */}
      <div className="absolute top-[10%] left-[10%] w-175 h-175 rounded-full bg-orange-300/10 blur-[180px]" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.5] bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)] bg-size-[70px_70px]" />

      <Link
        href="/"
        className="fixed top-4 left-4 sm:top-8 sm:left-8 z-20 glass rounded-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base transition hover:-translate-y-1"
      >
        ← Нүүр хуудас
      </Link>

      <div className="relative z-10 max-w-300 w-full grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-4xl lg:rounded-4xl lg:min-h-155 flex flex-col justify-center px-6 py-10 lg:p-14">
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,140,0,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)] bg-size-[56px_56px]" />
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-112.5 h-112.5 rounded-full bg-orange-300/20 blur-[140px]" />

          <div className="relative z-10">
            <p className="orange-text font-bold tracking-[6px]">MSTAFFING</p>
            <h1 className="mt-4 lg:mt-6 text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05]">
              {role === "staff" ? "Ажлаа ол." : "Багаа бүрдүүл."}
              <br />
              Тавтай морил.
            </h1>
            <p className="mt-4 lg:mt-8 text-gray-500 text-base sm:text-xl leading-7 sm:leading-9">
              {role === "staff"
                ? "Өөрт тохирох ажлаа олоод шууд эхлээрэй."
                : "Шилдэг ажилтнаа хурдан олоорой."}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="glass rounded-4xl sm:rounded-4xl p-6 sm:p-10">
          <div className="bg-orange-50 rounded-full p-2 flex">
            <button
              type="button"
              onClick={() => setRole("staff")}
              className={`flex-1 rounded-full py-3 transition ${
                role === "staff" ? "bg-orange-500 text-white" : ""
              }`}
            >
              Ажил Хайгч
            </button>

            <button
              type="button"
              onClick={() => setRole("company")}
              className={`flex-1 rounded-full py-3 transition ${
                role === "company" ? "bg-orange-500 text-white" : ""
              }`}
            >
              Ажил Олгогч
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mt-8 sm:mt-10">
            Нэвтрэх
          </h2>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              login()
            }}
          >
            <div className="mt-8">
              <label htmlFor="login-email">Имэйл</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                className={`mt-3 ${inputClass(!!fieldErrors.email)}`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }))
                }}
              />
              {fieldErrors.email && (
                <p id="login-email-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label htmlFor="login-password">Нууц үг</label>
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                placeholder="••••••••"
                wrapperClassName="mt-3"
                className={inputClass(!!fieldErrors.password)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }))
                }}
              />
              {fieldErrors.password && (
                <p id="login-password-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              <div className="mt-3 text-right">
                <Link href="/forgot-password" className="orange-text text-sm hover:underline">
                  Нууц үгээ мартсан уу?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="
                orange-btn
                w-full
                mt-10
                disabled:opacity-50
              "
              disabled={loading}
            >
              {loading
                ? "Түр хүлээнэ үү..."
                : role === "staff"
                ? "Ажил Хайгчаар Нэвтрэх"
                : "Ажил Олгогчоор Нэвтрэх"}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500">
            Бүртгэлгүй юу?
            <Link
              href="/register"
              className="
                orange-text
                ml-2
                hover:underline
              "
            >
              Бүртгүүлэх
            </Link>
          </p>
        </div>
      </div>

      {/* 🛠️ ERROR MODAL БҮТЭЦ */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            aria-describedby="login-error-message"
            className="bg-white rounded-4xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all scale-100"
          >
            
            {/* Алдааны анхааруулах дүрс (Icon) */}
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 id="login-error-title" className="text-xl font-bold text-center text-gray-900 mb-2">
              Алдаа гарлаа
            </h3>
            
            <p id="login-error-message" className="text-gray-500 text-center text-sm leading-relaxed mb-6">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={closeErrorModal}
              className="w-full bg-gray-900 text-white font-medium py-3 px-4 rounded-2xl hover:bg-gray-800 transition active:scale-[0.98]"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </main>
  )
}