"use client"

import Link from "next/link"
import { useState, useMemo, useEffect } from "react"

interface Applicant {
  id: string
  user_name: string 
  job_title: string 
  email: string
  phone: string
  created_at: string
  status: string
}

interface ListProps {
  initialApplicants: Applicant[]
}

export default function JobApplicantsList({ initialApplicants }: ListProps) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // 🔄 Анхны дата уншиж байх үеийн төлөв
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)

  // Хуудас анх ачаалагдаж, initialApplicants ирэхэд loader-ийг хаана
  useEffect(() => {
    if (initialApplicants) {
      setIsInitialLoading(false)
    }
  }, [initialApplicants])

  // Статусаар шүүх логик
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const currentStatus = app.status ? app.status.toLowerCase() : ""
      if (statusFilter === "all") return true
      if (statusFilter === "new") return ["new", "pending", ""].includes(currentStatus)
      return currentStatus === statusFilter
    })
  }, [applicants, statusFilter])

  // Анкетын төлөв өөрчлөх (Урих / Татгалзах)
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id)
      const response = await fetch("/api/company/jobrequest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) throw new Error("Амжилтгүй боллоо")

      setApplicants(
        applicants.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      )
    } catch (err) {
      alert("Алдаа гарлаа. Дахин оролдоно уу.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Аль нэг ачаалж буй төлөв идэвхтэй үед Loader-ийг харуулна
  const showLoader = isInitialLoading || updatingId !== null

  return (
    <div className="space-y-6 relative">
      
      {/* 🔄 БРЭНДИНГ LOADER ДЭЛГЭЦ */}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
          <div className="relative flex items-center justify-center h-32 w-32">
            {/* 1. Ард талын зөөлөн гэрэлтэлт */}
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
          
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
            {isInitialLoading ? "Анкетуудыг ачаалж байна..." : "Төлөв шинэчилж байна..."}
          </p>
        </div>
      )}

      {/* СТАТУС ТАБ ЦЭС */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100/80 w-full md:w-fit rounded-xl overflow-x-auto">
        {[
          { id: "all", label: `Бүгд (${applicants.length})` },
          { id: "new", label: `Шинэ (${applicants.filter(a => ["new", "pending", ""].includes(a.status ? a.status.toLowerCase() : "")).length})` },
          { id: "interview", label: `Ярилцлага (${applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "interview").length})` },
          { id: "rejected", label: `Татгалзсан (${applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "rejected").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap ${
              statusFilter === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredApplicants.length === 0 ? (
        <div className="p-12 bg-white border border-gray-100 rounded-3xl text-center text-gray-400 shadow-sm">
          <span className="text-3xl block mb-2">📁</span>
          <div className="font-bold text-gray-700 text-sm">Илэрц олдсонгүй</div>
        </div>
      ) : (
        <>
          {/* 🖥️ КОМПЬЮТЕР ДЭЭР СТАНДАРТ ХҮСНЭГТ */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Нэр</th>
                  <th className="px-6 py-4">Холбоо барих</th>
                  <th className="px-6 py-4">Огноо</th>
                  <th className="px-6 py-4">Төлөв</th>
                  <th className="px-6 py-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredApplicants.map((app) => {
                  const currentStatus = app.status ? app.status.toLowerCase() : ""
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{app.user_name}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">{app.phone}</div>
                        <div className="text-xs text-gray-400">{app.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500" suppressHydrationWarning>
                        {new Date(app.created_at).toLocaleDateString("mn-MN")}
                      </td>
                      <td className="px-6 py-4">
                        {["new", "pending", ""].includes(currentStatus) && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">Шинэ</span>}
                        {currentStatus === "interview" && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">Ярилцлага</span>}
                        {currentStatus === "rejected" && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600">Татгалзсан</span>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Link href={`/dashboard/company/applicants/profile?id=${app.id}`} className="text-xs font-bold bg-gray-990 text-white px-3 py-2 rounded-lg transition inline-block">
                          Дэлгэрэнгүй
                        </Link>
                        {["new", "pending", ""].includes(currentStatus) && (
                          <>
                            <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "interview")} className="text-xs font-bold bg-emerald-500 text-white px-3 py-2 rounded-lg transition disabled:opacity-50">Урих</button>
                            <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "rejected")} className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-lg transition disabled:opacity-50">Татгалзах</button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 УТАСНЫ ДЭЛГЭЦЭНД ЗОРИУЛСАН КАРТ */}
          <div className="block md:hidden space-y-3">
            {filteredApplicants.map((app) => {
              const currentStatus = app.status ? app.status.toLowerCase() : ""
              return (
                <div key={app.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">{app.user_name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5" suppressHydrationWarning>
                        📅 {new Date(app.created_at).toLocaleDateString("mn-MN")}
                      </div>
                    </div>
                    {["new", "pending", ""].includes(currentStatus) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">Шинэ</span>}
                    {currentStatus === "interview" && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Ярилцлага</span>}
                    {currentStatus === "rejected" && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600">Татгалзсан</span>}
                  </div>

                  <div className="text-xs text-gray-600 space-y-0.5 border-t border-b border-gray-50 py-2">
                    <div>📞 {app.phone}</div>
                    <div className="text-gray-400 break-all">✉️ {app.email}</div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link href={`/dashboard/company/applicants/profile?id=${app.id}`} className="flex-1 text-center text-xs font-bold bg-gray-950 text-white py-2 rounded-lg">
                      Үзэх
                    </Link>
                    {["new", "pending", ""].includes(currentStatus) && (
                      <>
                        <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "interview")} className="flex-1 text-center text-xs font-bold bg-emerald-500 text-white py-2 rounded-lg disabled:opacity-50">Урих</button>
                        <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "rejected")} className="px-2.5 bg-rose-50 text-rose-600 py-2 rounded-lg text-xs disabled:opacity-50">❌</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}