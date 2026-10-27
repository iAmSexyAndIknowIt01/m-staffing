"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2, Circle, XCircle } from "lucide-react"
import { getPasswordStrength, validateNewPassword } from "@/lib/password"
import { CYRILLIC_NAME_MAX_LENGTH, getNameError, normalizeName } from "@/lib/mongolianName"
import PasswordInput from "@/components/common/PasswordInput"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LAST_NAME_EMPTY = "Овгоо оруулна уу"
const FIRST_NAME_EMPTY = "Нэрээ оруулна уу"

type Field = "lastName" | "firstName" | "companyName" | "email" | "password"

const STRENGTH_STYLES = ["", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"]
const STRENGTH_TEXT = ["", "text-red-500", "text-amber-600", "text-lime-600", "text-emerald-600"]

function inputStateClass(state: "error" | "valid" | "idle") {
  if (state === "error") return "border-red-400 focus:border-red-500 bg-red-50/30"
  if (state === "valid") return "border-emerald-300 focus:border-emerald-500"
  return "border-orange-100 focus:border-orange-500"
}

// Талбарын доорх мөр: алдаа (улаан), зөв (ногоон) эсвэл зааварчилгаа (саарал)
function FieldMessage({ id, error, valid, hint }: { id: string; error: string | null; valid?: boolean; hint?: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-500">
        <XCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" /> {error}
      </p>
    )
  }
  if (valid) {
    return (
      <p id={id} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Зөв байна
      </p>
    )
  }
  return hint ? <p id={id} className="mt-1.5 text-xs text-gray-400">{hint}</p> : null
}

export default function RegisterPage() {
  const router = useRouter()

  const [role, setRole] = useState<"staff" | "company">("staff")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Талбараас гарсан эсвэл «Бүртгүүлэх» дарсан бол хоосон талбарын алдааг ч харуулна
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    lastName: false,
    firstName: false,
    companyName: false,
    email: false,
    password: false,
  })

  // Баталгаажуулалтын Modal болон Кодны state-үүд
  const [showModal, setShowModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [verifying, setVerifying] = useState(false)

  // Мэдэгдлийн Модалд зориулсан шинэ State-үүд
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "error" | "success" | "warning";
    onConfirm?: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    type: "warning",
  })

  // Мэдэгдлийн модал нээх туслах функц
  const showAlert = (
    title: string,
    message: string,
    type: "error" | "success" | "warning",
    onConfirm?: () => void
  ) => {
    setAlertModal({ show: true, title, message, type, onConfirm })
  }

  // Шивэх бүрт (realtime) шалгана
  const errors: Record<Field, string | null> = {
    lastName: getNameError(lastName, LAST_NAME_EMPTY),
    firstName: getNameError(firstName, FIRST_NAME_EMPTY),
    companyName: !companyName.trim()
      ? "Компанийн нэрээ оруулна уу"
      : companyName.trim().length < 2
        ? "Хамгийн багадаа 2 тэмдэгт байна"
        : null,
    email: !email.trim()
      ? "Имэйлээ оруулна уу"
      : !EMAIL_RE.test(email.trim())
        ? "Имэйл хаяг буруу байна. Жишээ: name@email.com"
        : null,
    password: password ? validateNewPassword(password) : "Нууц үгээ оруулна уу",
  }
  const values: Record<Field, string> = { lastName, firstName, companyName, email, password }
  const activeFields: Field[] = role === "staff" ? ["lastName", "firstName", "email", "password"] : ["companyName", "email", "password"]

  // Хоосон бол зөвхөн touched үед; имэйлийг «@» бичсэний дараа эсвэл гарсны дараа шалгана
  const visibleError = (field: Field): string | null => {
    const value = values[field]
    const started = field === "email" ? value.includes("@") : value.length > 0
    return touched[field] || started ? errors[field] : null
  }
  const fieldState = (field: Field) =>
    visibleError(field) ? "error" : values[field] && !errors[field] ? "valid" : "idle"
  const markTouched = (field: Field) => setTouched((prev) => ({ ...prev, [field]: true }))

  const strength = getPasswordStrength(password)

  // Алхам 1: "Бүртгүүлэх" дарахад код үүсгэж имэйл рүү илгээнэ
  async function handleSendAuthMail() {
    // Бүх талбарыг шалгаж, эхний алдаатай талбар руу шилжинэ
    setTouched({ lastName: true, firstName: true, companyName: true, email: true, password: true })
    const firstInvalid = activeFields.find((field) => errors[field])
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus()
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/auth/register/mailAuth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        showAlert("Алдаа гарлаа", data.message || "Код илгээхэд алдаа гарлаа", "error")
        return
      }

      setShowModal(true)
    } catch {
      showAlert("Системийн алдаа", "Системийн алдаа гарлаа. Дараа дахин оролдоно уу.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Алхам 2: Кодоо оруулаад "Баталгаажуулах" товч дарах үед
  async function handleVerifyAndRegister() {
    if (verificationCode.length !== 6) {
      showAlert("Анхааруулга", "6 оронтой кодоо бүрэн оруулна уу", "warning")
      return
    }

    try {
      setVerifying(true)

      // Код таарч байгаа эсэхийг mailAuth API дээр шалгана
      const verifyRes = await fetch("/api/auth/register/mailAuth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        showAlert("Баталгаажуулалт амжилтгүй", verifyData.message || "Баталгаажуулах код буруу байна", "error")
        setVerifying(false) 
        return
      }

      // Код зөв бол үндсэн бүртгэлийн API-г ажиллуулна
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName: normalizeName(firstName),
          lastName: normalizeName(lastName),
          companyName,
          email,
          password,
        }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        showAlert("Бүртгэл амжилтгүй", registerData.message || "Бүртгэл амжилтгүй боллоо", "error")
        setVerifying(false) 
        return
      }

      setShowModal(false)
      
      showAlert(
        "Амжилттай!", 
        "Бүртгэл амжилттай үүслээ. Та нэвтрэн орно уу.", 
        "success", 
        () => router.push("/login")
      )

    } catch {
      showAlert("Алдаа", "Баталгаажуулах явцад алдаа гарлаа", "error")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 pb-8 lg:py-0">
      {/* BG */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#fffaf6] to-white" />

      {/* GLOW */}
      <div className="absolute top-[10%] left-[10%] w-175 h-175 rounded-full bg-orange-300/10 blur-[180px]" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.5] bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)] bg-size-[70px_70px]" />

      <Link
        href="/login"
        className="fixed top-4 left-4 sm:top-8 sm:left-8 z-20 glass rounded-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base transition hover:-translate-y-1"
      >
        ← Нэвтрэх
      </Link>

      <div className="relative z-10 max-w-300 w-full grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-4xl lg:rounded-4xl lg:min-h-155 flex flex-col justify-center px-6 py-10 lg:p-14">
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,140,0,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)] bg-size-[56px_56px]" />
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-112.5 h-112.5 rounded-full bg-orange-300/20 blur-[140px]" />

          <div className="relative z-10">
            <p className="orange-text font-bold tracking-[6px]">MSTAFFING</p>
            <h1 className="mt-4 lg:mt-6 text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05]">
              {role === "staff" ? "Шинэ боломж." : "Шинэ ажилтан."}
            </h1>
            <p className="mt-4 lg:mt-8 text-gray-500 text-base sm:text-xl leading-7 sm:leading-9">
              {role === "staff"
                ? "Хэдхэн алхмаар бүртгүүлээд ажил хайж эхлээрэй."
                : "Компаниа бүртгүүлээд ажилтан хайж эхлээрэй."}
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

          <h2 className="text-2xl sm:text-3xl font-black mt-8 sm:mt-10">Бүртгүүлэх</h2>

          {role === "staff" ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ["lastName", "Овог", lastName, setLastName, "family-name", "Жишээ: Батбаяр"],
                  ["firstName", "Нэр", firstName, setFirstName, "given-name", "Жишээ: Сарангэрэл"],
                ] as const
              ).map(([field, label, value, setValue, autoComplete, placeholder]) => (
                <div key={field}>
                  <label htmlFor={`register-${field}`} className={visibleError(field) ? "text-red-500" : ""}>{label}</label>
                  <input
                    id={`register-${field}`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => markTouched(field)}
                    autoComplete={autoComplete}
                    maxLength={CYRILLIC_NAME_MAX_LENGTH}
                    aria-invalid={!!visibleError(field)}
                    aria-describedby={`register-${field}-msg`}
                    placeholder={placeholder}
                    className={`mt-3 w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${inputStateClass(fieldState(field))}`}
                  />
                  <FieldMessage
                    id={`register-${field}-msg`}
                    error={visibleError(field)}
                    valid={fieldState(field) === "valid"}
                    hint="Кирилл үсгээр бичнэ"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <label htmlFor="register-companyName" className={visibleError("companyName") ? "text-red-500" : ""}>Компанийн нэр</label>
              <input
                id="register-companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => markTouched("companyName")}
                autoComplete="organization"
                aria-invalid={!!visibleError("companyName")}
                aria-describedby="register-companyName-msg"
                className={`mt-3 w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${inputStateClass(fieldState("companyName"))}`}
              />
              <FieldMessage id="register-companyName-msg" error={visibleError("companyName")} valid={fieldState("companyName") === "valid"} />
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="register-email" className={visibleError("email") ? "text-red-500" : ""}>Имэйл</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched("email")}
              autoComplete="email"
              placeholder="name@email.com"
              aria-invalid={!!visibleError("email")}
              aria-describedby="register-email-msg"
              className={`mt-3 w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${inputStateClass(fieldState("email"))}`}
            />
            <FieldMessage id="register-email-msg" error={visibleError("email")} valid={fieldState("email") === "valid"} />
          </div>

          <div className="mt-6">
            <label htmlFor="register-password" className={touched.password && errors.password ? "text-red-500" : ""}>Нууц үг</label>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched("password")}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby="register-password-msg"
              wrapperClassName="mt-3"
              className={`w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${inputStateClass(
                touched.password && errors.password ? "error" : password && !errors.password ? "valid" : "idle"
              )}`}
            />

            {/* Нууц үгийн чанар */}
            <div id="register-password-msg" className="mt-3" aria-live="polite">
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-4 gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-colors ${i <= strength.score ? STRENGTH_STYLES[strength.score] : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <span className={`w-16 text-right text-xs font-semibold ${STRENGTH_TEXT[strength.score] || "text-gray-400"}`}>
                  {strength.label || "Чанар"}
                </span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {strength.checks.map((check) => {
                  const failed = !check.ok && (touched.password || password.length > 0)
                  return (
                    <li
                      key={check.id}
                      className={`inline-flex items-center gap-1 ${check.ok ? "text-emerald-600" : failed && touched.password ? "text-red-500" : "text-gray-400"}`}
                    >
                      {check.ok ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Circle className="w-3.5 h-3.5" aria-hidden="true" />}
                      {check.label}
                      <span className="sr-only">{check.ok ? " — хангасан" : " — хангаагүй"}</span>
                    </li>
                  )
                })}
              </ul>
              {strength.score >= 2 && strength.score < 4 && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Илүү хүчтэй болгохын тулд том, жижиг үсэг, тусгай тэмдэгт (!@#) нэмэх эсвэл 12+ тэмдэгт болгоорой.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSendAuthMail}
            disabled={loading}
            className="orange-btn w-full mt-10"
          >
            {loading ? "Код илгээж байна..." : "Бүртгүүлэх"}
          </button>

          <p className="mt-8 text-center text-gray-500">
            Бүртгэлтэй юу?
            <Link href="/login" className="orange-text ml-2">
              Нэвтрэх
            </Link>
          </p>
        </div>
      </div>

      {/* 6 ОРОНТОЙ КОД БАТАЛГААЖУУЛАХ MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl p-8 max-w-md w-full shadow-2xl border border-orange-50 text-center animate-in fade-in zoom-in-95 duration-200">
            
            <div className="mx-auto w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-3">
              Код баталгаажуулах
            </h3>
            
            <div className="text-gray-600 space-y-4 text-sm leading-relaxed mb-6">
              <p>
                Бид таны <span className="font-bold text-orange-600 break-all">{email}</span> хаяг руу 6 оронтой баталгаажуулах код илгээлээ.
              </p>
              
              <div className="mt-4">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full tracking-[12px] text-center text-2xl font-bold rounded-2xl border-2 border-orange-200 focus:border-orange-500 outline-none px-5 py-4 bg-orange-50/30"
                />
              </div>

              <p className="text-xs text-gray-400">
                Имэйл орж иртэл хэдэн секунд хүлээгдэж магадгүй. Спам хавтсыг мөн шалгаарай.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition cursor-pointer"
              >
                Цуцлах
              </button>
              <button
                onClick={handleVerifyAndRegister}
                disabled={verifying}
                className="flex-2 orange-btn py-4 rounded-2xl font-bold cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {verifying ? "Бүртгэж байна..." : "Баталгаажуулах"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МЭДЭГДЛИЙН АНХААРУУЛГА МОДАЛ */}
      {alertModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-xl border text-center animate-in fade-in zoom-in-95 duration-150">
            
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
              {alertModal.type === "success" && (
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              )}
              {alertModal.type === "error" && (
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {alertModal.type === "warning" && (
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
              )}
            </div>

            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {alertModal.title}
            </h4>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {alertModal.message}
            </p>

            <button
              onClick={() => {
                setAlertModal((prev) => ({ ...prev, show: false }))
                if (alertModal.onConfirm) alertModal.onConfirm()
              }}
              className={`w-full py-3.5 rounded-2xl font-bold text-white transition ${
                alertModal.type === "success" ? "bg-green-600 hover:bg-green-700" :
                alertModal.type === "error" ? "bg-red-600 hover:bg-red-700" :
                "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              ОК
            </button>
          </div>
        </div>
      )}
    </main>
  )
}