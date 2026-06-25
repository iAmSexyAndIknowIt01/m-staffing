"use client"

import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [role, setRole] = useState<"staff" | "company">("staff")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Modal-д зориулсан state
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function login() {
    try {
      setLoading(true)

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
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
    <main
      className="
        relative
        min-h-screen
        flex
        items-center
        justify-center
        overflow-hidden
        px-6
      "
    >
      <Link
        href="/"
        className="
          fixed
          top-8
          left-8
          glass
          rounded-full
          px-6
          py-3
          flex
          items-center
          gap-3
          transition
          hover:-translate-y-1
          z-30
        "
      >
        ← Нүүр Хуудас
      </Link>

      <div
        className="
          max-w-300
          w-full
          grid
          lg:grid-cols-2
          gap-10
          items-center
        "
      >
        {/* LEFT */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[44px]
            min-h-180
            flex
            items-center
            px-10
            md:px-16
          "
        >
          {/* GRID */}
          <div
            className="
              absolute
              inset-0
              opacity-[0.5]
              bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)]
              bg-size-[70px_70px]
            "
          />

          {/* ORANGE GLOW */}
          <div
            className="
              absolute
              top-[10%]
              left-[5%]
              w-130
              h-130
              rounded-full
              bg-orange-300/12
              blur-[140px]
              animate-pulse
            "
          />

          <div
            className="
              absolute
              -bottom-37.5
              -right-25
              w-125
              h-125
              rounded-full
              bg-orange-200/20
              blur-[180px]
            "
          />

          {/* CONTENT */}
          <div className="relative z-10">
            <p className="orange-text font-bold tracking-[6px]">
              MSTAFFING
            </p>
            <h1 className="mt-6 text-5xl md:text-7xl font-black">
              {role === "staff" ? "Ажлаа ол." : "Багаа бүрдүүл."}
              <br />
              Тавтай морил.
            </h1>
            <p className="mt-8 text-gray-500 text-xl">
              {role === "staff"
                ? "Өөрт тохирох ажлаа олоод шууд эхлээрэй."
                : "Шилдэг ажилтнаа хурдан олоорой."}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="
            glass
            rounded-[40px]
            p-10
            shadow-[0_40px_100px_rgba(255,122,0,.08)]
          "
        >
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

          <h2 className="text-3xl font-black mt-10">
            Нэвтрэх
          </h2>

          <div className="mt-8">
            <label>Имэйл</label>
            <input
              type="email"
              placeholder="name@email.com"
              className="
                mt-3
                w-full
                rounded-2xl
                border
                border-orange-100
                px-5
                py-4
                outline-none
                focus:border-orange-400
              "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <label>Нууц үг</label>
            <input
              type="password"
              placeholder="••••••••"
              className="
                mt-3
                w-full
                rounded-2xl
                border
                border-orange-100
                px-5
                py-4
                outline-none
                focus:border-orange-400
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="
              orange-btn
              w-full
              mt-10
              disabled:opacity-50
            "
            onClick={login}
            disabled={loading}
          >
            {loading
              ? "Түр хүлээнэ үү..."
              : role === "staff"
              ? "Ажил Хайгчаар Нэвтрэх"
              : "Ажил Олгогчоор Нэвтрэх"}
          </button>

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
          <div className="bg-white rounded-4xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all scale-100">
            
            {/* Алдааны анхааруулах дүрс (Icon) */}
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Алдаа гарлаа
            </h3>
            
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-6">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage(null)}
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