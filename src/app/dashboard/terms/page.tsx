"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()
  const [termsData, setTermsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/terms")
        const result = await res.json()
        if (result.success) setTermsData(result.data)
      } catch (error) {
        console.error("Дата татахад алдаа гарлаа:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = termsData.filter((item) => 
    item.title?.toLowerCase().includes(search.toLowerCase()) || 
    item.content?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const copyToClipboard = (title: string, content: string) => {
    navigator.clipboard.writeText(`${title}\n\n${content}`)
    alert("Заалтыг хууллаа!")
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:py-12">
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
          <h1 className="text-2xl font-bold text-slate-900">Үйлчилгээний нөхцөл</h1>
          <p className="text-sm text-slate-500">Манай платформыг ашиглах ерөнхий дүрэм журмууд.</p>
        </div>
      </div>

      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Нөхцөл хайх..."
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((item) => (
            <div key={item.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-all group relative">
              <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">{item.content}</p>
              <button
                onClick={() => copyToClipboard(item.title, item.content)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

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