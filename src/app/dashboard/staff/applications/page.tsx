"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Application {
  id: string
  company_id?: string
  title: string
  company: string
  date: string
  status: string
  statusColor: string
  description?: string
}

export default function ApplicationsHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId") || "" 

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  // 🌟 ШҮҮЛТҮҮРИЙН ТҮР ТӨЛӨВҮҮД
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, pending, approved, rejected

  useEffect(() => {
    async function fetchHistory() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
        const res = await fetch(`${baseUrl}/api/staff/dashboard?userId=${userId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Түүхийн өгөгдлийг татаж чадсангүй.")
        
        const result = await res.json()
        setApplications(result.recentApplications || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  // 🌟 ХАЙЛТ БОЛОН СТАТУСААР ШҮҮХ ЛОГИК (Real-time шүүлтүүр)
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Хайлт (Ажлын нэр эсвэл компанийн нэрээр)
      const matchesSearch = 
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase())

      // 2. Статус шүүлтүүр
      const matchesStatus = 
        statusFilter === "all" || 
        app.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [applications, searchTerm, statusFilter])

  const handleCompanyClick = (e: React.MouseEvent, companyId: string | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    
    if (!companyId) return

    fetch("/api/staff/companyView", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId })
    }).catch(err => console.error("Үзэлт бүртгэхэд алдаа:", err))

    router.push(`/dashboard/company/profile/${companyId}`)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "accepted":
        return "bg-emerald-50 text-emerald-600 border-emerald-100"
      case "rejected":
      case "declined":
        return "bg-rose-50 text-rose-600 border-rose-100"
      case "pending":
      default:
        return "bg-amber-50 text-amber-600 border-amber-100"
    }
  }

  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "Хүлээж авсан"
      case "rejected": return "Татгалзсан"
      case "pending": return "Шалгагдаж буй"
      default: return status
    }
  }

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
          <div className="relative flex items-center justify-center h-32 w-32">
            
            {/* 1. Ард талын зөөлөн гэрэлтэлт (Glow effect) */}
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            
            {/* 2. Гадуурх нарийн тасархай эргэлдэх шугам */}
            <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
            
            {/* 3. Үндсэн хурдан эргэлдэх тод зураас */}
            <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
            
            {/* 4. Гол хэсэгт байрлах брэндийн нэр */}
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
              <span className="text-xs font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
                mstaffing
              </span>
            </div>
            
          </div>
          
          {/* Доор уншиж буйг илтгэх жижиг текст */}
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
            Түр хүлээнэ үү...
          </p>
        </div>
      )
    }

  if (!userId) {
    return (
      <div className="text-center py-12 max-w-md mx-auto space-y-4">
        <p className="text-gray-500 font-medium">Хэрэглэгч баталгаажаагүй байна. Үндсэн хуудас руу шилжинэ үү.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Буцах</button>
      </div>
    )
  }

  if (error) return <div className="text-center py-12 text-red-500 font-medium">{error}</div>

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      
      {/* ДЭЭД ХЭСЭГ / BACK BUTTON */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Буцах
        </button>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Миний илгээсэн анкетууд</h1>
      </div>

      {/* 🌟 НӨХЦӨЛӨӨР ХАЙХ, ШҮҮХ ХЭСЭГ (SEARCH & FILTER BAR) */}
      {applications.length > 0 && (
        <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row gap-3 items-center">
          {/* Текстээр хайх оролт */}
          <div className="relative w-full sm:flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Ажлын нэр эсвэл компаниар хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all text-gray-900"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-4 flex items-center text-xs text-gray-400 hover:text-gray-600"
              >
                ✕ Арилгах
              </button>
            )}
          </div>

          {/* Статусаар шүүх Select */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all font-bold text-gray-700 cursor-pointer"
            >
              <option value="all">📊 Бүх статус</option>
              <option value="pending">⏳ Шалгагдаж буй</option>
              <option value="approved">✅ Хүлээж авсан</option>
              <option value="rejected">❌ Татгалзсан</option>
            </select>
          </div>
        </div>
      )}

      {/* ТҮҮХИЙН ЖАГСААЛТ */}
      {applications.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-4xl p-12 text-center space-y-4">
          <div className="text-4xl text-gray-300">📁</div>
          <h3 className="text-lg font-bold text-gray-900">Анкет илгээсэн түүх хоосон байна</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Та одоогоор ямар нэгэн ажлын байранд хүсэлт гаргаагүй байна.
          </p>
          <Link 
            href="/dashboard/staff/jobs"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Aжил хайх 🔍
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        // Шүүлтүүрт тохирох дата олдоогүй үед
        <div className="bg-white border border-gray-100 rounded-4xl p-12 text-center text-gray-500 text-sm font-medium">
          😞 Таны хайсан нөхцөлд тохирох анкет олдсонгүй.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApplications.map((app) => (
            <div 
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="bg-white border border-gray-100 p-6 rounded-4xl shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-100 hover:shadow-md transition-all group cursor-pointer animate-fade-in"
            >
              <div className="space-y-2">
                <h3 className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {app.title}
                </h3>
                
                <div>
                  <span 
                    onClick={(e) => handleCompanyClick(e, app.company_id)}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    🏢 {app.company}
                  </span>
                </div>

                <p className="text-xs text-gray-400 font-medium">📅 Илгээсэн огноо: {app.date}</p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-4 w-full">
                <span className="text-xs text-gray-400 font-medium">Шалгалтын явц:</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${getStatusBadgeClass(app.status)}`}>
                  {getStatusTranslation(app.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МOДАЛ ЦОНХ: АНКЕТЫН ДЭЛГЭРЭНГҮЙ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setSelectedApp(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            >
              ✕
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900">{selectedApp.title}</h3>
              <div>
                <span 
                  onClick={(e) => handleCompanyClick(e, selectedApp.company_id)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-block"
                >
                  🏢 {selectedApp.company}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">📅 Илгээсэн огноо: {selectedApp.date}</p>
            </div>
            <hr className="border-gray-100" />
            <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              <b className="text-gray-900 block mb-1">Ажлын тайлбар:</b>
              {selectedApp.description || "Ажлын тайлбар байхгүй байна."}
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="text-sm font-bold text-gray-500">Одоогийн статус:</span>
              <span className={`px-4 py-1.5 text-xs font-black rounded-xl border ${getStatusBadgeClass(selectedApp.status)}`}>
                {getStatusTranslation(selectedApp.status)}
              </span>
            </div>
            <button 
              onClick={() => setSelectedApp(null)} 
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition text-center"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}