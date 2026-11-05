"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2, Circle, XCircle } from "lucide-react"
import { getPasswordStrength, validateNewPassword } from "@/lib/password"
import { CYRILLIC_NAME_MAX_LENGTH, getNameError, normalizeName } from "@/lib/mongolianName"
import PasswordInput from "@/components/common/PasswordInput"
import VerifyCodeModal from "@/components/auth/VerifyCodeModal"
import { showAlert as showDialogAlert } from "@/components/common/AppDialog"
import { AnimatedHeadline, AuthBackdrop, RoleToggle, stagger } from "@/components/auth/AuthMotion"

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
  // Төрөл солиход талбарууд хүлээлтгүй шууд солигдон гарна (анх ачаалахад л дараалуулна)
  const [roleSwitched, setRoleSwitched] = useState(false)
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

  // Баталгаажуулах кодын цонх
  const [showModal, setShowModal] = useState(false)
  // Сервер «бүртгэлтэй» гэж хариулсан имэйл — талбарын доор шууд харуулна (код илгээхгүй)
  const [takenEmail, setTakenEmail] = useState<string | null>(null)
  const emailTaken = takenEmail !== null && email.trim().toLowerCase() === takenEmail

  // Системийн нийтлэг цонхоор (AppDialog) мэдэгдэл харуулна; хаагдсаны дараа onConfirm ажиллана
  const showAlert = (
    title: string,
    message: string,
    type: "error" | "success" | "warning",
    onConfirm?: () => void
  ) => {
    showDialogAlert(message, { title, tone: type }).then(() => onConfirm?.())
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
        : emailTaken
          ? "Энэ имэйл хаягаар бүртгэл үүссэн байна."
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

    setLoading(true)
    const result = await sendCode()
    setLoading(false)
    if (result.taken) {
      // Бүртгэлтэй имэйл — код илгээхгүй, цонх нээхгүй, талбар дээр нь заана
      setTakenEmail(email.trim().toLowerCase())
      document.getElementById("register-email")?.focus()
    } else if (result.error) showAlert("Алдаа гарлаа", result.error, "error")
    else setShowModal(true)
  }

  // Имэйл рүү код илгээнэ. Сервер код илгээхээс өмнө имэйл бүртгэлтэй эсэхийг (ажилтан, ажил олгогч) шалгана.
  async function sendCode(): Promise<{ error: string | null; taken?: boolean }> {
    try {
      const res = await fetch("/api/auth/register/mailAuth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) return { error: null }
      return { error: data.message || "Код илгээхэд алдаа гарлаа", taken: data.code === "email_taken" }
    } catch {
      return { error: "Системийн алдаа гарлаа. Дараа дахин оролдоно уу." }
    }
  }

  // Цонхны «Дахин илгээх»
  const requestCode = async (): Promise<string | null> => (await sendCode()).error

  // Алхам 2: Кодоо оруулаад «Баталгаажуулах» дарахад. Алдааг цонхон дотор нь харуулна.
  async function handleVerifyAndRegister(code: string): Promise<string | null> {
    try {
      // Код таарч байгаа эсэхийг mailAuth API дээр шалгана
      const verifyRes = await fetch("/api/auth/register/mailAuth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) return verifyData.message || "Баталгаажуулах код буруу байна"

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
      if (!registerRes.ok) return registerData.message || "Бүртгэл амжилтгүй боллоо"

      setShowModal(false)
      showAlert("Бүртгэл амжилттай", "Таны бүртгэл үүслээ. Одоо нэвтэрч орно уу.", "success", () => router.push("/login"))
      return null
    } catch {
      return "Баталгаажуулах явцад алдаа гарлаа. Дахин оролдоно уу."
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 pb-8 lg:py-0">
      <AuthBackdrop />

      <Link
        href="/login"
        className="auth-intro fixed top-4 left-4 sm:top-8 sm:left-8 z-20 glass rounded-full px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base transition hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10"
      >
        ← Нэвтрэх
      </Link>

      <div className="relative z-10 max-w-300 w-full grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-4xl lg:rounded-4xl lg:min-h-155 flex flex-col justify-center px-6 py-10 lg:p-14">
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,140,0,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)] bg-size-[56px_56px]" />
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-112.5 h-112.5 rounded-full bg-orange-300/20 blur-[140px]" />

          <div className="relative z-10">
            <p className="auth-intro orange-text font-bold tracking-[6px]">MSTAFFING</p>
            <h1 className="mt-4 lg:mt-6 text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05]">
              <AnimatedHeadline key={role} lines={[role === "staff" ? "Шинэ боломж." : "Шинэ ажилтан."]} />
            </h1>
            <p key={role} style={stagger(550)} className="dash-in mt-4 lg:mt-8 text-gray-500 text-base sm:text-xl leading-7 sm:leading-9">
              {role === "staff"
                ? "Хэдхэн алхмаар бүртгүүлээд ажил хайж эхлээрэй."
                : "Компаниа бүртгүүлээд ажилтан хайж эхлээрэй."}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-card glass rounded-4xl sm:rounded-4xl p-6 sm:p-10">
          <div style={stagger(350)} className="dash-in">
            <RoleToggle
              role={role}
              onChange={(next) => {
                setRole(next)
                setRoleSwitched(true)
              }}
            />
          </div>

          <h2 style={stagger(420)} className="dash-in text-2xl sm:text-3xl font-black mt-8 sm:mt-10">Бүртгүүлэх</h2>

          {role === "staff" ? (
            <div key="staff-fields" style={stagger(roleSwitched ? 0 : 480)} className="dash-in mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div key="company-fields" style={stagger(roleSwitched ? 0 : 480)} className="dash-in mt-8">
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

          <div style={stagger(540)} className="dash-in mt-6">
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
            {emailTaken && (
              <p className="mt-1.5 text-sm text-gray-600">
                <Link href="/login" className="font-semibold text-orange-600 hover:underline">Нэвтрэх</Link>
                {" "}эсвэл{" "}
                <Link href="/forgot-password" className="font-semibold text-orange-600 hover:underline">нууц үгээ сэргээх</Link>
              </p>
            )}
          </div>

          <div style={stagger(600)} className="dash-in mt-6">
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
            style={stagger(660)}
            className="dash-in btn-shine orange-btn w-full mt-10"
          >
            {loading ? "Код илгээж байна..." : "Бүртгүүлэх"}
          </button>

          <p style={stagger(720)} className="dash-in mt-8 text-center text-gray-500">
            Бүртгэлтэй юу?
            <Link href="/login" className="orange-text ml-2">
              Нэвтрэх
            </Link>
          </p>
        </div>
      </div>

      {showModal && (
        <VerifyCodeModal
          email={email}
          onClose={() => setShowModal(false)}
          onSubmit={handleVerifyAndRegister}
          onResend={requestCode}
        />
      )}
    </main>
  )
}