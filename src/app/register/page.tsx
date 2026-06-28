"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const router = useRouter()

  const [role, setRole] = useState<"staff" | "company">("staff")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Овог, нэр дээр улаан анхааруулга харуулах state-үүд
  const [lastNameError, setLastNameError] = useState(false)
  const [firstNameError, setFirstNameError] = useState(false)

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

  // Монгол кирил үсэг шалгах туслах функц (Зөвхөн үсэг, хасах зураас, сул зай зөвшөөрнө)
  const validateMongolianName = (name: string) => {
    const mongolianRegex = /^[А-ЯӨҮа-яөүЁё\- ]+$/
    return mongolianRegex.test(name)
  }

  // Овог шивэх үед шалгах функц
  const handleLastNameChange = (val: string) => {
    setLastName(val)
    if (val && !validateMongolianName(val)) {
      setLastNameError(true)
    } else {
      setLastNameError(false)
    }
  }

  // Нэр шивэх үед шалгах функц
  const handleFirstNameChange = (val: string) => {
    setFirstName(val)
    if (val && !validateMongolianName(val)) {
      setFirstNameError(true)
    } else {
      setFirstNameError(false)
    }
  }

  // Алхам 1: "Бүртгүүлэх" дарахад код үүсгэж имэйл рүү илгээнэ
  async function handleSendAuthMail() {
    if (!email || !password) {
      showAlert("Анхааруулга", "Бүх талбарыг бөглөнө үү", "warning")
      return
    }

    if (role === "staff") {
      if (!firstName || !lastName) {
        showAlert("Анхааруулга", "Овог нэрээ оруулна уу", "warning")
        return
      }

      // Овог нэр кирил үсэг эсэхийг баталгаажуулах
      if (!validateMongolianName(lastName) || !validateMongolianName(firstName)) {
        showAlert("Анхааруулга", "Овог нэрээ зөвхөн Монгол кирил үсгээр оруулна уу.", "warning")
        return
      }
    }

    if (role === "company" && !companyName) {
      showAlert("Анхааруулга", "Компанийн нэр оруулна уу", "warning")
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
          firstName,
          lastName,
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
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* BG */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#fffaf6] to-white" />

      {/* GLOW */}
      <div className="absolute top-[10%] left-[10%] w-175 h-175 rounded-full bg-orange-300/10 blur-[180px]" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.5] bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)] bg-size-[70px_70px]" />

      <Link
        href="/login"
        className="fixed top-8 left-8 z-20 glass rounded-full px-6 py-3 transition hover:-translate-y-1"
      >
        ← Нэвтрэх
      </Link>

      <div className="relative z-10 max-w-300 w-full grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-[40px] min-h-155 flex flex-col justify-center p-14">
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,140,0,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)] bg-size-[56px_56px]" />
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-112.5 h-112.5 rounded-full bg-orange-300/20 blur-[140px]" />

          <div className="relative z-10">
            <p className="orange-text font-bold tracking-[6px]">MSTAFFING</p>
            <h1 className="mt-6 text-5xl md:text-7xl font-black leading-[1.05]">
              {role === "staff" ? "Шинэ боломж." : "Шинэ ажилтан."}
            </h1>
            <p className="mt-8 text-gray-500 text-xl leading-9">
              {role === "staff"
                ? "Хэдхэн алхмаар бүртгүүлээд ажил хайж эхлээрэй."
                : "Компаниа бүртгүүлээд ажилтан хайж эхлээрэй."}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="glass rounded-[40px] p-10">
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

          <h2 className="text-3xl font-black mt-10">Бүртгүүлэх</h2>

          {role === "staff" ? (
            <div className="mt-8 grid grid-cols-2 gap-4">
              {/* ОВОГ INPUT */}
              <div>
                <label className={`transition-colors ${lastNameError ? "text-red-500 font-medium" : ""}`}>Овог</label>
                <input
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  placeholder="Овог"
                  className={`mt-3 w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${
                    lastNameError 
                      ? "border-red-500 focus:border-red-600 bg-red-50/10 text-red-900 placeholder-red-300" 
                      : "border-orange-100 focus:border-orange-500"
                  }`}
                />
                {lastNameError && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium animate-in fade-in duration-200">
                    Зөвхөн Монгол кирил үсгээр оруулна уу
                  </p>
                )}
              </div>

              {/* НЭР INPUT */}
              <div>
                <label className={`transition-colors ${firstNameError ? "text-red-500 font-medium" : ""}`}>Нэр</label>
                <input
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="Нэр"
                  className={`mt-3 w-full rounded-2xl border px-5 py-4 transition-colors outline-none ${
                    firstNameError 
                      ? "border-red-500 focus:border-red-600 bg-red-50/10 text-red-900 placeholder-red-300" 
                      : "border-orange-100 focus:border-orange-500"
                  }`}
                />
                {firstNameError && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium animate-in fade-in duration-200">
                    Зөвхөн Монгол кирил үсгээр оруулна уу
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <label>Компанийн нэр</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
              />
            </div>
          )}

          <div className="mt-6">
            <label>Имэйл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
            />
          </div>

          <div className="mt-6">
            <label>Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
            />
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
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
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
          <div className="bg-white rounded-[28px] p-7 max-w-sm w-full shadow-xl border text-center animate-in fade-in zoom-in-95 duration-150">
            
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