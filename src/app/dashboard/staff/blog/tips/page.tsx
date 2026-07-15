"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Tip {
  id: string
  title: string
  icon: string
  content: string
  detail_url: string
  created_at: string
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTips() {
      try {
        const res = await fetch("/api/staff/blog/tips")
        if (!res.ok) throw new Error("Зөвлөгөөнүүдийг ачаалж чадсангүй.")
        const data = await res.json()
        setTips(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTips()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 font-medium">{error}</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition">
          ← Буцах
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Зөвлөгөө 💡</h1>
      </div>

      <div className="space-y-6">
        {tips.map((tip) => (
          <div key={tip.id} className="bg-white border border-gray-100 p-6 md:p-8 rounded-4xl shadow-sm space-y-4 hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tip.icon}</span>
              <div>
                <h3 className="font-black text-lg text-gray-900">{tip.title}</h3>
                <p className="text-[10px] text-gray-400 font-medium">{tip.created_at}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
              {tip.content}
            </p>
          </div>
        ))}

        {tips.length === 0 && (
          <p className="text-center text-gray-400 py-12">Одоогоор зөвлөгөө оруулаагүй байна.</p>
        )}
      </div>
    </div>
  )
}