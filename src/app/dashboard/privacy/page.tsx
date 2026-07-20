"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
  const router = useRouter()
  const [privacyData, setPrivacyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/privacy")
        const result = await res.json()
        if (result.success) setPrivacyData(result.data)
      } catch (error) {
        console.error("Дата татахад алдаа гарлаа:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = privacyData.filter((item) => 
    item.title?.toLowerCase().includes(search.toLowerCase()) || 
    item.content?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="max-w-3xl mx-auto p-6 md:py-12">
      {/* Header хэсэг */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Нууцлалын бодлого</h1>
          <p className="text-sm text-slate-500">Бид таны мэдээллийг хэрхэн хамгаалдаг вэ?</p>
        </div>
      </div>

      {/* Хайлт */}
      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Заалт хайх..."
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Контент эсвэл Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 w-full">
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
      ) : (
        <div className="space-y-4">
          {currentItems.map((item) => (
            <div key={item.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-all group">
              <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Хуудаслалт */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg font-medium text-sm transition-all ${
                currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}