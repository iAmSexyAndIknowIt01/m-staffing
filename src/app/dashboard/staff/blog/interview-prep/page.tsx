"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Prep {
  id: string
  title: string
  icon: string
  content: string
  detail_url: string
  created_at: string
}

export default function InterviewPrepPage() {
  const [preps, setPreps] = useState<Prep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPreps() {
      try {
        const res = await fetch("/api/staff/blog/interview-prep")
        if (!res.ok) throw new Error("Ярилцлагын бэлтгэлүүдийг ачаалж чадсангүй.")
        const data = await res.json()
        setPreps(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPreps()
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
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Ажлын бэлтгэл 🤝</h1>
      </div>

      <div className="space-y-6">
        {preps.map((prep) => (
          <div key={prep.id} className="bg-white border border-gray-100 p-6 md:p-8 rounded-4xl shadow-sm space-y-4 hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{prep.icon}</span>
              <div>
                <h3 className="font-black text-lg text-gray-900">{prep.title}</h3>
                <p className="text-[10px] text-gray-400 font-medium">{prep.created_at}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
              {prep.content}
            </p>
          </div>
        ))}

        {preps.length === 0 && (
          <p className="text-center text-gray-400 py-12">Одоогоор зөвлөмж оруулаагүй байна.</p>
        )}
      </div>
    </div>
  )
}