"use client"

import { useState } from "react"
import Link from "next/link"

export default function CompanySupportPage() {
  const [category, setCategory] = useState("system")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false) // Хуудасны ачаалах төлөв
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatusMsg(null)

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, message })
      })
      const result = await res.json()

      if (res.ok && result.success) {
        setStatusMsg({ type: "success", text: result.message })
        setTitle("")
        setMessage("")
      } else {
        setStatusMsg({ type: "error", text: result.error || "Алдаа гарлаа." })
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Сервертэй холбогдож чадсангүй." })
    } finally {
      setSubmitting(false)
    }
  }

  // Хэрэв хуудас ачаалж байгаа бол Loader-г харуулна
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-125 py-24 w-full">
        <div className="relative flex items-center justify-center h-32 w-32">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
            <span className="text-[10px] font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
              mstaffing
            </span>
          </div>
        </div>
        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
          Түр хүлээнэ үү...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-bold text-gray-500 hover:text-slate-900 transition">
          ← Буцах
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Тусламж & Дэмжлэг 🙋‍♂️</h1>
      </div>

      <div className="bg-white border border-gray-100 p-8 rounded-4xl shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-lg text-gray-900">MStaffing-д асуудлаа илгээх</h3>
          <p className="text-xs text-gray-400 mt-1">Тулгарсан бэрхшээл, системийн алдаа эсвэл санал хүсэлтээ энд үлдээнэ үү.</p>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-2xl text-sm font-bold ${
            statusMsg.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"
          }`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Асуудлын ангилал</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
            >
              <option value="system">🖥️ Системийн алдаа / Ажиллахгүй байна</option>
              <option value="billing">💳 Багц сунгалт / Төлбөр тооцоо</option>
              <option value="job_post">📝 Ажлын зар оруулах / Засах</option>
              <option value="other">💡 Бусад санал хүсэлт</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Гарчиг</label>
            <input
              type="text"
              required
              placeholder="Жишээ нь: Багцын лимит шинэчлэгдсэнгүй"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Дэлгэрэнгүй агуулга</label>
            <textarea
              required
              rows={5}
              placeholder="Алдаа гарсан алхам эсвэл тусламж авахыг хүссэн асуудлаа тодорхой бичнэ үү..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-md shadow-indigo-600/10 flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting ? "Илгээж байна..." : "Хүсэлт илгээх 🚀"}
          </button>
        </form>
      </div>
    </div>
  )
}