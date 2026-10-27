"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import Select from "@/components/common/Select"

export default function CompanySupportPage() {
  const [category, setCategory] = useState("system")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
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
    } catch {
      setStatusMsg({ type: "error", text: "Сервертэй холбогдож чадсангүй." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Хянах самбар
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Тусламж ба дэмжлэг</h1>
        <p className="text-sm text-gray-500 mt-1">Тулгарсан бэрхшээл, системийн алдаа эсвэл санал хүсэлтээ энд үлдээнэ үү.</p>
      </div>

      <div className="bg-white border border-gray-100 p-5 sm:p-8 rounded-2xl shadow-sm space-y-6">
        {statusMsg && (
          <div
            role={statusMsg.type === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 p-4 rounded-xl text-sm font-medium border ${
              statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="support-category" className="block text-sm font-semibold text-gray-700">Асуудлын ангилал</label>
            <Select id="support-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12">
              <option value="system">Системийн алдаа / Ажиллахгүй байна</option>
              <option value="billing">Багц сунгалт / Төлбөр тооцоо</option>
              <option value="job_post">Ажлын зар оруулах / Засах</option>
              <option value="other">Бусад санал хүсэлт</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="support-title" className="block text-sm font-semibold text-gray-700">Гарчиг</label>
            <input
              id="support-title"
              type="text"
              required
              placeholder="Жишээ нь: Багцын лимит шинэчлэгдсэнгүй"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="support-message" className="block text-sm font-semibold text-gray-700">Дэлгэрэнгүй агуулга</label>
            <textarea
              id="support-message"
              required
              rows={5}
              placeholder="Алдаа гарсан алхам эсвэл тусламж авахыг хүссэн асуудлаа тодорхой бичнэ үү..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto sm:px-6 h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-orange-600/15 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Илгээж байна..." : "Хүсэлт илгээх"}
          </button>
        </form>
      </div>
    </div>
  )
}