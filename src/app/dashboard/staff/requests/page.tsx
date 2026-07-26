"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface RequestItem {
  id: string
  jobTitle: string
  companyName: string
  type: "applied" | "invitation"
  status: "pending" | "accepted" | "rejected"
  date: string
}

export default function StaffRequestsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "invitations">("all")
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        
        const res = await fetch(`/api/staff/requests`)
        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.error || "Дата татахад алдаа гарлаа")
        }

        const formattedData: RequestItem[] = (result.data || []).map((item: any) => ({
          id: item.id,
          jobTitle: item.mt_openjob?.title || "Тодорхойгүй ажлын байр",
          companyName: item.mt_openjob?.mt_company?.company_name || "Компанийн нэр байхгүй",
          type: "applied",
          status: item.status || "pending",
          date: new Date(item.created_at).toISOString().split("T")[0],
        }))

        setRequests(formattedData)
      } catch (err: any) {
        console.error("Fetch requests error:", err)
        setError(err.message || "Серверийн алдаа гарлаа")
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const getStatusBadge = (status: RequestItem["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-200/50">Хүлээгдэж буй</span>
      case "accepted":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50">Зөвшөөрсөн</span>
      case "rejected":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-200/50">Татгалзсан</span>
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-600 border border-gray-200/50">Тодорхойгүй</span>
    }
  }

  const filteredRequests = requests.filter((item) => {
    if (activeTab === "applied") return item.type === "applied"
    if (activeTab === "invitations") return item.type === "invitation"
    return true
  })

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Миний хүсэлтүүд</h1>
          <p className="text-sm text-gray-500 mt-1">Илгээсэн анкет болон компаниудаас ирсэн хүсэлт, урилгын түүх</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/staff/jobs"
            className="px-4 py-2.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition shadow-sm shadow-orange-500/20 text-center"
          >
            💼 Ажил хайх
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "all" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Бүгд ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("applied")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "applied" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Миний явуулсан анкетууд
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "invitations" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Компанийн урилгууд
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium animate-pulse">Мэдээллийг ачаалж байна...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 shadow-sm">
          <p className="text-rose-500 font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                    {req.type === "applied" ? "📄" : "✉️"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{req.jobTitle}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                        {req.type === "applied" ? "Анкет илгээсэн" : "Урилга"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mt-0.5">{req.companyName}</p>
                    <p className="text-xs text-gray-400 mt-1">Огноо: {req.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                  {getStatusBadge(req.status)}
                  
                  <button className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition">
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 font-medium">Хүсэлт одоогоор байхгүй байна.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}