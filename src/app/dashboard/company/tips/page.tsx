"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Tip {
  id: number
  title: string
  icon: string
  content: string
  detail_url: string
  views_count: number
}

export default function CompanyTipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"general" | "interview">("general")

  useEffect(() => {
    async function fetchTips() {
      try {
        const res = await fetch("/api/company/tips")
        const result = await res.json()
        if (result.success) {
          setTips(result.data)
        }
      } catch (err) {
        console.error("Алдаа гарлаа:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTips()
  }, [])

  // 🔥 ШИНЭЧЛЭГДСЭН ЛОГИК: detail_url-ийн утгаар нь ангилах
  const generalTips = tips.filter(tip => tip.detail_url === "tips")
  const interviewTips = tips.filter(tip => tip.detail_url === "interview-prep")

  const activeData = activeTab === "general" ? generalTips : interviewTips

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Толгой хэсэг */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-bold text-gray-500 hover:text-slate-900 transition">
          ← Буцах
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">HR хөтөч & Зөвлөмж 💡</h1>
      </div>

      {/* Таб сэлгэгч */}
      <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-md border border-gray-200 shadow-inner">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === "general"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          📝 Зөвлөгөө ({generalTips.length})
        </button>
        <button
          onClick={() => setActiveTab("interview")}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            activeTab === "interview"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          🤝 Ярилцлагын бэлтгэл ({interviewTips.length})
        </button>
      </div>

      {/* Контент жагсаалт */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : activeData.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-4xl border border-dashed border-gray-200 text-gray-400 font-medium">
          Энэ хэсэгт одоогоор зөвлөгөө ороогүй байна.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeData.map((tip) => (
            <div key={tip.id} className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex flex-col justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tip.icon || "💡"}</span>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
                    Үзсэн: {tip.views_count}
                  </span>
                </div>
                <h3 className="font-black text-lg text-gray-900 group-hover:text-indigo-600 transition">
                  {tip.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}